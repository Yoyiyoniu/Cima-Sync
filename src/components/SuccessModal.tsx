import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import img from "../assets/img/cima-sync-logo.avif";

interface SuccessModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const SuccessModal = ({ isOpen, onClose }: SuccessModalProps) => {
	const { t } = useTranslation();
	const [isVisible, setIsVisible] = useState(false);
	const [isCardOpen, setIsCardOpen] = useState(false);
	const [isAnimating, setIsAnimating] = useState(false);
	const [isClosing, setIsClosing] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setIsVisible(true);
			const frame = requestAnimationFrame(() => {
				setIsCardOpen(true);
				setIsAnimating(true);
			});
			return () => cancelAnimationFrame(frame);
		}
	}, [isOpen]);

	const handleClose = () => {
		setIsCardOpen(false);
		setIsClosing(true);
		setIsAnimating(false);
		setTimeout(() => {
			setIsVisible(false);
			setIsClosing(false);
			onClose();
		}, 150);
	};

	if (!isVisible) return null;

	return (
		<div
			className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-9999 flex items-center justify-center transition-opacity duration-[150ms] ${isCardOpen ? "opacity-100" : "opacity-0"}`}
		>
			<div
				className={`bg-white/10 backdrop-blur-md border border-green-500/30 rounded-2xl p-8 max-w-sm mx-4 text-center t-modal${isCardOpen ? " is-open" : ""}${isClosing ? " is-closing" : ""}`}
			>
				{/* Logo with bounce */}
				<div className="mb-6 flex justify-center">
					<div className={`relative ${isAnimating ? "success-modal-enter" : ""}`}>
						<img
							src={img}
							alt="Cima Sync Logo"
							className="w-20 h-20 object-contain filter drop-shadow-lg"
						/>
						<div
							className={`absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 ${isAnimating ? "shine-effect" : ""}`}
						/>
					</div>
				</div>

				{/* Checkmark with t-success-check */}
				<div className="mb-6 flex justify-center">
					<span
						className="t-success-check"
						data-state={isAnimating ? "in" : "out"}
						aria-hidden="true"
					>
						<div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
							<svg
								className="w-8 h-8 text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Checkmark</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={3}
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
					</span>
				</div>

				<h3 className="text-xl font-bold text-white mb-2">
					{t("SuccessModal.title")}
				</h3>
				<p className="text-green-300/80 mb-3">{t("SuccessModal.message")}</p>
				<p className="text-white/40 text-xs mb-4">{t("SuccessModal.hint")}</p>

				<button
					type="button"
					onClick={handleClose}
					className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 hover:scale-105"
				>
					{t("SuccessModal.button")}
				</button>
			</div>
		</div>
	);
};
