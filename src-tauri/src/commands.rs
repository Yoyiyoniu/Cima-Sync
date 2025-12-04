use crate::crypto::{encrypt_text, decrypt_text, init_session_key, clear_session_key, set_session_key};

use crate::auth::Auth;

use std::sync::Arc;
use std::sync::Mutex;
use std::thread;

lazy_static::lazy_static! {
    static ref CURRENT_AUTH: Arc<Mutex<Option<Auth>>> = Arc::new(Mutex::new(None));
}

// AUTH COMMANDS
#[tauri::command]
pub fn stop_auth() -> String {
    if let Some(auth) = CURRENT_AUTH.lock().unwrap().as_ref() {
        auth.stop_monitoring();
        "Proceso de monitoreo detenido".to_string()
    } else {
        "No hay proceso de monitoreo activo".to_string()
    }
}

#[tauri::command]
pub fn auto_auth(email: &str, password: &str) -> String {
    let username = email.split('@').next().unwrap_or(email).to_string();

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
pub fn login(email: &str, password: &str) -> Result<String, String> {
    let username = email.split('@').next().unwrap_or(email).to_string();

    let auth = Auth::new(&username, password);
    match auth.login() {
        Ok(true) => Ok(format!("Login exitoso para: {}", username)),
        Ok(false) => Err(format!("Login fallido para: {}", username)),
        Err(e) => Err(format!("{}", e)),
    }
}


// ENCRYPTION COMMANDS
#[tauri::command]
pub fn init_crypto() -> String {
    init_session_key()
}

#[tauri::command]
pub fn encrypt_credentials(plaintext: &str) -> Result<String, String> {
    encrypt_text(plaintext)
}

#[tauri::command]
pub fn decrypt_credentials(ciphertext: &str) -> Result<String, String> {
    decrypt_text(ciphertext)
}

#[tauri::command]
pub fn clear_crypto() {
    clear_session_key();
}

#[tauri::command]
pub fn set_crypto_key(key_b64: &str) -> Result<String, String> {
    set_session_key(key_b64)?;
    Ok("Clave de encriptación establecida correctamente".to_string())
}