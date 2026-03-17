import { useEffect, useRef } from "react";
import { sileo } from "sileo";
import type { NetworkSyncState } from "../types";
import CimaSyncLogo from "../assets/icons/CimaSyncLogo";
import LoginIcon from "../assets/icons/LoginIcon";
import NoWifiIcon from "../assets/icons/NoWifiIcon";
import AlertIcon from "../assets/icons/AlertIcon";
import HandStopIcon from "../assets/icons/HandStopIcon";

type NetworkToastState = "fine" | "requiresLogin" | "noUabc";

type NetworkStatusToastPayload = {
	networkState: NetworkSyncState;
	statusText: string;
	ssid: string | null;
	showInternetToast?: boolean;
};

type NetworkStateToastPayload = {
	networkState: NetworkSyncState;
	isUabcConnected: boolean;
};

const TOAST_DEBUG =
	String(
		import.meta.env?.VITE_TOAST_DEBUG ??
			import.meta.env?.TOAST_DEBUG ??
			"false",
	).toLowerCase() === "true";

export const CIMA_SYNC_STOPPED_TOAST_DURATION = 5000;

export function showNetworkStatusToast({
	networkState,
	statusText,
	ssid,
	showInternetToast = false,
}: NetworkStatusToastPayload) {
	if (!TOAST_DEBUG) return;
	if (!networkState || !statusText) return;

	sileo.action({
		title: "Estado de la red",
		description: statusText,
		icon: <span aria-hidden="true">📡</span>,
		button: {
			title: "Ver detalles",
			onClick: () => {
				sileo.info({
					title: "Detalles de la red",
					description: (
						<div className="flex flex-col gap-1">
							<span>Estado: {statusText}</span>
							<span>SSID: {ssid ?? "No disponible"}</span>
							<span>Estado interno: {networkState}</span>
						</div>
					),
					icon: <span aria-hidden="true">ℹ️</span>,
				});
			},
		},
	});

	if (showInternetToast && networkState === "fineConnection") {
		showFineConnectionToast();
	}
}

const getNetworkToastState = ({
	networkState,
	isUabcConnected,
}: NetworkStateToastPayload): NetworkToastState | null => {
	if (!isUabcConnected) return "noUabc";
	if (networkState === "fineConnection") return "fine";
	return "requiresLogin";
};

export function showNetworkStateToast(payload: NetworkStateToastPayload) {
	const state = getNetworkToastState(payload);
	if (!state) return;

	switch (state) {
		case "fine":
			showFineConnectionToast();
			break;
		case "requiresLogin":
			showRequiereLoginToast();
			break;
		case "noUabc":
			showNoUabcConnectionToast();
			break;
	}
}

interface NetworkStateToastManagerProps {
	networkState: NetworkSyncState;
	isUabcConnected: boolean;
}

export function NetworkStateToastManager({
	networkState,
	isUabcConnected,
}: NetworkStateToastManagerProps) {
	const prevStateRef = useRef<NetworkToastState | null>(null);

	useEffect(() => {
		const nextState = getNetworkToastState({
			networkState,
			isUabcConnected,
		});
		if (!nextState || prevStateRef.current === nextState) return;

		showNetworkStateToast({ networkState, isUabcConnected });
		prevStateRef.current = nextState;
	}, [isUabcConnected, networkState]);

	return null;
}

// interface NetworkStatusToastManagerProps {
// 	networkState: NetworkSyncState;
// 	statusText: string;
// 	ssid: string | null;
// }

// export function NetworkStatusToastManager({
// 	networkState,
// 	statusText,
// 	ssid,
// }: NetworkStatusToastManagerProps) {
// 	const prevNetworkStateRef = useRef<string | null>(null);

// 	useEffect(() => {
// 		if (!networkState || !statusText) return;

// 		const prevNetworkState = prevNetworkStateRef.current;
// 		if (prevNetworkState === networkState) return;

// 		showNetworkStatusToast({
// 			networkState,
// 			statusText,
// 			ssid,
// 			showInternetToast:
// 				networkState === "fineConnection" &&
// 				prevNetworkState !== "fineConnection",
// 		});

// 		prevNetworkStateRef.current = networkState;
// 	}, [networkState, ssid, statusText]);

// 	return null;
// }

export function showCimaSyncActiveToast() {
	sileo.success({
		title: "Cima Sync está activo",
		description:
			"Si pierdes la red Cimarrón, te re conectaremos automáticamente.",
		icon: <CimaSyncLogo color="green" />,
	});
}

export function showFineConnectionToast() {
	sileo.success({
		title: "Internet listo",
		description: "Ya tienes conexión a internet Cimarrón.",
		icon: <CimaSyncLogo color="white" />,
	});
}

export function showRequiereLoginToast() {
	sileo.info({
		title: "Necesitamos iniciar sesión",
		description: "Inicia sesión para poder navegar en internet.",
		icon: <LoginIcon />,
	});
}

export function showNoUabcConnectionToast() {
	sileo.info({
		title: "No estás en la red UABC",
		description: "Conéctate a la red UABC para continuar.",
		icon: <NoWifiIcon />,
	});
}

export function showAuthErrorToast(message: string) {
	sileo.error({
		title: "No pudimos iniciar sesión",
		description: message,
		icon: <AlertIcon />,
	});
}

export function showCimaSyncStoppedToast() {
	sileo.info({
		title: "Cima Sync pausado",
		description: "Cima Sync está desactivado por ahora.",
		duration: CIMA_SYNC_STOPPED_TOAST_DURATION,
		icon: <HandStopIcon />,
	});
}
