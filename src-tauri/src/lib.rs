mod auth;
mod tray;

use crate::auth::Auth;
use crate::tray::system_tray;

use std::sync::Arc;
use std::sync::Mutex;
use std::thread;

lazy_static::lazy_static! {
    static ref CURRENT_AUTH: Arc<Mutex<Option<Auth>>> = Arc::new(Mutex::new(None));
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

fn convert_email(email: &str) -> String {
    email.split('@').next().unwrap_or(email).to_string()
}

#[tauri::command]
fn auto_auth(email: &str, password: &str) -> String {
    let username = convert_email(email);

    let auth = Auth::new(&username, password);
    let auth_clone = Auth::new(&username, password);
    *CURRENT_AUTH.lock().unwrap() = Some(auth);

    thread::spawn(move || match auth_clone.start_monitoring() {
        Ok(_) => println!("Proceso de monitoreo finalizado"),
        Err(e) => eprintln!("Error en el proceso de monitoreo: {}", e),
    });

    format!("Proceso de autenticación iniciado para: {}", username)
}

#[tauri::command]
fn login(email: &str, password: &str) -> Result<String, String> {
    let username = convert_email(email);

    let auth = Auth::new(&username, password);
    match auth.login() {
        Ok(true) => Ok(format!("Login exitoso para: {}", username)),
        Ok(false) => Err(format!("Login fallido para: {}", username)),
        Err(e) => Err(format!("Error: {}", e)),
    }
}

pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init());

    #[cfg(desktop)]
    {
        builder = builder
            .plugin(tauri_plugin_autostart::init(
                tauri_plugin_autostart::MacosLauncher::LaunchAgent,
                Some(vec!["--flag1", "--flag2"])
            ))
            .setup(|app| {
                system_tray(app)?;
                Ok(())
            });
    }

    builder
        .invoke_handler(tauri::generate_handler![auto_auth, login, stop_auth])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
