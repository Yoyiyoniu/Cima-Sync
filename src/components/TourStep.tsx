import { useTour } from "@reactour/tour";
import { setShowTour } from "../controller/DbController";

interface TourStepProps {
	content: string;
}

export const TourStep = ({ content }: TourStepProps) => {
	const { currentStep, setCurrentStep, steps, setIsOpen } = useTour();

	const handlePrevious = () => {
		if (currentStep > 0) setCurrentStep(currentStep - 1);
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
		<div style={{ minWidth: 220, maxWidth: 280 }}>
			<div className="flex gap-1 mb-3">
				{steps.map((_, i) => (
					<div
						key={String(i)}
						style={{
							height: 3,
							flex: 1,
							borderRadius: 99,
							background: i <= currentStep ? "#00a854" : "rgba(255,255,255,0.15)",
							transition: "background 0.3s ease",
						}}
					/>
				))}
			</div>

			<p style={{ fontSize: 13, lineHeight: 1.55, color: "rgba(255,255,255,0.88)", marginBottom: 16 }}>
				{content}
			</p>

			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
				<div style={{ display: "flex", gap: 8 }}>
					<button
						type="button"
						onClick={handlePrevious}
						disabled={currentStep === 0}
						style={{
							padding: "6px 12px",
							borderRadius: 10,
							fontSize: 12,
							fontWeight: 500,
							border: "1px solid rgba(255,255,255,0.15)",
							background: "rgba(255,255,255,0.08)",
							color: currentStep === 0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.75)",
							cursor: currentStep === 0 ? "not-allowed" : "pointer",
							transition: "all 0.2s ease",
						}}
					>
						← Atrás
					</button>
					<button
						type="button"
						onClick={handleNext}
						style={{
							padding: "6px 14px",
							borderRadius: 10,
							fontSize: 12,
							fontWeight: 600,
							border: "none",
							background: "linear-gradient(135deg, #006633 0%, #00a854 100%)",
							color: "white",
							cursor: "pointer",
							transition: "all 0.2s ease",
						}}
					>
						{isLastStep ? "Listo ✓" : "Siguiente →"}
					</button>
				</div>

				<button
					type="button"
					onClick={handleClose}
					style={{
						padding: "6px 10px",
						borderRadius: 10,
						fontSize: 11,
						border: "none",
						background: "transparent",
						color: "rgba(255,255,255,0.35)",
						cursor: "pointer",
					}}
				>
					✕
				</button>
			</div>
		</div>
	);
};
