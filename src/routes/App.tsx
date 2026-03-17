import { TourProvider } from "@reactour/tour";
import { useSearchParams } from "react-router";
import { Toaster } from "sileo";
import App from "../App";
import { tourSteps, tourStyles } from "../tourConfig";
import { useDeviceStore } from "../store/deviceStore";

export const AppWrapper = () => {
	const [searchParams] = useSearchParams();
	const showTour = searchParams.get("tour") === "true";
	const isMobile = useDeviceStore((state) => state.isMobile);

	return (
		<TourProvider
			steps={tourSteps}
			showNavigation={false}
			showBadge={true}
			showDots={true}
			disableInteraction={false}
			disableDotsNavigation={false}
			disableKeyboardNavigation={false}
			styles={tourStyles}
		>
			<Toaster
				position="top-right"
				offset={isMobile ? { top: "3rem", left: "5rem" } : undefined}
				theme="dark"
				options={{
					duration: null,
					fill: "#00000000",
					roundness: 12,
					styles: {
						title: "text-white!",
						description: "text-white/75!",
					},
				}}
			/>
			<App showTourFirstTime={showTour} />
		</TourProvider>
	);
};
