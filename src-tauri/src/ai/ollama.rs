use reqwest::Client;
use serde_json::{json, Value};
use std::env;

/// Resolve local AI (Ollama) config from explicit args or environment.
/// Returns `None` when no base URL is configured — callers then use
/// their normal cloud/demo path.
pub fn resolve_local_ai(base: Option<String>, model: Option<String>) -> Option<(String, String)> {
    fn norm(v: Option<String>) -> Option<String> {
        v.map(|s| s.trim().to_string()).filter(|s| !s.is_empty())
    }
    let base = norm(base)
        .or_else(|| norm(env::var("OLLAMA_BASE_URL").ok()))
        .map(|b| b.trim_end_matches('/').to_string())?;
    let model = norm(model)
        .or_else(|| norm(env::var("OLLAMA_MODEL").ok()))
        .unwrap_or_else(|| "llama3.2".to_string());
    Some((base, model))
}

/// Ask a local Ollama server for one non-streaming chat completion.
/// `json_mode` sets Ollama's structured-output format for deterministic parsing.
pub async fn chat(
    base_url: &str,
    model: &str,
    prompt: &str,
    json_mode: bool,
) -> Result<String, String> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(120))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;
    let mut payload = json!({
        "model": model,
        "messages": [{ "role": "user", "content": prompt }],
        "stream": false,
    });
    if json_mode {
        payload["format"] = json!("json");
    }
    let url = format!("{}/api/chat", base_url.trim_end_matches('/'));
    let res = client
        .post(&url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Ollama request failed: {}", e))?;
    if !res.status().is_success() {
        let status = res.status();
        let body = res.text().await.unwrap_or_default();
        let snippet: String = body.chars().take(300).collect();
        return Err(format!("Ollama HTTP {}: {}", status, snippet));
    }
    let body: Value = res
        .json()
        .await
        .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;
    body["message"]["content"]
        .as_str()
        .map(String::from)
        .ok_or_else(|| "Ollama response missing message content".to_string())
}

/// Check `GET {base}/api/tags` — returns the names of installed models.
pub async fn list_models(base_url: &str) -> Result<Vec<String>, String> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;
    let url = format!("{}/api/tags", base_url.trim_end_matches('/'));
    let res = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Ollama request failed: {}", e))?;
    if !res.status().is_success() {
        let status = res.status();
        let body = res.text().await.unwrap_or_default();
        let snippet: String = body.chars().take(300).collect();
        return Err(format!("Ollama HTTP {}: {}", status, snippet));
    }
    let body: Value = res
        .json()
        .await
        .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;
    Ok(body["models"]
        .as_array()
        .map(|models| {
            models
                .iter()
                .filter_map(|m| m["name"].as_str().map(String::from))
                .collect()
        })
        .unwrap_or_default())
}

/// Strip Markdown code fences some models wrap around JSON payloads.
pub fn strip_json_fences(text: &str) -> &str {
    let trimmed = text.trim();
    let unfenced = trimmed
        .strip_prefix("```")
        .map(|s| match s.find('\n') {
            Some(i) => &s[i + 1..],
            None => s,
        })
        .unwrap_or(trimmed);
    unfenced
        .strip_suffix("```")
        .map(|s| s.trim_end())
        .unwrap_or(unfenced)
        .trim()
}

#[tauri::command]
pub async fn test_ollama_connection(base_url: String) -> Result<Vec<String>, String> {
    let base = base_url.trim().trim_end_matches('/').to_string();
    if base.is_empty() {
        return Err("No Ollama base URL configured".to_string());
    }
    list_models(&base).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolve_prefers_explicit_args() {
        let resolved = resolve_local_ai(
            Some("  http://localhost:11434/  ".into()),
            Some("qwen3".into()),
        );
        assert_eq!(
            resolved,
            Some(("http://localhost:11434".to_string(), "qwen3".to_string()))
        );
    }

    #[test]
    fn resolve_empty_base_is_none() {
        assert_eq!(resolve_local_ai(Some("   ".into()), Some("m".into())), None);
    }

    #[test]
    fn strips_plain_json() {
        assert_eq!(strip_json_fences("{\"a\": 1}"), "{\"a\": 1}");
    }

    #[test]
    fn strips_fenced_json() {
        assert_eq!(strip_json_fences("```json\n{\"a\": 1}\n```"), "{\"a\": 1}");
    }

    #[test]
    fn strips_fence_without_language() {
        assert_eq!(strip_json_fences("```\n[1, 2]\n```"), "[1, 2]");
    }
}
