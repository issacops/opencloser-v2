use serde_json::Value;
use std::process::Stdio;
use std::sync::Mutex;
use std::time::Duration;
use tokio::process::{Child, Command};
use tokio::time::timeout;

use super::stream::SharedStreamState;

const URL_DISCOVERY_TIMEOUT: Duration = Duration::from_secs(30);

#[derive(Default)]
pub struct TunnelInner {
    pub child: Option<Child>,
    pub url: Option<String>,
}

#[derive(Default)]
pub struct TunnelState {
    pub inner: Mutex<TunnelInner>,
}

impl TunnelState {
    pub fn is_running(&self) -> Result<bool, String> {
        let mut guard = self.inner.lock().map_err(|e| e.to_string())?;
        match &mut guard.child {
            Some(child) => Ok(child.try_wait().map_err(|e| e.to_string())?.is_none()),
            None => Ok(false),
        }
    }
}

/// Pulls the quick-tunnel URL out of a cloudflared log line.
pub fn extract_tunnel_url(line: &str) -> Option<String> {
    let idx = line.find("https://")?;
    let rest = &line[idx..];
    let end = rest
        .find(|c: char| c.is_whitespace() || c == '|')
        .unwrap_or(rest.len());
    let url = rest[..end].trim_end_matches([',', ';', ')']);
    if url.contains("trycloudflare.com") {
        Some(url.to_string())
    } else {
        None
    }
}

async fn find_tunnel_url(stderr: tokio::process::ChildStderr) -> Result<String, String> {
    use tokio::io::{AsyncBufReadExt, BufReader};

    let mut lines = BufReader::new(stderr).lines();
    let mut captured = Vec::new();
    while let Ok(Some(line)) = lines.next_line().await {
        if let Some(url) = extract_tunnel_url(&line) {
            return Ok(url);
        }
        if captured.len() < 6 {
            captured.push(line);
        }
    }
    Err(format!(
        "cloudflared exited before printing a tunnel URL. Output: {}",
        captured.join(" / ")
    ))
}

/// Starts (or reuses) a cloudflared quick tunnel in front of the local media
/// stream server and returns its `wss://` URL.
#[tauri::command]
pub async fn start_twilio_tunnel(
    stream: tauri::State<'_, SharedStreamState>,
    tunnel: tauri::State<'_, TunnelState>,
) -> Result<String, String> {
    let port = stream.lock().map_err(|e| e.to_string())?.port;
    if port == 0 {
        return Err("Twilio media stream server is not running".to_string());
    }
    if tunnel.is_running()? {
        if let Some(url) = tunnel.inner.lock().map_err(|e| e.to_string())?.url.clone() {
            return Ok(url);
        }
    }

    let mut child = Command::new("cloudflared")
        .args([
            "tunnel",
            "--url",
            &format!("http://127.0.0.1:{}", port),
            "--no-autoupdate",
        ])
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .kill_on_drop(true)
        .spawn()
        .map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                "cloudflared is not installed. Install it (https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) or set a manual WSS URL in Settings."
                    .to_string()
            } else {
                format!("Failed to launch cloudflared: {}", e)
            }
        })?;

    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| "cloudflared stderr unavailable".to_string())?;
    let url = match timeout(URL_DISCOVERY_TIMEOUT, find_tunnel_url(stderr)).await {
        Ok(Ok(url)) => url,
        Ok(Err(e)) => {
            let _ = child.kill().await;
            return Err(e);
        }
        Err(_) => {
            let _ = child.kill().await;
            return Err("Timed out waiting for cloudflared to print a tunnel URL".to_string());
        }
    };

    let stale = tunnel.inner.lock().map_err(|e| e.to_string())?.child.take();
    if let Some(mut stale) = stale {
        let _ = stale.kill().await;
    }
    let mut guard = tunnel.inner.lock().map_err(|e| e.to_string())?;
    guard.child = Some(child);
    guard.url = Some(url.clone());
    Ok(url)
}

#[tauri::command]
pub async fn stop_twilio_tunnel(tunnel: tauri::State<'_, TunnelState>) -> Result<(), String> {
    let child = tunnel.inner.lock().map_err(|e| e.to_string())?.child.take();
    if let Some(mut child) = child {
        let _ = child.kill().await;
    }
    tunnel.inner.lock().map_err(|e| e.to_string())?.url = None;
    Ok(())
}

#[tauri::command]
pub fn get_twilio_tunnel_info(tunnel: tauri::State<'_, TunnelState>) -> Result<Value, String> {
    let guard = tunnel.inner.lock().map_err(|e| e.to_string())?;
    let running = guard
        .child
        .as_ref()
        .map(|c| c.id().is_some())
        .unwrap_or(false);
    Ok(serde_json::json!({ "running": running, "url": guard.url }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_url_from_cloudflared_log_line() {
        let line = "2026-10-02T12:00:00Z INF |  https://tasty-fox-9x.trycloudflare.com |";
        assert_eq!(
            extract_tunnel_url(line).as_deref(),
            Some("https://tasty-fox-9x.trycloudflare.com")
        );
    }

    #[test]
    fn extracts_url_without_trailing_pipe() {
        let line = "INF Thank you for trying Cloudflare Tunnel. Doing so does not create any public DNS records. url=https://brave-cat-a1.trycloudflare.com";
        assert_eq!(
            extract_tunnel_url(line).as_deref(),
            Some("https://brave-cat-a1.trycloudflare.com")
        );
    }

    #[test]
    fn ignores_lines_without_a_tunnel_url() {
        assert_eq!(extract_tunnel_url("INF Starting tunnel"), None);
        assert_eq!(extract_tunnel_url("https://example.com/foo"), None);
    }

    #[test]
    fn tunnel_state_starts_stopped() {
        let state = TunnelState::default();
        assert!(!state.is_running().unwrap());
    }
}
