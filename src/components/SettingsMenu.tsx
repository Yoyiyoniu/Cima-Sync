import { useEffect, useState } from "react";
import OptionsIcon from "../assets/icons/OptionsIcon"
import XIcon from "../assets/icons/XIcon"
import GithubIcon from "../assets/icons/GithubIcon";
import TrashIcon from "../assets/icons/TrashIcon";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Modal } from "./Modal";
import { removeDatabase } from "../controller/DbController";
import { platform } from '@tauri-apps/plugin-os';
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "./SettingsMenu/LanguageSelector";
import { AutoStartConfig } from "./SettingsMenu/AutoStartConfig";
import { TourButton } from "./SettingsMenu/TourButton";

import CoffeeIcon from "../assets/icons/CoffeeIcon";

export const SettingsMenu = () => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [showGithubModal, setShowGithubModal] = useState(false);
    const [showRemoveDatabaseModal, setShowRemoveDatabaseModal] = useState(false);
    const [showCoffeeModal, setShowCoffeeModal] = useState(false);
    const [currentPlatform, setCurrentPlatform] = useState<string>('');


    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                setShowGithubModal(false);
                setShowCoffeeModal(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, []);

    useEffect(() => {
        const loadInitialState = () => {
            try {
                const platformName = platform();
                setCurrentPlatform(platformName);
            } catch (error) {
                console.error('Error al cargar la plataforma:', error);
                setCurrentPlatform('unknown');
            }
        };
        loadInitialState();
    }, []);

    const handleGithubRedirect = async () => {
        await openUrl('https://github.com/Yoyiyoniu/cima-sync');
    };

    const handleCoffeeRedirect = async () => {
        await openUrl(t("support.koFiUrl"));
    };

    const handleRemoveDatabase = async () => {
        await removeDatabase();
        window.location.reload();
    };

    return (
        <>
            <button
                type="button"
                className="top-0 left-0 absolute bg-white/5 rounded-full p-2 hover:bg-white/20 transition-all duration-300 m-3"
                onClick={() => setIsOpen(!isOpen)}
            >
                <OptionsIcon width={30} height={30} className="text-white" />
            </button>
            <button
                type="button"
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 ${isOpen ? 'block' : 'hidden'}`}
                onClick={() => setIsOpen(false)}
            />

            <Modal
                showModal={showGithubModal}
                title={t('Modal.github.title')}
                modalText={t('Modal.github.description')}
                setShowModal={setShowGithubModal}
                handleModalFunction={handleGithubRedirect} />

            <Modal
                showModal={showCoffeeModal}
                title={t('Modal.coffee.title')}
                modalText={t('Modal.coffee.description')}
                setShowModal={setShowCoffeeModal}
                handleModalFunction={handleCoffeeRedirect} />

            <Modal
                showModal={showRemoveDatabaseModal}
                title={t('Modal.removeDatabase.title')}
                modalText={t('Modal.removeDatabase.description')}
                setShowModal={setShowRemoveDatabaseModal}
                handleModalFunction={handleRemoveDatabase} />
            <div
                className={`fixed top-0 left-0 h-full w-80 bg-white/10 backdrop-blur-md border-r border-white/20 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-xl font-bold text-white">{t('Settings.title')}</h1>
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
                        title={t('App.buyCoffee')}
                        onClick={() => {
                            setShowCoffeeModal(true);
                        }}
                        className="group relative mb-4 overflow-hidden rounded-lg bg-linear-to-r from-amber-500/20 via-amber-600/20 to-amber-500/20 border border-amber-500/40 hover:border-amber-400/60 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20 p-3 w-full">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <CoffeeIcon />
                                <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-white font-medium text-sm">{t('App.buyCoffee')}</p>
                                <p className="text-amber-300/70 text-xs mt-0.5">{t('App.supportDevelopment')}</p>
                            </div>
                            <svg className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <title>Arrow</title>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </button>
                    <div className="flex-1 space-y-6">
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-white">{t('Settings.appInfo.title')}</h2>
                            <div className="space-y-3 text-white/80">
                                <div>
                                    <p className="font-medium">{t('Settings.appInfo.name')}</p>
                                    <p className="text-sm">{t('Settings.appInfo.version')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-white">{t('Settings.config.title')}</h2>
                            <div className="space-y-3">
                                {(currentPlatform === 'windows' || currentPlatform === 'macos' || currentPlatform === 'linux') && <AutoStartConfig />}
                                <button
                                    type="button"
                                    className="flex items-center justify-between cursor-pointer rounded-md w-full p-2 hover:bg-red-500/20 transition-colors duration-200"
                                    onClick={() => {
                                        setShowRemoveDatabaseModal(true);
                                    }}>
                                    <p className="text-white/80">{t('Settings.removeDatabase')}</p>
                                    <TrashIcon />
                                </button>

                                {/* Separación */}
                                <div className="border-t border-white/20 my-4"></div>

                                <TourButton onClose={() => setIsOpen(false)} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-white">{t('Settings.help.title')}</h2>
                            <div className="space-y-2 text-white/80">
                                <p className="text-sm">• {t('Settings.help.description1')}</p>
                                <p className="text-sm">• {t('Settings.help.description2')}</p>
                            </div>
                        </div>
                    </div>
                    <LanguageSelector />
                    <button
                        type="button"
                        title="Abrir proyecto de github"
                        onClick={() => setShowGithubModal(true)}
                        className="p-2 mb-2 mt-2 rounded-md bg-black/40 hover:bg-black/60 transition-colors duration-200 flex items-center gap-2 w-full">
                        <GithubIcon width={30} height={30} />
                        <p className="text-white/80 text-sm">{t('Settings.github')}</p>
                    </button>
                    <div className="pt-6 border-t border-white/20">
                        <p className="text-xs text-white/60 text-center">
                            &copy; {new Date().getFullYear()} {t('Settings.appInfo.name')}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
