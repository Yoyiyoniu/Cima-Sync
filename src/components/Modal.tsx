import { useState } from "react";
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
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowModal(false);
        }, 280);
    };

    const handleConfirm = async () => {
        setIsClosing(true);
        setTimeout(async () => {
            try {
                await handleModalFunction();
            } catch (error) {
                console.error('Error en la función del modal:', error);
            }
            setShowModal(false);
        }, 280);
    };

    return (
        <>
            {
                showModal && <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-9999 flex items-center justify-center modal-backdrop ${isClosing ? 'modal-backdrop-closing' : ''}`}>
                    <div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 max-w-md mx-4 modal-content ${isClosing ? 'modal-content-closing' : ''}`}>
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
            }
        </>
    )
}
