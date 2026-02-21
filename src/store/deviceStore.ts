import { platform } from "@tauri-apps/plugin-os";
import { create } from "zustand";

type DevicePlatform =
	| "linux"
	| "macos"
	| "windows"
	| "android"
	| "ios"
	| "unknown";

interface DeviceState {
	platform: DevicePlatform;
	isMobile: boolean;
	isDesktop: boolean;
	refreshPlatform: () => void;
}

const resolvePlatform = (): DevicePlatform => {
	try {
		const currentPlatform = platform();
		if (
			currentPlatform === "linux" ||
			currentPlatform === "macos" ||
			currentPlatform === "windows" ||
			currentPlatform === "android" ||
			currentPlatform === "ios"
		) {
			return currentPlatform;
		}
		return "unknown";
	} catch {
		return "unknown";
	}
};

const getPlatformState = (currentPlatform: DevicePlatform) => ({
	platform: currentPlatform,
	isMobile: currentPlatform === "android" || currentPlatform === "ios",
	isDesktop:
		currentPlatform === "linux" ||
		currentPlatform === "macos" ||
		currentPlatform === "windows",
});

export const useDeviceStore = create<DeviceState>((set) => ({
	...getPlatformState(resolvePlatform()),
	refreshPlatform: () => {
		const currentPlatform = resolvePlatform();
		set(getPlatformState(currentPlatform));
	},
}));
