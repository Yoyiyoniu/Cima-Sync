import { invoke } from "@tauri-apps/api/core";

interface ForceWifiProps {
	function: () => Promise<boolean>;
}

export const forceWifi = async ({ function: fun }: ForceWifiProps) => {
	await invoke("plugin:wifi-interface|bind_to_wifi");
	const result = await fun();
	if (!result) {
		throw new Error("Failed to force WiFi");
	}
	await invoke("plugin:wifi-interface|unbind_network");
};
