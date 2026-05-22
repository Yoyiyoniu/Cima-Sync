import { addPluginListener, invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { create } from "zustand";
import type { NetworkStatusPayload } from "../types";

interface WifiEvent {
	event: "available" | "lost" | "capabilitiesChanged" | "unavailable";
	networkId?: number;
	hasInternet?: boolean;
	hasValidated?: boolean;
	ssid?: string;
	rssi?: number;
	linkSpeed?: number;
}

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
	startListening: async (isMobile) => {
		const { isListening, unlistenFns } = get();
		if (isListening || unlistenFns.length > 0) return;

		try {
			// Escucha los eventos de estado de red emitidos por Rust
			const unlistenStatus = await listen<NetworkStatusPayload>(
				"network-status",
				(event) => {
					applyNetworkStatus(set, event.payload);
				},
			);

			let unlistenWifi: UnlistenFn = () => {};

			if (isMobile) {
				let lastSsid: string | null | undefined = undefined;

				// ── Observer push (principal) ──────────────────────────────────
				// El NetworkCallback de Android dispara este evento en <50 ms.
				const pluginListener = await addPluginListener<WifiEvent>(
					"wifi-interface",
					"wifiStateChange",
					(event) => {
						const ssid =
							event.event === "capabilitiesChanged"
								? (event.ssid ?? null)
								: event.event === "lost" || event.event === "unavailable"
									? null
									: undefined; // "available" → esperar capabilitiesChanged

						if (ssid !== undefined && ssid !== lastSsid) {
							lastSsid = ssid;
							invoke("set_mobile_wifi_info", { ssid }).catch(() => {});
						}
					},
				);

				// ── Heartbeat de polling (fallback) ───────────────────────────
				// Sincroniza el SSID si el observer pierde algún evento.
				// 12 s es suficiente — el observer ya cubre el 99% de los casos.
				const pollId = setInterval(async () => {
					try {
						const wifiStatus = await invoke<{ isBound: boolean; ssid: string }>(
							"plugin:wifi-interface|get_wifi_status",
						);
						const ssid =
							wifiStatus.isBound && wifiStatus.ssid ? wifiStatus.ssid : null;
						if (ssid !== lastSsid) {
							lastSsid = ssid;
							await invoke("set_mobile_wifi_info", { ssid });
						}
					} catch {
						// silencioso — el observer sigue activo
					}
				}, 12_000);

				unlistenWifi = () => {
					pluginListener.unregister();
					clearInterval(pollId);
				};
			}

			set({
				unlistenFns: [unlistenStatus, unlistenWifi],
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
