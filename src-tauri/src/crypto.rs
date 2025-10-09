use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, NewAead};
use base64::{Engine as _, engine::general_purpose};
use rand::{RngCore, rngs::OsRng};
use std::sync::{Arc, Mutex};
use lazy_static::lazy_static;

lazy_static! {
    static ref SESSION_KEY: Arc<Mutex<Option<Vec<u8>>>> = Arc::new(Mutex::new(None));
}

pub fn generate_session_key() -> Vec<u8> {
    let mut key = vec![0u8; 32];
    OsRng.fill_bytes(&mut key);
    key
}

pub fn init_session_key() -> String {
    let mut session_key = SESSION_KEY.lock().unwrap();
    
    if session_key.is_some() {
        return "EXISTING_KEY".to_string();
    }
    
    let key = generate_session_key();
    *session_key = Some(key.clone());
    
    general_purpose::STANDARD.encode(&key)
}

fn get_session_key() -> Result<Vec<u8>, String> {
    let session_key = SESSION_KEY.lock().unwrap();
    session_key.clone().ok_or_else(|| "No hay clave de sesión inicializada".to_string())
}

pub fn encrypt_text(plaintext: &str) -> Result<String, String> {
    let key = get_session_key()?;
    
    let cipher = Aes256Gcm::new(Key::from_slice(&key));
    
    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    let ciphertext = cipher.encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| format!("Error al encriptar: {}", e))?;
    
    let mut result = nonce_bytes.to_vec();
    result.extend_from_slice(&ciphertext);
    
    Ok(general_purpose::STANDARD.encode(&result))
}

pub fn decrypt_text(ciphertext: &str) -> Result<String, String> {
    let key = get_session_key()?;
    
    let encrypted_data = general_purpose::STANDARD.decode(ciphertext)
        .map_err(|e| format!("Error al decodificar base64: {}", e))?;
    
    if encrypted_data.len() < 12 {
        return Err("Datos encriptados inválidos".to_string());
    }
    
    let nonce_bytes = &encrypted_data[0..12];
    let ciphertext_bytes = &encrypted_data[12..];
    
    let cipher = Aes256Gcm::new(Key::from_slice(&key));
    let nonce = Nonce::from_slice(nonce_bytes);
    
    let plaintext = cipher.decrypt(nonce, ciphertext_bytes)
        .map_err(|e| format!("Error al desencriptar: {}", e))?;
    
    String::from_utf8(plaintext)
        .map_err(|e| format!("Error al convertir a UTF-8: {}", e))
}

#[allow(dead_code)]
pub fn has_session_key() -> bool {
    let session_key = SESSION_KEY.lock().unwrap();
    session_key.is_some()
}

pub fn clear_session_key() {
    let mut session_key = SESSION_KEY.lock().unwrap();
    *session_key = None;
}

pub fn set_session_key(key_b64: &str) -> Result<(), String> {
    let key = general_purpose::STANDARD.decode(key_b64)
        .map_err(|e| format!("Error al decodificar la clave: {}", e))?;
    
    if key.len() != 32 {
        return Err("La clave debe tener 32 bytes".to_string());
    }
    
    let mut session_key = SESSION_KEY.lock().unwrap();
    *session_key = Some(key);
    
    Ok(())
}