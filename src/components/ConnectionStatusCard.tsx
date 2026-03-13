import WifiIcon from "../assets/icons/WifiIcon";
import type { NetworkSyncState } from "../types";

interface ConnectionStatusCardProps {
	networkState: NetworkSyncState;
	statusText: string;
	isUabcConnected: boolean;
}
const STATUS_COLORS: Record<NetworkSyncState, string> = {
	fineConnection: "bg-[#00723f]",
	haveCautivePortal: "bg-[#00723f]",
	invalidConnection: "bg-[#6b7280]",
	mobileConnection: "bg-[#6b7280]",
	mobileConnectionRequiereAuth: "bg-[#00723f]",
};

const STATUS_SHADOW: Record<NetworkSyncState, string> = {
	fineConnection: "shadow-[0_2px_6px_rgba(0,114,63,0.25)]",
	haveCautivePortal: "shadow-[0_2px_6px_rgba(0,114,63,0.25)]",
	invalidConnection: "shadow-[0_2px_6px_rgba(107,114,128,0.25)]",
	mobileConnection: "shadow-[0_2px_6px_rgba(107,114,128,0.25)]",
	mobileConnectionRequiereAuth: "shadow-[0_2px_6px_rgba(0,114,63,0.25)]",
};

export function ConnectionStatusCard({
	networkState,
	statusText,
	isUabcConnected,
}: ConnectionStatusCardProps) {
	const showSyncIcon =
		networkState === "fineConnection" ||
		networkState === "haveCautivePortal" ||
		networkState === "mobileConnectionRequiereAuth";

	return (
		<div className="w-full max-w-sm px-4 mb-4">
			<div className="flex items-center gap-2">
				<div
					className={`flex-1 h-13.5 px-3 py-2 rounded-[14px] flex items-center justify-center gap-2 transition-colors duration-300 ${STATUS_COLORS[networkState]} ${STATUS_SHADOW[networkState]}`}
				>
					{showSyncIcon ? (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							className="w-4 h-4 text-white shrink-0"
							aria-hidden="true"
						>
							<path d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.07 1.07C9.9 5.45 10.91 5 12 5c3.07 0 5.64 2.13 6.32 5.01L19.35 10H22l-3.5 4-3.5-4h2.85zM6 19l3.5-4 3.5 4H10.15c.68 3.01 3.27 5.01 6.14 5.01-1.48 0-2.85-.43-4.01-1.17l-1.07-1.07c.83.77 1.84 1.22 2.93 1.22-3.07 0-5.64-2.13-6.32-5.01L6 19H3l3.5-4L10 19H6zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
						</svg>
					) : (
						<WifiIcon
							connected={isUabcConnected}
							className="w-4 h-4 text-white shrink-0"
						/>
					)}
					<span className="text-white text-[15px] font-semibold tracking-tight leading-tight text-center truncate">
						{statusText}
					</span>
				</div>
			</div>
		</div>
	);
}
