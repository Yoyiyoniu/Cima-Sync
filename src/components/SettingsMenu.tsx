import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { openUrl } from "@tauri-apps/plugin-opener";
import { invoke } from "@tauri-apps/api/core";

import {
	removeDatabase,
	resetCredentialsSystem,
} from "../controller/DbController";
import { useDeviceStore } from "../store/deviceStore";
import { useUiStore } from "../store/uiStore";

import CoffeeIcon from "../assets/icons/CoffeeIcon";
import GithubIcon from "../assets/icons/GithubIcon";
import OptionsIcon from "../assets/icons/OptionsIcon";
import TrashIcon from "../assets/icons/TrashIcon";
import XIcon from "../assets/icons/XIcon";
import BugIcon from "../assets/icons/BugIcon";

import { Modal } from "./Modal";
import { AutoStartConfig } from "./SettingsMenu/AutoStartConfig";
import { LanguageSelector } from "./SettingsMenu/LanguageSelector";
import { TourButton } from "./SettingsMenu/TourButton";

export const SettingsMenu = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const [isOpen, setIsOpen] = useState(false);
	const [showGithubModal, setShowGithubModal] = useState(false);
	const [showRemoveDatabaseModal, setShowRemoveDatabaseModal] = useState(false);
	const [showCoffeeModal, setShowCoffeeModal] = useState(false);
	const isMobile = useDeviceStore((state) => state.isMobile);
	const isDesktop = useDeviceStore((state) => state.isDesktop);
	const platform = useDeviceStore((state) => state.platform);
	const isAndroid = platform === "android";
	const closeBugModal = useUiStore((state) => state.closeBugModal);
	const openBugModal = useUiStore((state) => state.openBugModal);

	const isDebug = import.meta.env.DEV;
	const [serviceRunning, setServiceRunning] = useState(false);
	const [serviceLoading, setServiceLoading] = useState(false);
	const [serviceError, setServiceError] = useState<string | null>(null);

	useEffect(() => {
		if (!isDebug || !isAndroid || !isOpen) return;
		invoke<{ running: boolean }>("plugin:android-services|is_running")
			.then((res) => setServiceRunning(res.running))
			.catch(() => setServiceRunning(false));
	}, [isDebug, isAndroid, isOpen]);

	const handleToggleService = async () => {
		setServiceLoading(true);
		setServiceError(null);
		try {
			if (serviceRunning) {
				await invoke("plugin:android-services|stop_service");
				setServiceRunning(false);
			} else {
				await invoke("plugin:android-services|start_service");
				setServiceRunning(true);
			}
		} catch (err) {
			setServiceError(String(err));
		} finally {
			setServiceLoading(false);
		}
	};

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setIsOpen(false);
				setShowGithubModal(false);
				setShowCoffeeModal(false);
				closeBugModal();
			}
		};
		window.addEventListener("keydown", handleEscape);
		return () => {
			window.removeEventListener("keydown", handleEscape);
		};
	}, [closeBugModal]);

	const handleGithubRedirect = async () => {
		await openUrl("https://github.com/Yoyiyoniu/cima-sync");
	};

	const handleCoffeeRedirect = async () => {
		await openUrl(t("support.koFiUrl"));
	};

	const handleRemoveDatabase = async () => {
		await resetCredentialsSystem();
		await removeDatabase();
		navigate("/");
	};

	return (
		<>
			<button
				type="button"
				className={`left-0 absolute z-60 bg-white/5 border border-white/20 rounded-full p-2 hover:bg-white/20 hover:border-white/30 transition-all duration-300 m-3 ${isMobile ? "top-12" : "top-0"}`}
				onClick={() => setIsOpen(!isOpen)}
			>
				<OptionsIcon width={30} height={30} className="text-white" />
			</button>
			<button
				type="button"
				className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 ${isOpen ? "block" : "hidden"}`}
				onClick={() => setIsOpen(false)}
			/>

			<Modal
				showModal={showGithubModal}
				title={t("Modal.github.title")}
				modalText={t("Modal.github.description")}
				setShowModal={setShowGithubModal}
				handleModalFunction={handleGithubRedirect}
			/>

			<Modal
				showModal={showCoffeeModal}
				title={t("Modal.coffee.title")}
				modalText={t("Modal.coffee.description")}
				setShowModal={setShowCoffeeModal}
				handleModalFunction={handleCoffeeRedirect}
			/>

			<Modal
				showModal={showRemoveDatabaseModal}
				title={t("Modal.removeDatabase.title")}
				modalText={t("Modal.removeDatabase.description")}
				setShowModal={setShowRemoveDatabaseModal}
				handleModalFunction={handleRemoveDatabase}
			/>

			<div
				className="fixed top-0 left-0 h-full w-80 bg-white/10 backdrop-blur-md border-r border-white/20 z-50 t-panel-slide-x"
				data-open={isOpen ? "true" : "false"}
			>
				<div className={`p-6 h-full flex flex-col ${isMobile ? "pt-20" : ""}`}>
					<div className="flex items-center justify-between mb-6">
						<h1 className="text-xl font-bold text-white">
							{t("Settings.title")}
						</h1>
						<button
							type="button"
							onClick={() => setIsOpen(false)}
							className="text-white/70 hover:text-white transition-colors"
						>
							<XIcon />
						</button>
					</div>
					<button
						type="button"
						title={t("App.buyCoffee")}
						onClick={() => {
							setShowCoffeeModal(true);
						}}
						className="group relative mb-4 overflow-hidden rounded-lg bg-linear-to-r from-amber-500/20 via-amber-600/20 to-amber-500/20 border border-amber-500/40 hover:border-amber-400/60 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20 p-3 w-full min-h-20"
					>
						<div className="flex items-center gap-3">
							<div className="relative">
								<CoffeeIcon />
								<div className="absolute inset-0 bg-amber-400/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
							</div>
							<div className="flex-1 text-left">
								<p className="text-white font-medium text-sm">
									{t("App.buyCoffee")}
								</p>
								<p className="text-amber-300/70 text-xs mt-0.5">
									{t("App.supportDevelopment")}
								</p>
							</div>
							<svg
								className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<title>Arrow</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</div>
					</button>
					<div className="flex-1 space-y-6 items-center justify-center">
						<div className="space-y-4">
							<h2 className="text-lg font-semibold text-white">
								{t("Settings.appInfo.title")}
							</h2>
							<div className="space-y-3 text-white/80">
								<div>
									<p className="font-medium">{t("Settings.appInfo.name")}</p>
									<p className="text-sm">{t("Settings.appInfo.version")}</p>
								</div>
							</div>
						</div>

						<div className="space-y-4">
							<h2 className="text-lg font-semibold text-white">
								{t("Settings.config.title")}
							</h2>
							<div className="space-y-3">
								{isDesktop && <AutoStartConfig />}
								<button
									type="button"
									className="flex items-center justify-between cursor-pointer rounded-l-xl rounded-r-xl w-full p-2 border border-white/20 hover:bg-red-500/20 hover:border-red-500/40 transition-colors duration-200"
									onClick={() => {
										setShowRemoveDatabaseModal(true);
									}}
								>
									<p className="text-white/80">
										{t("Settings.removeDatabase")}
									</p>
									<TrashIcon />
								</button>

								{/* Separación */}
								<div className="border-t border-white/20 my-4"></div>

								<TourButton onClose={() => setIsOpen(false)} />
							</div>
						</div>

						<div className="space-y-4">
							<h2 className="text-lg font-semibold text-white">
								{t("Settings.help.title")}
							</h2>
							<div className="space-y-2">
								<button
									className="flex items-center justify-between cursor-pointer rounded-l-xl rounded-r-xl w-full p-2 border border-white/20 text-white/80 hover:text-white hover:bg-amber-500/20 hover:border-amber-500/40 transition-colors duration-200"
									type="button"
									onClick={openBugModal}
								>
									<p className="text-white/80">
										{t("Settings.help.reportBug")}
									</p>
									<BugIcon width={20} height={20} />
								</button>
							</div>
						</div>
					</div>

					{isDebug && isAndroid && (
						<div className="mt-4 space-y-3">
							<div className="flex items-center gap-2">
								<span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80 bg-amber-400/10 border border-amber-400/30 rounded px-1.5 py-0.5">
									debug
								</span>
								<span className="text-xs text-white/40">Android Services</span>
							</div>

							<div className="rounded-lg border border-white/10 bg-black/30 p-3 space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<span className={`h-2 w-2 rounded-full ${serviceRunning ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-white/20"}`} />
										<span className="text-xs text-white/70">Foreground Service</span>
									</div>
									<span className={`text-xs font-medium ${serviceRunning ? "text-emerald-400" : "text-white/30"}`}>
										{serviceRunning ? "ACTIVO" : "INACTIVO"}
									</span>
								</div>

								<button
									type="button"
									disabled={serviceLoading}
									onClick={handleToggleService}
									className={`w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
										${serviceRunning
											? "bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30"
											: "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
										}`}
								>
									{serviceLoading ? (
										<svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24" aria-hidden="true">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
										</svg>
									) : serviceRunning ? (
										<svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
											<rect x="4" y="4" width="12" height="12" rx="1" />
										</svg>
									) : (
										<svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
											<path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
										</svg>
									)}
									{serviceLoading ? "Procesando..." : serviceRunning ? "Detener servicio" : "Iniciar servicio"}
								</button>

								{serviceError && (
									<p className="text-[10px] text-red-400/80 break-all">{serviceError}</p>
								)}
							</div>
						</div>
					)}

					<LanguageSelector />
					<button
						type="button"
						title="Abrir proyecto de github"
						onClick={() => setShowGithubModal(true)}
						className="p-2 mb-2 mt-2 rounded-l-xl rounded-r-xl bg-black/40 border border-white/20 hover:bg-black/60 hover:border-white/30 transition-colors duration-200 flex items-center gap-2 w-full"
					>
						<GithubIcon width={30} height={30} />
						<p className="text-white/80 text-sm">{t("Settings.github")}</p>
					</button>
					<div className="pt-6 border-t border-white/20">
						<p className="text-xs text-white/60 text-center">
							&copy; {new Date().getFullYear()} {t("Settings.appInfo.name")}
						</p>
					</div>
				</div>
			</div>
		</>
	);
};
