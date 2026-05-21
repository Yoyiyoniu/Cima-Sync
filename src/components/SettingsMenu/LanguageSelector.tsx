import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { setLanguagePreference } from "../../controller/DbController";

export const LanguageSelector = () => {
    const { i18n, t } = useTranslation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownClosing, setDropdownClosing] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const closeDropdown = useCallback(() => {
        setDropdownClosing(true);
        setTimeout(() => {
            setDropdownOpen(false);
            setDropdownClosing(false);
        }, 150);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                closeDropdown();
            }
        }
        if (dropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownOpen, closeDropdown]);

    const handleLanguageChange = async (language: string) => {
        try {
            await i18n.changeLanguage(language);
            await setLanguagePreference(language);
            closeDropdown();
        } catch (error) {
            console.error("Error saving language:", error);
        }
    };

    const toggleDropdown = () => {
        if (dropdownOpen && !dropdownClosing) {
            closeDropdown();
        } else if (!dropdownOpen) {
            setDropdownOpen(true);
        }
    };

    return (
        <div className="mb-4">
            <label className="text-white/80 mr-2 flex items-center gap-2">
                {t('Settings.language')}
                <span role="img" aria-label={i18n.language === 'es' ? 'Español' : 'English'}>
                    {i18n.language === 'es' ? '🇲🇽' : '🇺🇸'}
                </span>
            </label>
            <div className="relative inline-block w-full" ref={dropdownRef}>
                <button
                    type="button"
                    className="w-full flex items-center justify-between rounded p-2 bg-white/10 text-white border border-white/20 focus:ring-2 focus:ring-blue-500 transition-all"
                    onClick={toggleDropdown}
                    aria-haspopup="listbox"
                    aria-expanded={dropdownOpen}
                >
                    <span className="flex items-center gap-2">
                        {i18n.language === 'es' ? '🇲🇽 ' : '🇺🇸 '}
                        {i18n.language === 'es' ? t('Settings.language.es') : t('Settings.language.en')}
                    </span>
                    <svg
                        className={`w-4 h-4 ml-2 transition-transform duration-200 ${dropdownOpen && !dropdownClosing ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {(dropdownOpen || dropdownClosing) && (
                    <ul
                        className={`t-dropdown absolute z-10 mt-2 w-full bg-black/90 backdrop-blur-md rounded shadow-lg border border-white/20 py-1${dropdownOpen && !dropdownClosing ? " is-open" : ""}${dropdownClosing ? " is-closing" : ""}`}
                        data-origin="top-center"
                        role="listbox"
                        tabIndex={-1}
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
                    </ul>
                )}
            </div>
        </div>
    );
};

interface LanguageOptionProps {
    lang: string;
    flag: string;
    isSelected: boolean;
    onSelect: () => void;
}

const LanguageOption = ({ lang, flag, isSelected, onSelect }: LanguageOptionProps) => {
    const { t } = useTranslation();

    return (
        <li
            className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-blue-500/20 transition-colors ${isSelected ? 'font-bold' : ''}`}
            role="option"
            aria-selected={isSelected}
            tabIndex={0}
            onClick={onSelect}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
        >
            <span role="img" aria-label={lang === 'es' ? 'Español' : 'English'}>{flag}</span>
            {t(`Settings.language.${lang}`)}
        </li>
    );
};
