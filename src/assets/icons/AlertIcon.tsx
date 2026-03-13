import type { SVGProps } from "react";

const AlertIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={24}
		height={24}
		fill="currentColor"
		viewBox="0 0 24 24"
		{...props}
	>
		<title>Alert Icon</title>
		<path fill="none" d="M0 0h24v24H0z" />
		<path d="M17 3.34A10 10 0 1 1 2 12l.005-.324A10 10 0 0 1 17 3.34M12 15a1 1 0 0 0-1 1v.01a1 1 0 0 0 2 0V16a1 1 0 0 0-1-1m0-7a1 1 0 0 0-1 1v4a1 1 0 0 0 2 0V9a1 1 0 0 0-1-1" />
	</svg>
);
export default AlertIcon;
