import { invoke } from "@tauri-apps/api/core";

export async function requestNotificationsPermission(): Promise<boolean> {
	const result = await invoke<{ granted: boolean }>(
		"plugin:android-services|request_notifications_permission",
	);
	return result.granted;
}

export async function startBackgroundService(): Promise<void> {
	await invoke<{ started: boolean }>("plugin:android-services|start_service");
}

export async function stopBackgroundService(): Promise<void> {
	await invoke<{ stopped: boolean }>("plugin:android-services|stop_service");
}

export async function isServiceRunning(): Promise<boolean> {
	const result = await invoke<{ running: boolean }>(
		"plugin:android-services|is_running",
	);
	return result.running;
}

export async function executeServiceTask(
	task: string,
	params: Record<string, unknown> = {},
): Promise<void> {
	await invoke<{ queued: boolean }>("plugin:android-services|execute_task", {
		payload: { task, params: JSON.stringify(params) },
	});
}
