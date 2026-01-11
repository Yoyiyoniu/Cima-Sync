use reqwest;
use std::time::Duration;
use lazy_static::lazy_static;
use std::sync::Mutex;
use crate::network_controller::certificate_controller::gen_certificate;

lazy_static! {
    static ref CERT_CACHE: Mutex<Option<reqwest::Certificate>> = Mutex::new(None);
}

fn get_cached_certificate() -> Result<reqwest::Certificate, Box<dyn std::error::Error>> {
    let mut cache = CERT_CACHE
        .lock()
        .map_err(|_| "Error al acceder a la caché del certificado")?;
    
    if let Some(ref cert) = *cache {
        return Ok(cert.clone());
    }
    
    let cert_pem = gen_certificate()?;
    let cert = reqwest::Certificate::from_pem(cert_pem.as_bytes())?;
    *cache = Some(cert.clone());
    
    Ok(cert)
}

pub fn build_client(
    timeout: Duration,
    no_redirect: bool,
) -> Result<reqwest::blocking::Client, Box<dyn std::error::Error>> {
    let cert = get_cached_certificate()?;
    
    let mut builder = reqwest::blocking::Client::builder()
        .timeout(timeout)
        .add_root_certificate(cert);
    
    if no_redirect {
        builder = builder.redirect(reqwest::redirect::Policy::none());
    }
    
    Ok(builder.build()?)
}
