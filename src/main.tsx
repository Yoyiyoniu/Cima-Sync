import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./i18n";
import { Onboarding } from "./components/Onboarding";
import { getHasSeenOnboarding, setHasSeenOnboarding } from "./controller/DbController";

const Main = () => {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const seen = await getHasSeenOnboarding();
        setShowOnboarding(!seen);
      } catch (e) {
        console.error(e);
        setShowOnboarding(false);
      }
    })();
  }, []);
 
  if (showOnboarding === null) {
    return null;
  }

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

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Main />
);
