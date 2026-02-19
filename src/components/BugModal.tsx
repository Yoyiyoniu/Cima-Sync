import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { openUrl } from "@tauri-apps/plugin-opener";

import { useDeviceStore } from "../store/deviceStore";
import BugIcon from "../assets/icons/BugIcon";

const BUG_REPORT_EMAIL = import.meta.env.VITE_BUG_REPORT_EMAIL;

interface BugModalProps {
	showModal: boolean;
	setShowModal: (show: boolean) => void;
}

export const BugModal = ({ showModal, setShowModal }: BugModalProps) => {
	const { t } = useTranslation();
	const isMobile = useDeviceStore((state) => state.isMobile);
	const [isClosing, setIsClosing] = useState(false);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && showModal) {
				setShowModal(false);
				setTitle("");
				setDescription("");
			}
		};
		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [showModal, setShowModal]);

	const handleClose = () => {
		setIsClosing(true);
		setTimeout(() => {
			setShowModal(false);
			setTitle("");
			setDescription("");
			setIsClosing(false);
		}, 280);
	};

	const handleSend = async () => {
		const subject = `ERROR: [Cima Sync] ${title || t("BugModal.defaultSubject")}`;
		const body = description || t("BugModal.defaultBody");

		const url = isMobile
			? `mailto:${BUG_REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
			: `https://mail.google.com/mail/u/0/?fs=1&tf=cm&to=${encodeURIComponent(BUG_REPORT_EMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

		await openUrl(url);
		handleClose();
	};

	if (!showModal) return null;

	return (
		<button
			type="button"
			className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-9999 flex items-center justify-center ${isClosing ? "animate-fadeOut" : ""}`}
			onClick={handleClose}
		>
			<button
				type="button"
				className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 max-w-md mx-4 w-full ${isClosing ? "modal-content-closing" : "modal-content"}`}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center gap-3 mb-4">
					<BugIcon width={24} height={24} className="text-white" />
					<h3 className="text-lg font-semibold text-white">
						{t("BugModal.title")}
					</h3>
				</div>
				<p className="text-white/80 text-sm mb-4">
					{t("BugModal.description")}
				</p>

				<div className="space-y-4 mb-6">
					<div>
						<label
							htmlFor="bug-title"
							className="block text-sm font-medium text-white/90 mb-1"
						>
							{t("BugModal.titleLabel")}
						</label>
						<input
							id="bug-title"
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder={t("BugModal.titlePlaceholder")}
							className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
						/>
					</div>
					<div>
						<label
							htmlFor="bug-description"
							className="block text-sm font-medium text-white/90 mb-1"
						>
							{t("BugModal.descriptionLabel")}
						</label>
						<textarea
							id="bug-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder={t("BugModal.descriptionPlaceholder")}
							rows={4}
							className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y min-h-[100px]"
						/>
					</div>
				</div>

				<div className="flex gap-3 justify-end">
					<button
						type="button"
						onClick={handleClose}
						className="px-4 py-2 text-white/70 hover:text-white transition-colors"
					>
						{t("Modal.cancel")}
					</button>
					<button
						type="button"
						onClick={handleSend}
						className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
					>
						{t("BugModal.send")}
					</button>
				</div>
			</button>
		</button>
	);
};
