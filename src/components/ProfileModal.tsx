import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";

import { setRememberSessionConfig } from "../controller/DbController";
import { useSessionStore } from "../store/sessionStore";
import { useDeviceStore } from "../store/deviceStore";
import { Input } from "./Input";
import XIcon from "../assets/icons/XIcon";
import CheckIcon from "../assets/icons/CheckIcon";

interface ProfileModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
	const { t } = useTranslation();
	const isDesktop = useDeviceStore((state) => state.isDesktop);

	const storeCredentials = useSessionStore((state) => state.credentials);
	const setCredentials = useSessionStore((state) => state.setCredentials);
	const storeRemember = useSessionStore((state) => state.rememberSession);
	const setRememberSession = useSessionStore(
		(state) => state.setRememberSession,
	);

	const [localEmail, setLocalEmail] = useState("");
	const [localPassword, setLocalPassword] = useState("");
	const [localRemember, setLocalRemember] = useState(false);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [keyboardOffset, setKeyboardOffset] = useState(0);

	// Panel reveal state
	const [isRendered, setIsRendered] = useState(false);
	const [sheetOpen, setSheetOpen] = useState(false);
	const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// t-text-swap for save button
	const saveLabelRef = useRef<HTMLSpanElement>(null);
	type SaveState = "save" | "saving" | "saved";
	const [displaySaveState, setDisplaySaveState] = useState<SaveState>("save");

	useEffect(() => {
		if (isOpen) {
			setLocalEmail(storeCredentials.email);
			setLocalPassword(storeCredentials.password);
			setLocalRemember(storeRemember);
			setSaved(false);
			setDisplaySaveState("save");
			setIsRendered(true);
			const frame = requestAnimationFrame(() => setSheetOpen(true));
			return () => cancelAnimationFrame(frame);
		} else if (isRendered) {
			setSheetOpen(false);
			if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
			closeTimerRef.current = setTimeout(() => setIsRendered(false), 350);
		}
	}, [isOpen, storeCredentials, storeRemember, isRendered]);

	useEffect(
		() => () => {
			if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
		},
		[],
	);

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

	useEffect(() => {
		const next: SaveState = saved ? "saved" : saving ? "saving" : "save";
		if (next === displaySaveState) return;
		const el = saveLabelRef.current;
		if (!el) {
			setDisplaySaveState(next);
			return;
		}
		el.classList.add("is-exit");
		const timer = setTimeout(() => {
			setDisplaySaveState(next);
			el.classList.remove("is-exit");
			el.classList.add("is-enter-start");
			void el.offsetHeight;
			el.classList.remove("is-enter-start");
		}, 150);
		return () => clearTimeout(timer);
	}, [saving, saved, displaySaveState]);

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

	if (!isRendered) return null;

	const content = (
		<>
			{/* Header */}
			<div className="flex items-center justify-between mb-5">
				<div>
					<h2 className="text-xl font-bold text-white">{t("Profile.title")}</h2>
					<div className="flex items-center gap-1.5 mt-0.5">
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
					<span className="t-text-swap" ref={saveLabelRef}>
						{displaySaveState === "saved" ? (
							<span className="flex items-center gap-2">
								<CheckIcon className="w-4 h-4" />
								{t("Profile.saveSuccess")}
							</span>
						) : displaySaveState === "saving" ? (
							<span className="flex items-center justify-center">
								<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							</span>
						) : (
							<>{t("Profile.save")}</>
						)}
					</span>
				</button>
			</div>
		</>
	);

	const panelStyle = {
		background:
			"linear-gradient(160deg, rgba(15,20,30,0.98) 0%, rgba(8,14,22,0.98) 100%)",
		backdropFilter: "blur(24px)",
	} as React.CSSProperties;

	if (isDesktop) {
		return (
			<>
				<div
					className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-[200ms] ${sheetOpen ? "opacity-100" : "opacity-0"}`}
					onClick={onClose}
				/>
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
					<div
						className={`t-modal w-full max-w-sm rounded-3xl border border-white/15 overflow-hidden pointer-events-auto ${sheetOpen ? "is-open" : ""}`}
						style={panelStyle}
					>
						<div className="px-6 py-6 overflow-y-auto max-h-[90vh]">
							{content}
						</div>
					</div>
				</div>
			</>
		);
	}

	return (
		<>
			<div
				className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-[200ms] ${sheetOpen ? "opacity-100" : "opacity-0"}`}
				onClick={onClose}
			/>

			<div
				className="fixed left-0 right-0 z-50"
				style={{ bottom: keyboardOffset, transition: "bottom 0.25s ease-out" }}
			>
				<div
					data-open={sheetOpen ? "true" : "false"}
					className="rounded-t-3xl border-t border-white/15 overflow-hidden t-panel-slide"
					style={
						{
							"--panel-translate-y": "100%",
							...panelStyle,
						} as React.CSSProperties
					}
				>
					<div className="flex justify-center pt-3 pb-1">
						<div className="w-10 h-1 rounded-full bg-white/25" />
					</div>
					<div className="px-6 pb-8 pt-2 overflow-y-auto max-h-[80vh]">
						{content}
					</div>
				</div>
			</div>
		</>
	);
};
