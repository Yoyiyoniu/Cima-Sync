import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

import cimaLogo from "../assets/img/cima_sync_logo.png";

interface OnboardingProps {
  onFinish: () => void | Promise<void>;
}

export function Onboarding({ onFinish }: OnboardingProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [showOutro, setShowOutro] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const steps = [
    {
      title: t("Onboarding.step1.title"),
      description: t("Onboarding.step1.description"),
    },
    {
      title: t("Onboarding.step2.title"),
      description: t("Onboarding.step2.description"),
    },
    {
      title: t("Onboarding.step3.title"),
      description: t("Onboarding.step3.description"),
    },
  ];

  const isLast = step === steps.length - 1;

  return (
    <main className="min-h-screen w-full text-white bg-gradient-to-r from-slate-900 via-gray-800 to-gray-900 overflow-hidden">
      <div className="min-h-screen flex items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {showIntro ? (
            <motion.div
              key="intro"
              className="flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.img
                src={cimaLogo}
                alt="Cima Sync Logo"
                className="w-[450px] h-[450px]"
                initial={{ y: -120, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 18, mass: 0.6, duration: 0.5 }}
                onAnimationComplete={() => {
                  // luego del primer bounce, agrandar y desvanecer
                }}
              />
              {/* Segundo efecto: escalar y desaparecer */}
              <motion.div
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 8, opacity: 0 }}
                transition={{ delay: 0.7, duration: 0.6, ease: "easeInOut" }}
                className="absolute w-20 h-20"
              />
            </motion.div>
          ) : showOutro ? (
            <motion.div
              key="outro"
              className="flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.img
                src={cimaLogo}
                alt="Cima Sync Logo"
                className="w-40 h-40"
                initial={{ scale: 0.7, opacity: 0, rotate: -4 }}
                animate={{ scale: [0.7, 1.15, 6], opacity: [0, 1, 0], rotate: [-4, 0, 0] }}
                transition={{ duration: 1.1, times: [0, 0.35, 1], ease: "easeInOut" }}
                onAnimationComplete={() => onFinish()}
              />
            </motion.div>
          ) : (
            <motion.section
              key="steps"
              className="relative w-full max-w-md bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-6 overflow-hidden shadow-lg shadow-black/20"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.35 }}
            >
              <motion.img
                src={cimaLogo}
                alt="Cima Sync Logo background"
                className="pointer-events-none absolute inset-0 m-auto w-[520px] h-[520px] opacity-20 saturate-150 contrast-125"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 0.2, y: [0, -6, 0, 6, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="flex flex-col items-center text-center">

                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ x: 40, opacity: 0, rotate: 1, scale: 0.98 }}
                    animate={{ x: 0, opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ x: -40, opacity: 0, rotate: -1, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h1 className="text-2xl font-semibold">{steps[step].title}</h1>
                    <p className="text-white/80 mt-2">{steps[step].description}</p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-6">
                <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500"
                    initial={false}
                    animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 18 }}
                  />
                </div>
                <div className="mt-2 text-center text-sm text-white/70">
                  {t("Onboarding.progress", { current: step + 1, total: steps.length })}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <motion.button
                  className="px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  whileTap={{ scale: 0.96 }}
                >
                  {t("Onboarding.prev")}
                </motion.button>
                <motion.button
                  className="px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    if (isLast) {
                      setShowOutro(true);
                    } else {
                      setStep((s) => Math.min(steps.length - 1, s + 1));
                    }
                  }}
                  whileTap={{ scale: 0.96 }}
                >
                  {isLast ? t("Onboarding.finish") : t("Onboarding.next")}
                </motion.button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}


