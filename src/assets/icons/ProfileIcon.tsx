import type { SVGProps } from "react";

const ProfileIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<title>Profile Icon</title>
		<circle cx="12" cy="8" r="4" />
		<path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
	</svg>
);

export default ProfileIcon;
