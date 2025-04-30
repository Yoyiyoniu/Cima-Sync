mod auth;
use crate::auth::Auth;
use std::thread;

#[tauri::command]
fn start_auth(email: &str, password: &str) -> String {
    // Iniciar el proceso de autenticación en un hilo separado para no bloquear la UI
    let email_owned = email.to_string();
    let password_owned = password.to_string();

    thread::spawn(move || {
        let auth = Auth::new(&email_owned, &password_owned);
        match auth.start_monitoring() {
            Ok(_) => println!("Proceso de monitoreo finalizado"),
            Err(e) => eprintln!("Error en el proceso de monitoreo: {}", e),
        }
    });

    format!("Proceso de autenticación iniciado para: {}", email)
}

#[tauri::command]
fn login_once(email: &str, password: &str) -> Result<String, String> {
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
        .plugin(tauri_plugin_opener::init())
        // declare this a command that can be called from the frontend
        .invoke_handler(tauri::generate_handler![start_auth, login_once])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
