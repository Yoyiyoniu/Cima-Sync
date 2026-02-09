

<div align="center">

# Cima Sync - Cybersecurity Class Edition
<br>

<img src="src/assets/img/cima-sync-desktop.png" width="300" alt="Cima Sync Logo">

<br>
<br>

**Enunciado para la clase de Ciberseguridad: análisis y refuerzo de la seguridad de Cima Sync**

</div>

---

## Objetivo de la práctica

En esta práctica vas a analizar y mejorar la seguridad de **Cima Sync**, una aplicación de escritorio que automatiza el inicio de sesión en el portal cautivo WiFi de la UABC.

Tu enfoque NO es agregar features nuevos, sino:

- **Identificar y corregir problemas de manejo de credenciales en memoria (RAM)**.
- **Implementar correctamente certificate pinning** para que la aplicación **no sea vulnerable a ataques MITM (Man-In-The-Middle)**.
- Documentar claramente **qué riesgos existían**, **cómo los explotaría un atacante** y **cómo los mitigaste**.

Al final, deberías tener una versión de la app más robusta desde el punto de vista de ciberseguridad, junto con evidencia técnica de los cambios.

---

## Contexto general del proyecto

**Cima Sync** automatiza el proceso de autenticación al WiFi de la UABC:

- Detecta cuando estás conectado a la red de la universidad.
- Envía tus credenciales al portal cautivo.
- Mantiene la sesión activa sin que tengas que entrar manualmente al portal cada vez.

Tecnologías principales:

- **Frontend**: React 18, TypeScript, Tailwind CSS.
- **Backend**: Rust + Tauri 2.
- **HTTP**: `reqwest` para las peticiones.
- **Credenciales**: uso de llavero/Keyring del sistema operativo.

Para esta clase, debes pensar como un atacante y como un ingeniero de seguridad al mismo tiempo: ¿dónde se pueden filtrar o robar credenciales?, ¿cómo puedo asegurar el canal de comunicación?, ¿qué pasa si alguien controla la red WiFi?

---

## Problema 1: Credenciales en memoria (RAM)

### Descripción del problema

Aunque las credenciales se almacenen “seguras” en el llavero del sistema, en algún momento:

- Se **desencriptan**.
- Se **cargan en memoria (RAM)**.
- Se **usan para construir peticiones HTTP**.

Si el código:

- Mantiene las credenciales en variables globales o estáticas.
- Las pasa innecesariamente a muchas funciones.
- No las limpia después de usarlas.

…entonces se quedan **más tiempo del necesario en RAM**, lo que abre la puerta a:

- **Dumps de memoria** (por ejemplo, un atacante con acceso al sistema puede hacer un volcado de memoria del proceso).
- **Logs accidentales** (credenciales impresas en logs de depuración).
- Exposición a herramientas de análisis forense de memoria.

### Lo que DEBES hacer

- **Identificar en el código dónde se cargan, almacenan y utilizan las credenciales** (en Rust y/o en el lado de Tauri donde aplique).
- Reducir al mínimo el tiempo de vida de las credenciales en memoria:
  - No guardarlas en estructuras globales si no es estrictamente necesario.
  - Usar variables con un scope lo más reducido posible.
  - Liberar/limpiar la información sensible tan pronto como ya no se requiera.
- Revisar que las credenciales **no se impriman en logs, errores o mensajes de debug**.
- Donde sea viable, usar tipos/estructuras pensadas para datos sensibles (o, si no se usan crates externos, al menos documentar claramente dónde se hace el “borrado lógico” de la información).

### Entregables específicos de este problema

- **Código modificado** donde se vea:
  - Menor exposición de las credenciales en memoria.
  - Eliminación de logs inseguros.
  - Mejor manejo del ciclo de vida de usuario/contraseña.
- **Explicación en texto** (en el reporte) respondiendo:
  - ¿En qué partes del código las credenciales permanecían más tiempo del necesario en RAM?
  - ¿Qué cambios realizaste para reducir su exposición?
  - ¿Cómo mitigaría esto un posible ataque que haga uso de dumps de memoria?

---

## Problema 2: Vulnerabilidad a ataques MITM (falta de certificate pinning)

### Descripción del problema

La aplicación se conecta al portal de la UABC usando HTTPS. Sin embargo, **si solo confía en la cadena de certificados del sistema operativo**, un atacante que controle la red (por ejemplo, un WiFi malicioso o un AP falso llamado igual) podría:

- Presentar un certificado válido emitido por una CA que el sistema confíe, o
- Aprovechar una CA maliciosa o comprometida,

y realizar un **ataque Man-In-The-Middle (MITM)**:

- Interceptando y leyendo tus credenciales.
- Modificando las respuestas del portal.

Para evitar esto, se requiere **certificate pinning**, es decir, que la aplicación:

- **Verifique explícitamente** que el certificado del servidor (o su huella/firma pública) coincide con uno o varios valores esperados.
- Rechace la conexión **aunque el sistema operativo “confíe” en el certificado**, si no coincide con el pin configurado.

### Lo que DEBES hacer

- Investigar cómo implementar **certificate pinning** con:
  - `reqwest` y
  - la pila de TLS que esté usando (por ejemplo, `rustls` si aplica en el proyecto).
- Extraer y definir al menos un **pin**:
  - Puede ser el **fingerprint** del certificado del portal.
  - O la **clave pública (SPKI)**.
- Modificar la configuración del cliente HTTP para:
  - Verificar ese pin en cada conexión al portal de autenticación.
  - **Fallar de forma segura** (no continuar) si el pin no coincide.

No basta con “aceptar cualquier certificado” ni con “desactivar la verificación de certificado” (eso, de hecho, es un peor escenario de seguridad).

### Entregables específicos de este problema

- **Código modificado** donde se vea:
  - Configuración explícita de certificate pinning.
  - Manejo de error cuando el pin no coincide.
- **Explicación en texto** (en el reporte) respondiendo:
  - ¿Cómo era el flujo de verificación de certificados antes?
  - ¿Qué tipo de ataque MITM sería posible sin pinning?
  - ¿Cómo asegura el nuevo código que solo se acepta el certificado legítimo del portal?

---

## Flujo de trabajo recomendado para los alumnos

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/Yoyiyoniu/Cima-Sync.git
   cd Cima-Sync
   ```

2. **Cambiar a la rama indicada por el profesor**

   El profesor puede darte una rama base específica (por ejemplo, `cybersecurity-class`). Cámbiate a ella:

   ```bash
   git checkout cybersecurity-class
   ```

3. **Instalar dependencias**

   ```bash
   npm install
   # o con Bun
   bun install
   ```

4. **Ejecutar en modo desarrollo**

   ```bash
   npm run tauri dev
   ```

   Verifica que:

   - La app se abre correctamente.
   - Puedes simular el login (no necesitas usar tus credenciales reales en producción, sigue las instrucciones del profesor para pruebas).

5. **Localizar el código relevante**

   - En **`src-tauri/`**: busca la lógica que:
     - Obtiene credenciales.
     - Construye y envía las peticiones HTTP de login.
   - En **`src/`** (frontend): revisa que no se expongan credenciales en componentes, estados globales o logs.

6. **Aplicar los cambios de seguridad**

   - Reducir tiempo de vida de credenciales en RAM.
   - Implementar certificate pinning.
   - Asegurarte de no romper el flujo de autenticación normal.

7. **Probar escenarios**

   - Conexión normal al portal.
   - Simulación de error de certificado (por ejemplo, cambiando el pin a uno incorrecto para forzar el fallo).
   - Comprobar que la app:
     - Falla de forma explícita cuando el pin es incorrecto.
     - No filtra credenciales en logs ni mensajes de error.

---

## Lo que debes entregar

- **Código** (commit/pull request o rama) con:
  - Manejo mejorado de credenciales en memoria.
  - Implementación de certificate pinning en el cliente HTTP de la app.
- **Reporte técnico en un archivo `REPORT.md` (o el formato que indique el profesor)** que incluya:
  - Descripción de los riesgos iniciales.
  - Explicación paso a paso de los cambios realizados.
  - Cómo un atacante podría haber explotado las vulnerabilidades originales.
  - Cómo tus cambios mitigan esos ataques.
  - Limitaciones o riesgos que aún podrían existir.

El reporte debe estar escrito de forma clara, como si se lo explicaras a otro ingeniero de seguridad que no conoce el proyecto.

---

## Criterios de evaluación

- **Claridad del análisis de riesgos**:
  - ¿Identificaste correctamente los puntos donde las credenciales se exponen en memoria?
  - ¿Explicaste de forma concreta posibles ataques MITM?
- **Calidad de las mitigaciones**:
  - ¿Reduciste efectivamente la exposición de credenciales en RAM?
  - ¿El certificate pinning está bien implementado y verificado?
  - ¿Fallan las conexiones de forma segura cuando algo no coincide?
- **Calidad del código**:
  - Cambios bien organizados y legibles.
  - Comentarios solo donde sean necesarios (no comentar obviedades).
- **Calidad del reporte**:
  - Lenguaje claro y técnico.
  - Diagrama/resumen del flujo antes y después (opcional pero recomendado).

---

## Nota final para los alumnos

Este proyecto es una oportunidad realista para pensar como atacante y como defensor:

- No basta con que “funcione”.
- Tiene que **funcionar de forma segura**.

Piensa siempre:

- ¿Qué pasa si alguien controla la red?
- ¿Qué pasa si alguien puede leer la memoria de mi proceso?
- ¿Qué pasaría si este código se desplegara en miles de máquinas de estudiantes?

Tu objetivo en esta práctica es dejar Cima Sync en un estado donde responder “sí, tiene sentido usar esto en un entorno hostil como una red WiFi pública” sea mucho más defendible desde el punto de vista de ciberseguridad.
