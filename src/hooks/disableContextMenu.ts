import { useEffect } from "react";

export const disableContextMenu = () => {
    useEffect(() => {
        function handleContextMenu(e: MouseEvent) {
            e.preventDefault();
        }

        document.addEventListener('contextmenu', handleContextMenu);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, []);
}