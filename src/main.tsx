import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./i18n";
import { Onboarding } from "./components/Onboarding";
import { SplashScreen } from "./components/SplashScreen";
import { getHasSeenOnboarding, setHasSeenOnboarding } from "./controller/DbController";

const Main = () => {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const seen = await getHasSeenOnboarding();
        setShowOnboarding(!seen);
        setAppReady(true);
      } catch (e) {
        console.error(e);
        setShowOnboarding(false);
        setAppReady(true);
      }
    })();
  }, []);
 
  if (!appReady) {
    return null;
  }

  // Mostrar splash screen primero siempre
  if (showSplash) {
    return (
      <React.StrictMode>
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </React.StrictMode>
    );
  }

  // Luego mostrar onboarding si es necesario
  if (showOnboarding) {
    return (
      <React.StrictMode>
        <Onboarding onFinish={async () => {
          await setHasSeenOnboarding(true);
          setShowOnboarding(false);
        }} />
      </React.StrictMode>
    );
  }

  // Finalmente mostrar la aplicación principal
  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Main />
);
