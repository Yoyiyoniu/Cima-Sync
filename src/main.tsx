import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./i18n";
import { Onboarding } from "./components/Onboarding";
import { SplashScreen } from "./components/SplashScreen";
import { getHasSeenOnboarding, setHasSeenOnboarding } from "./controller/DbController";
import { TourProvider, type StepType } from "@reactour/tour";
import { TourStep } from "./components/TourStep";
import "./css/TourNavigation.css";

const Main = () => {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);
  const [showTourFirstTime, setShowTourFirstTime] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const seenOnboarding = await getHasSeenOnboarding();
        setShowOnboarding(!seenOnboarding);
        setShowTourFirstTime(false);
        setAppReady(true);
      } catch (error) {
        console.error("Error initializing app:", error);
        setShowOnboarding(false);
        setShowTourFirstTime(false);
        setAppReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!appReady) return null;

  if (showSplash) {
    return (
      <React.StrictMode>
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </React.StrictMode>
    );
  }

  if (showOnboarding) {
    return (
      <React.StrictMode>
        <Onboarding onFinish={async () => {
          await setHasSeenOnboarding(true);
          setShowOnboarding(false);
          setShowTourFirstTime(true);
        }} />
      </React.StrictMode>
    );
  }

  return (
    <React.StrictMode>
      <TourProvider
        steps={tourSteps}
        showNavigation={false}
        showBadge={true}
        showDots={true}
        disableInteraction={false}
        disableDotsNavigation={false}
        disableKeyboardNavigation={false}
        styles={tourStyles}
      >
        <App showTourFirstTime={showTourFirstTime} />
      </TourProvider>
    </React.StrictMode>
  );
};

const tourSteps: StepType[] = [
  {
    selector: '.app-title',
    content: <TourStep content="¡Bienvenido a Cima Sync! Esta aplicación te ayudará a conectarte automáticamente a la red de UABC." />,
  },
  {
    selector: '#email',
    content: <TourStep content="Aquí debes ingresar tu correo electrónico de UABC (ejemplo: tu.nombre@uabc.edu.mx) o tu nombre de usuario institucional." />,
  },
  {
    selector: '#password',
    content: <TourStep content="Ingresa tu contraseña de UABC. Esta se guardará de forma segura en tu dispositivo." />,
  },
  {
    selector: '#remember',
    content: <TourStep content="Marca esta casilla si quieres que la aplicación recuerde tu sesión y se conecte automáticamente en el futuro." />,
  },
  {
    selector: '#login-button',
    content: <TourStep content="¡Perfecto! Ahora haz clic en este botón para conectarte a la red de UABC. La aplicación se encargará de todo automáticamente." />,
  },
];

const tourStyles = {
  popover: (base: Record<string, unknown>) => ({
    ...base,
    backgroundColor: '#1e293b',
    color: 'white',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
    padding: '20px',
  }),
  badge: (base: Record<string, unknown>) => ({
    ...base,
    backgroundColor: '#006633',
  }),
  controls: (base: Record<string, unknown>) => ({
    ...base,
    color: 'white',
  }),
  arrow: (base: Record<string, unknown>) => ({
    ...base,
    color: '#1e293b',
  }),
  navigation: (base: Record<string, unknown>) => ({
    ...base,
    marginTop: '15px',
  }),
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<Main />);
