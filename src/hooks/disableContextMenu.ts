import { useEffect } from "react";

export const useDisableContextMenu = () => {
	useEffect(() => {
		function handleContextMenu(e: MouseEvent) {
			e.preventDefault();
		}

		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "F5") {
				e.preventDefault();
				return false;
			}
			if (e.ctrlKey && e.key === "r") {
				e.preventDefault();
				return false;
			}
			if (e.ctrlKey && e.shiftKey && e.key === "R") {
				e.preventDefault();
				return false;
			}
			if (e.key === "F12") {
				e.preventDefault();
				return false;
			}
		}

		document.addEventListener("contextmenu", handleContextMenu);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("contextmenu", handleContextMenu);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, []);
};