import React from "react";
import ReactDOM from "react-dom/client";
import "./i18n";
import { BrowserRouter, Route, Routes, Navigate } from "react-router";
import { Onboarding } from "./components/Onboarding";
import { SplashScreen } from "./components/SplashScreen";
import { Initializer } from "./routes/Initializer";
import { AppWrapper } from "./routes/App";

import "./css/TourNavigation.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Initializer />} />
				<Route path="/splash" element={<SplashScreen />} />
				<Route path="/onboarding" element={<Onboarding />} />
				<Route path="/app" element={<AppWrapper />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</BrowserRouter>
	</React.StrictMode>,
);
