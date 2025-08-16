import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import img from "../assets/img/cima_sync_logo.png";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuccessModal = ({ isOpen, onClose }: SuccessModalProps) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimating(true);
      
      // Auto-close after 3 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center transition-all duration-300 ${
      isAnimating ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className={`bg-white/10 backdrop-blur-md border border-green-500/30 rounded-2xl p-8 max-w-sm mx-4 text-center transition-all duration-300 transform ${
        isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        {/* Logo con animación */}
        <div className="mb-6 flex justify-center">
          <div className={`relative ${isAnimating ? 'success-modal-enter' : ''}`}>
            <img 
              src={img} 
              alt="Cima Sync Logo" 
              className="w-20 h-20 object-contain filter drop-shadow-lg"
            />
            {/* Efecto de brillo */}
            <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 ${
              isAnimating ? 'shine-effect' : ''
            }`}></div>
          </div>
        </div>

        {/* Checkmark animado */}
        <div className="mb-6 flex justify-center">
          <div className={`w-16 h-16 rounded-full bg-green-500 flex items-center justify-center transition-all duration-500 ${
            isAnimating ? 'scale-100' : 'scale-0'
          }`}>
            <svg 
              className="w-8 h-8 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={3} 
                d="M5 13l4 4L19 7"
                className={`${isAnimating ? 'checkmark-animate' : ''}`}
                style={{
                  strokeDasharray: 20,
                  strokeDashoffset: isAnimating ? 0 : 20
                }}
              />
            </svg>
          </div>
        </div>

        {/* Texto */}
        <h3 className="text-xl font-bold text-white mb-2">
          {t('SuccessModal.title')}
        </h3>
        <p className="text-green-300/80 mb-6">
          {t('SuccessModal.message')}
        </p>

        {/* Barra de progreso */}
        <div className="w-full bg-white/20 rounded-full h-1 mb-4">
          <div className={`bg-green-500 h-1 rounded-full ${
            isAnimating ? 'progress-animate' : ''
          }`}></div>
        </div>

        {/* Botón de cerrar */}
        <button
          onClick={handleClose}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 hover:scale-105"
        >
          {t('SuccessModal.button')}
        </button>
      </div>
    </div>
  );
};
