mod auth;
mod commands;
mod keyring_controller;
mod network_controller;
mod tray;

use crate::network_controller::network_sync::start_network_monitor;

#[cfg(desktop)]
use crate::tray::system_tray;

use crate::commands::{
    auto_auth, clear_crypto, decrypt_credentials, delete_credentials, encrypt_credentials,
    get_credentials, get_network_status, init_crypto, login, save_credentials, set_crypto_key,
    stop_auth,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = rustls::crypto::ring::default_provider().install_default();
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init());

    #[cfg(desktop)]
    {
        builder = builder
            .plugin(tauri_plugin_autostart::init(
                tauri_plugin_autostart::MacosLauncher::LaunchAgent,
                Some(vec!["--flag1", "--flag2"]),
            ))
            .setup(|app| {
                system_tray(app)?;
                start_network_monitor(app.handle().clone());
                Ok(())
            })
            .on_window_event( | window, event | {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            });
    }

    #[cfg(not(desktop))]
    {
        builder = builder.setup(|app| { 
            start_network_monitor(app.handle().clone());
            Ok(())
        });
    }

    builder
        .invoke_handler(tauri::generate_handler![
            auto_auth,
            login,
            stop_auth,
            init_crypto,
            encrypt_credentials,
            decrypt_credentials,
            clear_crypto,
            set_crypto_key,
            save_credentials,
            get_credentials,
            delete_credentials,
            get_network_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
