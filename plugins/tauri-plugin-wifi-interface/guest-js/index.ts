import { invoke, addPluginListener } from '@tauri-apps/api/core'

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

// -------------------------------------------------------
// Observer — eventos de red en tiempo real
// -------------------------------------------------------

export type WifiEventType = 'available' | 'lost' | 'capabilitiesChanged' | 'unavailable'

export interface WifiEvent {
  event: WifiEventType
  networkId?: number
  hasInternet?: boolean
  hasValidated?: boolean
  ssid?: string
  rssi?: number
  linkSpeed?: number
}

export async function startObserving(): Promise<void> {
  await invoke('plugin:wifi-interface|start_observing')
}

export async function stopObserving(): Promise<void> {
  await invoke('plugin:wifi-interface|stop_observing')
}

export async function connectToNetwork(ssid: string, password?: string): Promise<ConnectResult> {
  return await invoke<ConnectResult>('plugin:wifi-interface|connect_to_network', {
    ssid,
    password: password ?? null,
  })
}

export interface ConnectResult {
  connected: boolean
  ssid?: string
}

export async function onWifiStateChange(
  callback: (event: WifiEvent) => void
): Promise<() => void> {
  const listener = await addPluginListener('wifi-interface', 'wifiStateChange', callback)
  return () => listener.unregister()
}
