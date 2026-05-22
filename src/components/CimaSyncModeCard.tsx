import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { openUrl } from "@tauri-apps/plugin-opener";

import { Modal } from "./Modal";
import StopIcon from "../assets/icons/StopIcon";

interface CimaSyncModeCardProps {
	isCimaSyncActive: boolean;
	isLoading: boolean;
	isDisabled: boolean;
	onActivate: () => void;
	onDeactivate: () => void;
}

export const CimaSyncModeCard = ({
	isCimaSyncActive,
	isLoading,
	isDisabled,
	onActivate,
	onDeactivate,
}: CimaSyncModeCardProps) => {
	const { t } = useTranslation();
	const [showLandingModal, setShowLandingModal] = useState(false);

	const handleOpenLanding = useCallback(async () => {
		await openUrl("https://www.honeyfix.solutions");
	}, []);

	return (
		<>
			<Modal
				title={t("Modal.thanks")}
				modalText={t("Modal.thanksDescription")}
				showModal={showLandingModal}
				setShowModal={setShowLandingModal}
				handleModalFunction={handleOpenLanding}
			/>

			<motion.div
				id="tour-cimasync-card"
				initial={{ opacity: 0, y: 40 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
				className="relative z-10 w-full rounded-t-3xl border-t border-white/12 px-6 pt-6 pb-7"
				style={{
					background:
						"linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.04) 100%)",
					backdropFilter: "blur(20px)",
				}}
			>
				{/* Top row: title + toggle/stop */}
				<div className="flex items-start justify-between gap-4 mb-1">
					<div className="flex-1 min-w-0">
						<h3 className="text-white font-bold text-lg leading-tight">
							{t("CimaSyncMode.title")}
						</h3>
						<p className="text-white/50 text-sm mt-1 leading-snug">
							{t("CimaSyncMode.subtitle")}
						</p>
					</div>

					{/* Animated toggle ↔ stop button */}
					<div className="flex items-center gap-3 shrink-0 mt-0.5">
						{isLoading && (
							<div className="w-5 h-5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
						)}

						<div
							className="t-icon-swap"
							data-state={isCimaSyncActive ? "b" : "a"}
						>
							<span className="t-icon" data-icon="a">
								<button
									type="button"
									onClick={onActivate}
									disabled={isLoading || isDisabled}
									title={
										isDisabled
											? t("App.networkUnavailable")
											: t("CimaSyncMode.activate")
									}
									className="relative w-[68px] h-[36px] rounded-full border transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
									style={{
										background: "rgba(255,255,255,0.1)",
										borderColor: "rgba(255,255,255,0.2)",
									}}
								>
									<div className="absolute top-[5px] left-[3px] w-[26px] h-[26px] rounded-full bg-white/80 shadow-sm" />
								</button>
							</span>
							<span className="t-icon" data-icon="b">
								<button
									type="button"
									onClick={onDeactivate}
									disabled={isLoading}
									className="flex items-center gap-2 px-5 py-3 rounded-full border text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
									style={{
										background: "rgba(239,68,68,0.15)",
										borderColor: "rgba(239,68,68,0.35)",
										color: "rgb(252,165,165)",
									}}
								>
									<StopIcon className="w-4 h-4" />
									{t("CimaSyncMode.stop")}
								</button>
							</span>
						</div>
					</div>
				</div>

				{/* Active status indicator */}
				<AnimatePresence>
					{isCimaSyncActive && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							className="overflow-hidden"
						>
							<div className="flex items-center gap-2 mt-2 mb-1">
								<span
									className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse"
								/>
								<span className="text-emerald-400 text-sm font-medium">
									{t("CimaSyncMode.active")}
								</span>
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Divider */}
				<div className="border-t border-white/10 mt-4 mb-4" />

				{/* Bottom: Honeyfix + landing */}
				<div className="flex items-center justify-between">
					<button
						type="button"
						className="text-white/40 hover:text-white/70 text-sm transition-colors py-1"
						onClick={() => setShowLandingModal(true)}
					>
						Created by Honeyfix
					</button>

					<button
						type="button"
						onClick={() => setShowLandingModal(true)}
						className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors py-1"
					>
						<span>{t("CimaSyncMode.landing")}</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width={14}
							height={14}
							fill="none"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
							<polyline points="15 3 21 3 21 9" />
							<line x1="10" y1="14" x2="21" y2="3" />
						</svg>
					</button>
				</div>
			</motion.div>
		</>
	);
};
