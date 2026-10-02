mod ai;
mod db;
mod relay;
mod twilio;

use std::sync::{Arc, Mutex};
use tauri::Manager;

struct RelayState {
    port: u16,
}

#[tauri::command]
fn get_relay_port(state: tauri::State<Mutex<RelayState>>) -> u16 {
    state.lock().unwrap().port
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            dotenvy::from_path("../.env").ok();
            db::schema::init(app.handle());

            // Start voice relay server for OpenAI/ElevenLabs
            let relay_port =
                tauri::async_runtime::block_on(relay::start_relay_server()).unwrap_or(0);
            app.manage(Mutex::new(RelayState { port: relay_port }));
            log::info!("Voice relay available on port {}", relay_port);

            // Twilio Media Streams endpoint (phone line)
            let stream_state: twilio::stream::SharedStreamState =
                Arc::new(Mutex::new(twilio::stream::StreamState::default()));
            app.manage(stream_state.clone());
            app.manage(twilio::tunnel::TunnelState::default());
            match tauri::async_runtime::block_on(twilio::stream::start_stream_server(
                app.handle().clone(),
                stream_state.clone(),
            )) {
                Ok(p) => log::info!("Twilio media stream server on port {}", p),
                Err(e) => log::error!("Twilio media stream server failed to start: {}", e),
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            db::commands::get_leads,
            db::commands::update_lead_status,
            db::commands::add_leads,
            db::commands::get_call_logs,
            db::commands::add_call_log,
            db::commands::get_lead_call_logs,
            db::commands::get_lead_notes,
            db::commands::add_lead_note,
            db::commands::delete_lead,
            ai::gemini::simulate_lead_scraping,
            ai::gemini::process_onboarding_chat,
            ai::gemini::analyze_call_transcript,
            ai::gemini::objection_trainer_turn,
            ai::gemini::test_provider_connection,
            ai::ollama::test_ollama_connection,
            twilio::place_twilio_call,
            twilio::end_twilio_call,
            twilio::test_twilio_connection,
            twilio::stream::send_twilio_audio,
            twilio::stream::get_twilio_stream_info,
            twilio::tunnel::start_twilio_tunnel,
            twilio::tunnel::stop_twilio_tunnel,
            twilio::tunnel::get_twilio_tunnel_info,
            get_relay_port
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
