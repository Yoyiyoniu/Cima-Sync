import { useEffect, useState } from "react";

export const useShowApp = () => {
	const [showApp, setShowApp] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setShowApp(true), 100);
		return () => clearTimeout(timer);
	}, []);

	return { showApp };
};
