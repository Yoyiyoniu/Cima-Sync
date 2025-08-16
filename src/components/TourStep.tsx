import { useTour } from "@reactour/tour";
import { setShowTour } from "../controller/DbController";

interface TourStepProps {
  content: string;
}

export const TourStep = ({ content }: TourStepProps) => {
  const { currentStep, setCurrentStep, steps, setIsOpen } = useTour();

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await setShowTour(false);
      setIsOpen(false);
    }
  };

  const handleClose = async () => {
    await setShowTour(false);
    setIsOpen(false);
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="tour-step-content">
      <div className="tour-text">
        {content}
      </div>
      
      <div className="tour-navigation">
        <div className="tour-buttons">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="tour-btn tour-btn-prev"
            title="Anterior"
          >
            ← Anterior
          </button>
          
          <button
            onClick={handleNext}
            className="tour-btn tour-btn-next"
            title={isLastStep ? "Finalizar" : "Siguiente"}
          >
            {isLastStep ? "Finalizar" : "Siguiente →"}
          </button>
        </div>
        
        <button
          onClick={handleClose}
          className="tour-btn tour-btn-close"
          title="Cerrar tour"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
