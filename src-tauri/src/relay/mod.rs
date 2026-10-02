use futures_util::{SinkExt, StreamExt};
use log::{error, info};
use std::sync::Arc;
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::Mutex;
use tokio_tungstenite::tungstenite::protocol::Message;

pub type RelayPort = u16;

pub async fn start_relay_server() -> Result<RelayPort, Box<dyn std::error::Error>> {
    let listener = TcpListener::bind("127.0.0.1:0").await?;
    let port = listener.local_addr()?.port();
    info!("Voice relay server started on ws://127.0.0.1:{}", port);

    tokio::spawn(async move {
        while let Ok((stream, _)) = listener.accept().await {
            tokio::spawn(handle_connection(stream));
        }
    });

    Ok(port)
}

async fn handle_connection(stream: TcpStream) {
    let ws_stream = match tokio_tungstenite::accept_async(stream).await {
        Ok(ws) => ws,
        Err(e) => {
            error!("WebSocket accept failed: {}", e);
            return;
        }
    };

    let (mut client_tx, mut client_rx) = ws_stream.split();

    // Read first client message for config
    let config = match client_rx.next().await {
        Some(Ok(Message::Text(text))) => match serde_json::from_str::<serde_json::Value>(&text) {
            Ok(v) => v,
            Err(_) => {
                let _ = client_tx
                    .send(Message::Text(
                        r#"{"type":"error","message":"Invalid config JSON"}"#.into(),
                    ))
                    .await;
                return;
            }
        },
        _ => {
            let _ = client_tx
                .send(Message::Text(
                    r#"{"type":"error","message":"Expected config message"}"#.into(),
                ))
                .await;
            return;
        }
    };

    let provider = config["provider"].as_str().unwrap_or("openai");
    let api_key = config["apiKey"].as_str().unwrap_or("");
    let model = config["model"]
        .as_str()
        .unwrap_or("gpt-4o-realtime-preview");
    let voice = config["voice"].as_str().unwrap_or("alloy");
    let system_prompt = config["systemPrompt"].as_str().unwrap_or("");

    if api_key.is_empty() {
        let _ = client_tx
            .send(Message::Text(
                r#"{"type":"error","message":"API key required"}"#.into(),
            ))
            .await;
        return;
    }

    let (provider_url, connect_payload) = match provider {
        "elevenlabs" => {
            let agent_id = config["agentId"].as_str().unwrap_or("");
            let url = format!(
                "wss://api.elevenlabs.io/v1/convai/conversation?agent_id={}",
                agent_id
            );
            let payload = serde_json::json!({
                "xi_api_key": api_key,
                "agent_id": agent_id,
                "first_message": system_prompt,
            });
            (url, payload)
        }
        _ => {
            let url = format!("wss://api.openai.com/v1/realtime?model={}", model);
            let payload = serde_json::json!({
                "type": "session.update",
                "session": {
                    "modalities": ["text", "audio"],
                    "instructions": system_prompt,
                    "voice": voice,
                    "input_audio_format": "pcm16",
                    "output_audio_format": "pcm16",
                    "temperature": 0.8,
                }
            });
            (url, payload)
        }
    };

    // Connect to provider
    let (provider_ws, _) = match tokio_tungstenite::connect_async(&provider_url).await {
        Ok(ws) => ws,
        Err(e) => {
            let _ = client_tx
                .send(Message::Text(format!(
                    r#"{{"type":"error","message":"Provider connection failed: {}"}}"#,
                    e
                )))
                .await;
            return;
        }
    };

    let (mut provider_tx, mut provider_rx) = provider_ws.split();

    // Send config to provider
    if !connect_payload.is_null() {
        let _ = provider_tx
            .send(Message::Text(connect_payload.to_string()))
            .await;
    }

    // Notify client we're ready
    let _ = client_tx
        .send(Message::Text(r#"{"type":"ready"}"#.into()))
        .await;

    let client_tx = Arc::new(Mutex::new(client_tx));
    let provider_tx = Arc::new(Mutex::new(provider_tx));

    // Forward client → provider
    let tx_to_provider = provider_tx.clone();
    let client_to_provider = tokio::spawn(async move {
        while let Some(msg) = client_rx.next().await {
            match msg {
                Ok(Message::Binary(data)) => {
                    let mut tx = tx_to_provider.lock().await;
                    let _ = tx.send(Message::Binary(data)).await;
                }
                Ok(Message::Close(_)) => break,
                Err(_) => break,
                _ => {}
            }
        }
    });

    // Forward provider → client
    let tx_to_client = client_tx.clone();
    let provider_to_client = tokio::spawn(async move {
        while let Some(msg) = provider_rx.next().await {
            match msg {
                Ok(msg) => {
                    let mut tx = tx_to_client.lock().await;
                    let _ = tx.send(msg).await;
                }
                Err(_) => break,
            }
        }
    });

    let _ = tokio::join!(client_to_provider, provider_to_client);
    info!("Voice relay connection closed");
}
