use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine as _;
use futures_util::{SinkExt, StreamExt};
use log::{error, info};
use serde_json::{json, Value};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::mpsc;
use tokio_tungstenite::tungstenite::protocol::Message;

use super::{decode_mulaw_base64, resample_pcm16};

/// Shared state of the local Twilio Media Streams endpoint.
#[derive(Default)]
pub struct StreamState {
    pub port: u16,
    pub connected: bool,
    pub stream_sid: Option<String>,
    pub call_sid: Option<String>,
    pub lead_id: Option<String>,
    outbound: Option<mpsc::UnboundedSender<Message>>,
}

pub type SharedStreamState = Arc<Mutex<StreamState>>;

fn le_bytes(samples: &[i16]) -> Vec<u8> {
    let mut out = Vec::with_capacity(samples.len() * 2);
    for s in samples {
        out.extend_from_slice(&s.to_le_bytes());
    }
    out
}

/// Binds the local media-stream endpoint and starts accepting Twilio connections.
pub async fn start_stream_server(app: AppHandle, state: SharedStreamState) -> Result<u16, String> {
    let listener = TcpListener::bind("127.0.0.1:0")
        .await
        .map_err(|e| format!("Failed to bind stream server: {}", e))?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    state.lock().map_err(|e| e.to_string())?.port = port;
    info!("Twilio media stream server listening on 127.0.0.1:{}", port);

    tokio::spawn(async move {
        loop {
            match listener.accept().await {
                Ok((stream, _)) => {
                    let app = app.clone();
                    let state = state.clone();
                    tokio::spawn(handle_connection(app, state, stream));
                }
                Err(e) => {
                    error!("Media stream accept error: {}", e);
                    break;
                }
            }
        }
    });

    Ok(port)
}

async fn handle_connection(app: AppHandle, state: SharedStreamState, stream: TcpStream) {
    let ws_stream = match tokio_tungstenite::accept_async(stream).await {
        Ok(ws) => ws,
        Err(e) => {
            error!("Media stream WS accept failed: {}", e);
            return;
        }
    };
    let (mut ws_tx, mut ws_rx) = ws_stream.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<Message>();

    let writer = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if ws_tx.send(msg).await.is_err() {
                break;
            }
        }
    });

    let mut stream_sid: Option<String> = None;
    while let Some(msg) = ws_rx.next().await {
        let text = match msg {
            Ok(Message::Text(t)) => t,
            Ok(Message::Close(_)) | Err(_) => break,
            _ => continue,
        };
        handle_frame(&app, &state, &tx, &text, &mut stream_sid).await;
    }

    let tx_copy = tx.clone();
    if let Ok(mut guard) = state.lock() {
        let owns = guard
            .outbound
            .as_ref()
            .is_some_and(|s| s.same_channel(&tx_copy));
        if owns {
            guard.outbound = None;
            guard.connected = false;
            guard.stream_sid = None;
            guard.call_sid = None;
            guard.lead_id = None;
        }
    }
    if stream_sid.is_some() {
        let _ = app.emit("twilio_stream_stopped", json!({}));
    }
    writer.abort();
}

/// Tracks stream lifecycle in `current_sid` (Some while a stream is live).
async fn handle_frame(
    app: &AppHandle,
    state: &SharedStreamState,
    tx: &mpsc::UnboundedSender<Message>,
    text: &str,
    current_sid: &mut Option<String>,
) {
    let Ok(v) = serde_json::from_str::<Value>(text) else {
        return;
    };
    let Some(event) = v["event"].as_str() else {
        return;
    };
    match event {
        "start" => {
            let Some(sid) = v["start"]["streamSid"].as_str().map(str::to_string) else {
                return;
            };
            let call_sid = v["start"]["callSid"].as_str().unwrap_or("").to_string();
            let lead_id = v["start"]["customParameters"]["leadId"]
                .as_str()
                .unwrap_or("")
                .to_string();
            if let Ok(mut guard) = state.lock() {
                guard.stream_sid = Some(sid.clone());
                guard.call_sid = Some(call_sid.clone());
                guard.lead_id = Some(lead_id.clone());
                guard.connected = true;
                guard.outbound = Some(tx.clone());
            }
            info!("Twilio media stream started: {}", sid);
            *current_sid = Some(sid.clone());
            let _ = app.emit(
                "twilio_stream_started",
                json!({ "streamSid": sid, "callSid": call_sid, "leadId": lead_id }),
            );
        }
        "media" => {
            if v["media"]["track"].as_str().unwrap_or("inbound") != "inbound" {
                return;
            }
            let Some(payload) = v["media"]["payload"].as_str() else {
                return;
            };
            let Ok(samples) = decode_mulaw_base64(payload) else {
                return;
            };
            let bytes = le_bytes(&samples);
            let _ = app.emit(
                "twilio_audio_in",
                json!({ "pcm16Base64": BASE64.encode(bytes), "sampleRate": 8000 }),
            );
        }
        "stop" => {
            if let Ok(mut guard) = state.lock() {
                let owns = guard.outbound.as_ref().is_some_and(|s| s.same_channel(tx));
                if owns {
                    guard.outbound = None;
                    guard.connected = false;
                }
            }
            info!("Twilio media stream stopped");
            *current_sid = None;
            let _ = app.emit("twilio_stream_stopped", json!({}));
        }
        _ => {}
    }
}

/// Push AI audio (PCM16 at `sample_rate`) to the phone line as µ-law 8 kHz.
#[tauri::command]
pub async fn send_twilio_audio(
    state: tauri::State<'_, SharedStreamState>,
    pcm16_base64: String,
    sample_rate: u32,
) -> Result<(), String> {
    let bytes = BASE64
        .decode(pcm16_base64.trim())
        .map_err(|e| format!("Invalid base64 audio: {}", e))?;
    if bytes.len() % 2 != 0 {
        return Err("PCM16 buffer has odd byte length".to_string());
    }
    let samples: Vec<i16> = bytes
        .chunks_exact(2)
        .map(|c| i16::from_le_bytes([c[0], c[1]]))
        .collect();
    let at_8k = if sample_rate == 8000 || samples.is_empty() {
        samples
    } else {
        resample_pcm16(&samples, sample_rate, 8000)
    };
    let mu: Vec<u8> = at_8k.iter().map(|&s| super::pcm16_to_mulaw(s)).collect();
    let frame = json!({ "event": "media", "media": { "payload": BASE64.encode(mu) } }).to_string();

    let guard = state.lock().map_err(|e| e.to_string())?;
    match &guard.outbound {
        Some(tx) => tx
            .send(Message::Text(frame))
            .map_err(|_| "Twilio media stream is not connected".to_string()),
        None => Err("Twilio media stream is not connected".to_string()),
    }
}

#[tauri::command]
pub fn get_twilio_stream_info(state: tauri::State<'_, SharedStreamState>) -> Result<Value, String> {
    let guard = state.lock().map_err(|e| e.to_string())?;
    Ok(json!({
        "port": guard.port,
        "connected": guard.connected,
        "streamSid": guard.stream_sid,
        "callSid": guard.call_sid,
        "leadId": guard.lead_id,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn le_bytes_are_little_endian_pcm16() {
        assert_eq!(le_bytes(&[1, -1]), vec![1, 0, 255, 255]);
        assert_eq!(le_bytes(&[]), Vec::<u8>::new());
    }

    #[test]
    fn stream_state_starts_empty() {
        let s = StreamState::default();
        assert_eq!(s.port, 0);
        assert!(!s.connected);
        assert!(s.stream_sid.is_none());
        assert!(s.outbound.is_none());
    }
}
