import type { SVGProps } from "react";

const AutostartIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={24}
		height={24}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeLinecap="round"
		strokeLinejoin="round"
		strokeWidth={1.5}
		{...props}
	>
		<title>Auto Start Icon</title>
		<path d="M13 10V3L4 14h7v7l9-11h-7z" />
	</svg>
);

export default AutostartIcon;
