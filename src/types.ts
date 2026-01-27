export interface AppProps {
	showTourFirstTime?: boolean;
}

export interface AppState {
	loading: boolean;
	error: string | null;
	success: boolean;
}