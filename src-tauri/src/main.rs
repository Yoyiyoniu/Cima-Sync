// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {

    rustls::crypto::ring::default_provider()
        .install_default()
        .expect("fallo al instalar CryptoProvider por defecto");

    cima_sync_lib::run()
}
