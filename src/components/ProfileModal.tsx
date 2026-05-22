import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";

import { setRememberSessionConfig } from "../controller/DbController";
import { useSessionStore } from "../store/sessionStore";
import { Input } from "./Input";
import XIcon from "../assets/icons/XIcon";
import CheckIcon from "../assets/icons/CheckIcon";
import LockIcon from "../assets/icons/LockIcon";

interface ProfileModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
	const { t } = useTranslation();

	const storeCredentials = useSessionStore((state) => state.credentials);
	const setCredentials = useSessionStore((state) => state.setCredentials);
	const storeRemember = useSessionStore((state) => state.rememberSession);
	const setRememberSession = useSessionStore((state) => state.setRememberSession);

	const [localEmail, setLocalEmail] = useState("");
	const [localPassword, setLocalPassword] = useState("");
	const [localRemember, setLocalRemember] = useState(false);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [keyboardOffset, setKeyboardOffset] = useState(0);

	useEffect(() => {
		if (isOpen) {
			setLocalEmail(storeCredentials.email);
			setLocalPassword(storeCredentials.password);
			setLocalRemember(storeRemember);
			setSaved(false);
		}
	}, [isOpen, storeCredentials, storeRemember]);

	useEffect(() => {
		if (!isOpen || !window.visualViewport) return;

		const update = () => {
			const vv = window.visualViewport!;
			const offset = window.innerHeight - vv.height - vv.offsetTop;
			setKeyboardOffset(Math.max(0, offset));
		};

		window.visualViewport.addEventListener("resize", update);
		window.visualViewport.addEventListener("scroll", update);
		update();

		return () => {
			window.visualViewport!.removeEventListener("resize", update);
			window.visualViewport!.removeEventListener("scroll", update);
			setKeyboardOffset(0);
		};
	}, [isOpen]);

	useEffect(() => {
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) onClose();
		};
		window.addEventListener("keydown", handleEsc);
		return () => window.removeEventListener("keydown", handleEsc);
	}, [isOpen, onClose]);

	const handleSave = async () => {
		setSaving(true);
		try {
			setCredentials({ email: localEmail, password: localPassword });
			setRememberSession(localRemember);
			await setRememberSessionConfig(localRemember);

			if (localRemember && localEmail && localPassword) {
				await invoke("save_credentials", {
					email: localEmail,
					password: localPassword,
				});
			} else if (!localRemember) {
				try {
					await invoke("delete_credentials");
				} catch {
					// No credentials to delete
				}
			}

			setSaved(true);
			setTimeout(() => {
				onClose();
				setSaved(false);
			}, 700);
		} finally {
			setSaving(false);
		}
	};

	const canSave = localEmail.trim().length > 0 && localPassword.length > 0;

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						key="profile-backdrop"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
						onClick={onClose}
					/>

					<motion.div
						key="profile-sheet"
						initial={{ opacity: 0, y: "100%" }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: "100%" }}
						transition={{ type: "spring", stiffness: 320, damping: 32 }}
						className="fixed left-0 right-0 z-50 rounded-t-3xl border-t border-white/15 overflow-hidden"
						style={{
							bottom: keyboardOffset,
							transition: "bottom 0.25s ease-out",
							background: "linear-gradient(160deg, rgba(15,20,30,0.98) 0%, rgba(8,14,22,0.98) 100%)",
							backdropFilter: "blur(24px)",
						}}
					>
						{/* Handle bar */}
						<div className="flex justify-center pt-3 pb-1">
							<div className="w-10 h-1 rounded-full bg-white/25" />
						</div>

						<div className="px-6 pb-8 pt-2 overflow-y-auto max-h-[80vh]">
							{/* Header */}
							<div className="flex items-center justify-between mb-5">
								<div>
									<h2 className="text-xl font-bold text-white">
										{t("Profile.title")}
									</h2>
									<div className="flex items-center gap-1.5 mt-0.5">
										<LockIcon width={11} height={11} className="text-green-400/70" />
										<span className="text-xs text-white/45">
											{t("Profile.encrypted")}
										</span>
									</div>
								</div>
								<button
									type="button"
									onClick={onClose}
									className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
								>
									<XIcon />
								</button>
							</div>

							{/* Inputs */}
							<div className="space-y-4 mb-5">
								<Input
									id="profile-email"
									type="email"
									label={t("App.email")}
									placeholder={t("Input.emailPlaceholder")}
									value={localEmail}
									onChange={(e) => setLocalEmail(e.target.value)}
								/>
								<Input
									id="profile-password"
									type="password"
									label={t("App.password")}
									placeholder={t("Input.passwordPlaceholder")}
									value={localPassword}
									onChange={(e) => setLocalPassword(e.target.value)}
								/>
							</div>

							{/* Remember toggle */}
							<button
								type="button"
								onClick={() => setLocalRemember(!localRemember)}
								className="flex items-center gap-3 w-full py-3 px-0 rounded-xl text-left cursor-pointer"
							>
								<div
									className={`relative w-12 h-6 rounded-full border transition-all duration-300 shrink-0 ${
										localRemember
											? "bg-[#00723f] border-[#00723f]/60 shadow-[0_0_8px_rgba(0,114,63,0.4)]"
											: "bg-white/10 border-white/20"
									}`}
								>
									<motion.div
										animate={{ x: localRemember ? 22 : 2 }}
										transition={{ type: "spring", stiffness: 500, damping: 35 }}
										className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
									/>
								</div>
								<div>
									<p className="text-white text-sm font-medium">{t("App.remember")}</p>
									<p className="text-white/45 text-xs">{t("App.rememberTitle")}</p>
								</div>
							</button>

							{/* Actions */}
							<div className="flex gap-3 mt-5">
								<button
									type="button"
									onClick={onClose}
									className="flex-1 h-12 rounded-xl border border-white/20 bg-white/8 text-white/80 hover:bg-white/12 hover:text-white text-sm font-medium transition-all"
								>
									{t("Modal.cancel")}
								</button>
								<button
									type="button"
									onClick={handleSave}
									disabled={saving || !canSave}
									className="flex-1 h-12 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
									style={{
										background: canSave
											? "linear-gradient(135deg, #006633 0%, #00a854 100%)"
											: "rgba(255,255,255,0.08)",
										color: "white",
									}}
								>
									<AnimatePresence mode="wait" initial={false}>
										{saved ? (
											<motion.span
												key="saved"
												initial={{ scale: 0, opacity: 0 }}
												animate={{ scale: 1, opacity: 1 }}
												exit={{ scale: 0, opacity: 0 }}
												className="flex items-center gap-2"
											>
												<CheckIcon className="w-4 h-4" />
												{t("Profile.saveSuccess")}
											</motion.span>
										) : saving ? (
											<motion.span
												key="saving"
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}
												className="flex items-center gap-2"
											>
												<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
											</motion.span>
										) : (
											<motion.span
												key="save"
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}
											>
												{t("Profile.save")}
											</motion.span>
										)}
									</AnimatePresence>
								</button>
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
};
