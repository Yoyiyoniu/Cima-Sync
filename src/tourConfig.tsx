import type { StepType } from "@reactour/tour";
import { TourStep } from "./components/TourStep";

export const tourSteps: StepType[] = [
	{
		selector: ".app-title",
		content: (
			<TourStep content="¡Bienvenido a Cima Sync! Esta aplicación te ayudará a conectarte automáticamente a la red de UABC." />
		),
	},
	{
		selector: "#email",
		content: (
			<TourStep content="Aquí debes ingresar tu correo electrónico de UABC (ejemplo: tu.nombre@uabc.edu.mx) o tu nombre de usuario institucional." />
		),
	},
	{
		selector: "#password",
		content: (
			<TourStep content="Ingresa tu contraseña de UABC. Esta se guardará de forma segura en tu dispositivo." />
		),
	},
	{
		selector: "#remember",
		content: (
			<TourStep content="Marca esta casilla si quieres que la aplicación recuerde tu sesión y se conecte automáticamente en el futuro." />
		),
	},
	{
		selector: "#login-button",
		content: (
			<TourStep content="¡Perfecto! Ahora haz clic en este botón para conectarte a la red de UABC. La aplicación se encargará de todo automáticamente." />
		),
	},
];

export const tourStyles = {
	popover: (base: Record<string, unknown>) => ({
		...base,
		backgroundColor: "#1e293b",
		color: "white",
		borderRadius: "8px",
		boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
		padding: "20px",
	}),
	badge: (base: Record<string, unknown>) => ({
		...base,
		backgroundColor: "#006633",
	}),
	controls: (base: Record<string, unknown>) => ({
		...base,
		color: "white",
	}),
	arrow: (base: Record<string, unknown>) => ({
		...base,
		color: "#1e293b",
	}),
	navigation: (base: Record<string, unknown>) => ({
		...base,
		marginTop: "15px",
	}),
};
