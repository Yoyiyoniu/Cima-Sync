import { type FormEvent, useEffect, useState, useId } from "react";
import { invoke } from "@tauri-apps/api/core";
import { clearCredentials, getCredentials, saveCredentials, getRememberSessionConfig, setRememberSessionConfig, initEncryption } from "./controller/DbController";
import { disableContextMenu } from "./hooks/disableContextMenu";
import { useTranslation } from "react-i18next";
import { useTour } from "@reactour/tour";

import { Input } from "./components/Input";
import { SettingsMenu } from "./components/SettingsMenu";
import { CopyRightMenu } from "./components/ContactMe";
import { SuccessModal } from "./components/SuccessModal";

import img from "./assets/img/cima_sync_logo.png";
import StopIcon from "./assets/icons/StopIcon";

import "./css/Global.css"
import "./css/AppAnimations.css"

interface AppProps {
  showTourFirstTime?: boolean;
}

interface AppState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

function App({ showTourFirstTime = false }: AppProps) {
  const { t } = useTranslation();
  const { setIsOpen } = useTour();
  const emailId = useId();
  const passwordId = useId();
  const rememberId = useId();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [appState, setAppState] = useState<AppState>({ loading: false, error: null, success: false });
  const [rememberSession, setRememberSession] = useState(false);
  const [showApp, setShowApp] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [credentialsLoaded, setCredentialsLoaded] = useState(false);

  disableContextMenu();

  useEffect(() => {
    if (showTourFirstTime) {
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [showTourFirstTime, setIsOpen]);

  useEffect(() => {
    const timer = setTimeout(() => setShowApp(true), 100);
    return () => clearTimeout(timer);
  }, []);


  useEffect(() => {
    const bootstrap = async () => {
      try {        
        await initEncryption();
        
        const remember = await getRememberSessionConfig();
        setRememberSession(remember);
        
        const result = await getCredentials();
        
        if (result) {
          setCredentials({ email: result.email, password: result.password });
        }
        setCredentialsLoaded(true);
      } catch (error) {
        console.error("Error loading configuration:", error);
      }
    };

    bootstrap();
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAppState({ loading: true, error: null, success: false });

    try {
      await setRememberSessionConfig(rememberSession);
      
      // Guardar credenciales ANTES del login si está marcado "Recordar sesión"
      if (rememberSession) {
        await saveCredentials(credentials);
      } else {
        await clearCredentials();
      }

      await invoke("login", { email: credentials.email, password: credentials.password });
      
      setAppState(prev => ({ ...prev, success: true }));
      setShowSuccessModal(true);
      
      if (rememberSession) {
        await invoke("auto_auth", { email: credentials.email, password: credentials.password });
      }
    } catch (error) {
      console.error("Login error:", error);
      setAppState(prev => ({ ...prev, error: String(error) }));
      
    } finally {
      setAppState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleLogout = async () => {
    await invoke("stop_auth");
    setAppState({ loading: false, error: null, success: false });
  };

  const handleRememberChange = async (checked: boolean) => {
    setRememberSession(checked);
    await setRememberSessionConfig(checked);
    // No borrar las credenciales automáticamente, solo actualizar la configuración
  };

  // Mostrar loading mientras se cargan las credenciales
  if (!credentialsLoaded) {
    return (
      <main className="flex flex-col h-screen items-center justify-center text-white gap-5 p-4 relative bg-gradient-to-r from-slate-900 via-gray-800 to-gray-900 overflow-hidden">
        <img src={img} alt="" className="blur absolute" />
        <div className="relative z-10 text-center">
          <h1 className="text-2xl font-medium mb-4">{t('App.title')}</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006633] mx-auto"></div>
          <p className="mt-4 text-gray-300">Cargando credenciales...</p>
        </div>
      </main>
    );
  }


  return (
    <main className={`app-fade-in ${showApp ? 'show' : ''} flex flex-col h-screen items-center justify-center text-white gap-5 p-4 relative bg-gradient-to-r from-slate-900 via-gray-800 to-gray-900 overflow-hidden`}>
      <img src={img} alt="" className="blur absolute" />
      
      <SettingsMenu />
      
      <div className="w-full p-5 relative z-10 flex flex-col items-center justify-center">
        <CopyRightMenu />
        <form className="w-full max-w-sm flex flex-col gap-3 mb-8">
          <div className="text-center mb-8">
            <h1 className={`app-title ${showApp ? 'show' : ''} text-2xl font-medium`}>{t('App.title')}</h1>
            <p className={`app-subtitle ${showApp ? 'show' : ''}`}>{t('App.subtitle')}</p>
          </div>
          
          {appState.success && (
            <div className={`form-element ${showApp ? 'show' : ''} bg-green-500/20 border border-green-500/50 text-white p-3 rounded-md mb-3`}>
              {t('App.success')}
            </div>
          )}
          
          <div className={`form-element ${showApp ? 'show' : ''}`}>
            <Input
              key={`email-${credentials.email}`}
              id={emailId}
              type="email"
              label={t('App.email')}
              placeholder={t('Input.emailPlaceholder')}
              value={credentials.email}
              onChange={(e) => {
                setCredentials(prev => ({ ...prev, email: e.target.value }));
              }}
              disabled={appState.loading || appState.success}
            />
          </div>
          
          <div className={`form-element ${showApp ? 'show' : ''}`}>
            <Input
              key={`password-${credentials.password}`}
              id={passwordId}
              type="password"
              label={t('App.password')}
              placeholder={t('Input.passwordPlaceholder')}
              value={credentials.password}
              onChange={(e) => {
                setCredentials(prev => ({ ...prev, password: e.target.value }));
              }}
              disabled={appState.loading || appState.success}
            />
          </div>
          
          <div className={`form-element ${showApp ? 'show' : ''} flex items-center`}>
            <div className="relative flex items-center">
              <input
                key={`remember-${rememberSession}`}
                type="checkbox"
                id={rememberId}
                checked={rememberSession}
                onChange={(e) => handleRememberChange(e.target.checked)}
                disabled={appState.loading || appState.success}
                className="peer h-4 w-4 appearance-none rounded border border-[#006633]/30 bg-black/40 
                        checked:bg-[#006633] checked:border-[#006633] 
                          focus:outline-none focus:ring-2 focus:ring-[#006633]/50
                          disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <label htmlFor={rememberId} title={t('App.rememberTitle')} className="ml-2 text-sm text-gray-300 cursor-pointer select-none">
              {t('App.remember')}
            </label>
          </div>
          
          {appState.error && (
            <div className={`form-element ${showApp ? 'show' : ''} bg-red-500/20 border border-red-500/50 text-white p-3 rounded-md mb-3`}>
              {t('App.error')}: {appState.error}
            </div>
          )}
          
          <div className={`form-element ${showApp ? 'show' : ''} flex w-full max-w-sm justify-center gap-2 relative`}>
            <button
              type="submit"
              title={t('App.login')}
              onClick={handleLogin}
              disabled={appState.loading || appState.success || !credentials.email || !credentials.password}
              className="h-11 flex items-center justify-center rounded-md font-medium
                        bg-[#006633] hover:bg-[#005528] text-white 
                        disabled:opacity-70 disabled:cursor-not-allowed
                        transition-all duration-300 shadow-sm cursor-pointer w-full"
            >
              {appState.loading ? t('App.connecting') : appState.success ? t('App.connected') : t('App.login')}
            </button>
            <button
              title={t('App.logout')}
              onClick={handleLogout}
              type="button"
              className={`h-11 flex items-center justify-center rounded-md font-medium
                      bg-red-600 hover:bg-red-700 text-white
                      disabled:opacity-70 disabled:cursor-not-allowed
                      transition-all duration-300 shadow-sm cursor-pointer
                      absolute right-0 w-10
                      ${appState.success ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
            >
              <StopIcon />
            </button>
          </div>
        </form>
      </div>
      
      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
    </main>
  );
}

export default App;