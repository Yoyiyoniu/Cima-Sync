use reqwest;
use std::collections::HashMap;
use std::thread;
use std::time::{Duration, Instant};

use crate::network_controller::client_builder::build_client;

const ERROR_NO_CONEXION: &str = "No se detecta conexión a internet.";
const ERROR_PORTAL_NO_DISPONIBLE: &str = "No estas en el wifi UABC o ya estas conectado.";
const ERROR_CREDENCIALES: &str = "Credenciales invalidas.";
const ERROR_TIEMPO_ESPERA: &str = "Tiempo de espera agotado.";
const ERROR_GENERAL: &str = "Ocurrió un error al conectarse a la red UABC.";

const MONITORING_INTERVAL: Duration = Duration::from_secs(60);
const SUCCESS_INTERVAL: Duration = Duration::from_secs(20);

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

pub struct Auth {
    email: String,
    password: String,
    check_interval: Duration,
    success_interval: Duration,
    should_stop: Arc<AtomicBool>,
}

impl Auth {
    pub fn new(email: &str, password: &str) -> Self {
        Auth {
            email: email.to_string(),
            password: password.to_string(),
            check_interval: MONITORING_INTERVAL,
            success_interval: SUCCESS_INTERVAL,
            should_stop: Arc::new(AtomicBool::new(false)),
        }
    }

    pub fn login(&self) -> Result<bool, Box<dyn std::error::Error>> {
        let start_time = Instant::now();
        print!("Verificando conexión... ");

        match check_uabc_connection() {
            Ok(is_direct_access) => {
                let elapsed = start_time.elapsed();

                if is_direct_access {
                    println!(
                        "✓ Conexión establecida en {:.2} segundos.",
                        elapsed.as_secs_f32()
                    );
                    println!("Connected to UABC.");
                    Ok(true)
                } else {
                    println!(
                        "\nPortal detectado en {:.2} segundos.",
                        elapsed.as_secs_f32()
                    );
                    println!("Starting session...");

                    let login_start = Instant::now();
                    match auto_login(&self.email, &self.password) {
                        Ok(success) => {
                            let login_elapsed = login_start.elapsed();
                            if success {
                                println!(
                                    "Session started in {:.2} seconds.",
                                    login_elapsed.as_secs_f32()
                                );
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
        println!("Starting connection monitoring...");
        self.should_stop.store(false, Ordering::SeqCst);

        while !self.should_stop.load(Ordering::SeqCst) {
            match self.login() {
                Ok(true) => {
                    println!(
                        "Next verification in {} seconds.",
                        self.success_interval.as_secs()
                    );
                    thread::sleep(self.success_interval);
                }
                Ok(false) | Err(_) => {
                    println!("Retrying in {} seconds.", self.check_interval.as_secs());
                    thread::sleep(self.check_interval);
                }
            }

            println!("\n---------------------------------------------");
        }
        println!("Connection monitoring stopped");
        Ok(())
    }

    pub fn stop_monitoring(&self) {
        self.should_stop.store(true, Ordering::SeqCst);
        println!("Stop signal sent");
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
            let id_time = start_time.elapsed();
            println!("ID obtained in {:.2} seconds", id_time.as_secs_f32());

            match send_login(username, password, &local_id) {
                Ok(status) => {
                    if status == reqwest::StatusCode::OK {
                        println!("Request sent successfully");

                        if verify_connection_after_login() {
                            return Ok(true);
                        } else {
                            println!("Request sent but no active connection");
                            return Ok(false);
                        }
                    } else {
                        println!("Unexpected server response: {}", status);
                        Ok(false)
                    }
                }
                Err(e) => {
                    if e.to_string().contains("certificate") && verify_connection_after_login() {
                        println!("Connection established");
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

    println!("Sending data...");
    let start_time = Instant::now();

    match client.post("https://pcw.uabc.mx/").form(&form).send() {
        Ok(res) => {
            let elapsed = start_time.elapsed();
            let status = res.status();
            let body = res.text()?;

            if status.is_success() {
                if body.contains("<title>Login Successful</title>") {
                    println!("Data sent in {:.2} seconds", elapsed.as_secs_f32());
                    Ok(status)
                } else {
                    println!("Error: The page title does not match");
                    println!("It is possible that the credentials are incorrect");
                    Ok(reqwest::StatusCode::UNAUTHORIZED)
                }
            } else {
                println!("Error sending data. Code: {}", status);
                Ok(status)
            }
        }
        Err(e) => Err(e.into()),
    }
}

fn verify_connection_after_login() -> bool {
    println!("Verifying connection...");

    thread::sleep(Duration::from_millis(500));

    match reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(3))
        .build()
    {
        Ok(client) => match client.get("https://www.google.com").send() {
            Ok(response) => {
                let success = response.status().is_success();
                println!(
                    "Result: {}",
                    if success {
                        "Conectado"
                    } else {
                        "No connection"
                    }
                );
                success
            }
            Err(_) => match client.get("https://www.cloudflare.com").send() {
                Ok(response) => {
                    let success = response.status().is_success();
                    println!(
                        "Resultado (alternativo): {}",
                        if success {
                            "Connected"
                        } else {
                            "No connection"
                        }
                    );
                    success
                }
                Err(_) => {
                    println!("No internet connection detected");
                    false
                }
            },
        },
        Err(_) => {
            println!("Error verifying connection");
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