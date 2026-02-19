import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { create } from "zustand";

type UnlistenFn = () => void;

interface NetworkState {
	isUabcConnected: boolean;
	isListening: boolean;
	networkError: string | null;
	unlistenFns: UnlistenFn[];
	startListening: (isMobile: boolean) => Promise<void>;
	stopListening: () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
	isUabcConnected: false,
	isListening: false,
	networkError: null,
	unlistenFns: [],
	startListening: async (isMobile) => {
		const { isListening, unlistenFns } = get();
		if (isListening || unlistenFns.length > 0) return;

		if (isMobile) {
			set({ isUabcConnected: true, isListening: true, networkError: null });
			return;
		}

		try {
			const [unlistenUabc, unlistenStatus] = await Promise.all([
				listen("uabc-detected", () => {
					set({ isUabcConnected: true });
				}),
				listen("network-status", (event: any) => {
					const payload = event.payload;
					set({ isUabcConnected: !!payload?.is_uabc });
				}),
			]);

			set({
				unlistenFns: [unlistenUabc, unlistenStatus],
				isListening: true,
				networkError: null,
			});

			try {
				const status: any = await invoke("get_network_status");
				set({ isUabcConnected: !!status?.is_uabc });
			} catch (error) {
				set({ networkError: String(error) });
				console.error("Error fetching initial network status:", error);
			}
		} catch (error) {
			set({
				isListening: false,
				networkError: String(error),
				unlistenFns: [],
			});
			console.error("Error setting network listeners:", error);
		}
	},
	stopListening: () => {
		const { unlistenFns } = get();
		for (const unlisten of unlistenFns) {
			try {
				unlisten();
			} catch (error) {
				console.error("Error removing network listener:", error);
			}
		}
		set({ unlistenFns: [], isListening: false });
	},
}));
