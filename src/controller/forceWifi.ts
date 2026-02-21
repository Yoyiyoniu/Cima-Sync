import { invoke } from "@tauri-apps/api/core";

interface ForceWifiProps {
	function: () => Promise<boolean>;
}

export const forceWifi = async ({ function: fun }: ForceWifiProps) => {
	await invoke<boolean>("force_wifi");
	const result = await fun();
	if (!result) {
		throw new Error("Failed to force WiFi");
	}
	await invoke<boolean>("release_wifi");
};
