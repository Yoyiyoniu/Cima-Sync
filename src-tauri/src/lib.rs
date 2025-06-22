mod auth;
#[cfg(desktop)]
mod tray;

use crate::auth::Auth;
#[cfg(desktop)]
use crate::tray::system_tray;

use std::sync::Arc;
use std::sync::Mutex;
use std::thread;

lazy_static::lazy_static! {
    static ref CURRENT_AUTH: Arc<Mutex<Option<Auth>>> = Arc::new(Mutex::new(None));
}

#[tauri::command]
fn auto_auth(email: &str, password: &str) -> String {
    let auth = Auth::new(email, password);
    let auth_clone = Auth::new(email, password);
    *CURRENT_AUTH.lock().unwrap() = Some(auth);

    thread::spawn(move || match auth_clone.start_monitoring() {
        Ok(_) => println!("Proceso de monitoreo finalizado"),
        Err(e) => eprintln!("Error en el proceso de monitoreo: {}", e),
    });

    format!("Proceso de autenticación iniciado para: {}", email)
}

#[tauri::command]
fn stop_auth() -> String {
    if let Some(auth) = CURRENT_AUTH.lock().unwrap().as_ref() {
        auth.stop_monitoring();
        "Proceso de monitoreo detenido".to_string()
    } else {
        "No hay proceso de monitoreo activo".to_string()
    }
}

#[tauri::command]
fn login(email: &str, password: &str) -> Result<String, String> {
    let auth = Auth::new(email, password);
    match auth.login() {
        Ok(true) => Ok(format!("Login exitoso para: {}", email)),
        Ok(false) => Err(format!("Login fallido para: {}", email)),
        Err(e) => Err(format!("Error: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_network::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(desktop)]
            {
                system_tray(app)?;
            }
            #[cfg(not(desktop))]
            {
                let _ = app; // Silence unused warning on mobile
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![auto_auth, login, stop_auth])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
