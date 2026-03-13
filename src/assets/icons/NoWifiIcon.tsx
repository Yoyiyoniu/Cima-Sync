import type { SVGProps } from "react";

const NoWifiIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={24}
		height={24}
		fill="none"
		stroke="currentColor"
		strokeLinecap="round"
		strokeLinejoin="round"
		strokeWidth={2}
		viewBox="0 0 24 24"
		{...props}
	>
		<title>No Wifi Icon</title>
		<path stroke="none" d="M0 0h24v24H0z" />
		<path d="M12 18h.01M9.172 15.172a4 4 0 0 1 5.656 0M6.343 12.343a7.963 7.963 0 0 1 3.864-2.14m4.163.155a7.965 7.965 0 0 1 3.287 2M3.515 9.515A12 12 0 0 1 7.059 7.06m3.101-.92a12 12 0 0 1 10.325 3.374M3 3l18 18" />
	</svg>
);
export default NoWifiIcon;
