use crate::crypto::{
    clear_credentials_from_keyring, clear_stored_key, get_credentials_from_keyring,
    init_crypto_system, save_credentials_to_keyring, UserCredentials,
};

use crate::auth::Auth;
use crate::network_controller::network_sync::get_current_network_status;

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

// ENCRYPTION & CREDENTIALS COMMANDS
#[tauri::command]
pub fn init_crypto() -> Result<String, String> {
    init_crypto_system()?;
    Ok("Sistema de encriptación inicializado".to_string())
}

#[tauri::command]
pub fn save_credentials(email: &str, password: &str) -> Result<(), String> {
    save_credentials_to_keyring(email, password)
}

#[tauri::command]
pub fn get_credentials() -> Result<UserCredentials, String> {
    get_credentials_from_keyring()
}

#[tauri::command]
pub fn delete_credentials() -> Result<(), String> {
    clear_credentials_from_keyring()
}

#[tauri::command]
pub fn clear_crypto() -> Result<(), String> {
    clear_stored_key()
}

// Legacy / Deprecated placeholders para evitar errores si el frontend viejo llama
#[tauri::command]
pub fn encrypt_credentials(plaintext: &str) -> Result<String, String> {
    // Si aun se llama por error, retorna dummy o implementa si es necesario.
    // Pero la idea es migrar. Dejaré implementación base por si acaso.
    crate::crypto::encrypt_text(plaintext)
}

#[tauri::command]
pub fn decrypt_credentials(ciphertext: &str) -> Result<String, String> {
    crate::crypto::decrypt_text(ciphertext)
}

#[tauri::command]
pub fn set_crypto_key(_key_b64: &str) -> Result<String, String> {
    Ok("Comando obsoleto".to_string())
}

// NETWORK STATUS COMMANDS

#[tauri::command]
pub fn get_network_status() -> serde_json::Value {
    get_current_network_status()
}
