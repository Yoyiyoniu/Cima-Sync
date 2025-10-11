import { useEffect, useState } from "react";
import img from "../assets/img/cima_sync_logo.png";
import "./SplashScreen.css";

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    // Mostrar logo después de un pequeño delay
    const showTimer = setTimeout(() => {
      setShowLogo(true);
    }, 200);

    // Cerrar splash screen después de 2 segundos totales
    const closeTimer = setTimeout(() => {
      onFinish();
    }, 800);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(closeTimer);
    };
  }, [onFinish]);

  return (
    <div className="splash-screen">
      <div className={`logo-container ${showLogo ? 'show' : ''}`}>
        <img src={img} alt="Cima Sync" className="logo" />
        <div className="logo-glow" />
      </div>
    </div>
  );
};
