import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { enable, isEnabled, disable } from "@tauri-apps/plugin-autostart";
import { openUrl } from "@tauri-apps/plugin-opener";

import cimaLogo from "../assets/img/cima-sync-logo.avif";
import {
	setLanguagePreference,
	setHasSeenOnboarding,
} from "../controller/DbController";

export function Onboarding() {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const [step, setStep] = useState(0);
	const [showIntro, setShowIntro] = useState(true);
	const [showOutro, setShowOutro] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [autoStartEnabled, setAutoStartEnabled] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setShowIntro(false), 3000);
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		const checkAutoStart = async () => {
			try {
				const enabled = await isEnabled();
				setAutoStartEnabled(enabled);
			} catch (error) {
				console.error("Error checking autostart:", error);
			}
		};
		checkAutoStart();
	}, []);

	const handleAutoStartToggle = async () => {
		try {
			if (autoStartEnabled) {
				await disable();
				setAutoStartEnabled(false);
			} else {
				await enable();
				setAutoStartEnabled(true);
			}
		} catch (error) {
			console.error("Error toggling autostart:", error);
		}
	};

	const handleOpenKofi = async () => {
		try {
			await openUrl(t("support.koFiUrl"));
		} catch (error) {
			console.error("Error opening Ko-fi:", error);
		}
	};

	const handleFinish = async () => {
		await setHasSeenOnboarding(true);
		navigate("/app?tour=true", { replace: true });
	};

	// Cerrar dropdown cuando se hace clic fuera
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownOpen) {
				const target = event.target as Element;
				if (!target.closest(".language-dropdown")) {
					setDropdownOpen(false);
				}
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [dropdownOpen]);

	const handleLanguageChange = async (language: string) => {
		try {
			await i18n.changeLanguage(language);
			await setLanguagePreference(language);
			setDropdownOpen(false);
		} catch (error) {
			console.error("Error saving language:", error);
		}
	};

	const steps = [
		{
			id: "language",
			title: t("Onboarding.step1.title"),
			description: t("Onboarding.step1.description"),
			icon: (
				<svg
					aria-hidden="true"
					className="w-12 h-12"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
					/>
				</svg>
			),
			showLanguageSelector: true,
		},
		{
			id: "autostart",
			title: t("Onboarding.step4.title"),
			description: t("Onboarding.step4.description"),
			icon: (
				<svg
					aria-hidden="true"
					className="w-12 h-12"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M13 10V3L4 14h7v7l9-11h-7z"
					/>
				</svg>
			),
			showAutoStart: true,
		},
		{
			id: "session",
			title: t("Onboarding.step2.title"),
			description: t("Onboarding.step2.description"),
			icon: (
				<svg
					aria-hidden="true"
					className="w-12 h-12"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
					/>
				</svg>
			),
		},
		{
			id: "privacy",
			title: t("Onboarding.step3.title"),
			description: t("Onboarding.step3.description"),
			icon: (
				<svg
					aria-hidden="true"
					className="w-12 h-12"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
					/>
				</svg>
			),
		},
		{
			id: "donate",
			title: t("Onboarding.step5.title"),
			description: t("Onboarding.step5.description"),
			icon: (
				<svg
					aria-hidden="true"
					className="w-12 h-12"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
					/>
				</svg>
			),
			showDonation: true,
		},
	];

	const isLast = step === steps.length - 1;

	return (
		<main className="min-h-screen w-full text-white bg-linear-to-r from-gray-950 via-slate-950 to-gray-900 overflow-hidden relative">
			{/* Fondo animado */}
			<div className="absolute inset-0">
				<div className="absolute top-0 left-0 w-full h-full bg-radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent"></div>
				<div className="absolute bottom-0 right-0 w-full h-full bg-radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-teal-900/20 via-transparent to-transparent"></div>
				<motion.div
					className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"
					animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
					transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
				/>
				<motion.div
					className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl"
					animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
					transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
				/>
			</div>

			<div className="min-h-screen flex items-center justify-center px-6 relative z-10">
				<AnimatePresence mode="wait">
					{showIntro ? (
						<motion.div
							key="intro"
							className="flex flex-col items-center justify-center text-center"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.5 }}
						>
							{/* Mensaje de bienvenida */}
							<motion.h1
								className="text-5xl font-bold mb-8 bg-linear-to-r from-slate-300 to-gray-400 bg-clip-text text-transparent"
								initial={{ y: -50, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
							>
								{t("Onboarding.welcome.title")}
							</motion.h1>

							<motion.p
								className="text-xl text-gray-300 mb-12 max-w-md"
								initial={{ y: -30, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								transition={{ delay: 0.4, duration: 0.8, type: "spring" }}
							>
								{t("Onboarding.welcome.subtitle")}
							</motion.p>

							{/* Logo con animación mejorada */}
							<motion.div
								className="relative"
								initial={{ scale: 0.8, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								transition={{
									delay: 0.6,
									duration: 1,
									type: "spring",
									stiffness: 100,
								}}
							>
								<motion.img
									src={cimaLogo}
									alt="Cima Sync Logo"
									className="w-64 h-64 drop-shadow-2xl"
									animate={{
										y: [0, -10, 0],
										rotate: [0, 2, -2, 0],
									}}
									transition={{
										y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
										rotate: {
											duration: 4,
											repeat: Infinity,
											ease: "easeInOut",
										},
									}}
								/>

								{/* Efecto de brillo */}
								<motion.div
									className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
									animate={{
										x: [-100, 100],
									}}
									transition={{
										duration: 2,
										repeat: Infinity,
										ease: "easeInOut",
									}}
								/>
							</motion.div>

							{/* Indicador de carga */}
							<motion.div
								className="mt-8 flex space-x-3"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 1.5, duration: 0.5 }}
							>
								{[0, 1, 2].map((i) => (
									<motion.div
										key={i}
										className="w-3 h-3 bg-emerald-400 rounded-full"
										animate={{
											scale: [1, 1.5, 1],
											opacity: [0.4, 1, 0.4],
										}}
										transition={{
											duration: 1.2,
											repeat: Infinity,
											delay: i * 0.15,
										}}
									/>
								))}
							</motion.div>
						</motion.div>
					) : showOutro ? (
						<motion.div
							key="outro"
							className="flex flex-col items-center justify-center text-center"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.3 }}
						>
							{/* Círculo de éxito animado */}
							<motion.div
								className="mb-6 p-6 rounded-full bg-linear-to-br from-emerald-500/30 to-teal-600/30 border-2 border-emerald-500/50"
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
							>
								<motion.svg
									aria-hidden="true"
									className="w-16 h-16 text-emerald-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									initial={{ pathLength: 0 }}
									animate={{ pathLength: 1 }}
									transition={{ delay: 0.3, duration: 0.5 }}
								>
									<motion.path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2.5}
										d="M5 13l4 4L19 7"
										initial={{ pathLength: 0 }}
										animate={{ pathLength: 1 }}
										transition={{ delay: 0.4, duration: 0.6 }}
									/>
								</motion.svg>
							</motion.div>

							<motion.h2
								className="text-3xl font-bold mb-4 bg-linear-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent"
								initial={{ y: -30, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								transition={{ delay: 0.2, duration: 0.6 }}
							>
								{t("Onboarding.ready.title")}
							</motion.h2>

							<motion.img
								src={cimaLogo}
								alt="Cima Sync Logo"
								className="w-28 h-28 mb-4"
								initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
								animate={{
									scale: [0.5, 1.2, 1],
									opacity: [0, 1, 1],
									rotate: [-10, 5, 0],
								}}
								transition={{ duration: 1.2, ease: "easeOut" }}
								onAnimationComplete={() => {
									setTimeout(() => handleFinish(), 1000);
								}}
							/>

							<motion.p
								className="text-lg text-gray-300"
								initial={{ y: 20, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								transition={{ delay: 0.4, duration: 0.6 }}
							>
								{t("Onboarding.ready.subtitle")}
							</motion.p>

							{/* Animación de partículas */}
							<motion.div
								className="absolute inset-0 pointer-events-none"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
							>
								{[...Array(6)].map((_, i) => (
									<motion.div
										key={String(i)}
										className="absolute w-2 h-2 bg-emerald-400/60 rounded-full"
										style={{
											left: `${50 + (i % 2 === 0 ? -1 : 1) * (20 + i * 10)}%`,
											top: "50%",
										}}
										initial={{ scale: 0, opacity: 0 }}
										animate={{
											scale: [0, 1.5, 0],
											opacity: [0, 1, 0],
											y: [0, -100 - i * 20],
											x: [(i % 2 === 0 ? -1 : 1) * (10 + i * 15)],
										}}
										transition={{
											delay: 0.5 + i * 0.1,
											duration: 1.5,
											ease: "easeOut",
										}}
									/>
								))}
							</motion.div>
						</motion.div>
					) : (
						<motion.section
							key="steps"
							className="relative w-full max-w-lg bg-gray-900/90 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-8 overflow-hidden shadow-2xl shadow-emerald-500/5"
							initial={{ y: 30, opacity: 0, scale: 0.95 }}
							animate={{ y: 0, opacity: 1, scale: 1 }}
							transition={{ duration: 0.5, type: "spring" }}
						>
							{/* Fondo decorativo */}
							<div className="absolute inset-0 bg-linear-to-br from-emerald-900/10 via-transparent to-teal-900/10 rounded-3xl"></div>
							<div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-emerald-500/50 to-transparent"></div>

							{/* Logo de fondo */}
							<motion.img
								src={cimaLogo}
								alt="Cima Sync Logo background"
								className="pointer-events-none absolute -top-6 -right-6 w-28 h-28 opacity-[0.08]"
								animate={{
									rotate: [0, 360],
								}}
								transition={{
									rotate: { duration: 30, repeat: Infinity, ease: "linear" },
								}}
							/>
							<motion.div
								className="pointer-events-none absolute -bottom-12 -left-12 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl"
								animate={{ scale: [1, 1.2, 1] }}
								transition={{
									duration: 3,
									repeat: Infinity,
									ease: "easeInOut",
								}}
							/>

							<div className="relative z-10">
								{/* Selector de idioma */}
								{steps[step].showLanguageSelector && (
									<motion.div
										className="mb-6"
										initial={{ y: -20, opacity: 0 }}
										animate={{ y: 0, opacity: 1 }}
										transition={{ delay: 0.2, duration: 0.5 }}
									>
										<label
											htmlFor="language"
											className="block text-white/90 text-sm font-medium mb-3"
										>
											{t("Settings.language")}
										</label>
										<div className="relative language-dropdown">
											<button
												type="button"
												className="w-full flex items-center justify-between rounded-lg p-3 bg-gray-800/60 text-white border border-gray-600/50 focus:ring-2 focus:ring-gray-500/50 transition-all hover:bg-gray-700/60"
												onClick={() => setDropdownOpen(!dropdownOpen)}
											>
												<span className="flex items-center gap-3">
													<span className="text-lg">
														{i18n.language === "es" ? "🇲🇽" : "🇺🇸"}
													</span>
													{i18n.language === "es"
														? t("Settings.language.es")
														: t("Settings.language.en")}
												</span>
												<motion.svg
													aria-hidden="true"
													className="w-5 h-5"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
													animate={{ rotate: dropdownOpen ? 180 : 0 }}
													transition={{ duration: 0.2 }}
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M19 9l-7 7-7-7"
													/>
												</motion.svg>
											</button>

											<AnimatePresence>
												{dropdownOpen && (
													<motion.ul
														className="absolute z-20 mt-2 w-full bg-gray-900/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-700/50 py-2"
														initial={{ opacity: 0, y: -10, scale: 0.95 }}
														animate={{ opacity: 1, y: 0, scale: 1 }}
														exit={{ opacity: 0, y: -10, scale: 0.95 }}
														transition={{ duration: 0.2 }}
													>
														<LanguageOption
															lang="es"
															flag="🇲🇽"
															isSelected={i18n.language === "es"}
															onSelect={() => handleLanguageChange("es")}
														/>
														<LanguageOption
															lang="en"
															flag="🇺🇸"
															isSelected={i18n.language === "en"}
															onSelect={() => handleLanguageChange("en")}
														/>
													</motion.ul>
												)}
											</AnimatePresence>
										</div>
									</motion.div>
								)}

								{/* Contenido del paso */}
								<div className="text-center mb-8">
									<AnimatePresence mode="wait">
										<motion.div
											key={step}
											initial={{ x: 50, opacity: 0, scale: 0.95 }}
											animate={{ x: 0, opacity: 1, scale: 1 }}
											exit={{ x: -50, opacity: 0, scale: 0.95 }}
											transition={{ duration: 0.4, type: "spring" }}
											className="flex flex-col items-center"
										>
											{/* Icono del paso */}
											<motion.div
												className="mb-6 p-4 rounded-2xl bg-linear-to-br from-emerald-500/20 to-teal-600/20 text-emerald-400 border border-emerald-500/30"
												initial={{ scale: 0, rotate: -180 }}
												animate={{ scale: 1, rotate: 0 }}
												transition={{
													delay: 0.2,
													type: "spring",
													stiffness: 200,
												}}
											>
												{steps[step].icon}
											</motion.div>

											<h2 className="text-2xl font-bold mb-4 bg-linear-to-r from-gray-200 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
												{steps[step].title}
											</h2>
											<p className="text-gray-300 text-base leading-relaxed max-w-sm">
												{steps[step].description}
											</p>

											{/* Toggle de AutoStart */}
											{steps[step].showAutoStart && (
												<motion.div
													className="mt-6 w-full"
													initial={{ y: 20, opacity: 0 }}
													animate={{ y: 0, opacity: 1 }}
													transition={{ delay: 0.3 }}
												>
													<div className="flex items-center justify-between p-4 bg-gray-800/60 rounded-xl border border-gray-600/50 hover:border-emerald-500/30 transition-colors">
														<div className="flex items-center gap-3">
															<div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
																<svg
																	aria-hidden="true"
																	className="w-5 h-5 text-emerald-400"
																	fill="none"
																	stroke="currentColor"
																	viewBox="0 0 24 24"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={2}
																		d="M13 10V3L4 14h7v7l9-11h-7z"
																	/>
																</svg>
															</div>
															<span className="text-white font-medium">
																{t("Onboarding.step4.toggle")}
															</span>
														</div>
														<label className="relative inline-flex items-center cursor-pointer">
															<input
																type="checkbox"
																className="sr-only peer"
																checked={autoStartEnabled}
																onChange={handleAutoStartToggle}
															/>
															<div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600 shadow-inner"></div>
														</label>
													</div>
													<p className="text-xs text-gray-400 mt-2 text-center">
														{autoStartEnabled
															? t("Onboarding.step4.enabled")
															: t("Onboarding.step4.disabled")}
													</p>
												</motion.div>
											)}

											{/* Sección de Donación */}
											{steps[step].showDonation && (
												<motion.div
													className="mt-6 w-full"
													initial={{ y: 20, opacity: 0 }}
													animate={{ y: 0, opacity: 1 }}
													transition={{ delay: 0.3 }}
												>
													<motion.button
														onClick={handleOpenKofi}
														className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-linear-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 rounded-xl text-white font-semibold shadow-lg shadow-pink-500/25 transition-all"
														whileHover={{
															scale: 1.02,
															boxShadow:
																"0 20px 40px -10px rgba(236, 72, 153, 0.4)",
														}}
														whileTap={{ scale: 0.98 }}
													>
														<svg
															aria-hidden="true"
															className="w-6 h-6"
															viewBox="0 0 24 24"
															fill="currentColor"
														>
															<path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311z" />
														</svg>
														{t("Onboarding.step5.button")}
													</motion.button>
													<p className="text-xs text-gray-400 mt-3 text-center">
														{t("Onboarding.step5.optional")}
													</p>
												</motion.div>
											)}
										</motion.div>
									</AnimatePresence>
								</div>

								{/* Indicadores de pasos */}
								<div className="mb-8">
									<div className="flex justify-center gap-2 mb-4">
										{steps.map((_, idx) => (
											<motion.button
												key={String(idx)}
												onClick={() => setStep(idx)}
												className={`w-3 h-3 rounded-full transition-all ${
													idx === step
														? "bg-emerald-500 scale-125"
														: idx < step
															? "bg-emerald-500/50"
															: "bg-gray-600"
												}`}
												whileHover={{ scale: 1.3 }}
												whileTap={{ scale: 0.9 }}
											/>
										))}
									</div>
									<div className="h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden">
										<motion.div
											className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full"
											initial={false}
											animate={{
												width: `${((step + 1) / steps.length) * 100}%`,
											}}
											transition={{
												type: "spring",
												stiffness: 100,
												damping: 20,
											}}
										/>
									</div>
									<div className="mt-3 text-center text-sm text-white/50">
										{t("Onboarding.progress", {
											current: step + 1,
											total: steps.length,
										})}
									</div>
								</div>

								{/* Botones de navegación */}
								<div className="flex justify-between items-center gap-4">
									<motion.button
										className="flex-1 px-6 py-3 rounded-xl bg-gray-800/60 hover:bg-gray-700/60 border border-gray-600/50 text-gray-300 font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
										onClick={() => setStep((s) => Math.max(0, s - 1))}
										disabled={step === 0}
										whileHover={{ scale: step === 0 ? 1 : 1.02 }}
										whileTap={{ scale: step === 0 ? 1 : 0.98 }}
									>
										<svg
											className="w-4 h-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<title>Icono de flecha izquierda</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M15 19l-7-7 7-7"
											/>
										</svg>
										{t("Onboarding.prev")}
									</motion.button>

									<motion.button
										className="flex-1 px-8 py-3 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
										onClick={() => {
											if (isLast) {
												setShowOutro(true);
											} else {
												setStep((s) => Math.min(steps.length - 1, s + 1));
											}
										}}
										whileHover={{
											scale: 1.02,
											boxShadow: "0 20px 40px -10px rgba(16, 185, 129, 0.4)",
										}}
										whileTap={{ scale: 0.98 }}
									>
										{isLast ? t("Onboarding.finish") : t("Onboarding.next")}
										<svg
											className="w-4 h-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<title>Icono de flecha derecha</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d={isLast ? "M5 13l4 4L19 7" : "M9 5l7 7-7 7"}
											/>
										</svg>
									</motion.button>
								</div>
							</div>
						</motion.section>
					)}
				</AnimatePresence>
			</div>
		</main>
	);
}

interface LanguageOptionProps {
	lang: string;
	flag: string;
	isSelected: boolean;
	onSelect: () => void;
}

const LanguageOption = ({
	lang,
	flag,
	isSelected,
	onSelect,
}: LanguageOptionProps) => {
	const { t } = useTranslation();

	return (
		<motion.li
			className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-700/50 transition-colors ${
				isSelected ? "bg-gray-700/70 font-semibold" : ""
			}`}
			onClick={onSelect}
			whileHover={{ x: 5 }}
			whileTap={{ scale: 0.95 }}
		>
			<span className="text-lg">{flag}</span>
			<span>{t(`Settings.language.${lang}`)}</span>
			{isSelected && (
				<motion.svg
					aria-hidden="true"
					className="w-4 h-4 ml-auto text-gray-400"
					fill="currentColor"
					viewBox="0 0 20 20"
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ type: "spring" }}
				>
					<path
						fillRule="evenodd"
						d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
						clipRule="evenodd"
					/>
				</motion.svg>
			)}
		</motion.li>
	);
};
