use std::time::{Duration, Instant};

const BIND_WIFI_TIMEOUT_MS: u64 = 15_000;
const POLL_INTERVAL_MS: u64 = 250;
const ANDROID_API_M: i32 = 23;

#[cfg(target_os = "android")]
fn sdk_int(env: &mut jni::JNIEnv) -> Result<i32, String> {
    env.get_static_field("android/os/Build$VERSION", "SDK_INT", "I")
        .map_err(|e| format!("No se pudo leer SDK_INT: {e}"))?
        .i()
        .map_err(|e| format!("SDK_INT inválido: {e}"))
}

#[cfg(target_os = "android")]
fn get_connectivity_manager(
    env: &mut jni::JNIEnv,
) -> Result<jni::objects::GlobalRef, String> {
    let android_context = ndk_context::android_context();
    let context_ptr = android_context.context() as jni::sys::jobject;
    if context_ptr.is_null() {
        return Err("Contexto Android nulo".to_string());
    }

    // El contexto proviene del runtime Android embebido por Tauri.
    let context = unsafe { jni::objects::JObject::from_raw(context_ptr) };
    let context = env
        .new_global_ref(context)
        .map_err(|e| format!("No se pudo crear referencia global al contexto: {e}"))?;

    let connectivity_service = env
        .get_static_field(
            "android/content/Context",
            "CONNECTIVITY_SERVICE",
            "Ljava/lang/String;",
        )
        .map_err(|e| format!("No se pudo obtener CONNECTIVITY_SERVICE: {e}"))?
        .l()
        .map_err(|e| format!("CONNECTIVITY_SERVICE inválido: {e}"))?;

    let connectivity_manager = env
        .call_method(
            context.as_obj(),
            "getSystemService",
            "(Ljava/lang/String;)Ljava/lang/Object;",
            &[jni::objects::JValue::Object(&connectivity_service)],
        )
        .map_err(|e| format!("Error en getSystemService: {e}"))?
        .l()
        .map_err(|e| format!("ConnectivityManager inválido: {e}"))?;

    if connectivity_manager.is_null() {
        return Err("ConnectivityManager no disponible".to_string());
    }

    env
        .new_global_ref(connectivity_manager)
        .map_err(|e| format!("No se pudo crear referencia global de ConnectivityManager: {e}"))
}

#[cfg(target_os = "android")]
fn try_bind_to_any_wifi(
    env: &mut jni::JNIEnv,
    connectivity_manager: &jni::objects::GlobalRef,
) -> Result<bool, String> {
    let transport_wifi = env
        .get_static_field("android/net/NetworkCapabilities", "TRANSPORT_WIFI", "I")
        .map_err(|e| format!("No se pudo leer TRANSPORT_WIFI: {e}"))?
        .i()
        .map_err(|e| format!("TRANSPORT_WIFI inválido: {e}"))?;

    let networks = env
        .call_method(
            connectivity_manager.as_obj(),
            "getAllNetworks",
            "()[Landroid/net/Network;",
            &[],
        )
        .map_err(|e| format!("Error obteniendo redes: {e}"))?
        .l()
        .map_err(|e| format!("Arreglo de redes inválido: {e}"))?;

    if networks.is_null() {
        return Ok(false);
    }

    let network_array = jni::objects::JObjectArray::from(networks);
    let len = env
        .get_array_length(&network_array)
        .map_err(|e| format!("No se pudo leer longitud de redes: {e}"))?;

    for i in 0..len {
        let network = env
            .get_object_array_element(&network_array, i)
            .map_err(|e| format!("No se pudo leer red {i}: {e}"))?;

        if network.is_null() {
            continue;
        }

        let capabilities = env
            .call_method(
                connectivity_manager.as_obj(),
                "getNetworkCapabilities",
                "(Landroid/net/Network;)Landroid/net/NetworkCapabilities;",
                &[jni::objects::JValue::Object(&network)],
            )
            .map_err(|e| format!("Error leyendo capacidades de red: {e}"))?
            .l()
            .map_err(|e| format!("Capacidades de red inválidas: {e}"))?;

        if capabilities.is_null() {
            continue;
        }

        let is_wifi = env
            .call_method(
                &capabilities,
                "hasTransport",
                "(I)Z",
                &[jni::objects::JValue::Int(transport_wifi)],
            )
            .map_err(|e| format!("Error validando transporte WiFi: {e}"))?
            .z()
            .map_err(|e| format!("Resultado inválido de hasTransport: {e}"))?;

        if !is_wifi {
            continue;
        }

        let bound = env
            .call_method(
                connectivity_manager.as_obj(),
                "bindProcessToNetwork",
                "(Landroid/net/Network;)Z",
                &[jni::objects::JValue::Object(&network)],
            )
            .map_err(|e| format!("Error al forzar bind de red: {e}"))?
            .z()
            .map_err(|e| format!("Resultado inválido de bindProcessToNetwork: {e}"))?;

        if bound {
            return Ok(true);
        }
    }

    Ok(false)
}

#[cfg(target_os = "android")]
fn with_env<F, T>(mut f: F) -> Result<T, String>
where
    F: FnMut(&mut jni::JNIEnv) -> Result<T, String>,
{
    let android_context = ndk_context::android_context();
    let vm_ptr = android_context.vm() as *mut jni::sys::JavaVM;
    if vm_ptr.is_null() {
        return Err("JavaVM no disponible".to_string());
    }

    let vm = unsafe { jni::JavaVM::from_raw(vm_ptr) }
        .map_err(|e| format!("No se pudo obtener JavaVM: {e}"))?;
    let result = {
        let mut env = vm
            .attach_current_thread()
            .map_err(|e| format!("No se pudo adjuntar hilo JNI: {e}"))?;
        f(&mut env)
    };
    std::mem::forget(vm);
    result
}

#[cfg(target_os = "android")]
pub fn force_wifi_binding_android() -> Result<bool, String> {
    with_env(|env| {
        let sdk = sdk_int(env)?;
        if sdk < ANDROID_API_M {
            return Ok(true);
        }

        let connectivity_manager = get_connectivity_manager(env)?;
        let deadline = Instant::now() + Duration::from_millis(BIND_WIFI_TIMEOUT_MS);

        loop {
            if try_bind_to_any_wifi(env, &connectivity_manager)? {
                return Ok(true);
            }

            if Instant::now() >= deadline {
                return Err("Timeout esperando red WiFi".to_string());
            }

            std::thread::sleep(Duration::from_millis(POLL_INTERVAL_MS));
        }
    })
}

#[cfg(target_os = "android")]
pub fn release_wifi_binding_android() -> Result<bool, String> {
    with_env(|env| {
        let sdk = sdk_int(env)?;
        if sdk < ANDROID_API_M {
            return Ok(true);
        }

        let connectivity_manager = get_connectivity_manager(env)?;
        let null_network = jni::objects::JObject::null();

        let _ = env
            .call_method(
                connectivity_manager.as_obj(),
                "bindProcessToNetwork",
                "(Landroid/net/Network;)Z",
                &[jni::objects::JValue::Object(&null_network)],
            )
            .map_err(|e| format!("Error liberando bind de red: {e}"))?;

        Ok(true)
    })
}

#[cfg(not(target_os = "android"))]
pub fn force_wifi_binding_android() -> Result<bool, String> {
    Err("force_wifi solo está disponible en Android".to_string())
}

#[cfg(not(target_os = "android"))]
pub fn release_wifi_binding_android() -> Result<bool, String> {
    Err("release_wifi solo está disponible en Android".to_string())
}
