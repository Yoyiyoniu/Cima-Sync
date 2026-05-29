import { TourProvider } from "@reactour/tour";
import { useSearchParams } from "react-router";
import App from "../App";
import { tourSteps, tourStyles } from "../tourConfig";

export const AppWrapper = () => {
	const [searchParams] = useSearchParams();
	const showTour = searchParams.get("tour") === "true";

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
			<App showTourFirstTime={showTour} />
		</TourProvider>
	);
};
