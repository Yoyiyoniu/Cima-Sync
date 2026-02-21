import { useEffect } from "react";
import { useNavigate } from "react-router";
import { getHasSeenOnboarding } from "../controller/DbController";
import { SplashScreen } from "../components/SplashScreen";

export const Initializer = () => {
	const navigate = useNavigate();

	useEffect(() => {
		const checkState = async () => {
			try {
				const seenOnboarding = await getHasSeenOnboarding();
				if (!seenOnboarding) {
					navigate("/onboarding", { replace: true });
				} else {
					navigate("/app", { replace: true });
				}
			} catch (error) {
				console.error("Error checking onboarding state:", error);
				navigate("/app", { replace: true });
			}
		};

		const timer = setTimeout(checkState, 1000);
		return () => clearTimeout(timer);
	}, [navigate]);

	return <SplashScreen />;
};
