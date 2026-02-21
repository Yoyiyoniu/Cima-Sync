import { useTour } from "@reactour/tour";
import { useTranslation } from "react-i18next";

interface TourButtonProps {
  onClose: () => void;
}

export const TourButton = ({ onClose }: TourButtonProps) => {
  const { t } = useTranslation();
  const { setIsOpen } = useTour();

  const handleStartTour = () => {
    onClose(); // Cerrar el menú de configuración
    setIsOpen(true); // Abrir el tour
  };

  return (
    <button
      type="button"
      onClick={handleStartTour}
      className="flex items-center justify-between cursor-pointer rounded-md w-full p-2 hover:bg-blue-500/20 transition-colors duration-200"
    >
      <div className="flex items-center gap-2">
        <p className="text-white/80">📖 {t('Settings.tour')}</p>
        <span className="text-xs text-white/50">({t('Settings.tour.button')})</span>
      </div>
      <svg 
        className="w-4 h-4 text-white/60" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9 5l7 7-7 7" 
        />
      </svg>
    </button>
  );
};
