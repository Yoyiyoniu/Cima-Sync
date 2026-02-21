import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

import {
	getRememberSessionConfig,
	initEncryption,
} from "../controller/DbController";

type Credentials = {
	email: string;
	password: string;
};

export const useAppBootstrap = () => {
	const [credentials, setCredentials] = useState<Credentials>({
		email: "",
		password: "",
	});
	const [rememberSession, setRememberSession] = useState(false);

	useEffect(() => {
		const bootstrap = async () => {
			try {
				await initEncryption();

				const remember = await getRememberSessionConfig();
				setRememberSession(remember);

				// Cargar credenciales desde el keyring seguro
				if (remember) {
					try {
						const storedCreds = await invoke<Credentials>("get_credentials");
						if (storedCreds?.email && storedCreds?.password) {
							setCredentials({
								email: storedCreds.email,
								password: storedCreds.password,
							});
						}
					} catch {
						// No hay credenciales guardadas, es normal
					}
				}
			} catch (_error) {
				console.error("Error loading configuration:");
			}
		};

		bootstrap();
	}, []);

	return { credentials, setCredentials, rememberSession, setRememberSession };
};
