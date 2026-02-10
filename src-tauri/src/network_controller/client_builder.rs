use lazy_static::lazy_static;
use std::sync::Arc;
use std::time::Duration;

use rustls::client::danger::{HandshakeSignatureValid, ServerCertVerified, ServerCertVerifier};
use rustls::client::WebPkiServerVerifier;
use rustls::pki_types::{CertificateDer, ServerName, UnixTime};
use rustls::{DigitallySignedStruct, Error as RustlsError, RootCertStore, SignatureScheme};
use sha2::{Digest, Sha256};

#[derive(Debug)]
struct PinnedCertVerifier {
    inner: Arc<dyn ServerCertVerifier>,
    expected_cert_sha256: [u8; 32],
}

impl ServerCertVerifier for PinnedCertVerifier {
    fn verify_server_cert(
        &self,
        end_entity: &CertificateDer<'_>,
        intermediates: &[CertificateDer<'_>],
        server_name: &ServerName<'_>,
        ocsp_response: &[u8],
        now: UnixTime,
    ) -> Result<ServerCertVerified, RustlsError> {
        // Verificación estándar con WebPki
        self.inner
            .verify_server_cert(end_entity, intermediates, server_name, ocsp_response, now)?;

        // Cálculo del SHA-256 del certificado presentado por el servidor
        let mut hasher = Sha256::new();
        hasher.update(end_entity.as_ref());
        let digest = hasher.finalize();

        if digest.as_slice() == self.expected_cert_sha256 {
            Ok(ServerCertVerified::assertion())
        } else {
            Err(RustlsError::General(
                "El certificado del servidor no coincide con el pin configurado".into(),
            ))
        }
    }

    fn verify_tls12_signature(
        &self,
        message: &[u8],
        cert: &CertificateDer<'_>,
        dss: &DigitallySignedStruct,
    ) -> Result<HandshakeSignatureValid, RustlsError> {
        self.inner.verify_tls12_signature(message, cert, dss)
    }

    fn verify_tls13_signature(
        &self,
        message: &[u8],
        cert: &CertificateDer<'_>,
        dss: &DigitallySignedStruct,
    ) -> Result<HandshakeSignatureValid, RustlsError> {
        self.inner.verify_tls13_signature(message, cert, dss)
    }

    fn supported_verify_schemes(&self) -> Vec<SignatureScheme> {
        self.inner.supported_verify_schemes()
    }
}

fn build_pinned_client(no_redirect: bool) -> reqwest::blocking::Client {
    // Mismo pin que en `cima-sync-cli`
    // No sabes que es esto?
    // checa este repo: https://github.com/Yoyiyoniu/cima-tool.git
    const CERT_SHA256_HEX: &str =
        "19DC98BB1F0806934A375019394A01A9DAD4A18758EB1E4BB82607CDEB1DD25B";

    let expected_cert_sha256_vec =
        hex::decode(CERT_SHA256_HEX).expect("CERT_SHA256_HEX inválido, no es hex");
    let expected_cert_sha256: [u8; 32] = expected_cert_sha256_vec
        .try_into()
        .expect("CERT_SHA256_HEX no tiene longitud de 32 bytes");

    // RootCertStore con los anchors de webpki-roots
    let mut root_store = RootCertStore::empty();
    root_store.roots = webpki_roots::TLS_SERVER_ROOTS.to_vec();
    let root_store = Arc::new(root_store);

    let inner_verifier: Arc<dyn ServerCertVerifier> = WebPkiServerVerifier::builder(root_store)
        .build()
        .expect("No se pudo construir el verificador WebPki");

    let pinned_verifier = Arc::new(PinnedCertVerifier {
        inner: inner_verifier,
        expected_cert_sha256,
    });

    let root_config = rustls::ClientConfig::builder()
        .dangerous()
        .with_custom_certificate_verifier(pinned_verifier)
        .with_no_client_auth();

    let mut builder = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(5))
        .pool_max_idle_per_host(2)
        .pool_idle_timeout(Duration::from_secs(30))
        .use_preconfigured_tls(root_config);

    if no_redirect {
        builder = builder.redirect(reqwest::redirect::Policy::none());
    }

    builder.build().expect("Failed to build HTTP client with pinning")
}

lazy_static! {
    // Cliente con pinning y redirecciones permitidas (para la mayoría de peticiones al portal)
    static ref CLIENT_WITH_REDIRECT: reqwest::blocking::Client = {
        build_pinned_client(false)
    };

    // Cliente con pinning y sin seguir redirecciones (para detectar el portal cautivo)
    static ref CLIENT_NO_REDIRECT: reqwest::blocking::Client = {
        build_pinned_client(true)
    };

    // Cliente simple sin pinning, usado para comprobar conectividad general (Google/Cloudflare)
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
