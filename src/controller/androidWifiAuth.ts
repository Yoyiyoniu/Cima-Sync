import { invoke } from "@tauri-apps/api/core";

const UABC_5G = "UABC_5G";
const UABC_24G = "UABC_2.4G";
const VERIFY_DELAY_MS = 2000;

interface WifiStatus {
	isBound: boolean;
	ssid: string;
}

interface NetworkStatus {
	connected: boolean;
	network_state: string;
	is_uabc: boolean;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isValidSsid = (ssid: string | null | undefined): ssid is string =>
	Boolean(ssid && ssid !== "<unknown ssid>" && ssid !== "0x");

const syncMobileSsid = async (ssid: string | null) => {
	await invoke("set_mobile_wifi_info", { ssid });
};

const isUabcNetwork = (ssid: string): boolean => ssid.includes("UABC");

const getAlternateBandSsid = (currentSsid: string): string | null => {
	const ssid = currentSsid.trim();
	const upper = ssid.toUpperCase();

	if (upper.includes("5G") || ssid === UABC_5G) {
		return UABC_24G;
	}

	if (upper.includes("2.4") || upper.includes("2G") || ssid === UABC_24G) {
		return UABC_5G;
	}

	if (isUabcNetwork(ssid)) {
		return UABC_5G;
	}

	return null;
};

const getCurrentSsid = async (): Promise<string | null> => {
	const status = await invoke<WifiStatus>(
		"plugin:wifi-interface|get_wifi_status",
	);
	const ssid = status.isBound && status.ssid ? status.ssid : null;
	return isValidSsid(ssid) ? ssid : null;
};

const connectToSsid = async (ssid: string): Promise<void> => {
	const result = await invoke<{ connected: boolean }>(
		"plugin:wifi-interface|connect_to_network",
		{ ssid },
	);
	if (!result.connected) {
		throw new Error(`No se pudo conectar a la red ${ssid}`);
	}
	await syncMobileSsid(ssid);
};

const bindWifi = () => invoke("plugin:wifi-interface|bind_to_wifi");
const unbindWifi = () => invoke("plugin:wifi-interface|unbind_network");

const verifyWifiConnection = async (expectedSsid: string): Promise<boolean> => {
	await sleep(VERIFY_DELAY_MS);

	const wifiStatus = await invoke<WifiStatus>(
		"plugin:wifi-interface|get_wifi_status",
	);
	if (!isValidSsid(wifiStatus.ssid)) {
		return false;
	}

	await syncMobileSsid(wifiStatus.ssid);

	const networkStatus = await invoke<NetworkStatus>("get_network_status");
	const onExpectedNetwork = wifiStatus.ssid === expectedSsid;

	return (
		onExpectedNetwork &&
		networkStatus.connected &&
		networkStatus.is_uabc &&
		(networkStatus.network_state === "fineConnection" ||
			networkStatus.network_state === "FineConnection")
	);
};

interface AndroidWifiAuthProps {
	login: () => Promise<unknown>;
}

export const androidWifiAuth = async ({ login }: AndroidWifiAuthProps) => {
	const originalSsid = await getCurrentSsid();

	if (!originalSsid || !isUabcNetwork(originalSsid)) {
		console.log(
			"[android-auth] Red no UABC detectada, usando bind_to_wifi estándar",
		);
		await bindWifi();
		try {
			await login();
		} finally {
			await unbindWifi();
		}
		return;
	}

	const targetSsid = getAlternateBandSsid(originalSsid);
	if (!targetSsid) {
		throw new Error("No se pudo determinar la red alternativa UABC");
	}

	console.log(
		`[android-auth] Red UABC: ${originalSsid} → cambiando a ${targetSsid}`,
	);

	await connectToSsid(targetSsid);

	await bindWifi();
	try {
		await login();
	} finally {
		await unbindWifi();
	}

	console.log(
		`[android-auth] Autenticado en ${targetSsid} → regresando a ${originalSsid}`,
	);

	await connectToSsid(originalSsid);
	await unbindWifi();

	const verified = await verifyWifiConnection(originalSsid);
	if (verified) {
		console.log("Autenticado Modo Cima Sync Correctamente");
	} else {
		console.warn(
			"[android-auth] Verificación WiFi post-reconexión sin conexión confirmada",
		);
	}
};
