export interface AppProps {
	showTourFirstTime?: boolean;
}

export interface AppState {
	loading: boolean;
	error: string | null;
	success: boolean;
}

export type NetworkSyncState =
	| "fineConnection"
	| "haveCautivePortal"
	| "invalidConnection"
	| "mobileConnection"
	| "mobileConnectionRequiereAuth";

export interface NetworkStatusPayload {
	connected: boolean;
	ssid: string | null;
	is_uabc: boolean;
	network_state: NetworkSyncState;
	status_text: string;
}
