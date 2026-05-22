import { create } from "zustand";

interface UiState {
	showSuccessModal: boolean;
	showCertificateAlert: boolean;
	showBugModal: boolean;
	showSettingsMenu: boolean;
	showProfileModal: boolean;
	openSuccessModal: () => void;
	closeSuccessModal: () => void;
	openCertificateAlert: () => void;
	closeCertificateAlert: () => void;
	openBugModal: () => void;
	closeBugModal: () => void;
	openSettingsMenu: () => void;
	closeSettingsMenu: () => void;
	openProfileModal: () => void;
	closeProfileModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
	showSuccessModal: false,
	showCertificateAlert: false,
	showBugModal: false,
	showSettingsMenu: false,
	showProfileModal: false,
	openSuccessModal: () => set({ showSuccessModal: true }),
	closeSuccessModal: () => set({ showSuccessModal: false }),
	openCertificateAlert: () => set({ showCertificateAlert: true }),
	closeCertificateAlert: () => set({ showCertificateAlert: false }),
	openBugModal: () => set({ showBugModal: true }),
	closeBugModal: () => set({ showBugModal: false }),
	openSettingsMenu: () => set({ showSettingsMenu: true }),
	closeSettingsMenu: () => set({ showSettingsMenu: false }),
	openProfileModal: () => set({ showProfileModal: true }),
	closeProfileModal: () => set({ showProfileModal: false }),
}));
