import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
    en: {
        translation: {
            "Settings": {
                "title": "Settings",
                "description": "Settings description",
                "language": "Language",
                "language.es": "Spanish",
                "language.en": "English",
                "github": "See project on Github",
                "autoRun": {
                    "title": "Auto-run",
                    "description": "Auto-run description"
                },
                "appInfo": {
                    "title": "App info",
                    "name": "Cima Sync",
                    "version": "1.0.0",
                    "description": "Tool to automate the authentication process in the captive portal of UABC."
                },
                "config": {
                    "title": "Configuration",
                    "description": "Configuration description"
                },
                "help": {
                    "title": "Help",
                    "description1": "Help description 1",
                    "description2": "Help description 2"
                },
                "removeDatabase": "Delete app data"
            },
            "App": {
                "title": "Auto login",
                "subtitle": "UABC Institutional System",
                "success": "Connection established successfully.",
                "email": "Email",
                "password": "Password",
                "remember": "Remember session",
                "rememberTitle": "Keep session active",
                "login": "Login",
                "logout": "Logout",
                "connecting": "Connecting...",
                "connected": "Connected",
                "error": "Error",
                "autoLogin": "Automatic login"
            },
            "Input": {
                "emailPlaceholder": "me@uabc.edu.mx",
                "passwordPlaceholder": "•••••••••••••"
            },
            "Modal": {
                "cancel": "Cancel",
                "continue": "Continue",
                "github": {
                    "title": "You're exiting the app",
                    "description": "You will be redirected to the GitHub page to see the project code. Do you want to continue?"
                },
                "removeDatabase": {
                    "title": "Remove database",
                    "description": "Are you sure you want to remove the database? This action cannot be undone."
                }
            }
        }
    },
    es: {
        translation: {
            "Settings": {
                "title": "Ajustes",
                "description": "Descripción de los ajustes",
                "language": "Idioma",
                "language.es": "Español",
                "language.en": "Inglés",
                "github": "Ver proyecto en Github",
                "autoRun": {
                    "title": "Auto-inicio",
                    "description": "Descripción del auto-inicio"
                },
                "appInfo": {
                    "title": "Información de la aplicación",
                    "name": "Cima Sync",
                    "version": "1.0.0",
                    "description": "Herramienta para automatizar el proceso de autenticación en el portal cautivo de UABC."
                },
                "config": {
                    "title": "Configuración",
                    "description": "Descripción de la configuración"
                },
                "help": {
                    "title": "Ayuda",
                    "description1": "Descripción de la ayuda 1",
                    "description2": "Descripción de la ayuda 2"
                },
                "removeDatabase": "Eliminar datos"
            },
            "App": {
                "title": "Inicio de sesión automático",
                "subtitle": "Sistema Institucional UABC'nt",
                "success": "Conexión establecida correctamente.",
                "email": "Correo",
                "password": "Contraseña",
                "remember": "Recordar sesión",
                "rememberTitle": "Mantener sesión activa",
                "login": "Iniciar sesión",
                "logout": "Detener sesión",
                "connecting": "Conectando...",
                "connected": "Conectado",
                "error": "Error",
                "autoLogin": "Inicio de sesión automático"
            },
            "Input": {
                "emailPlaceholder": "me@uabc.edu.mx",
                "passwordPlaceholder": "•••••••••••••"
            },
            "Modal": {
                "cancel": "Cancelar",
                "continue": "Continuar",
                "github": {
                    "title": "Estás saliendo de la aplicación",
                    "description": "Serás redirigido a la página web de GitHub para ver el código fuente del proyecto. ¿Deseas continuar?"
                },
                "removeDatabase": {
                    "title": "Eliminar datos",
                    "description": "¿Estás seguro de querer eliminar los datos de la aplicación? Esta acción no se puede deshacer."
                }
            }
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: "es",
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;