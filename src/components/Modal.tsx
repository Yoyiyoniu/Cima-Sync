import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import GithubIcon from "../assets/icons/GithubIcon";

interface ModalProps {
    modalText: string;
    title: string;
    showModal: boolean;
    setShowModal: (show: boolean) => void;
    handleModalFunction: () => void | Promise<void>;
}

export const Modal = ({ setShowModal, handleModalFunction, modalText, title, showModal }: ModalProps) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setIsOpen(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    const closeMs = 150;

    const handleClose = () => {
        setIsOpen(false);
        setIsClosing(true);
        setTimeout(() => setShowModal(false), closeMs);
    };

    const handleConfirm = async () => {
        setIsOpen(false);
        setIsClosing(true);
        setTimeout(async () => {
            try {
                await handleModalFunction();
            } catch (error) {
                console.error('Error en la función del modal:', error);
            }
            setShowModal(false);
        }, closeMs);
    };

    return (
        <>
            {showModal && (
                <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-9999 flex items-center justify-center transition-opacity duration-[150ms] ${isOpen ? "opacity-100" : "opacity-0"}`}>
                    <div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 max-w-md mx-4 t-modal${isOpen ? " is-open" : ""}${isClosing ? " is-closing" : ""}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <GithubIcon width={24} height={24} className="text-white" />
                            <h3 className="text-lg font-semibold text-white">{t(title)}</h3>
                        </div>
                        <p className="text-white/80 mb-6">
                            {t(modalText)}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                            >
                                {t('Modal.cancel')}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                            >
                                {t('Modal.continue')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
