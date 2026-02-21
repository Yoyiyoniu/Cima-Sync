import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";
import type { SetStateAction } from "react";

import {
	getRememberSessionConfig,
	initEncryption,
} from "../controller/DbController";

type Credentials = {
	email: string;
	password: string;
};

interface SessionState {
	credentials: Credentials;
	rememberSession: boolean;
	isBootstrapping: boolean;
	isBootstrapped: boolean;
	bootstrapError: string | null;
	setCredentials: (value: SetStateAction<Credentials>) => void;
	setRememberSession: (value: boolean) => void;
	bootstrap: () => Promise<void>;
}

const EMPTY_CREDENTIALS: Credentials = {
	email: "",
	password: "",
};

export const useSessionStore = create<SessionState>((set, get) => ({
	credentials: EMPTY_CREDENTIALS,
	rememberSession: false,
	isBootstrapping: false,
	isBootstrapped: false,
	bootstrapError: null,
	setCredentials: (value) => {
		set((state) => ({
			credentials:
				typeof value === "function"
					? (value as (prev: Credentials) => Credentials)(state.credentials)
					: value,
		}));
	},
	setRememberSession: (value) => set({ rememberSession: value }),
	bootstrap: async () => {
		const { isBootstrapping, isBootstrapped } = get();
		if (isBootstrapping || isBootstrapped) return;

		set({ isBootstrapping: true, bootstrapError: null });
		try {
			await initEncryption();

			const remember = await getRememberSessionConfig();
			set({ rememberSession: remember });

			if (remember) {
				try {
					const storedCreds = await invoke<Credentials>("get_credentials");
					if (storedCreds?.email && storedCreds?.password) {
						set({
							credentials: {
								email: storedCreds.email,
								password: storedCreds.password,
							},
						});
					}
				} catch {
					// No hay credenciales guardadas, es normal.
				}
			}

			set({ isBootstrapped: true });
		} catch (error) {
			set({ bootstrapError: String(error) });
			console.error("Error loading configuration:", error);
		} finally {
			set({ isBootstrapping: false });
		}
	},
}));
