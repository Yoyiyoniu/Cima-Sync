import { useEffect } from "react";
import { useDeviceStore } from "../store/deviceStore";
import { useNetworkStore } from "../store/networkStore";

export const useNetworkStatus = () => {
	const isMobile = useDeviceStore((state) => state.isMobile);
	const isUabcConnected = useNetworkStore((state) => state.isUabcConnected);
	const startListening = useNetworkStore((state) => state.startListening);
	const stopListening = useNetworkStore((state) => state.stopListening);

	useEffect(() => {
		void startListening(isMobile);
		return () => stopListening();
	}, [isMobile, startListening, stopListening]);

	return { isUabcConnected };
};
