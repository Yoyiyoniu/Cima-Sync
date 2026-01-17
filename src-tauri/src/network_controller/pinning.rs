use base64::engine::general_purpose::STANDARD;
use base64::Engine;
use rustls::client::danger::{HandshakeSignatureValid, ServerCertVerified, ServerCertVerifier};
use rustls::client::WebPkiServerVerifier;
use rustls::pki_types::{CertificateDer, ServerName, UnixTime};
use rustls::{
    CertificateError, DigitallySignedStruct, Error as RustlsError, RootCertStore, SignatureScheme,
};
use sha2::{Digest, Sha256};
use std::sync::Arc;
use x509_parser::prelude::{FromDer, X509Certificate};

// ? Rotated every 3 months :D
const PINNED_SPKI_SHA256: &[&str] = &[
    "LsFWmoYBZbe7dGPj4X9kDpO59+xly3cuwIgO7SgtW34=",
];

pub fn build_pinned_tls_config() -> Result<rustls::ClientConfig, Box<dyn std::error::Error>> {
    let roots = Arc::new(load_native_roots()?);
    let inner = WebPkiServerVerifier::builder(roots.clone()).build()?;
    let verifier = Arc::new(PinningVerifier::new(inner, PINNED_SPKI_SHA256));

    let config = rustls::ClientConfig::builder()
        .dangerous()
        .with_custom_certificate_verifier(verifier)
        .with_no_client_auth();

    Ok(config)
}

fn load_native_roots() -> Result<RootCertStore, Box<dyn std::error::Error>> {
    let mut roots = RootCertStore::empty();
    for cert in rustls_native_certs::load_native_certs()? {
        roots.add(cert)?;
    }
    Ok(roots)
}

#[derive(Debug)]
struct PinningVerifier {
    inner: Arc<WebPkiServerVerifier>,
    pins: Vec<String>,
}

impl PinningVerifier {
    fn new(inner: Arc<WebPkiServerVerifier>, pins: &[&str]) -> Self {
        Self {
            inner,
            pins: pins.iter().map(|pin| pin.to_string()).collect(),
        }
    }

    fn spki_pin(cert: &CertificateDer<'_>) -> Result<String, RustlsError> {
        let (_, parsed) = X509Certificate::from_der(cert.as_ref())
            .map_err(|_| RustlsError::InvalidCertificate(CertificateError::BadEncoding))?;
        let spki = parsed.tbs_certificate.subject_pki.raw;
        let hash = Sha256::digest(spki);
        Ok(STANDARD.encode(hash))
    }
}

impl ServerCertVerifier for PinningVerifier {
    fn verify_server_cert(
        &self,
        end_entity: &CertificateDer<'_>,
        intermediates: &[CertificateDer<'_>],
        server_name: &ServerName<'_>,
        ocsp_response: &[u8],
        now: UnixTime,
    ) -> Result<ServerCertVerified, RustlsError> {
        self.inner.verify_server_cert(
            end_entity,
            intermediates,
            server_name,
            ocsp_response,
            now,
        )?;

        let pin = Self::spki_pin(end_entity)?;
        if self.pins.iter().any(|allowed| allowed == &pin) {
            Ok(ServerCertVerified::assertion())
        } else {
            Err(RustlsError::InvalidCertificate(
                CertificateError::ApplicationVerificationFailure,
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
