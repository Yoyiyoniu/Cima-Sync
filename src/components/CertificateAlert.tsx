import { useState } from "react";
import { useTranslation } from "react-i18next";
import { openUrl } from "@tauri-apps/plugin-opener";
import XIcon from "../assets/icons/XIcon";

const GITHUB_RELEASES_URL = "https://github.com/Yoyiyoniu/Cima-Sync/releases";

interface CertificateAlertProps {
	isVisible: boolean;
}

export function CertificateAlert({ isVisible }: CertificateAlertProps) {
	const { t } = useTranslation();
	const [isModalOpen, setIsModalOpen] = useState(false);

	if (!isVisible) return null;

	const handleUpdateClick = async () => {
		try {
			await openUrl(GITHUB_RELEASES_URL);
		} catch (error) {
			console.error("Error opening URL:", error);
		}
	};

	return (
		<>
			<button
				onClick={() => setIsModalOpen(true)}
				className="fixed bottom-4 right-4 z-50 
					bg-red-600 hover:bg-red-500 
					text-white p-3 rounded-full shadow-lg
					transition-all duration-300 hover:scale-110
					animate-pulse hover:animate-none"
				title={t("CertificateAlert.buttonTitle")}
			>
				<svg
					className="w-6 h-6"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
			</button>

			{isModalOpen && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center p-4"
					onClick={() => setIsModalOpen(false)}
				>
					<div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

					<div
						className="relative bg-gradient-to-br from-gray-900 to-gray-800 
							border border-red-500/30 rounded-xl shadow-2xl 
							max-w-md w-full p-6"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							onClick={() => setIsModalOpen(false)}
							className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
						>
							<XIcon className="w-5 h-5" />
						</button>

						<div className="flex items-center gap-4 mb-4">
							<div className="bg-red-500/20 p-3 rounded-full">
								<svg
									className="w-8 h-8 text-red-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
									/>
								</svg>
							</div>
							<h2 className="text-xl font-semibold text-white">
								{t("CertificateAlert.title")}
							</h2>
						</div>

						<p className="text-gray-300 mb-6 leading-relaxed">
							{t("CertificateAlert.message")}
						</p>

						<button
							onClick={handleUpdateClick}
							className="w-full flex items-center justify-center gap-3
								bg-gradient-to-r from-green-600 to-green-700
								hover:from-green-500 hover:to-green-600
								text-white font-medium py-3 px-4 rounded-lg
								transition-all duration-200 shadow-lg hover:shadow-green-500/25"
						>
							<svg
								className="w-5 h-5"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
							</svg>
							{t("CertificateAlert.updateButton")}
						</button>
					</div>
				</div>
			)}
		</>
	);
}
