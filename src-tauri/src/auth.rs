use reqwest;
use secrecy::{ExposeSecret, SecretBox};
use std::collections::HashMap;
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};
use zeroize::Zeroize;

use crate::network_controller::client_builder::build_client;

const ERROR_NO_CONEXION: &str = "No se detecta conexión a internet.";
const ERROR_PORTAL_NO_DISPONIBLE: &str = "No estas en el wifi UABC o ya estas conectado.";
const ERROR_CREDENCIALES: &str = "Credenciales invalidas.";
const ERROR_TIEMPO_ESPERA: &str = "Tiempo de espera agotado.";
const ERROR_GENERAL: &str = "Ocurrió un error al conectarse a la red UABC.";

const MONITORING_INTERVAL: Duration = Duration::from_secs(60);
const SUCCESS_INTERVAL: Duration = Duration::from_secs(20);
const INITIAL_BACKOFF_SECS: u64 = 5;
const MAX_BACKOFF_SECS: u64 = 5 * 60;
const BACKOFF_MULTIPLIER: f64 = 2.0;
const MAX_CONSECUTIVE_FAILURES: u32 = 10;

use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::Arc;

#[derive(Clone)]
pub struct SecureString(String);

impl Zeroize for SecureString {
    fn zeroize(&mut self) {
        self.0.zeroize();
    }
}

impl Drop for SecureString {
    fn drop(&mut self) {
        self.zeroize();
    }
}

impl From<String> for SecureString {
    fn from(s: String) -> Self {
        SecureString(s)
    }
}

impl From<&str> for SecureString {
    fn from(s: &str) -> Self {
        SecureString(s.to_string())
    }
}

impl SecureString {
    pub fn expose(&self) -> &str {
        &self.0
    }
}

pub struct Auth {
    email: String,
    password: SecretBox<SecureString>,
    check_interval: Duration,
    success_interval: Duration,
    should_stop: Arc<AtomicBool>,
    consecutive_failures: Arc<AtomicU32>,
    current_backoff_secs: Arc<Mutex<u64>>,
}

impl Auth {
    pub fn new(email: &str, password: &str) -> Self {
        Auth {
            email: email.to_string(),
            password: SecretBox::new(Box::new(SecureString::from(password))),
            check_interval: MONITORING_INTERVAL,
            success_interval: SUCCESS_INTERVAL,
            should_stop: Arc::new(AtomicBool::new(false)),
            consecutive_failures: Arc::new(AtomicU32::new(0)),
            current_backoff_secs: Arc::new(Mutex::new(INITIAL_BACKOFF_SECS)),
        }
    }

    fn calculate_backoff(&self) -> Duration {
        let failures = self.consecutive_failures.load(Ordering::SeqCst);
        
        if failures == 0 {
            return self.check_interval;
        }

        let backoff_secs = match self.current_backoff_secs.lock() {
            Ok(mut guard) => {
                let current = *guard;
                let next = ((current as f64) * BACKOFF_MULTIPLIER) as u64;
                *guard = next.min(MAX_BACKOFF_SECS);
                current
            }
            Err(poisoned) => {
                let guard = poisoned.into_inner();
                *guard
            }
        };

        Duration::from_secs(backoff_secs.min(MAX_BACKOFF_SECS))
    }

    fn record_success(&self) {
        self.consecutive_failures.store(0, Ordering::SeqCst);
        if let Ok(mut guard) = self.current_backoff_secs.lock() {
            *guard = INITIAL_BACKOFF_SECS;
        }
    }

    fn record_2efailure(&self) {
        let failures = self.consecutive_failures.fetch_add(1, Ordering::SeqCst);
        if failures >= MAX_CONSECUTIVE_FAILURES {
            eprintln!(
                "[auth] Demasiados fallos consecutivos ({}), considera verificar la conexión",
                failures + 1
            );
        }
    }

    pub fn login(&self) -> Result<bool, Box<dyn std::error::Error>> {
        let start_time = Instant::now();

        match check_uabc_connection() {
            Ok(is_direct_access) => {
                let _elapsed = start_time.elapsed();

                if is_direct_access {
                    Ok(true)
                } else {
                    let login_start = Instant::now();
                    match auto_login(&self.email, self.password.expose_secret().expose()) {
                        Ok(success) => {
                            let _login_elapsed = login_start.elapsed();
                            if success {
                                Ok(true)
                            } else {
                                Err(ERROR_CREDENCIALES.into())
                            }
                        }
                        Err(e) => {
                            if e.to_string().contains("timeout") {
                                Err(ERROR_TIEMPO_ESPERA.into())
                            } else if e.to_string().contains("connection") {
                                Err(ERROR_NO_CONEXION.into())
                            } else {
                                Err(ERROR_GENERAL.into())
                            }
                        }
                    }
                }
            }
            Err(e) => {
                if e.to_string().contains("timeout") {
                    Err(ERROR_TIEMPO_ESPERA.into())
                } else if e.to_string().contains("connection") {
                    Err(ERROR_NO_CONEXION.into())
                } else {
                    Err(ERROR_PORTAL_NO_DISPONIBLE.into())
                }
            }
        }
    }

    pub fn start_monitoring(&self) -> Result<(), Box<dyn std::error::Error>> {
        self.should_stop.store(false, Ordering::SeqCst);

        while !self.should_stop.load(Ordering::SeqCst) {
            match self.login() {
                Ok(true) => {
                    self.record_success();
                    thread::sleep(self.success_interval);
                }
                Ok(false) => {
                    self.record_2efailure();
                    let backoff = self.calculate_backoff();
                    eprintln!("[auth] Login fallido, reintentando en {} segundos", backoff.as_secs());
                    thread::sleep(backoff);
                }
                Err(e) => {
                    self.record_2efailure();
                    let backoff = self.calculate_backoff();
                    eprintln!("[auth] Error: {}. Reintentando en {} segundos", e, backoff.as_secs());
                    thread::sleep(backoff);
                }
            }
        }
        Ok(())
    }

    pub fn stop_monitoring(&self) {
        self.should_stop.store(true, Ordering::SeqCst);
    }
}

fn check_uabc_connection() -> Result<bool, Box<dyn std::error::Error>> {
    let client = build_client(Duration::from_secs(3), false)?;

    match client.get("https://pcw.uabc.mx/").send() {
        Ok(response) => {
            let status = response.status();

            if status.is_success() {
                let body = response.text()?;
                if body.contains("Universidad Autónoma de Baja California")
                    && !body.contains("login")
                {
                    println!("Pcw exist");
                    return Ok(true);
                }
            }

            Ok(false)
        }
        Err(e) => {
            if e.to_string().contains("certificate") || e.to_string().contains("cert") {
                return Ok(false);
            }

            Err(e.into())
        }
    }
}

fn auto_login(username: &str, password: &str) -> Result<bool, Box<dyn std::error::Error>> {
    let start_time = Instant::now();
    let res = get_local_id();
    match res {
        Ok(local_id) => {
            let _id_time = start_time.elapsed();

            match send_login(username, password, &local_id) {
                Ok(status) => {
                    if status == reqwest::StatusCode::OK {
                        if verify_connection_after_login() {
                            return Ok(true);
                        } else {
                            return Ok(false);
                        }
                    } else {
                        Ok(false)
                    }
                }
                Err(e) => {
                    if e.to_string().contains("certificate") && verify_connection_after_login() {
                        return Ok(true);
                    }

                    Err(e)
                }
            }
        }
        Err(e) => Err(e),
    }
}

fn send_login(
    email: &str,
    password: &str,
    local_id: &str,
) -> Result<reqwest::StatusCode, Box<dyn std::error::Error>> {
    let client = build_client(Duration::from_secs(5), false)?;

    let mut form = HashMap::new();
    form.insert("url", local_id);
    form.insert("username", email);
    form.insert("password", password);

    match client.post("https://pcw.uabc.mx/").form(&form).send() {
        Ok(res) => {
            let status = res.status();
            let body = res.text()?;

            if status.is_success() {
                if body.contains("<title>Login Successful</title>") {
                    Ok(status)
                } else {
                    Ok(reqwest::StatusCode::UNAUTHORIZED)
                }
            } else {
                Ok(status)
            }
        }
        Err(e) => Err(e.into()),
    }
}

fn verify_connection_after_login() -> bool {
    thread::sleep(Duration::from_millis(500));

    match reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(3))
        .build()
    {
        Ok(client) => match client.get("https://www.google.com").send() {
            Ok(response) => {
                let success = response.status().is_success();
                success
            }
            Err(_) => match client.get("https://www.cloudflare.com").send() {
                Ok(response) => {
                    let success = response.status().is_success();
                    success
                }
                Err(_) => {
                    false
                }
            },
        },
        Err(_) => {
            false
        }
    }
}

fn check_redirect(url: &str) -> Result<(bool, Option<String>), Box<dyn std::error::Error>> {
    let client = build_client(Duration::from_secs(3), true)?;

    let response = client.get(url).send()?;

    let status = response.status();
    let is_redirect = status.is_redirection();

    let redirect_url = if is_redirect {
        response
            .headers()
            .get("Location")
            .or(response.headers().get("location"))
            .map(|h| h.to_str().unwrap_or_default().to_string())
    } else {
        None
    };

    Ok((is_redirect, redirect_url))
}

fn get_local_id() -> Result<String, Box<dyn std::error::Error>> {
    match check_redirect("https://pcw.uabc.mx/") {
        Ok((redirected, redirect_url)) => {
            if redirected {
                if let Some(url) = redirect_url {
                    if let Some(pos) = url.find("url=") {
                        let local_id = &url[(pos + 4)..];
                        return Ok(local_id.to_string());
                    }
                    return Err(ERROR_PORTAL_NO_DISPONIBLE.into());
                }
                return Err(ERROR_PORTAL_NO_DISPONIBLE.into());
            }
            Err(ERROR_PORTAL_NO_DISPONIBLE.into())
        }
        Err(_) => Err(ERROR_NO_CONEXION.into()),
    }
}