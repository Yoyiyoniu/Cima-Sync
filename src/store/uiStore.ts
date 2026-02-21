import { create } from "zustand";

interface UiState {
	showSuccessModal: boolean;
	showCertificateAlert: boolean;
	showBugModal: boolean;
	openSuccessModal: () => void;
	closeSuccessModal: () => void;
	openCertificateAlert: () => void;
	closeCertificateAlert: () => void;
	openBugModal: () => void;
	closeBugModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
	showSuccessModal: false,
	showCertificateAlert: false,
	showBugModal: false,
	openSuccessModal: () => set({ showSuccessModal: true }),
	closeSuccessModal: () => set({ showSuccessModal: false }),
	openCertificateAlert: () => set({ showCertificateAlert: true }),
	closeCertificateAlert: () => set({ showCertificateAlert: false }),
	openBugModal: () => set({ showBugModal: true }),
	closeBugModal: () => set({ showBugModal: false }),
}));
