use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine as _;
use reqwest::Client;
use serde_json::{json, Value};
pub mod stream;
pub mod tunnel;

use std::time::Duration;

fn snippet(text: String) -> String {
    text.chars().take(300).collect()
}

fn mock_sid() -> String {
    let millis = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    format!("SM_mock_{}", millis)
}

fn is_mock_sid(call_sid: &str) -> bool {
    call_sid.starts_with("SM_mock_")
}

/// TwiML that hands the live call audio to our Media Streams WebSocket.
pub fn build_stream_twiml(ws_url: &str, lead_id: &str) -> String {
    format!(
        r#"<Response><Connect><Stream url="{}"><Parameter name="leadId" value="{}" /></Stream></Connect></Response>"#,
        ws_url, lead_id
    )
}

fn configured(account_sid: &str, auth_token: &str, phone_number: &str) -> bool {
    !account_sid.trim().is_empty()
        && !auth_token.trim().is_empty()
        && !phone_number.trim().is_empty()
}

async fn http() -> Result<Client, String> {
    Client::builder()
        .timeout(Duration::from_secs(20))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))
}

/// Place an outbound call. Without credentials this resolves to a mock SID so
/// the phone-line flow stays fully playable ("plug and play") before setup.
#[tauri::command]
pub async fn place_twilio_call(
    account_sid: String,
    auth_token: String,
    phone_number: String,
    to: String,
    lead_id: String,
    ws_url: String,
) -> Result<Value, String> {
    let to = to.trim().to_string();
    if to.is_empty() {
        return Err("Lead has no phone number".to_string());
    }
    if !configured(&account_sid, &auth_token, &phone_number) {
        return Ok(json!({ "callSid": mock_sid(), "mock": true }));
    }
    if ws_url.trim().is_empty() {
        return Err(
            "No public WebSocket URL — start the tunnel or set a manual URL in Settings"
                .to_string(),
        );
    }

    let twiml = build_stream_twiml(ws_url.trim(), &lead_id);
    let url = format!(
        "https://api.twilio.com/2010-04-01/Accounts/{}/Calls.json",
        account_sid.trim()
    );
    let res = http()
        .await?
        .post(&url)
        .basic_auth(account_sid.trim(), Some(auth_token.trim()))
        .form(&[
            ("To", to.as_str()),
            ("From", phone_number.trim()),
            ("Twiml", twiml.as_str()),
        ])
        .send()
        .await
        .map_err(|e| format!("Twilio request failed: {}", e))?;
    if !res.status().is_success() {
        let status = res.status();
        let body = res.text().await.unwrap_or_default();
        return Err(format!("Twilio HTTP {}: {}", status, snippet(body)));
    }
    let body: Value = res
        .json()
        .await
        .map_err(|e| format!("Failed to parse Twilio response: {}", e))?;
    let call_sid = body["sid"].as_str().unwrap_or_default().to_string();
    if call_sid.is_empty() {
        return Err("Twilio response missing call SID".to_string());
    }
    Ok(json!({ "callSid": call_sid, "mock": false }))
}

#[tauri::command]
pub async fn end_twilio_call(
    account_sid: String,
    auth_token: String,
    call_sid: String,
) -> Result<(), String> {
    if call_sid.trim().is_empty()
        || is_mock_sid(&call_sid)
        || account_sid.trim().is_empty()
        || auth_token.trim().is_empty()
    {
        return Ok(());
    }
    let url = format!(
        "https://api.twilio.com/2010-04-01/Accounts/{}/Calls/{}.json",
        account_sid.trim(),
        call_sid.trim()
    );
    let res = http()
        .await?
        .delete(&url)
        .basic_auth(account_sid.trim(), Some(auth_token.trim()))
        .send()
        .await
        .map_err(|e| format!("Twilio request failed: {}", e))?;
    if !res.status().is_success() {
        let status = res.status();
        let body = res.text().await.unwrap_or_default();
        return Err(format!("Twilio HTTP {}: {}", status, snippet(body)));
    }
    Ok(())
}

#[tauri::command]
pub async fn test_twilio_connection(account_sid: String, auth_token: String) -> Result<(), String> {
    if !configured(&account_sid, &auth_token, "any") {
        return Err("No API credentials configured".to_string());
    }
    let url = format!(
        "https://api.twilio.com/2010-04-01/Accounts/{}.json",
        account_sid.trim()
    );
    let res = http()
        .await?
        .get(&url)
        .basic_auth(account_sid.trim(), Some(auth_token.trim()))
        .send()
        .await
        .map_err(|e| format!("Twilio request failed: {}", e))?;
    if !res.status().is_success() {
        let status = res.status();
        let body = res.text().await.unwrap_or_default();
        return Err(format!("Twilio HTTP {}: {}", status, snippet(body)));
    }
    Ok(())
}

// ── G.711 μ-law codec (Twilio wire format, 8 kHz mono) ─────────

pub fn mulaw_to_pcm16(byte: u8) -> i16 {
    let u = !byte;
    let quant = (u & 0x0F) as i32;
    let seg = ((u & 0x70) >> 4) as i32;
    let bias = 0x84;
    let t = ((quant << 3) + bias) << seg;
    let pcm = if (u & 0x80) != 0 { bias - t } else { t - bias };
    pcm.clamp(i16::MIN as i32, i16::MAX as i32) as i16
}

pub fn pcm16_to_mulaw(sample: i16) -> u8 {
    const BIAS: i32 = 0x84;
    const CLIP: i32 = 8159;
    const SEG_UEND: [i32; 8] = [0x3F, 0x7F, 0xFF, 0x1FF, 0x3FF, 0x7FF, 0xFFF, 0x1FFF];

    let mut pcm = sample as i32 >> 2;
    let mask = if pcm < 0 {
        pcm = -pcm;
        0x7F
    } else {
        0xFF
    };
    if pcm > CLIP {
        pcm = CLIP;
    }
    pcm += BIAS >> 2;

    let seg = SEG_UEND.iter().position(|&end| pcm <= end).unwrap_or(8) as i32;
    if seg >= 8 {
        return (0x7F ^ mask) as u8;
    }
    let uval = (seg << 4) | ((pcm >> (seg + 1)) & 0x0F);
    (uval ^ mask) as u8
}

/// Linear-interpolation resampler for mono PCM16 streams (8 kHz ↔ engine rates).
pub fn resample_pcm16(input: &[i16], from_rate: u32, to_rate: u32) -> Vec<i16> {
    if from_rate == to_rate || input.is_empty() {
        return input.to_vec();
    }
    let ratio = from_rate as f64 / to_rate as f64;
    let out_len = ((input.len() as f64) / ratio).round().max(1.0) as usize;
    let mut out = Vec::with_capacity(out_len);
    for i in 0..out_len {
        let pos = i as f64 * ratio;
        let idx = pos.floor() as usize;
        let frac = pos - idx as f64;
        let s0 = input[idx.min(input.len() - 1)] as f64;
        let s1 = input[(idx + 1).min(input.len() - 1)] as f64;
        out.push((s0 + (s1 - s0) * frac).round() as i16);
    }
    out
}

pub fn decode_mulaw_base64(payload: &str) -> Result<Vec<i16>, String> {
    let bytes = BASE64
        .decode(payload)
        .map_err(|e| format!("Invalid base64 media payload: {}", e))?;
    Ok(bytes.into_iter().map(mulaw_to_pcm16).collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn twiml_hands_audio_to_the_stream_socket() {
        let twiml = build_stream_twiml("wss://abc.trycloudflare.com", "lead_4");
        assert!(
            twiml.starts_with("<Response><Connect><Stream url=\"wss://abc.trycloudflare.com\">")
        );
        assert!(twiml.contains("name=\"leadId\" value=\"lead_4\""));
        assert!(twiml.ends_with("</Stream></Connect></Response>"));
    }

    #[test]
    fn mock_place_call_needs_no_credentials() {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        let res = rt.block_on(place_twilio_call(
            String::new(),
            String::new(),
            String::new(),
            "+15125550101".into(),
            "lead_1".into(),
            String::new(),
        ));
        let value = res.expect("mock call should succeed");
        assert_eq!(value["mock"], true);
        assert!(value["callSid"].as_str().unwrap().starts_with("SM_mock_"));
    }

    #[test]
    fn real_call_without_ws_url_errors() {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        let res = rt.block_on(place_twilio_call(
            "AC123".into(),
            "token".into(),
            "+15125550000".into(),
            "+15125550101".into(),
            "lead_1".into(),
            String::new(),
        ));
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("WebSocket"));
    }

    #[test]
    fn mock_call_ends_without_network() {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        rt.block_on(end_twilio_call(
            String::new(),
            String::new(),
            "SM_mock_123".into(),
        ))
        .expect("mock end should be a no-op");
    }

    #[test]
    fn mulaw_zero_codes_decode_to_zero() {
        assert_eq!(mulaw_to_pcm16(0xFF), 0);
        assert_eq!(mulaw_to_pcm16(0x7F), 0);
    }

    #[test]
    fn mulaw_roundtrips_within_quantization_error() {
        for sample in (i16::MIN..i16::MAX).step_by(137) {
            let encoded = pcm16_to_mulaw(sample);
            let decoded = mulaw_to_pcm16(encoded);
            let error = (decoded as i32 - sample as i32).abs();
            assert!(
                error <= 700,
                "sample {} encoded {} decoded {} error {}",
                sample,
                encoded,
                decoded,
                error
            );
        }
    }

    #[test]
    fn pcm16_to_mulaw_known_values() {
        assert_eq!(pcm16_to_mulaw(0), 0xFF);
        assert_eq!(pcm16_to_mulaw(-32124), 0x00);
    }

    #[test]
    fn resample_preserves_length_ratio_and_silence() {
        let silence = vec![0i16; 160];
        let down = resample_pcm16(&silence, 24000, 8000);
        assert_eq!(down.len(), 53); // 160 * 8/24 ≈ 53
        assert!(down.iter().all(|&s| s == 0));

        let tone: Vec<i16> = (0..480)
            .map(|i| ((i as f32 / 480.0 * std::f32::consts::TAU).sin() * 8000.0) as i16)
            .collect();
        let up = resample_pcm16(&tone, 8000, 24000);
        assert_eq!(up.len(), 1440);
        assert!(up.iter().any(|&s| s > 1000));
        assert!(up.iter().any(|&s| s < -1000));
    }

    #[test]
    fn decode_mulaw_base64_parses_wire_frames() {
        // base64 of [0xFF, 0x7F] — both decode to 0
        let pcm = decode_mulaw_base64("//8=").expect("decode");
        assert_eq!(pcm, vec![0, 0]);
        assert!(decode_mulaw_base64("!!!").is_err());
    }
}
