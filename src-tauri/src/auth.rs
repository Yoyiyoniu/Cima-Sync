use reqwest;
use std::collections::HashMap;
use std::thread;
use std::time::{Duration, Instant};

const ERROR_NO_CONEXION: &str = "No se detecta conexión a internet.";
const ERROR_PORTAL_NO_DISPONIBLE: &str = "No estas en el wifi UABC o ya estas conectado.";
const ERROR_CREDENCIALES: &str = "Credenciales invalidas.";
const ERROR_TIEMPO_ESPERA: &str = "Tiempo de espera agotado.";
const ERROR_GENERAL: &str = "Ocurrió un error al conectarse a la red UABC.";

const MONITORING_INTERVAL: Duration = Duration::from_secs(120);
const SUCCESS_INTERVAL: Duration = Duration::from_secs(10);

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
        println!("Usuario: {}", self.email);

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
                    println!("Conectado a la red UABC.");
                    Ok(true)
                } else {
                    println!(
                        "\nPortal detectado en {:.2} segundos.",
                        elapsed.as_secs_f32()
                    );
                    println!("Iniciando sesión...");

                    let login_start = Instant::now();
                    match auto_login(&self.email, &self.password) {
                        Ok(success) => {
                            let login_elapsed = login_start.elapsed();
                            if success {
                                println!(
                                    "Sesión iniciada en {:.2} segundos.",
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
        println!("Iniciando monitoreo de conexión...");
        self.should_stop.store(false, Ordering::SeqCst);

        while !self.should_stop.load(Ordering::SeqCst) {
            match self.login() {
                Ok(true) => {
                    println!(
                        "Próxima verificación en {} segundos.",
                        self.success_interval.as_secs()
                    );
                    thread::sleep(self.success_interval);
                }
                Ok(false) | Err(_) => {
                    println!(
                        "Reintentando en {} segundos.",
                        self.check_interval.as_secs()
                    );
                    thread::sleep(self.check_interval);
                }
            }

            println!("\n---------------------------------------------");
        }
        println!("Monitoreo detenido");
        Ok(())
    }

    pub fn stop_monitoring(&self) {
        self.should_stop.store(true, Ordering::SeqCst);
        println!("Señal de detención enviada");
    }
}

fn check_uabc_connection() -> Result<bool, Box<dyn std::error::Error>> {
    let client = reqwest::blocking::Client::builder()
        .danger_accept_invalid_certs(true)
        .timeout(Duration::from_secs(3))
        .build()?;

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
            println!("ID obtenido en {:.2} segundos", id_time.as_secs_f32());

            match send_login(username, password, &local_id) {
                Ok(status) => {
                    if status == reqwest::StatusCode::OK {
                        println!("Solicitud enviada correctamente");

                        if verify_connection_after_login() {
                            return Ok(true);
                        } else {
                            println!("Solicitud enviada pero sin conexión activa");
                            return Ok(false);
                        }
                    } else {
                        println!("Respuesta inesperada del servidor: {}", status);
                        Ok(false)
                    }
                }
                Err(e) => {
                    if e.to_string().contains("certificate") && verify_connection_after_login() {
                        println!("Conexión establecida");
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
    let client = reqwest::blocking::Client::builder()
        .danger_accept_invalid_certs(true)
        .timeout(Duration::from_secs(5))
        .build()?;

    let mut form = HashMap::new();
    form.insert("url", local_id);
    form.insert("username", email);
    form.insert("password", password);

    println!("Enviando datos...");
    let start_time = Instant::now();

    match client.post("https://pcw.uabc.mx/").form(&form).send() {
        Ok(res) => {
            let elapsed = start_time.elapsed();
            let status = res.status();
            let body = res.text()?;

            if status.is_success() {
                // Verificar si el título es correcto
                if body.contains("<title>Login Successful</title>") {
                    println!("Datos enviados en {:.2} segundos", elapsed.as_secs_f32());
                    Ok(status)
                } else {
                    println!("Error: El título de la página no coincide");
                    println!("Es posible que las credenciales sean incorrectas");
                    Ok(reqwest::StatusCode::UNAUTHORIZED)
                }
            } else {
                println!("Error al enviar datos. Código: {}", status);
                Ok(status)
            }
        }
        Err(e) => Err(e.into()),
    }
}

fn verify_connection_after_login() -> bool {
    println!("Verificando conexión...");

    thread::sleep(Duration::from_millis(500));

    match reqwest::blocking::Client::builder()
        .danger_accept_invalid_certs(true)
        .timeout(Duration::from_secs(3))
        .build()
    {
        Ok(client) => match client.get("https://www.google.com").send() {
            Ok(response) => {
                let success = response.status().is_success();
                println!(
                    "Resultado: {}",
                    if success {
                        "Conectado"
                    } else {
                        "Sin conexión"
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
                            "Conectado"
                        } else {
                            "Sin conexión"
                        }
                    );
                    success
                }
                Err(_) => {
                    println!("No se detecta conexión a internet");
                    false
                }
            },
        },
        Err(_) => {
            println!("Error al verificar conexión");
            false
        }
    }
}

fn check_redirect(url: &str) -> Result<(bool, Option<String>), Box<dyn std::error::Error>> {
    let client = reqwest::blocking::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .timeout(Duration::from_secs(3))
        .danger_accept_invalid_certs(true)
        .build()?;

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
