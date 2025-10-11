import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { setLanguagePreference } from "../controller/DbController";

import cimaLogo from "../assets/img/cima_sync_logo.png";

interface OnboardingProps {
  onFinish: () => void | Promise<void>;
}

export function Onboarding({ onFinish }: OnboardingProps) {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [showOutro, setShowOutro] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen) {
        const target = event.target as Element;
        if (!target.closest('.language-dropdown')) {
          setDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      title: t("Onboarding.step1.title"),
      description: t("Onboarding.step1.description"),
      showLanguageSelector: true,
    },
    {
      title: t("Onboarding.step2.title"),
      description: t("Onboarding.step2.description"),
      showLanguageSelector: false,
    },
    {
      title: t("Onboarding.step3.title"),
      description: t("Onboarding.step3.description"),
      showLanguageSelector: false,
    },
  ];

  const isLast = step === steps.length - 1;

  return (
    <main className="min-h-screen w-full text-white bg-gradient-to-br from-gray-950 via-slate-900 to-black overflow-hidden relative">
      {/* Fondo animado */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-800/20 via-transparent to-gray-900/20 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-slate-800/10 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-800/10 rounded-full blur-3xl animate-pulse"></div>
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
                className="text-5xl font-bold mb-8 bg-gradient-to-r from-slate-300 to-gray-400 bg-clip-text text-transparent"
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
                transition={{ delay: 0.6, duration: 1, type: "spring", stiffness: 100 }}
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
                    rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                  }}
                />
                
                {/* Efecto de brillo */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
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
                className="mt-8 flex space-x-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
              >
                                 {[0, 1, 2].map((i) => (
                   <motion.div
                     key={i}
                     className="w-3 h-3 bg-gray-400 rounded-full"
                     animate={{
                       scale: [1, 1.5, 1],
                       opacity: [0.5, 1, 0.5],
                     }}
                     transition={{
                       duration: 1.5,
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.h2
                className="text-3xl font-bold mb-6 bg-gradient-to-r from-gray-300 to-slate-400 bg-clip-text text-transparent"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                {t("Onboarding.ready.title")}
              </motion.h2>
              
              <motion.img
                src={cimaLogo}
                alt="Cima Sync Logo"
                className="w-32 h-32 mb-6"
                initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                animate={{ 
                  scale: [0.5, 1.2, 1], 
                  opacity: [0, 1, 1], 
                  rotate: [-10, 5, 0] 
                }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                onAnimationComplete={() => {
                  setTimeout(() => onFinish(), 1000);
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
            </motion.div>
          ) : (
            <motion.section
              key="steps"
              className="relative w-full max-w-lg bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 overflow-hidden shadow-2xl shadow-black/50"
              initial={{ y: 30, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              {/* Fondo decorativo */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800/20 to-slate-800/20 rounded-2xl"></div>
              
              {/* Logo de fondo */}
              <motion.img
                src={cimaLogo}
                alt="Cima Sync Logo background"
                className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 opacity-10"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
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
                    <label htmlFor="language" className="block text-white/90 text-sm font-medium mb-3">
                      {t('Settings.language')}
                    </label>
                                         <div className="relative language-dropdown">
                       <button
                         type="button"
                         className="w-full flex items-center justify-between rounded-lg p-3 bg-gray-800/60 text-white border border-gray-600/50 focus:ring-2 focus:ring-gray-500/50 transition-all hover:bg-gray-700/60"
                         onClick={() => setDropdownOpen(!dropdownOpen)}
                       >
                        <span className="flex items-center gap-3">
                          <span className="text-lg">
                            {i18n.language === 'es' ? '🇲🇽' : '🇺🇸'}
                          </span>
                          {i18n.language === 'es' ? t('Settings.language.es') : t('Settings.language.en')}
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
                              isSelected={i18n.language === 'es'}
                              onSelect={() => handleLanguageChange('es')}
                            />
                            <LanguageOption
                              lang="en"
                              flag="🇺🇸"
                              isSelected={i18n.language === 'en'}
                              onSelect={() => handleLanguageChange('en')}
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
                    >
                                             <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-gray-300 to-slate-400 bg-clip-text text-transparent">
                         {steps[step].title}
                       </h2>
                       <p className="text-gray-300 text-lg leading-relaxed">
                         {steps[step].description}
                       </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Barra de progreso */}
                <div className="mb-8">
                                     <div className="h-2 w-full bg-gray-700/50 rounded-full overflow-hidden">
                     <motion.div
                       className="h-full bg-gradient-to-r from-gray-400 to-slate-500 rounded-full"
                       initial={false}
                       animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                       transition={{ type: "spring", stiffness: 100, damping: 20 }}
                     />
                   </div>
                  <div className="mt-3 text-center text-sm text-white/60">
                    {t("Onboarding.progress", { current: step + 1, total: steps.length })}
                  </div>
                </div>

                {/* Botones de navegación */}
                <div className="flex justify-between items-center">
                                     <motion.button
                     className="px-6 py-3 rounded-lg bg-gray-800/60 hover:bg-gray-700/60 border border-gray-600/50 text-gray-200 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                     onClick={() => setStep((s) => Math.max(0, s - 1))}
                     disabled={step === 0}
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                   >
                     {t("Onboarding.prev")}
                   </motion.button>
                   
                   <motion.button
                     className="px-8 py-3 rounded-lg bg-gradient-to-r from-gray-600 to-slate-700 hover:from-gray-700 hover:to-slate-800 text-white font-semibold shadow-lg transition-all"
                     onClick={() => {
                       if (isLast) {
                         setShowOutro(true);
                       } else {
                         setStep((s) => Math.min(steps.length - 1, s + 1));
                       }
                     }}
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                   >
                     {isLast ? t("Onboarding.finish") : t("Onboarding.next")}
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

const LanguageOption = ({ lang, flag, isSelected, onSelect }: LanguageOptionProps) => {
  const { t } = useTranslation();

  return (
         <motion.li
       className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-700/50 transition-colors ${
         isSelected ? 'bg-gray-700/70 font-semibold' : ''
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
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </motion.svg>
      )}
    </motion.li>
  );
};


