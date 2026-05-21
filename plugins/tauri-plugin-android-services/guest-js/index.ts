import { invoke } from '@tauri-apps/api/core'

export async function startService(): Promise<boolean> {
  const result = await invoke<{ started: boolean }>('plugin:android-services|start_service')
  return result.started
}

export async function stopService(): Promise<boolean> {
  const result = await invoke<{ stopped: boolean }>('plugin:android-services|stop_service')
  return result.stopped
}

export async function isRunning(): Promise<boolean> {
  const result = await invoke<{ running: boolean }>('plugin:android-services|is_running')
  return result.running
}

export async function executeTask(task: string, params: Record<string, unknown> = {}): Promise<boolean> {
  const result = await invoke<{ queued: boolean }>('plugin:android-services|execute_task', {
    payload: { task, params: JSON.stringify(params) },
  })
  return result.queued
}
