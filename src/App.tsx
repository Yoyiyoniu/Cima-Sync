import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTour } from "@reactour/tour";
import { AnimatePresence, motion } from "motion/react";

import { useAppBootstrap } from "./hooks/useAppBootstrap";
import { useDisableContextMenu } from "./hooks/disableContextMenu";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { useTourAutoOpen } from "./hooks/useTourAutoOpen";
import { useDeviceStore } from "./store/deviceStore";
import { useUiStore } from "./store/uiStore";
import { useSessionStore } from "./store/sessionStore";
import type { AppProps, AppState } from "./types";

import { BugModal } from "./components/BugModal";
import { CertificateAlert } from "./components/CertificateAlert";
import { CimaSyncModeCard } from "./components/CimaSyncModeCard";
import { DesktopStatusCard } from "./components/DesktopStatusCard";
import { ProfileModal } from "./components/ProfileModal";
import { SettingsMenu } from "./components/SettingsMenu";
import { SuccessModal } from "./components/SuccessModal";

import BugIcon from "./assets/icons/BugIcon";
import OptionsIcon from "./assets/icons/OptionsIcon";
import ProfileIcon from "./assets/icons/ProfileIcon";
import img from "./assets/img/cima-sync-logo.avif";

import "@fontsource-variable/nunito";
import "./css/Global.css";
import { forceWifi } from "./controller/forceWifi";
import {
	startBackgroundService,
	stopBackgroundService,
} from "./controller/backgroundService";

type NetworkSyncState =
	| "fineConnection"
	| "haveCautivePortal"
	| "invalidConnection"
	| "mobileConnection"
	| "mobileConnectionRequiereAuth";

const STATUS_CONFIG: Record<
	NetworkSyncState,
	{
		label: (t: (k: string) => string) => string;
		color: string;
		dot: string;
		glow: string;
	}
> = {
	fineConnection: {
		label: (t) => t("Header.connected"),
		color: "bg-[#00723f]/20 border-[#00723f]/50",
		dot: "bg-emerald-400 shadow-[0_0_6px_#34d399]",
		glow: "rgba(0,114,63,0.3)",
	},
	haveCautivePortal: {
		label: (t) => t("Header.initSession"),
		color: "bg-amber-500/15 border-amber-500/40",
		dot: "bg-amber-400",
		glow: "rgba(245,158,11,0.2)",
	},
	mobileConnectionRequiereAuth: {
		label: (t) => t("Header.initSession"),
		color: "bg-amber-500/15 border-amber-500/40",
		dot: "bg-amber-400",
		glow: "rgba(245,158,11,0.2)",
	},
	invalidConnection: {
		label: (t) => t("Header.disconnected"),
		color: "bg-white/8 border-white/15",
		dot: "bg-white/30",
		glow: "transparent",
	},
	mobileConnection: {
		label: (t) => t("Header.disconnected"),
		color: "bg-white/8 border-white/15",
		dot: "bg-white/30",
		glow: "transparent",
	},
};

const ORBIT_RADIUS = 116;
const ORBIT_DURATION = 13.0;

const ORBIT_DOTS = [0, 1, 2, 3].map((i) => ({
	startAngle: (i / 4) * 360,
	delay: i * 0.18,
}));

function App({ showTourFirstTime = false }: AppProps) {
	const { t } = useTranslation();
	const { setIsOpen } = useTour();

	const { rememberSession, isBootstrapping } = useAppBootstrap();
	const credentials = useSessionStore((state) => state.credentials);

	const [appState, setAppState] = useState<AppState>({
		loading: false,
		error: null,
		success: false,
	});
	const [pendingSource, setPendingSource] = useState<
		"login" | "activate" | null
	>(null);

	const showSuccessModal = useUiStore((state) => state.showSuccessModal);
	const openSuccessModal = useUiStore((state) => state.openSuccessModal);
	const closeSuccessModal = useUiStore((state) => state.closeSuccessModal);
	const openCertificateAlert = useUiStore(
		(state) => state.openCertificateAlert,
	);
	const openBugModal = useUiStore((state) => state.openBugModal);
	const closeBugModal = useUiStore((state) => state.closeBugModal);
	const showCertificateAlert = useUiStore(
		(state) => state.showCertificateAlert,
	);
	const showBugModal = useUiStore((state) => state.showBugModal);
	const openSettingsMenu = useUiStore((state) => state.openSettingsMenu);
	const showProfileModal = useUiStore((state) => state.showProfileModal);
	const openProfileModal = useUiStore((state) => state.openProfileModal);
	const closeProfileModal = useUiStore((state) => state.closeProfileModal);

	const { isUabcConnected, networkState } = useNetworkStatus();
	const [isCimaSyncActive, setIsCimaSyncActive] = useState(false);

	const isMobile = useDeviceStore((state) => state.isMobile);
	const platform = useDeviceStore((state) => state.platform);
	const isAndroid = platform === "android";

	const isLoginDisabled =
		appState.loading ||
		isBootstrapping ||
		isCimaSyncActive ||
		(!isMobile &&
			(!credentials.email || !credentials.password || !isUabcConnected));

	const status =
		STATUS_CONFIG[networkState as NetworkSyncState] ??
		STATUS_CONFIG.invalidConnection;

	const refreshAuthStatus = useCallback(async () => {
		try {
			const res = await invoke<{ is_active?: boolean }>("get_auth_status");
			setIsCimaSyncActive(Boolean(res?.is_active));
		} catch (error) {
			console.error("Error getting auth status:", error);
		}
	}, []);

	useDisableContextMenu();
	useTourAutoOpen({ showTourFirstTime, setIsOpen });

	useEffect(() => {
		void refreshAuthStatus();
	}, [refreshAuthStatus]);

	const handleLogin = useCallback(async () => {
		if (!credentials.email || !credentials.password) {
			setPendingSource("login");
			openProfileModal();
			return;
		}
		setPendingSource(null);
		setAppState({ loading: true, error: null, success: false });
		try {
			if (isMobile) {
				await forceWifi({
					function: async () =>
						await invoke("login", {
							email: credentials.email,
							password: credentials.password,
						}),
				});
			}

			if (isAndroid) {
				await startBackgroundService();
			}

			await invoke("auto_auth", {
				email: credentials.email,
				password: credentials.password,
			});

			setIsCimaSyncActive(true);
			setAppState((prev) => ({ ...prev, success: true }));
			openSuccessModal();

			if (!rememberSession) {
				await invoke("delete_credentials");
			}
		} catch (error) {
			console.error("Login error:", error);
			const errorStr = String(error).toLowerCase();
			if (
				errorStr.includes("certificate") ||
				errorStr.includes("ssl") ||
				errorStr.includes("tls") ||
				errorStr.includes("expired")
			) {
				openCertificateAlert();
			}
			setAppState((prev) => ({ ...prev, error: String(error) }));
		} finally {
			setAppState((prev) => ({ ...prev, loading: false }));
		}
	}, [
		credentials,
		rememberSession,
		isMobile,
		isAndroid,
		openProfileModal,
		openSuccessModal,
		openCertificateAlert,
	]);

	const handleActivateMode = useCallback(async () => {
		if (!credentials.email || !credentials.password) {
			setPendingSource("activate");
			openProfileModal();
			return;
		}
		setPendingSource(null);
		setAppState({ loading: true, error: null, success: false });
		try {
			if (isAndroid) {
				await startBackgroundService();
			}

			await invoke("auto_auth", {
				email: credentials.email,
				password: credentials.password,
			});

			setIsCimaSyncActive(true);
			setAppState((prev) => ({ ...prev, success: true }));

			if (!rememberSession) {
				await invoke("delete_credentials");
			}
		} catch (error) {
			console.error("Activate mode error:", error);
			setAppState((prev) => ({ ...prev, error: String(error) }));
		} finally {
			setAppState((prev) => ({ ...prev, loading: false }));
		}
	}, [credentials, rememberSession, isAndroid, openProfileModal]);

	const handleLogout = useCallback(async () => {
		if (isAndroid) {
			await stopBackgroundService().catch(() => {});
		}
		await invoke("stop_auth");
		setIsCimaSyncActive(false);
		setAppState({ loading: false, error: null, success: false });
	}, [isAndroid]);

	useEffect(() => {
		if (
			pendingSource !== null &&
			!showProfileModal &&
			credentials.email &&
			credentials.password &&
			!appState.loading &&
			!isCimaSyncActive
		) {
			if (pendingSource === "login") {
				setPendingSource(null);
				void handleLogin();
			} else {
				setPendingSource(null);
				void handleActivateMode();
			}
		}
	}, [
		pendingSource,
		showProfileModal,
		credentials.email,
		credentials.password,
		appState.loading,
		isCimaSyncActive,
		handleLogin,
		handleActivateMode,
	]);

	useEffect(() => {
		if (!appState.error) return;
		const timer = setTimeout(
			() => setAppState((prev) => ({ ...prev, error: null })),
			4000,
		);
		return () => clearTimeout(timer);
	}, [appState.error]);

	const ringGlow = isCimaSyncActive
		? "0 0 55px rgba(0,220,100,0.65), 0 0 110px rgba(0,160,60,0.35), 0 0 170px rgba(0,100,40,0.18)"
		: isUabcConnected
			? "0 0 30px rgba(0,114,63,0.25)"
			: "none";

	// Label above circle — t-text-swap state
	const currentLabelText = appState.loading
		? t("App.connecting")
		: appState.error
			? appState.error.length > 48
				? `${appState.error.slice(0, 48)}…`
				: appState.error
			: isCimaSyncActive
				? t("App.connected")
				: isUabcConnected || isMobile
					? t("App.activateCimaSync")
					: t("App.networkUnavailable");
	const currentLabelCls = appState.loading
		? "text-white/70 font-medium"
		: appState.error
			? "text-red-400 text-sm font-medium"
			: isCimaSyncActive
				? "text-emerald-400 font-bold"
				: isUabcConnected || isMobile
					? "text-white/55 font-medium"
					: "text-white/30";

	const labelRef = useRef<HTMLSpanElement>(null);
	const prevLabelTextRef = useRef(currentLabelText);
	const [displayedLabelText, setDisplayedLabelText] =
		useState(currentLabelText);
	const [displayedLabelCls, setDisplayedLabelCls] = useState(currentLabelCls);

	useEffect(() => {
		if (currentLabelText === prevLabelTextRef.current) return;
		const el = labelRef.current;
		prevLabelTextRef.current = currentLabelText;
		if (!el) {
			setDisplayedLabelText(currentLabelText);
			setDisplayedLabelCls(currentLabelCls);
			return;
		}
		el.classList.add("is-exit");
		const timer = setTimeout(() => {
			setDisplayedLabelText(currentLabelText);
			setDisplayedLabelCls(currentLabelCls);
			el.classList.remove("is-exit");
			el.classList.add("is-enter-start");
			void el.offsetHeight;
			el.classList.remove("is-enter-start");
		}, 150);
		return () => clearTimeout(timer);
	}, [currentLabelText, currentLabelCls]);

	return (
		<main
			className={`flex flex-col h-screen text-white overflow-hidden relative select-none ${isMobile ? "pt-12" : ""}`}
		>
			<motion.header
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
				className={`relative z-10 flex px-4 py-3 ${isMobile ? "items-start" : "items-center"}`}
			>
				<div className="flex-1 flex items-start">
					<button
						id="tour-settings-btn"
						type="button"
						onClick={openSettingsMenu}
						className="w-12 h-12 flex items-center justify-center rounded-full border border-white/15 bg-white/6 hover:bg-white/12 hover:border-white/25 transition-all duration-200 active:scale-95"
					>
						<OptionsIcon width={24} height={24} className="text-white/80" />
					</button>
				</div>

				<motion.div
					id="tour-network-status"
					key={networkState}
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
					className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full border text-base font-semibold transition-all duration-500 ${status.color}`}
				>
					<span
						className={`w-2.5 h-2.5 rounded-full shrink-0 ${status.dot} ${networkState === "fineConnection" || isCimaSyncActive ? "animate-pulse" : ""}`}
					/>
					{isBootstrapping ? (
						<span className="text-white/40">
							{t("ConnectionStatus.loading")}
						</span>
					) : (
						<span className="text-white/90">{status.label(t)}</span>
					)}
				</motion.div>

				<div
					className={`flex-1 flex justify-end gap-2 ${isMobile ? "flex-col items-end" : "flex-row items-center"}`}
				>
					<button
						id="tour-profile-btn"
						type="button"
						onClick={openProfileModal}
						className="w-12 h-12 flex items-center justify-center rounded-full border border-white/15 bg-white/6 hover:bg-white/12 hover:border-white/25 transition-all duration-200 active:scale-95"
					>
						<ProfileIcon width={24} height={24} className="text-white/80" />
					</button>
					<button
						type="button"
						title={t("Settings.help.reportBug")}
						onClick={openBugModal}
						className="w-12 h-12 flex items-center justify-center rounded-full border border-white/15 bg-white/6 hover:bg-white/12 hover:border-white/25 transition-all duration-200 active:scale-95"
					>
						<BugIcon width={24} height={24} className="text-white/80" />
					</button>
				</div>
			</motion.header>

			{/* ── Main content ──────────────────────────────────────── */}
			<div className="flex-1 relative z-10 flex flex-col items-center justify-center px-6 gap-4 min-h-0">
				{/* Desktop hero title */}
				{!isMobile && !isCimaSyncActive && (
					<motion.div
						initial={{ opacity: 0, y: -14 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
						className="text-center"
					>
						<h1 className="text-2xl font-bold tracking-tight text-white/90">
							{t("App.desktopTitle")}
						</h1>
						<p className="text-sm text-white/35 mt-1 tracking-wide">
							{t("App.desktopSubtitle")}
						</p>
					</motion.div>
				)}

				{/* Label above the circle */}
				<motion.div
					initial={{ opacity: 0, y: -8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.45, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
					className="h-8 flex items-center justify-center"
				>
					<span
						ref={labelRef}
						className={`t-text-swap text-base text-center ${displayedLabelCls}`}
						style={{ maxWidth: 220 }}
					>
						{displayedLabelText}
					</span>
				</motion.div>

				{/* Logo circle — IS the activate button */}
				<div className="relative">
					{/* Orbiting dots layer */}
					<div className="absolute inset-0 pointer-events-none">
						<AnimatePresence>
							{!isCimaSyncActive && !appState.loading && (
								<motion.div
									key="orbit-container"
									className="absolute inset-0"
									initial={{ scale: 0.4, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 2.0, opacity: 0 }}
									transition={{
										scale: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
										opacity: { duration: 0.5 },
									}}
								>
									{ORBIT_DOTS.map((dot) => (
										<motion.div
											key={dot.startAngle}
											className="absolute rounded-full"
											style={{
												top: "50%",
												left: "50%",
												width: 12,
												height: 12,
												marginLeft: ORBIT_RADIUS - 6,
												marginTop: -6,
												transformOrigin: `${6 - ORBIT_RADIUS}px 6px`,
												background:
													"radial-gradient(circle, rgba(0,220,130,0.95) 0%, rgba(0,160,80,0.7) 100%)",
												boxShadow:
													"0 0 10px rgba(0,220,100,0.75), 0 0 22px rgba(0,160,80,0.45)",
											}}
											animate={{ rotate: dot.startAngle + 360 }}
											initial={{ rotate: dot.startAngle }}
											transition={{
												rotate: {
													duration: ORBIT_DURATION,
													repeat: Infinity,
													ease: "linear",
												},
											}}
										/>
									))}
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					<motion.button
						id="tour-activate-btn"
						type="button"
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
						onClick={handleLogin}
						disabled={isLoginDisabled}
						className="relative rounded-full transition-transform duration-200 active:scale-95 disabled:cursor-not-allowed focus:outline-none"
						style={{ WebkitTapHighlightColor: "transparent" }}
					>
						{/* Outer glow ring */}
						<motion.div
							className="absolute inset-[-8px] rounded-full pointer-events-none"
							animate={
								appState.loading
									? {
											boxShadow: [
												"0 0 0px rgba(0,220,100,0)",
												"0 0 45px rgba(0,220,100,0.65), 0 0 90px rgba(0,180,80,0.3)",
												"0 0 0px rgba(0,220,100,0)",
											],
										}
									: {
											boxShadow: ringGlow,
										}
							}
							transition={
								appState.loading
									? { duration: 2, repeat: Infinity, ease: "easeInOut" }
									: { duration: 1.1 }
							}
							style={{
								border: isCimaSyncActive
									? "1px solid rgba(0,220,100,0.4)"
									: appState.loading
										? "1px solid rgba(0,220,100,0.25)"
										: isUabcConnected
											? "1px solid rgba(0,114,63,0.2)"
											: "1px solid rgba(255,255,255,0.06)",
								borderRadius: "50%",
							}}
						/>

						<motion.div
							className="relative w-52 h-52 rounded-full flex items-center justify-center overflow-hidden"
							animate={
								appState.loading
									? {
											boxShadow: [
												"0 0 0px rgba(0,220,100,0), inset 0 0 0px rgba(0,220,100,0)",
												"0 0 20px rgba(0,220,100,0.35), inset 0 0 30px rgba(0,180,80,0.22)",
												"0 0 0px rgba(0,220,100,0), inset 0 0 0px rgba(0,220,100,0)",
											],
										}
									: {
											boxShadow: isCimaSyncActive
												? "inset 0 0 40px rgba(0,180,80,0.22), inset 0 0 80px rgba(0,100,50,0.12)"
												: "none",
										}
							}
							transition={
								appState.loading
									? { duration: 2, repeat: Infinity, ease: "easeInOut" }
									: { duration: 1.1 }
							}
							style={{
								background: isCimaSyncActive
									? "radial-gradient(circle at 35% 35%, rgba(0,210,100,0.38) 0%, rgba(0,100,50,0.58) 100%)"
									: isUabcConnected
										? "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.28) 100%)"
										: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.35) 100%)",
								border: isCimaSyncActive
									? "1.5px solid rgba(0,220,100,0.55)"
									: appState.loading
										? "1px solid rgba(0,220,100,0.3)"
										: "1px solid rgba(255,255,255,0.12)",
								backdropFilter: "blur(12px)",
							}}
						>
							<img
								src={img}
								alt="CimaSync"
								className={`w-32 h-32 object-cover rounded-full animate-logo-pop transition-opacity duration-500 ${
									isCimaSyncActive
										? "opacity-50"
										: isLoginDisabled && !isMobile
											? "opacity-30"
											: "opacity-100"
								}`}
							/>

							<span
								className="t-success-check absolute inset-0 flex items-center justify-center"
								data-state={isCimaSyncActive ? "in" : "out"}
								aria-hidden="true"
							>
								<span className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width={32}
										height={32}
										fill="none"
										stroke="currentColor"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2.5}
										viewBox="0 0 24 24"
										className="text-emerald-400"
										aria-hidden="true"
									>
										<polyline points="20 6 9 17 4 12" />
									</svg>
								</span>
							</span>
						</motion.div>
					</motion.button>
				</div>
			</div>

			{isMobile ? (
				<CimaSyncModeCard
					isCimaSyncActive={isCimaSyncActive}
					isLoading={appState.loading}
					isDisabled={isLoginDisabled}
					onActivate={handleActivateMode}
					onDeactivate={handleLogout}
				/>
			) : (
				<DesktopStatusCard
					isCimaSyncActive={isCimaSyncActive}
					isLoading={appState.loading}
					onDeactivate={handleLogout}
				/>
			)}

			<SettingsMenu />
			<ProfileModal isOpen={showProfileModal} onClose={closeProfileModal} />
			<SuccessModal isOpen={showSuccessModal} onClose={closeSuccessModal} />
			<CertificateAlert isVisible={showCertificateAlert} />

			<BugModal
				showModal={showBugModal}
				setShowModal={(show) => (show ? openBugModal() : closeBugModal())}
			/>
		</main>
	);
}

export default App;
