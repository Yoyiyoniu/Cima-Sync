use std::time::Duration;
use crate::network_controller::pinning::build_pinned_tls_config;

pub fn build_client(
    timeout: Duration,
    no_redirect: bool,
) -> Result<reqwest::blocking::Client, Box<dyn std::error::Error>> {
    let tls_config = build_pinned_tls_config()?;

    let mut builder = reqwest::blocking::Client::builder()
        .timeout(timeout)
        .use_preconfigured_tls(Some(tls_config));
    
    if no_redirect {
        builder = builder.redirect(reqwest::redirect::Policy::none());
    }
    
    Ok(builder.build()?)
}
