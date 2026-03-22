import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";

import cimaLogo from "../assets/img/cima-sync-logo.avif";
import {
	setLanguagePreference,
	setHasSeenOnboarding,
} from "../controller/DbController";
import { useDeviceStore } from "../store/deviceStore";

import LanguageIcon from "../assets/icons/LanguageIcon";
import AutostartIcon from "../assets/icons/AutostartIcon";
import SessionIcon from "../assets/icons/SessionIcon";
import PrivacyIcon from "../assets/icons/PrivacyIcon";

const fadeIn = {
	initial: { opacity: 0 },
	animate: { opacity: 1 },
	exit: { opacity: 0 },
};

const slideIn = {
	initial: { x: 30, opacity: 0 },
	animate: { x: 0, opacity: 1 },
	exit: { x: -30, opacity: 0 },
};

export function Onboarding() {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const [step, setStep] = useState(0);
	const [showIntro, setShowIntro] = useState(true);
	const [showOutro, setShowOutro] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [autoStartEnabled, setAutoStartEnabled] = useState(false);
	const isDesktop = useDeviceStore((state) => state.isDesktop);
	const finishCalledRef = useRef(false);

	useEffect(() => {
		const timer = setTimeout(() => setShowIntro(false), 3000);
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		if (!isDesktop) return;
		isEnabled().then(setAutoStartEnabled).catch(console.error);
	}, [isDesktop]);

	const handleAutoStartToggle = useCallback(async () => {
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
	}, [autoStartEnabled]);

	const handleFinish = useCallback(async () => {
		if (finishCalledRef.current) return;
		finishCalledRef.current = true;
		await setHasSeenOnboarding(true);
		navigate("/app?tour=true", { replace: true });
	}, [navigate]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (!dropdownOpen) return;
			const target = event.target as Element;
			if (!target.closest(".language-dropdown")) setDropdownOpen(false);
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [dropdownOpen]);

	const handleLanguageChange = useCallback(
		async (language: string) => {
			try {
				await i18n.changeLanguage(language);
				await setLanguagePreference(language);
				setDropdownOpen(false);
			} catch (error) {
				console.error("Error saving language:", error);
			}
		},
		[i18n],
	);
	const steps = [
		{
			id: "language",
			title: t("Onboarding.step1.title"),
			description: t("Onboarding.step1.description"),
			icon: <LanguageIcon aria-hidden="true" className="w-12 h-12" />,
			showLanguageSelector: true,
		},
		...(isDesktop
			? [
					{
						id: "autostart",
						title: t("Onboarding.step4.title"),
						description: t("Onboarding.step4.description"),
						icon: <AutostartIcon aria-hidden="true" className="w-12 h-12" />,
						showAutoStart: true,
					},
				]
			: []),
		{
			id: "session",
			title: t("Onboarding.step2.title"),
			description: t("Onboarding.step2.description"),
			icon: <SessionIcon aria-hidden="true" className="w-12 h-12" />,
		},
		{
			id: "privacy",
			title: t("Onboarding.step3.title"),
			description: t("Onboarding.step3.description"),
			icon: <PrivacyIcon aria-hidden="true" className="w-12 h-12" />,
		},
	];

	const isLast = step === steps.length - 1;

	return (
		<main className="min-h-screen w-full text-white bg-linear-to-br from-gray-950 via-slate-950 to-gray-900 overflow-hidden relative">
			{/* Fondo estático — sin animaciones de blur en mobile */}
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
				<div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
			</div>

			<div className="min-h-screen flex items-center justify-center px-6 relative z-10">
				<AnimatePresence mode="wait">
					{showIntro ? (
						<motion.div
							key="intro"
							className="flex flex-col items-center justify-center text-center"
							{...fadeIn}
							transition={{ duration: 0.4 }}
						>
							<motion.h1
								className="text-5xl font-bold mb-8 bg-linear-to-r from-slate-300 to-gray-400 bg-clip-text text-transparent"
								initial={{ y: -30, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								transition={{ delay: 0.2, duration: 0.5 }}
							>
								{t("Onboarding.welcome.title")}
							</motion.h1>

							<motion.p
								className="text-xl text-gray-300 mb-12 max-w-md"
								initial={{ y: -20, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								transition={{ delay: 0.35, duration: 0.5 }}
							>
								{t("Onboarding.welcome.subtitle")}
							</motion.p>

							<motion.img
								src={cimaLogo}
								alt="Cima Sync Logo"
								className="w-48 h-48 drop-shadow-2xl"
								initial={{ scale: 0.85, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								transition={{ delay: 0.5, duration: 0.6 }}
							/>

							<motion.div
								className="mt-8 flex space-x-3"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 1.2, duration: 0.4 }}
							>
								{[0, 1, 2].map((i) => (
									<motion.div
										key={i}
										className="w-3 h-3 bg-emerald-400 rounded-full"
										animate={{ opacity: [0.4, 1, 0.4] }}
										transition={{
											duration: 1.2,
											repeat: Infinity,
											delay: i * 0.2,
										}}
									/>
								))}
							</motion.div>
						</motion.div>
					) : showOutro ? (
						<motion.div
							key="outro"
							className="flex flex-col items-center justify-center text-center"
							{...fadeIn}
							transition={{ duration: 0.3 }}
						>
							<motion.div
								className="mb-6 p-6 rounded-full bg-linear-to-br from-emerald-500/30 to-teal-600/30 border-2 border-emerald-500/50"
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ type: "spring", stiffness: 180, damping: 18 }}
							>
								<svg
									aria-hidden="true"
									className="w-16 h-16 text-emerald-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<motion.path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2.5}
										d="M5 13l4 4L19 7"
										initial={{ pathLength: 0 }}
										animate={{ pathLength: 1 }}
										transition={{ delay: 0.3, duration: 0.5 }}
									/>
								</svg>
							</motion.div>

							<motion.h2
								className="text-3xl font-bold mb-4 bg-linear-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent"
								initial={{ y: -20, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								transition={{ delay: 0.2, duration: 0.5 }}
							>
								{t("Onboarding.ready.title")}
							</motion.h2>

							<motion.img
								src={cimaLogo}
								alt="Cima Sync Logo"
								className="w-28 h-28 mb-4"
								initial={{ scale: 0.6, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								transition={{ duration: 0.7, ease: "easeOut" }}
								onAnimationComplete={() => setTimeout(handleFinish, 800)}
							/>

							<motion.p
								className="text-lg text-gray-300"
								initial={{ y: 15, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								transition={{ delay: 0.4, duration: 0.5 }}
							>
								{t("Onboarding.ready.subtitle")}
							</motion.p>
						</motion.div>
					) : (
						<motion.section
							key="steps"
							className="relative w-full max-w-lg bg-gray-900/90 backdrop-blur-sm border border-emerald-500/20 rounded-3xl p-8 overflow-hidden shadow-2xl shadow-emerald-500/5"
							initial={{ y: 20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ duration: 0.4 }}
						>
							{/* Fondo decorativo estático */}
							<div className="absolute inset-0 bg-linear-to-br from-emerald-900/10 via-transparent to-teal-900/10 rounded-3xl pointer-events-none" />
							<div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-emerald-500/50 to-transparent pointer-events-none" />

							<div className="relative z-10">
								{/* Selector de idioma */}
								{steps[step].showLanguageSelector && (
									<motion.div
										className="mb-6"
										initial={{ y: -15, opacity: 0 }}
										animate={{ y: 0, opacity: 1 }}
										transition={{ delay: 0.15, duration: 0.4 }}
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
												className="w-full flex items-center justify-between rounded-lg p-3 bg-gray-800/60 text-white border border-gray-600/50 focus:ring-2 focus:ring-gray-500/50 transition-colors hover:bg-gray-700/60"
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
														className="absolute z-20 mt-2 w-full bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 py-2"
														initial={{ opacity: 0, y: -8 }}
														animate={{ opacity: 1, y: 0 }}
														exit={{ opacity: 0, y: -8 }}
														transition={{ duration: 0.15 }}
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
											{...slideIn}
											transition={{ duration: 0.25 }}
											className="flex flex-col items-center"
										>
											<div className="mb-6 p-4 rounded-2xl bg-linear-to-br from-emerald-500/20 to-teal-600/20 text-emerald-400 border border-emerald-500/30">
												{steps[step].icon}
											</div>

											<h2 className="text-2xl font-bold mb-4 bg-linear-to-r from-gray-200 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
												{steps[step].title}
											</h2>
											<p className="text-gray-300 text-base leading-relaxed max-w-sm">
												{steps[step].description}
											</p>

											{/* Toggle AutoStart */}
											{"showAutoStart" in steps[step] &&
												steps[step].showAutoStart && (
													<motion.div
														className="mt-6 w-full"
														initial={{ y: 15, opacity: 0 }}
														animate={{ y: 0, opacity: 1 }}
														transition={{ delay: 0.2 }}
													>
														<div className="flex items-center justify-between p-4 bg-gray-800/60 rounded-xl border border-gray-600/50 hover:border-emerald-500/30 transition-colors">
															<div className="flex items-center gap-3">
																<div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
																	<AutostartIcon
																		aria-hidden="true"
																		className="w-5 h-5 text-emerald-400"
																	/>
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
																<div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600 shadow-inner" />
															</label>
														</div>
														<p className="text-xs text-gray-400 mt-2 text-center">
															{autoStartEnabled
																? t("Onboarding.step4.enabled")
																: t("Onboarding.step4.disabled")}
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
											<button
												key={String(idx)}
												type="button"
												onClick={() => setStep(idx)}
												className={`w-3 h-3 rounded-full transition-all ${
													idx === step
														? "bg-emerald-500 scale-125"
														: idx < step
															? "bg-emerald-500/50"
															: "bg-gray-600"
												}`}
											/>
										))}
									</div>
									<div className="h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden">
										<motion.div
											className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full"
											animate={{
												width: `${((step + 1) / steps.length) * 100}%`,
											}}
											transition={{ duration: 0.3, ease: "easeOut" }}
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
									<button
										type="button"
										className="flex-1 px-6 py-3 rounded-xl bg-gray-800/60 hover:bg-gray-700/60 active:scale-95 border border-gray-600/50 text-gray-300 font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
										onClick={() => setStep((s) => Math.max(0, s - 1))}
										disabled={step === 0}
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
									</button>

									<button
										type="button"
										className="flex-1 px-8 py-3 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
										onClick={() => {
											if (isLast) setShowOutro(true);
											else setStep((s) => Math.min(steps.length - 1, s + 1));
										}}
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
									</button>
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
		<li
			className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-700/50 active:bg-gray-700/70 transition-colors ${isSelected ? "bg-gray-700/70 font-semibold" : ""}`}
			onClick={onSelect}
			onKeyDown={(e) => e.key === "Enter" && onSelect()}
		>
			<span className="text-lg">{flag}</span>
			<span>{t(`Settings.language.${lang}`)}</span>
			{isSelected && (
				<svg
					aria-hidden="true"
					className="w-4 h-4 ml-auto text-gray-400"
					fill="currentColor"
					viewBox="0 0 20 20"
				>
					<path
						fillRule="evenodd"
						d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
						clipRule="evenodd"
					/>
				</svg>
			)}
		</li>
	);
};
