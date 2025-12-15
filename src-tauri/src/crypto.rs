use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, NewAead};
use base64::{Engine as _, engine::general_purpose};
use rand::{RngCore, rngs::OsRng};
use std::sync::{Arc, Mutex};
use lazy_static::lazy_static;
use keyring::Entry;
use serde::{Serialize, Deserialize};

const SERVICE_NAME: &str = "cima-sync";
const KEY_USER: &str = "master_key";
const KEY_CREDS: &str = "user_creds";

lazy_static! {
    static ref SESSION_KEY: Arc<Mutex<Option<Vec<u8>>>> = Arc::new(Mutex::new(None));
}

#[derive(Serialize, Deserialize)]
pub struct UserCredentials {
    pub email: String,
    pub password: String,
}

pub fn generate_session_key() -> Vec<u8> {
    let mut key = vec![0u8; 32];
    OsRng.fill_bytes(&mut key);
    key
}

fn get_keyring_entry(key_name: &str) -> Result<Entry, String> {
    Entry::new(SERVICE_NAME, key_name).map_err(|e| e.to_string())
}

fn get_session_key() -> Result<Vec<u8>, String> {
    let mut session_key = SESSION_KEY.lock().unwrap();
    
    if let Some(ref key) = *session_key {
        return Ok(key.clone());
    }

    // Intentar cargar del keyring
    let entry = get_keyring_entry(KEY_USER)?;
    
    match entry.get_password() {
        Ok(stored_key_b64) => {
            let key = general_purpose::STANDARD.decode(stored_key_b64)
                .map_err(|e| format!("Error decodificando clave almacenada: {}", e))?;
            
            if key.len() != 32 {
                return Err("Clave almacenada corrupta o inválida".to_string());
            }
            
            *session_key = Some(key.clone());
            Ok(key)
        },
        Err(keyring::Error::NoEntry) => {
            // Generar nueva clave
            let key = generate_session_key();
            let key_b64 = general_purpose::STANDARD.encode(&key);
            
            entry.set_password(&key_b64)
                .map_err(|e| format!("Error guardando clave en keyring: {}", e))?;
                
            *session_key = Some(key.clone());
            Ok(key)
        },
        Err(e) => Err(format!("Error de keyring: {}", e))
    }
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

pub fn save_credentials_to_keyring(email: &str, password: &str) -> Result<(), String> {
    let creds = UserCredentials {
        email: email.to_string(),
        password: password.to_string(),
    };
    
    let json = serde_json::to_string(&creds)
        .map_err(|e| format!("Error serializando credenciales: {}", e))?;
        
    let encrypted = encrypt_text(&json)?;
    
    let entry = get_keyring_entry(KEY_CREDS)?;
    entry.set_password(&encrypted)
        .map_err(|e| format!("Error guardando credenciales en keyring: {}", e))?;
        
    Ok(())
}

pub fn get_credentials_from_keyring() -> Result<UserCredentials, String> {
    let entry = get_keyring_entry(KEY_CREDS)?;
    
    let encrypted = entry.get_password()
        .map_err(|_| "No se encontraron credenciales".to_string())?;
        
    let json = decrypt_text(&encrypted)?;
    
    serde_json::from_str(&json)
        .map_err(|e| format!("Error deserializando credenciales: {}", e))
}

pub fn clear_credentials_from_keyring() -> Result<(), String> {
    let entry = get_keyring_entry(KEY_CREDS)?;
    let _ = entry.delete_credential();
    Ok(())
}

// Llamada para asegurar que el sistema de criptografía esté listo
pub fn init_crypto_system() -> Result<(), String> {
    get_session_key().map(|_| ())
}

pub fn clear_stored_key() -> Result<(), String> {
    let mut session_key = SESSION_KEY.lock().unwrap();
    *session_key = None;
    
    let entry_key = get_keyring_entry(KEY_USER)?;
    let _ = entry_key.delete_credential();
    
    let entry_creds = get_keyring_entry(KEY_CREDS)?;
    let _ = entry_creds.delete_credential();
    
    Ok(())
}
