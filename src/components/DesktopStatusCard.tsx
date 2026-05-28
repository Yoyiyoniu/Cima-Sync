import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import StopIcon from "../assets/icons/StopIcon";

interface DesktopStatusCardProps {
	isCimaSyncActive: boolean;
	isLoading: boolean;
	onDeactivate: () => void;
}

export const DesktopStatusCard = ({
	isCimaSyncActive,
	isLoading,
	onDeactivate,
}: DesktopStatusCardProps) => {
	const { t } = useTranslation();

	return (
		<AnimatePresence>
			{isCimaSyncActive && (
				<motion.div
					initial={{ opacity: 0, y: 32 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 32 }}
					transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
					className="relative z-10 rounded-3xl border border-emerald-500/20 px-5 py-4 mx-4 mb-5"
					style={{
						background:
							"linear-gradient(160deg, rgba(0,180,80,0.09) 0%, rgba(255,255,255,0.04) 100%)",
						backdropFilter: "blur(20px)",
						boxShadow: "0 0 24px rgba(0,180,80,0.08)",
					}}
				>
					<div className="flex items-center justify-between gap-4">
						<div className="flex items-center gap-3 min-w-0">
							<div className="relative shrink-0">
								<span className="block h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
							</div>
							<div className="min-w-0">
								<p className="text-white font-semibold text-sm leading-tight">
									{t("DesktopStatus.title")}
								</p>
								<p className="text-white/50 text-xs mt-0.5 truncate">
									{t("DesktopStatus.subtitle")}
								</p>
							</div>
						</div>

						<button
							type="button"
							onClick={onDeactivate}
							disabled={isLoading}
							className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
							style={{
								background: "rgba(239,68,68,0.15)",
								borderColor: "rgba(239,68,68,0.35)",
								color: "rgb(252,165,165)",
							}}
						>
							<StopIcon className="w-4 h-4" />
							{t("CimaSyncMode.stop")}
						</button>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
