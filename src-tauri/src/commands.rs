use crate::keyring_controller::keyring::{
    clear_credentials_from_keyring, clear_stored_key, decrypt_text_with_session,
    encrypt_text_with_session, get_credentials_from_keyring, init_crypto_system,
    save_credentials_to_keyring, UserCredentials,
};

use crate::auth::Auth;
use crate::network_controller::android_wifi::{
    force_wifi_binding_android, release_wifi_binding_android,
};
use crate::network_controller::network_sync::get_current_network_status;

use regex::Regex;
use std::sync::Arc;
use std::sync::Mutex;
use std::thread;

lazy_static::lazy_static! {
    static ref CURRENT_AUTH: Arc<Mutex<Option<Arc<Auth>>>> = Arc::new(Mutex::new(None));
    static ref EMAIL_REGEX: Regex = Regex::new(
        r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    ).expect("Regex de email inválido");
}

const MAX_EMAIL_LENGTH: usize = 254;
const MAX_PASSWORD_LENGTH: usize = 128;
const MIN_PASSWORD_LENGTH: usize = 1;
#[derive(Debug)]
pub enum ValidationError {
    EmptyEmail,
    EmptyPassword,
    EmailTooLong,
    PasswordTooLong,
    InvalidEmailFormat,
    ControlCharactersDetected,
}

impl std::fmt::Display for ValidationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ValidationError::EmptyEmail => write!(f, "El email no puede estar vacío"),
            ValidationError::EmptyPassword => write!(f, "La contraseña no puede estar vacía"),
            ValidationError::EmailTooLong => write!(f, "El email es demasiado largo (máximo {} caracteres)", MAX_EMAIL_LENGTH),
            ValidationError::PasswordTooLong => write!(f, "La contraseña es demasiado larga (máximo {} caracteres)", MAX_PASSWORD_LENGTH),
            ValidationError::InvalidEmailFormat => write!(f, "Formato de email inválido"),
            ValidationError::ControlCharactersDetected => write!(f, "Se detectaron caracteres de control no permitidos"),
        }
    }
}

fn validate_email(email: &str) -> Result<(), ValidationError> {
    if email.is_empty() {
        return Err(ValidationError::EmptyEmail);
    }
    
    if email.len() > MAX_EMAIL_LENGTH {
        return Err(ValidationError::EmailTooLong);
    }
    
    if email.chars().any(|c| c.is_control()) {
        return Err(ValidationError::ControlCharactersDetected);
    }
    
    if !EMAIL_REGEX.is_match(email) {
        return Err(ValidationError::InvalidEmailFormat);
    }
    
    Ok(())
}

fn validate_password(password: &str) -> Result<(), ValidationError> {
    if password.is_empty() || password.len() < MIN_PASSWORD_LENGTH {
        return Err(ValidationError::EmptyPassword);
    }
    
    if password.len() > MAX_PASSWORD_LENGTH {
        return Err(ValidationError::PasswordTooLong);
    }
    
    if password.chars().any(|c| c.is_control() && c != '\t') {
        return Err(ValidationError::ControlCharactersDetected);
    }
    
    Ok(())
}

fn validate_credentials(email: &str, password: &str) -> Result<(), String> {
    validate_email(email).map_err(|e| e.to_string())?;
    validate_password(password).map_err(|e| e.to_string())?;
    Ok(())
}

fn sanitize_text(text: &str) -> Result<String, ValidationError> {
    if text.chars().any(|c| c.is_control() && c != '\n' && c != '\t') {
        return Err(ValidationError::ControlCharactersDetected);
    }
    Ok(text.to_string())
}

#[tauri::command]
pub fn stop_auth() -> String {
    match CURRENT_AUTH.lock() {
        Ok(guard) => {
            if let Some(auth) = guard.as_ref() {
                auth.stop_monitoring();
                "Proceso de monitoreo detenido".to_string()
            } else {
                "No hay proceso de monitoreo activo".to_string()
            }
        }
        Err(_) => "Error al acceder al estado de autenticación".to_string(),
    }
}

#[tauri::command]
pub fn auto_auth(email: &str, password: &str) -> Result<String, String> {
    validate_credentials(email, password)?;
    
    let username = email.split('@').next().unwrap_or(email).to_string();

    // Crear solo una instancia de Auth envuelta en Arc
    let auth = Arc::new(Auth::new(&username, password));
    let auth_for_thread = Arc::clone(&auth);
    
    match CURRENT_AUTH.lock() {
        Ok(mut guard) => {
            *guard = Some(auth);
        }
        Err(_) => return Err("Error al inicializar autenticación".to_string()),
    }

    thread::spawn(move || {
        if let Err(e) = auth_for_thread.start_monitoring() {
            eprintln!("[auth] Error en monitoreo: {}", e);
        }
    });

    Ok(format!("Proceso de autenticación iniciado para: {}", username))
}

#[tauri::command]
pub fn login(email: &str, password: &str) -> Result<String, String> {
    validate_credentials(email, password)?;
    
    let username = email.split('@').next().unwrap_or(email).to_string();

    let auth = Auth::new(&username, password);
    match auth.login() {
        Ok(true) => Ok(format!("Login exitoso para: {}", username)),
        Ok(false) => Err("Credenciales inválidas".to_string()),
        Err(e) => Err(format!("{}", e)),
    }
}

#[tauri::command]
pub fn init_crypto() -> Result<String, String> {
    init_crypto_system()?;
    Ok("Sistema de encriptación inicializado".to_string())
}

#[tauri::command]
pub fn save_credentials(email: &str, password: &str) -> Result<(), String> {
    validate_credentials(email, password)?;
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

#[tauri::command]
pub fn encrypt_credentials(plaintext: &str) -> Result<String, String> {
    let sanitized = sanitize_text(plaintext)
        .map_err(|e| e.to_string())?;
    encrypt_text_with_session(&sanitized)
}

#[tauri::command]
pub fn decrypt_credentials(ciphertext: &str) -> Result<String, String> {
    if ciphertext.is_empty() {
        return Err("Texto cifrado vacío".to_string());
    }
    if ciphertext.len() > 10_000 {
        return Err("Texto cifrado demasiado largo".to_string());
    }
    decrypt_text_with_session(ciphertext)
}

#[tauri::command]
pub fn set_crypto_key(_key_b64: &str) -> Result<String, String> {
    Ok("Comando obsoleto".to_string())
}

#[tauri::command]
pub fn get_network_status() -> serde_json::Value {
    get_current_network_status()
}

#[tauri::command]
pub fn force_wifi() -> Result<bool, String> {
    force_wifi_binding_android()
}

#[tauri::command]
pub fn release_wifi() -> Result<bool, String> {
    release_wifi_binding_android()
}
