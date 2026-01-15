use crate::keyring_controller::crypto::{decrypt_text, encrypt_text, generate_session_key};
use base64::{engine::general_purpose, Engine as _};
use keyring::Entry;
use lazy_static::lazy_static;
use secrecy::{ExposeSecret, SecretBox};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use zeroize::Zeroize;

const SERVICE_NAME: &str = "cima-sync";
const KEY_USER: &str = "master_key";
const KEY_CREDS: &str = "user_creds";
const KEYRING_KEY_PREFIX: &str = "cimasync:";

#[derive(Clone)]
pub struct SecureKey(Vec<u8>);

impl Zeroize for SecureKey {
    fn zeroize(&mut self) {
        self.0.zeroize();
    }
}

impl Drop for SecureKey {
    fn drop(&mut self) {
        self.zeroize();
    }
}

impl SecureKey {
    pub fn new(key: Vec<u8>) -> Self {
        SecureKey(key)
    }

    pub fn expose(&self) -> &[u8] {
        &self.0
    }
}

lazy_static! {
    static ref SESSION_KEY: Arc<Mutex<Option<SecretBox<SecureKey>>>> = Arc::new(Mutex::new(None));
}

#[derive(Serialize, Deserialize)]
pub struct UserCredentials {
    pub email: String,
    pub password: String,
}

fn get_keyring_entry(key_name: &str) -> Result<Entry, String> {
    let namespaced_key = format!("{}{}", KEYRING_KEY_PREFIX, key_name);
    Entry::new(SERVICE_NAME, &namespaced_key).map_err(|e| e.to_string())
}

pub fn get_session_key() -> Result<Vec<u8>, String> {
    let mut session_key = SESSION_KEY
        .lock()
        .map_err(|_| "Error al acceder a la clave de sesión".to_string())?;

    if let Some(ref key) = *session_key {
        return Ok(key.expose_secret().expose().to_vec());
    }

    let entry = get_keyring_entry(KEY_USER)?;

    match entry.get_password() {
        Ok(stored_key_b64) => {
            let key = general_purpose::STANDARD
                .decode(stored_key_b64)
                .map_err(|e| format!("Error decodificando clave almacenada: {}", e))?;

            if key.len() != 32 {
                return Err("Clave almacenada corrupta o inválida".to_string());
            }

            let secure_key = SecretBox::new(Box::new(SecureKey::new(key.clone())));
            *session_key = Some(secure_key);
            Ok(key)
        }
        Err(keyring::Error::NoEntry) => {
            let key = generate_session_key();
            let key_b64 = general_purpose::STANDARD.encode(&key);

            entry
                .set_password(&key_b64)
                .map_err(|e| format!("Error guardando clave en keyring: {}", e))?;

            let secure_key = SecretBox::new(Box::new(SecureKey::new(key.clone())));
            *session_key = Some(secure_key);
            Ok(key)
        }
        Err(e) => Err(format!("Error de keyring: {}", e)),
    }
}

pub fn save_credentials_to_keyring(email: &str, password: &str) -> Result<(), String> {
    let creds = UserCredentials {
        email: email.to_string(),
        password: password.to_string(),
    };

    let json = serde_json::to_string(&creds)
        .map_err(|e| format!("Error serializando credenciales: {}", e))?;

    let session_key = get_session_key()?;
    let encrypted = encrypt_text(&session_key, &json)?;

    let entry = get_keyring_entry(KEY_CREDS)?;
    entry
        .set_password(&encrypted)
        .map_err(|e| format!("Error guardando credenciales en keyring: {}", e))?;

    Ok(())
}

pub fn get_credentials_from_keyring() -> Result<UserCredentials, String> {
    let entry = get_keyring_entry(KEY_CREDS)?;

    let encrypted = entry.get_password().map_err(|e| match e {
        keyring::Error::NoEntry => "No se encontraron credenciales".to_string(),
        keyring::Error::BadEncoding(_) => {
            "Datos de keyring corruptos o invalidos".to_string()
        }
        other => format!("Error de keyring: {}", other),
    })?;

    let session_key = get_session_key()?;
    let json = decrypt_text(&session_key, &encrypted)?;

    serde_json::from_str(&json).map_err(|e| format!("Error deserializando credenciales: {}", e))
}

pub fn clear_credentials_from_keyring() -> Result<(), String> {
    let entry = get_keyring_entry(KEY_CREDS)?;
    let _ = entry.delete_credential();
    Ok(())
}

pub fn init_crypto_system() -> Result<(), String> {
    get_session_key().map(|_| ())
}

pub fn clear_stored_key() -> Result<(), String> {
    let mut session_key = SESSION_KEY
        .lock()
        .map_err(|_| "Error al acceder a la clave de sesión".to_string())?;
    
    *session_key = None;

    let entry_key = get_keyring_entry(KEY_USER)?;
    let _ = entry_key.delete_credential();

    let entry_creds = get_keyring_entry(KEY_CREDS)?;
    let _ = entry_creds.delete_credential();

    Ok(())
}

pub fn encrypt_text_with_session(plaintext: &str) -> Result<String, String> {
    let key = get_session_key()?;
    encrypt_text(&key, plaintext)
}

pub fn decrypt_text_with_session(ciphertext: &str) -> Result<String, String> {
    let key = get_session_key()?;
    decrypt_text(&key, ciphertext)
}