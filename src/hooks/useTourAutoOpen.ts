import { useEffect } from "react";

type UseTourAutoOpenParams = {
	showTourFirstTime: boolean;
	setIsOpen: (isOpen: boolean) => void;
};

export const useTourAutoOpen = ({
	showTourFirstTime,
	setIsOpen,
}: UseTourAutoOpenParams) => {
	useEffect(() => {
		if (showTourFirstTime) {
			const timer = setTimeout(() => setIsOpen(true), 1000);
			return () => clearTimeout(timer);
		}
	}, [showTourFirstTime, setIsOpen]);
};
