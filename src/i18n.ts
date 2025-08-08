import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import es from "./i18n/es.json";
import en from "./i18n/en.json";

const resources = {
    es: {
        translation: es
    },
    en: {
        translation: en
    }
};

async function initializeI18n() {
    try {
        await i18n
            .use(initReactI18next)
            .init({
                resources,
                lng: 'es',
                fallbackLng: "es",
                interpolation: {
                    escapeValue: false
                }
            });
    } catch (error) {
        console.error("Error loading language settings:", error);
        await i18n
            .use(initReactI18next)
            .init({
                resources,
                lng: "es",
                fallbackLng: "es",
                interpolation: {
                    escapeValue: false
                }
            });
    }
}

initializeI18n();

export default i18n;