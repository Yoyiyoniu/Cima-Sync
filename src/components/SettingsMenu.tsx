import { useEffect, useState } from "react";
import OptionsIcon from "../assets/icons/OptionsIcon"
import XIcon from "../assets/icons/XIcon"
import GithubIcon from "../assets/icons/GithubIcon";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Modal } from "./Modal";
import { removeDatabase } from "../controller/DbController";
import TrashIcon from "../assets/icons/TrashIcon";
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';

import { platform } from '@tauri-apps/plugin-os';
import { useTranslation } from "react-i18next";

export const SettingsMenu = () => {
    const { i18n, t } = useTranslation();

    const [isOpen, setIsOpen] = useState(false);
    const [showGithubModal, setShowGithubModal] = useState(false);
    const [showRemoveDatabaseModal, setShowRemoveDatabaseModal] = useState(false);
    const [autoRunEnabled, setAutoRunEnabled] = useState(false);
    const [currentPlatform, setCurrentPlatform] = useState<string>('');

    useEffect(() => {
        const loadInitialState = async () => {
            try {
                const enabled = await isEnabled();
                setAutoRunEnabled(enabled);

                const platformName = platform();
                setCurrentPlatform(platformName);
            } catch (error) {
                console.error('Error al cargar el estado inicial:', error);
                setAutoRunEnabled(false);
                setCurrentPlatform('unknown');
            }
        };
        loadInitialState();
    }, []);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                setShowGithubModal(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, []);

    const handleGithubRedirect = async () => {
        await openUrl('https://github.com/Yoyiyoniu/cima-sync');
    };

    const handleRemoveDatabase = async () => {
        await removeDatabase();
        window.location.reload();
    };

    const handleAutoRunToggle = async () => {
        try {
            if (autoRunEnabled) {
                await disable();
                setAutoRunEnabled(false);
            } else {
                await enable();
                setAutoRunEnabled(true);
            }
        } catch (error) {
            setAutoRunEnabled(!autoRunEnabled);
            console.error('Error al cambiar el estado del auto-run:', error);
        }
    };

    return (
        <>
            <button
                className="top-0 left-0 absolute bg-white/5 rounded-full p-2 hover:bg-white/20 transition-all duration-300 m-3"
                onClick={() => setIsOpen(!isOpen)}
            >
                <OptionsIcon width={30} height={30} className="text-white" />
            </button>

            {/* Overlay de fondo */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Modal de confirmación para GitHub */}
            {showGithubModal && (
                <Modal
                    title={t('Modal.github.title')}
                    modalText={t('Modal.github.description')}
                    setShowModal={setShowGithubModal}
                    handleModalFunction={handleGithubRedirect} />
            )}

            {/* Modal de confirmación para eliminar la base de datos */}

            {showRemoveDatabaseModal && (
                <Modal
                    title={t('Modal.removeDatabase.title')}
                    modalText={t('Modal.removeDatabase.description')}
                    setShowModal={setShowRemoveDatabaseModal}
                    handleModalFunction={handleRemoveDatabase} />
            )}

            {/* Panel deslizante */}
            <div
                className={`fixed top-0 left-0 h-full w-80 bg-white/10 backdrop-blur-md border-r border-white/20 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="p-6 h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-xl font-bold text-white">{t('Settings.title')}</h1>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            <XIcon />
                        </button>
                    </div>
                    {/* Selector de idioma */}
                    <div className="mb-4">
                        <label htmlFor="language-select" className="text-white/80 mr-2">{t('Settings.language')}</label>
                        <select
                            id="language-select"
                            className="rounded p-1 bg-white/10 text-white"
                            value={i18n.language}
                            onChange={e => i18n.changeLanguage(e.target.value)}
                        >
                            <option value="es">{t('Settings.language.es')}</option>
                            <option value="en">{t('Settings.language.en')}</option>
                        </select>
                    </div>

                    {/* Contenido del menú */}
                    <div className="flex-1 space-y-6">
                        {/* Sección de información */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-white">{t('Settings.appInfo.title')}</h2>
                            <div className="space-y-3 text-white/80">
                                <div>
                                    <p className="font-medium">{t('Settings.appInfo.name')}</p>
                                    <p className="text-sm">{t('Settings.appInfo.version')}</p>
                                </div>
                                <div>
                                    <p className="font-medium">{t('Settings.description')}</p>
                                    <p className="text-sm">{t('Settings.description')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Sección de configuración */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-white">{t('Settings.config.title')}</h2>
                            <div className="space-y-3">
                                {
                                    (currentPlatform === 'windows' || currentPlatform === 'macos') ?
                                        (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between w-full p-3 transition-colors duration-200 hover:bg-white/10 rounded-lg border border-white/10">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium text-sm">{t('Settings.autoRun.title')}</p>
                                                            <p className="text-white/60 text-xs">{t('Settings.autoRun.description')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                className="sr-only peer"
                                                                checked={autoRunEnabled}
                                                                onChange={handleAutoRunToggle}
                                                            />
                                                            <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        ) :
                                        (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between w-full p-3 transition-colors duration-200 hover:bg-white/10 rounded-lg border border-white/10">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium">{t('Settings.autoRun.title')}</p>
                                                            <p className="text-white/60 text-xs">{t('Settings.autoRun.description')}</p>
                                                        </div>
                                                    </div>
                                                    <span className="bg-green-500/20 text-green-400 text-xs font-semibold px-2 py-1 rounded-full border border-green-500/30">Beta</span>
                                                </div>
                                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                                    <div className="flex items-start gap-2">
                                                        <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <p className="text-blue-300 text-xs leading-relaxed">
                                                            {t('Settings.autoRun.description')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                }
                                {/* remove sqlite database */}
                                <button
                                    type="button"
                                    className="flex items-center justify-between cursor-pointer rounded-md w-full p-2 hover:bg-red-500/20 transition-colors duration-200"
                                    onClick={() => {
                                        setShowRemoveDatabaseModal(true);
                                    }}>
                                    <p className="text-white/80">{t('Settings.removeDatabase')}</p>
                                    <TrashIcon />
                                </button>
                            </div>
                        </div>

                        {/* Sección de ayuda */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-white">{t('Settings.help.title')}</h2>
                            <div className="space-y-2 text-white/80">
                                <p className="text-sm">• {t('Settings.help.description1')}</p>
                                <p className="text-sm">• {t('Settings.help.description2')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Github source code */}
                    <button
                        title="Abrir proyecto de github"
                        onClick={() => setShowGithubModal(true)}
                        className="p-2 mb-2 mt-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors duration-200 flex items-center gap-2">
                        <GithubIcon width={30} height={30} />
                        <p className="text-white/80 text-sm">{t('Settings.github')}</p>
                    </button>

                    {/* Footer */}
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
