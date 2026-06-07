import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { openUrl } from "@tauri-apps/plugin-opener";

import { useDeviceStore } from "../store/deviceStore";
import { Input } from "./Input";
import XIcon from "../assets/icons/XIcon";

const BUG_REPORT_EMAIL = import.meta.env.VITE_BUG_REPORT_EMAIL;

interface BugModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const BugModal = ({ isOpen, onClose }: BugModalProps) => {
	const { t } = useTranslation();
	const isDesktop = useDeviceStore((state) => state.isDesktop);
	const isMobile = useDeviceStore((state) => state.isMobile);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [sending, setSending] = useState(false);
	const [keyboardOffset, setKeyboardOffset] = useState(0);

	const [isRendered, setIsRendered] = useState(false);
	const [sheetOpen, setSheetOpen] = useState(false);
	const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (isOpen) {
			setTitle("");
			setDescription("");
			setSending(false);
			setIsRendered(true);
			const frame = requestAnimationFrame(() => setSheetOpen(true));
			return () => cancelAnimationFrame(frame);
		} else if (isRendered) {
			setSheetOpen(false);
			if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
			closeTimerRef.current = setTimeout(() => setIsRendered(false), 350);
		}
	}, [isOpen, isRendered]);

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

	const handleSend = async () => {
		setSending(true);
		try {
			const subject = `ERROR: [Cima Sync] ${title || t("BugModal.defaultSubject")}`;
			const body = description || t("BugModal.defaultBody");

			const url = isMobile
				? `mailto:${BUG_REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
				: `https://mail.google.com/mail/u/0/?fs=1&tf=cm&to=${encodeURIComponent(BUG_REPORT_EMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

			await openUrl(url);
			onClose();
		} finally {
			setSending(false);
		}
	};

	if (!isRendered) return null;

	const content = (
		<>
			<div className="flex items-center justify-between mb-5">
				<div>
					<h2 className="text-xl font-bold text-white">
						{t("BugModal.title")}
					</h2>
					<div className="flex items-center gap-1.5 mt-0.5">
						<span className="text-xs text-white/45">
							{t("BugModal.description")}
						</span>
					</div>
				</div>
				<button
					type="button"
					onClick={onClose}
					className="min-w-8 min-h-8 p-1 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
				>
					<XIcon />
				</button>
			</div>

			<div className="space-y-4 mb-5">
				<Input
					id="bug-title"
					type="text"
					label={t("BugModal.titleLabel")}
					placeholder={t("BugModal.titlePlaceholder")}
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					disabled={sending}
				/>
				<div className="space-y-2">
					<label
						htmlFor="bug-description"
						className="block text-white font-medium text-sm"
					>
						{t("BugModal.descriptionLabel")}
					</label>
					<textarea
						id="bug-description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder={t("BugModal.descriptionPlaceholder")}
						rows={4}
						disabled={sending}
						className="w-full px-4 py-2 bg-black/40 border border-[#006633]/30 rounded-md text-white placeholder-gray-500
							focus:outline-none focus:ring-2 focus:ring-[#006633] focus:border-[#006633]
							disabled:opacity-50 disabled:cursor-not-allowed resize-y min-h-[100px]"
					/>
				</div>
			</div>

			<div className="flex gap-3 mt-5">
				<button
					type="button"
					onClick={onClose}
					disabled={sending}
					className="flex-1 h-12 rounded-xl border border-white/20 bg-white/8 text-white/80 hover:bg-white/12 hover:text-white text-sm font-medium transition-all disabled:opacity-50"
				>
					{t("Modal.cancel")}
				</button>
				<button
					type="button"
					onClick={handleSend}
					disabled={sending}
					className="flex-1 h-12 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					style={{
						background: "linear-gradient(135deg, #006633 0%, #00a854 100%)",
						color: "white",
					}}
				>
					{sending ? (
						<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
					) : (
						t("BugModal.send")
					)}
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
