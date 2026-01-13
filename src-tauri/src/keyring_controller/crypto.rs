use aes_gcm::aead::{Aead, NewAead};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use base64::{engine::general_purpose, Engine as _};
use rand::{rngs::OsRng, RngCore};

pub fn generate_session_key() -> Vec<u8> {
    let mut key = vec![0u8; 32];
    OsRng.fill_bytes(&mut key);
    key
}

pub fn encrypt_text(key: &[u8], plaintext: &str) -> Result<String, String> {
    if key.len() != 32 {
        return Err("La clave debe tener exactamente 32 bytes".to_string());
    }

    let cipher = Aes256Gcm::new(Key::from_slice(key));

    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| format!("Error al encriptar: {}", e))?;

    let mut result = nonce_bytes.to_vec();
    result.extend_from_slice(&ciphertext);

    Ok(general_purpose::STANDARD.encode(&result))
}

pub fn decrypt_text(key: &[u8], ciphertext: &str) -> Result<String, String> {
    if key.len() != 32 {
        return Err("La clave debe tener exactamente 32 bytes".to_string());
    }

    let encrypted_data = general_purpose::STANDARD
        .decode(ciphertext)
        .map_err(|e| format!("Error al decodificar base64: {}", e))?;

    if encrypted_data.len() < 12 {
        return Err("Datos encriptados inválidos".to_string());
    }

    let nonce_bytes = &encrypted_data[0..12];
    let ciphertext_bytes = &encrypted_data[12..];

    let cipher = Aes256Gcm::new(Key::from_slice(key));
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, ciphertext_bytes)
        .map_err(|e| format!("Error al desencriptar: {}", e))?;

    String::from_utf8(plaintext).map_err(|e| format!("Error al convertir a UTF-8: {}", e))
}