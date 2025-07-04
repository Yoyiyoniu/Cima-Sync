import { FormEvent, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { clearCredentials, getCredentials, saveCredentials } from "./controller/DbController";
import { disableContextMenu } from "./hooks/disableContextMenu";

import { Input } from "./components/Input";

import img from "./assets/img/Logo.avif";
import StopIcon from "./assets/icons/StopIcon";

import "./css/Global.css"

import { getInterfaces } from "tauri-plugin-network-api";
import { z } from "zod";

const NetworkInterfaceSchema = z.object({
  name: z.string(),
  v4_addrs: z.array(z.object({
    ip: z.string(),
    ip_octets: z.array(z.number()),
    prefix: z.number(),
    netmask: z.string(),
    netmask_octets: z.array(z.number()),
    network: z.string().nullable(),
    broadcast: z.string().nullable()
  })),
  v6_addrs: z.array(z.object({
    ip: z.string(),
    ip_octets: z.array(z.number()),
    prefix: z.number().nullable(),
    netmask: z.string().nullable(),
    netmask_octets: z.array(z.number()).nullable(),
    network: z.string().nullable(),
    broadcast: z.string().nullable()
  }))
});

function App() {

  const [{ email, password }, setCredentials] = useState({ email: "", password: "" });
  const [{ error, loading, success }, setAppState] = useState<AppState>({ loading: false, error: null, success: false });

  const [rememberSession, setRememberSession] = useState(false);

  disableContextMenu();

  useEffect(() => {

    const getInterfacesView = async () => {
      getInterfaces().then((ifaces: Array<Object>) => {
        const parsed = z.array(NetworkInterfaceSchema).safeParse(ifaces);
        if (parsed.success) {
          // Identificar la interfaz de internet activa (no localhost)
          const activeInterface = parsed.data.find(iface =>
            iface.v4_addrs.some(addr =>
              !addr.ip.startsWith('127.') &&
              !addr.ip.startsWith('169.254.') &&
              !addr.ip.startsWith('10.') &&
              !addr.ip.startsWith('172.') &&
              !addr.ip.startsWith('192.168.')
            )
          );

          if (activeInterface) {
            const activeAddr = activeInterface.v4_addrs.find(addr =>
              !addr.ip.startsWith('127.') &&
              !addr.ip.startsWith('169.254.') &&
              !addr.ip.startsWith('10.') &&
              !addr.ip.startsWith('172.') &&
              !addr.ip.startsWith('192.168.')
            );

            if (activeAddr) {
              // Determinar si es Ethernet o WiFi basado en el nombre de la interfaz
              const interfaceName = activeInterface.name.toLowerCase();
              let connectionType = "Desconocido";

              if (interfaceName.includes('ethernet') || interfaceName.includes('lan') || interfaceName.includes('cable')) {
                connectionType = "Ethernet";
              } else if (interfaceName.includes('wifi') || interfaceName.includes('wireless') || interfaceName.includes('wi-fi')) {
                connectionType = "WiFi";
              } else if (interfaceName.includes('wlan')) {
                connectionType = "WiFi";
              } else {
                connectionType = "Ethernet"; // Por defecto asumimos Ethernet
              }

              console.log(`Conexión: ${connectionType}`);
              console.log(`Interfaz: ${activeInterface.name}`);
            }
          } else {
            console.log("No se detectó conexión de internet activa");
          }

        } else {
          console.log("Error al obtener información de red:", parsed.error.toString());
        }
      });
    }

    async function loadCredentials() {
      try {
        const result = await getCredentials();
        if (result) {
          const { email, password } = result;
          setCredentials({ email, password });
          setRememberSession(true);
        }
      } catch (error) {
        console.error("Error loading credentials:", error);
      }
    }

    getInterfacesView();
    loadCredentials();
  }, []);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();

    setAppState({ loading: true, error: null, success: false });

    try {
      if (!rememberSession) clearCredentials();

      await invoke("login", {
        email: email,
        password: password,
      }).then(async (res) => {
        console.log(res);
        setAppState((prev) => ({ ...prev, success: true }))
        if (rememberSession) {
          await saveCredentials({ email: email, password: password });

          await invoke("auto_auth", {
            email: email,
            password: password,
          });
        }
      });
    } catch (err) {
      console.error(err);
      setAppState((prev) => ({ ...prev, error: String(err) }));
    } finally {
      setAppState((prev) => ({ ...prev, loading: false }));
    }
  }

  async function handleLogout() {
    await invoke("stop_auth");
    setAppState({ loading: false, error: null, success: false });
  }

  return (
    <main className="flex flex-col h-screen items-center justify-center text-white gap-5 p-4 relative bg-gradient-to-r from-slate-900 via-gray-800 to-gray-900 overflow-hidden">
      <img src={img} alt="" className="blur absolute" />
      <div className="w-full p-5 relative z-10 flex flex-col items-center justify-center">
        <form className="w-full max-w-sm flex flex-col gap-3 mb-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-medium">Inicio de sesión automático</h1>
            <p>Sistema Institucional UABC'nt</p>
          </div>
          {success && (
            <div className="bg-green-500/20 border border-green-500/50 text-white p-3 rounded-md mb-3">
              Conexión establecida correctamente.
            </div>
          )}
          <Input
            id="email"
            type="email"
            label="Correo"
            placeholder="me@uabc.edu.mx"
            value={email}
            onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
            disabled={loading || success}
          />
          <Input
            id="password"
            type="password"
            label="Contraseña"
            placeholder="•••••••••••••"
            value={password}
            onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
            disabled={loading || success}
          />
          <div className="flex items-center">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberSession}
                onChange={(e) => setRememberSession(e.target.checked)}
                disabled={loading || success}
                className="peer h-4 w-4 appearance-none rounded border border-[#006633]/30 bg-black/40 
          checked:bg-[#006633] checked:border-[#006633] 
          focus:outline-none focus:ring-2 focus:ring-[#006633]/50
          disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <label title="Mantener sesión activa" className="ml-2 text-sm text-gray-300 cursor-pointer select-none">
              Mantener sesión activa
            </label>
          </div>
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-white p-3 rounded-md mb-3">
              {error}
            </div>
          )}
        </form>
        <div className="flex w-full max-w-sm justify-center gap-2 relative">
          <button
            title="Iniciar sesión"
            onClick={(e) => handleLogin(e)}
            disabled={loading || success || !email || !password}
            className={`h-11 flex items-center justify-center rounded-md font-medium
                        bg-[#006633] hover:bg-[#005528] text-white 
                        disabled:opacity-70 disabled:cursor-not-allowed
                        transition-all duration-300 shadow-sm cursor-pointer
                        w-full`}>
            {loading ? "Conectando..." : success ? "Conectado" : "Iniciar sesión"}
          </button>
          <button
            title="Detener sesión"
            onClick={handleLogout}
            type="button"
            className={`h-11 flex items-center justify-center rounded-md font-medium
                      bg-red-600 hover:bg-red-700 text-white
                      disabled:opacity-70 disabled:cursor-not-allowed
                      transition-all duration-300 shadow-sm cursor-pointer
                      absolute right-0 w-10
                      ${success ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
            <StopIcon />
          </button>
        </div>
      </div>
    </main>
  );
}

export default App;