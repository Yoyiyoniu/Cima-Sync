import type { StepType } from "@reactour/tour";
import { TourStep } from "./components/TourStep";

export const tourSteps: StepType[] = [
	{
		selector: "#tour-activate-btn",
		position: "top",
		content: (
			<TourStep content="Este es el botón principal de Cima Sync. Cuando estés en la red Cimarrón, tócalo para iniciar la autenticación automática." />
		),
	},
	{
		selector: "#tour-network-status",
		position: "bottom",
		content: (
			<TourStep content="Aquí ves el estado de tu conexión. 'Inicia sesión' significa que estás en la red Cimarrón pero aún no autenticado. 'Con conexión' indica que ya estás conectado." />
		),
	},
	{
		selector: "#tour-profile-btn",
		position: "bottom",
		content: (
			<TourStep content="Toca aquí para configurar tu correo y contraseña de UABC. Activa 'Recordar sesión' para que no tengas que ingresarlos de nuevo." />
		),
	},
	{
		selector: "#tour-cimasync-card",
		position: "top",
		content: (
			<TourStep content="Activa o detén el Modo Cima Sync desde esta tarjeta. El switch inicia la autenticación automática; el botón rojo la detiene cuando quieras." />
		),
	},
	{
		selector: "#tour-settings-btn",
		position: "right",
		content: (
			<TourStep content="Accede a los ajustes desde aquí: idioma, inicio automático con el sistema, eliminar datos y repetir este tour cuando quieras." />
		),
	},
];

export const tourStyles = {
	popover: (base: Record<string, unknown>) => ({
		...base,
		background: "linear-gradient(160deg, rgba(12,16,24,0.97) 0%, rgba(8,12,20,0.97) 100%)",
		border: "1px solid rgba(255,255,255,0.12)",
		backdropFilter: "blur(20px)",
		WebkitBackdropFilter: "blur(20px)",
		borderRadius: 20,
		boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
		padding: "18px 20px",
		color: "white",
	}),
	badge: (base: Record<string, unknown>) => ({
		...base,
		background: "linear-gradient(135deg, #006633 0%, #00a854 100%)",
		borderRadius: 99,
		fontWeight: 700,
	}),
	controls: (base: Record<string, unknown>) => ({
		...base,
		color: "white",
		display: "none",
	}),
	arrow: (base: Record<string, unknown>) => ({
		...base,
		color: "rgba(12,16,24,0.97)",
	}),
	dot: (base: Record<string, unknown>, state?: { current?: boolean }) => ({
		...base,
		background: state?.current ? "#00a854" : "rgba(255,255,255,0.2)",
		width: 6,
		height: 6,
	}),
	navigation: (base: Record<string, unknown>) => ({
		...base,
		display: "none",
	}),
	maskArea: (base: Record<string, unknown>) => ({
		...base,
		rx: 12,
	}),
	maskWrapper: (base: Record<string, unknown>) => ({
		...base,
		color: "rgba(0,0,0,0.55)",
	}),
};
