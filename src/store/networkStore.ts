import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { create } from "zustand";
import type { NetworkStatusPayload } from "../types";

type UnlistenFn = () => void;

interface NetworkState {
	statusText: string;
	networkState: NetworkStatusPayload["network_state"];
	ssid: string | null;
	isConnected: boolean;
	isUabcConnected: boolean;
	isListening: boolean;
	networkError: string | null;
	unlistenFns: UnlistenFn[];
	startListening: (_isMobile: boolean) => Promise<void>;
	stopListening: () => void;
}

const DEFAULT_NETWORK_STATUS: NetworkStatusPayload = {
	connected: false,
	ssid: null,
	is_uabc: false,
	network_state: "invalidConnection",
	status_text: "WI-FI Cimarrón No Disponible",
};

const normalizeNetworkState = (
	value: unknown,
): NetworkStatusPayload["network_state"] => {
	if (typeof value !== "string") return DEFAULT_NETWORK_STATUS.network_state;

	switch (value) {
		case "fineConnection":
		case "FineConnection":
			return "fineConnection";
		case "haveCautivePortal":
		case "HaveCautivePortal":
			return "haveCautivePortal";
		case "invalidConnection":
		case "InvalidConnection":
			return "invalidConnection";
		case "mobileConnection":
		case "MobileConnection":
			return "mobileConnection";
		case "mobileConnectionRequiereAuth":
		case "MobileConnectionRequiereAuth":
			return "mobileConnectionRequiereAuth";
		default:
			return DEFAULT_NETWORK_STATUS.network_state;
	}
};

const toNetworkStatusPayload = (payload: unknown): NetworkStatusPayload => {
	if (!payload || typeof payload !== "object") return DEFAULT_NETWORK_STATUS;

	const value = payload as Partial<NetworkStatusPayload>;

	return {
		connected: Boolean(value.connected),
		ssid: typeof value.ssid === "string" ? value.ssid : null,
		is_uabc: Boolean(value.is_uabc),
		network_state: normalizeNetworkState(value.network_state),
		status_text:
			typeof value.status_text === "string"
				? value.status_text
				: DEFAULT_NETWORK_STATUS.status_text,
	};
};

const applyNetworkStatus = (
	set: (partial: Partial<NetworkState>) => void,
	payload: unknown,
) => {
	const status = toNetworkStatusPayload(payload);
	set({
		isConnected: status.connected,
		ssid: status.ssid,
		isUabcConnected: status.is_uabc,
		networkState: status.network_state,
		statusText: status.status_text,
	});
};

export const useNetworkStore = create<NetworkState>((set, get) => ({
	statusText: DEFAULT_NETWORK_STATUS.status_text,
	networkState: DEFAULT_NETWORK_STATUS.network_state,
	ssid: DEFAULT_NETWORK_STATUS.ssid,
	isConnected: DEFAULT_NETWORK_STATUS.connected,
	isUabcConnected: false,
	isListening: false,
	networkError: null,
	unlistenFns: [],
	startListening: async (_isMobile) => {
		const { isListening, unlistenFns } = get();
		if (isListening || unlistenFns.length > 0) return;

		try {
			const unlistenStatus = await listen<NetworkStatusPayload>(
				"network-status",
				(event) => {
					applyNetworkStatus(set, event.payload);
				},
			);

			set({
				unlistenFns: [unlistenStatus],
				isListening: true,
				networkError: null,
			});

			try {
				const status = await invoke<NetworkStatusPayload>("get_network_status");
				applyNetworkStatus(set, status);
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
