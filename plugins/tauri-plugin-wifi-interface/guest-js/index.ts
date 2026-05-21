import { invoke } from '@tauri-apps/api/core'

export async function bindToWifi(): Promise<boolean> {
  const result = await invoke<{ success: boolean }>('plugin:wifi-interface|bind_to_wifi')
  return result.success
}

export async function unbindNetwork(): Promise<boolean> {
  const result = await invoke<{ success: boolean }>('plugin:wifi-interface|unbind_network')
  return result.success
}

export interface WifiStatus {
  isBound: boolean
  ssid: string
}

export async function getWifiStatus(): Promise<WifiStatus> {
  return await invoke<WifiStatus>('plugin:wifi-interface|get_wifi_status')
}
