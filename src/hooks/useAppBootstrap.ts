import { useEffect } from "react";
import { useSessionStore } from "../store/sessionStore";

export const useAppBootstrap = () => {
	const credentials = useSessionStore((state) => state.credentials);
	const setCredentials = useSessionStore((state) => state.setCredentials);
	const rememberSession = useSessionStore((state) => state.rememberSession);
	const setRememberSession = useSessionStore((state) => state.setRememberSession);
	const bootstrap = useSessionStore((state) => state.bootstrap);

	useEffect(() => {
		void bootstrap();
	}, [bootstrap]);

	return { credentials, setCredentials, rememberSession, setRememberSession };
};
