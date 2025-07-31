import { useEffect, useState } from "react";
import OptionsIcon from "../assets/icons/OptionsIcon"
import XIcon from "../assets/icons/XIcon"
import GithubIcon from "../assets/icons/GithubIcon";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Modal } from "./Modal";


const appInfo = Object.freeze({
    name: "Cima Sync",
    version: "1.0.0",
    description: "Herramienta para automatizar el proceso de autenticación en el portal cautivo de UABC.",
    author: "Cima Sync",
    year: new Date().getFullYear(),
});

export const SettingsMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showGithubModal, setShowGithubModal] = useState(false);

    // Accessibility: Closeable by pressing escape or clicking outside
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
        setShowGithubModal(false);
        await openUrl('https://github.com/Yoyiyoniu/cima-sync');
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
                    title="Saldrás de la aplicación"
                    modalText="Serás redirigido a la página web de GitHub para ver el código fuente del proyecto. ¿Deseas continuar?"
                    setShowModal={setShowGithubModal}
                    handleModalRedirect={handleGithubRedirect} />
            )}

            {/* Panel deslizante */}
            <div
                className={`fixed top-0 left-0 h-full w-80 bg-white/10 backdrop-blur-md border-r border-white/20 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="p-6 h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-xl font-bold text-white">Ajustes</h1>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            <XIcon />
                        </button>
                    </div>

                    {/* Contenido del menú */}
                    <div className="flex-1 space-y-6">
                        {/* Sección de información */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-white">Información de la Aplicación</h2>
                            <div className="space-y-3 text-white/80">
                                <div>
                                    <p className="font-medium">{appInfo.name}</p>
                                    <p className="text-sm">Versión {appInfo.version}</p>
                                </div>
                                <div>
                                    <p className="font-medium">Descripción</p>
                                    <p className="text-sm">{appInfo.description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Sección de configuración */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-white">Configuración</h2>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <p className="text-white/80">Auto-inicio</p>
                                        <span className="bg-green-900 text-white text-xs font-bold px-2 py-1 rounded-full">Beta</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" />
                                        <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Sección de ayuda */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-white">Ayuda</h2>
                            <div className="space-y-2 text-white/80">
                                <p className="text-sm">• Olvídate de la contraseña de UABC, la aplicación la guarda por ti de forma segura</p>
                                <p className="text-sm">• La aplicación se conectará automáticamente a la red UABC</p>
                                <p className="text-sm">• Si tienes alguna duda o sugerencia, contacta al desarrollador</p>
                            </div>
                        </div>
                    </div>
                    {/* Github source code */}
                    <button
                        title="Abrir proyecto de github"
                        onClick={() => setShowGithubModal(true)}
                        className="p-2 mb-3 rounded-full bg-black/40 hover:bg-black/60 transition-colors duration-200 flex items-center gap-2">
                        <GithubIcon width={30} height={30} />
                        <p className="text-white/80 text-sm">Ver proyecto en Github</p>
                    </button>

                    {/* Footer */}
                    <div className="pt-6 border-t border-white/20">
                        <p className="text-xs text-white/60 text-center">
                            &copy; {appInfo.year} {appInfo.author}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
