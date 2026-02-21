import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

export const useNetworkStatus = () => {
	const [isUabcConnected, setIsUabcConnected] = useState(false);

	useEffect(() => {
		const setupNetworkListener = async () => {
			const unlisten = await listen("uabc-detected", async () => {
				console.log("UABC Network detected via event");
				setIsUabcConnected(true);
			});

			return unlisten;
		};

		const setupStatusListener = async () => {
			// 1. Listen for network status changes
			const unlisten = await listen("network-status", (event: any) => {
				const payload = event.payload;
				setIsUabcConnected(!!payload.is_uabc);
			});

			// 2. Check the current status if the initial event was already emitted
			try {
				const status: any = await invoke("get_network_status");
				setIsUabcConnected(!!status.is_uabc);
			} catch (error) {
				console.error("Error fetching initial network status:", error);
			}

			return unlisten;
		};

		let unlistenFn: (() => void) | undefined;
		let unlistenStatusFn: (() => void) | undefined;

		setupNetworkListener().then((fn) => {
			unlistenFn = fn;
		});
		setupStatusListener().then((fn) => {
			unlistenStatusFn = fn;
		});

		return () => {
			if (unlistenFn) unlistenFn();
			if (unlistenStatusFn) unlistenStatusFn();
		};
	}, []);

	return { isUabcConnected };
};
