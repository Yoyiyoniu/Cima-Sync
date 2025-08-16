import { useEffect, useState } from "react";
import { getShowTour, setShowTour } from "../../controller/DbController";
import { useTranslation } from "react-i18next";

export const TourConfig = () => {
  const { t } = useTranslation();
  const [showTour, setShowTourState] = useState(true);

  useEffect(() => {
    const loadTourConfig = async () => {
      try {
        const shouldShow = await getShowTour();
        setShowTourState(shouldShow);
      } catch (error) {
        console.error("Error loading tour config:", error);
        setShowTourState(true);
      }
    };

    loadTourConfig();
  }, []);

  const handleToggle = async (checked: boolean) => {
    try {
      setShowTourState(checked);
      await setShowTour(checked);
    } catch (error) {
      console.error("Error saving tour config:", error);
    }
  };

  return (
    <div className="flex items-center justify-between cursor-pointer rounded-md w-full p-2 hover:bg-white/10 transition-colors duration-200">
      <div className="flex items-center gap-2">
        <p className="text-white/80">{t('Settings.tour')}</p>
        <span className="text-xs text-white/50">({t('Settings.tour.description')})</span>
      </div>
      <div className="relative flex items-center">
        <input
          type="checkbox"
          id="tour"
          checked={showTour}
          onChange={(e) => handleToggle(e.target.checked)}
          className="peer h-4 w-4 appearance-none rounded border border-[#006633]/30 bg-black/40 
                  checked:bg-[#006633] checked:border-[#006633] 
                    focus:outline-none focus:ring-2 focus:ring-[#006633]/50
                    disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
