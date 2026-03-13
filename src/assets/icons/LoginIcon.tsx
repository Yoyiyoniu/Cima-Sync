import type { SVGProps } from "react";

const LoginIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<title>Login Icon</title>
		<path stroke="none" d="M0 0h24v24H0z" />
		<path d="M15 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2" />
		<path d="M21 12H8l3-3M11 15l-3-3" />
	</svg>
);
export default LoginIcon;
