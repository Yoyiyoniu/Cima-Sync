use lazy_static::lazy_static;
use std::time::Duration;

lazy_static! {
    static ref CLIENT_WITH_REDIRECT: reqwest::blocking::Client = {
        reqwest::blocking::Client::builder()
            .timeout(Duration::from_secs(5))
            .pool_max_idle_per_host(2)
            .pool_idle_timeout(Duration::from_secs(30))
            .build()
            .expect("Failed to build HTTP client")
    };
    
    static ref CLIENT_NO_REDIRECT: reqwest::blocking::Client = {
        reqwest::blocking::Client::builder()
            .timeout(Duration::from_secs(5))
            .pool_max_idle_per_host(2)
            .pool_idle_timeout(Duration::from_secs(30))
            .redirect(reqwest::redirect::Policy::none())
            .build()
            .expect("Failed to build HTTP client")
    };
    
    static ref CLIENT_SIMPLE: reqwest::blocking::Client = {
        reqwest::blocking::Client::builder()
            .timeout(Duration::from_secs(3))
            .pool_max_idle_per_host(1)
            .pool_idle_timeout(Duration::from_secs(20))
            .build()
            .expect("Failed to build simple HTTP client")
    };
}

pub fn build_client(
    _timeout: Duration,
    no_redirect: bool,
) -> Result<&'static reqwest::blocking::Client, Box<dyn std::error::Error>> {
    if no_redirect {
        Ok(&*CLIENT_NO_REDIRECT)
    } else {
        Ok(&*CLIENT_WITH_REDIRECT)
    }
}

pub fn get_simple_client() -> &'static reqwest::blocking::Client {
    &*CLIENT_SIMPLE
}
