import { invoke } from "@tauri-apps/api/core";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useTour } from "@reactour/tour";

import { useAppBootstrap } from "./hooks/useAppBootstrap";
import { useDisableContextMenu } from "./hooks/disableContextMenu";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { useShowApp } from "./hooks/useShowApp";
import { useTourAutoOpen } from "./hooks/useTourAutoOpen";
import type { AppProps, AppState } from "./types";

import { setRememberSessionConfig } from "./controller/DbController";
import { LoadingText } from "./components/LoadingText";
import { BugModal } from "./components/BugModal";
import { CertificateAlert } from "./components/CertificateAlert";
import { CopyRightMenu } from "./components/ContactMe";
import { Input } from "./components/Input";
import { SettingsMenu } from "./components/SettingsMenu";
import { SuccessModal } from "./components/SuccessModal";

import BugIcon from "./assets/icons/BugIcon";
import StopIcon from "./assets/icons/StopIcon";
import WifiIcon from "./assets/icons/WifiIcon";
import img from "./assets/img/cima-sync-logo.avif";

import "@fontsource-variable/nunito";
import "./css/Global.css";

function App({ showTourFirstTime = false }: AppProps) {
	const { t } = useTranslation();
	const { setIsOpen } = useTour();
	const { credentials, setCredentials, rememberSession, setRememberSession } =
		useAppBootstrap();
	const [appState, setAppState] = useState<AppState>({
		loading: false,
		error: null,
		success: false,
	});
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [showCertificateAlert, setShowCertificateAlert] = useState(false);
	const [showBugModal, setShowBugModal] = useState(false);
	const { showApp } = useShowApp();
	const { isUabcConnected } = useNetworkStatus();
	const isFormDisabled = appState.loading || appState.success;
	const isLoginDisabled =
		isFormDisabled ||
		!credentials.email ||
		!credentials.password ||
		!isUabcConnected;

	useDisableContextMenu();

	useTourAutoOpen({ showTourFirstTime, setIsOpen });

	const handleLogin = async (e: FormEvent) => {
		e.preventDefault();
		setAppState({ loading: true, error: null, success: false });
		try {
			await setRememberSessionConfig(rememberSession);

			await invoke("login", {
				email: credentials.email,
				password: credentials.password,
			});

			setAppState((prev) => ({ ...prev, success: true }));
			setShowSuccessModal(true);

			if (rememberSession) {
				await invoke("save_credentials", {
					email: credentials.email,
					password: credentials.password,
				});

				await invoke("auto_auth", {
					email: credentials.email,
					password: credentials.password,
				});
			} else {
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
				setShowCertificateAlert(true);
			}
			setAppState((prev) => ({ ...prev, error: String(error) }));
		} finally {
			setAppState((prev) => ({ ...prev, loading: false }));
		}
	};

	const handleLogout = async () => {
		await invoke("stop_auth");
		setAppState({ loading: false, error: null, success: false });
	};

	const handleRememberChange = async (checked: boolean) => {
		setRememberSession(checked);
		await setRememberSessionConfig(checked);

		if (!checked) {
			try {
				await invoke("delete_credentials");
			} catch (_error) {
				console.error("Error deleting credentials:");
			}
		}
	};

	return (
		<main
			className={`app-fade-in ${showApp ? "show" : ""} flex flex-col h-screen items-center justify-center text-white gap-5 p-4 relative bg-linear-to-r from-slate-900 via-gray-800 to-gray-900 overflow-hidden`}
		>
			<img
				src={img}
				alt=""
				className="blur absolute max-h-[800px] object-fit"
			/>

			<SettingsMenu setShowBugModal={setShowBugModal} />

			<div
				className={`absolute top-4 right-4 flex items-center gap-2 z-50 app-fade-in ${showApp ? "show" : ""} transition-colors duration-300`}
			>
				<WifiIcon
					connected={isUabcConnected}
					className={`${isUabcConnected ? "text-green-400" : "text-gray-500"} w-5 h-5 transition-colors duration-300`}
				/>
				<span
					className={`text-xs font-medium ${isUabcConnected ? "text-green-400" : "text-gray-500"} transition-colors duration-300`}
				>
					{isUabcConnected
						? t("App.uabcConnection")
						: t("App.networkUnavailable")}
				</span>
			</div>

			<div className="w-full p-5 relative z-10 flex flex-col items-center justify-center">
				<CopyRightMenu />
				<form
					className={`login-form w-full max-w-sm flex flex-col gap-3 mb-8 ${isFormDisabled ? "is-loading" : ""}`}
					onSubmit={handleLogin}
					aria-busy={appState.loading}
				>
					<div className="text-center mb-8">
						<h1
							className={`app-title ${showApp ? "show" : ""} text-2xl font-medium`}
						>
							{t("App.title")}
						</h1>
						<p className={`app-subtitle ${showApp ? "show" : ""}`}>
							{t("App.subtitle")}
						</p>
					</div>

					{appState.success && (
						<div
							className={`form-element ${showApp ? "show" : ""} bg-green-500/20 border border-green-500/50 text-white p-3 rounded-md mb-3`}
						>
							{t("App.success")}
						</div>
					)}

					<fieldset
						disabled={isFormDisabled}
						className={`login-fieldset flex flex-col gap-3 ${isFormDisabled ? "is-disabled" : ""}`}
					>
						<div className={`form-element ${showApp ? "show" : ""}`}>
							<Input
								id="email"
								type="email"
								label={t("App.email")}
								placeholder={t("Input.emailPlaceholder")}
								value={credentials.email}
								onChange={(e) => {
									setCredentials((prev) => ({
										...prev,
										email: e.target.value,
									}));
								}}
								disabled={isFormDisabled}
							/>
						</div>

						<div className={`form-element ${showApp ? "show" : ""}`}>
							<Input
								id="password"
								type="password"
								label={t("App.password")}
								placeholder={t("Input.passwordPlaceholder")}
								value={credentials.password}
								onChange={(e) => {
									setCredentials((prev) => ({
										...prev,
										password: e.target.value,
									}));
								}}
								disabled={isFormDisabled}
							/>
						</div>

						<div
							className={`form-element ${showApp ? "show" : ""} flex items-center`}
						>
							<div className="relative flex items-center">
								<input
									type="checkbox"
									id="remember"
									checked={rememberSession}
									onChange={(e) => handleRememberChange(e.target.checked)}
									disabled={isFormDisabled}
									className="peer h-4 w-4 appearance-none rounded border border-[#006633]/30 bg-black/40 
                        checked:bg-[#006633] checked:border-[#006633] 
                          focus:outline-none focus:ring-2 focus:ring-[#006633]/50
                          disabled:opacity-50 disabled:cursor-not-allowed"
								/>
								<div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-3 w-3"
										viewBox="0 0 20 20"
										fill="currentColor"
										aria-hidden="true"
									>
										<path
											fillRule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clipRule="evenodd"
										/>
									</svg>
								</div>
							</div>
							<label
								htmlFor="remember"
								title={t("App.rememberTitle")}
								className="ml-2 text-sm text-gray-300 cursor-pointer select-none"
							>
								{t("App.remember")}
							</label>
						</div>

						{appState.error && (
							<div
								className={`form-element ${showApp ? "show" : ""} bg-red-500/20 border border-red-500/50 text-white p-3 rounded-md mb-3`}
							>
								{t("App.error")}: {appState.error}
							</div>
						)}

					</fieldset>
					<div
						className={`form-element ${showApp ? "show" : ""} flex w-full max-w-sm justify-center ${
							appState.success ? "gap-2" : "gap-0"
						}`}
					>
						<button
							id="login-button"
							type="submit"
							title={
								!isUabcConnected
									? t("App.networkUnavailable")
									: t("App.login")
							}
							disabled={isLoginDisabled}
							className="login-button h-11 flex-1 items-center justify-center rounded-md font-medium
                        bg-[#006633] hover:bg-[#005528] text-white 
                        disabled:cursor-not-allowed
                        transition-all duration-300 shadow-sm cursor-pointer w-full"
						>
							<span className="login-button-glow" aria-hidden="true" />
							<span className="login-button-text">
								{appState.loading
									? (
											<LoadingText
												isActive={appState.loading}
												className="inline-block"
												messages={[
													`${t("App.connecting")}...`,
													"Desbloqueando limitaciones cimarronas...",
													"Puliendo credenciales interestelares...",
													"Calibrando señal extraterrestre...",
												]}
											/>
										)
									: appState.success
										? t("App.connected")
										: !isUabcConnected
											? t("App.networkUnavailable")
											: t("App.login")}
							</span>
							<span className="login-button-sheen" aria-hidden="true" />
						</button>
						<button
							title={t("App.logout")}
							onClick={handleLogout}
							type="button"
							className={`h-11 flex items-center justify-center rounded-md font-medium
                      bg-red-600 hover:bg-red-700 text-white
                      disabled:opacity-70 disabled:cursor-not-allowed
                      transition-all duration-300 shadow-sm cursor-pointer
                      ${appState.success ? "w-20 opacity-100 translate-x-0" : "w-0 opacity-0 translate-x-0 pointer-events-none"}`}
						>
							<StopIcon />
						</button>
					</div>

				</form>
			</div>

			<SuccessModal
				isOpen={showSuccessModal}
				onClose={() => setShowSuccessModal(false)}
			/>

			<CertificateAlert isVisible={showCertificateAlert} />

			<BugModal showModal={showBugModal} setShowModal={setShowBugModal} />

			<button
				type="button"
				title={t("Settings.help.reportBug")}
				onClick={() => setShowBugModal(true)}
				className="fixed bottom-5 right-5 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white shadow-lg transition-all duration-300 hover:scale-105"
			>
				<BugIcon width={24} height={24} />
			</button>
		</main>
	);
}

export default App;
