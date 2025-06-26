# Auto Login for UABC WiFi

# Requirements
- Cargo 
- Rust
- Bun.js (Or any other Node.js package manager)
- Not to be vibe coder



## This is a simple application that will log you into the UABC WiFi network automatically.

## Understanding the UABC Captive Portal

```
    Domain   | PHP Script | HTML Reference |    Util    | url={ImportantId}
https://pcw.uabc.mx/{phpScript}?{htmlReference}&{util}=true&url=ComputerId
```

## How to Use

How does this application work?

1. Detects if you are connected to the UABC WiFi network.
2. Accesses the URL `https://pcw.uabc.mx/` (the captive portal that requires login to access the internet).
3. Captures the redirected URL and extracts your device's ID.
4. Intercepts an HTTP request and modifies the URL to include your credentials.
5. Sends the modified request to the captive portal.
6. The captive portal logs you in automatically.
7. Enjoy!

## Disclaimer

I'm a student at UABC. I am not responsible for any misuse of this application.

🤓 I'm a 3rd semester student, and I use my free time to create interesting projects like this one.
