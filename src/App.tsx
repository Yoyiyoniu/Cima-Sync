import { FormEvent, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Input } from "./components/Input";

import img from "./assets/img/Logo.avif";
import GithubIcon from "./assets/icons/GithubIcon";

import "./css/Global.css"

import { clearCredentials, getCredentials, saveCredentials } from "./controller/DbController";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [rememberSession, setRememberSession] = useState(false);


  useEffect(() => {
    async function loadCredentials() {
      try {
        const result = await getCredentials();
        if (result) {
          const { email, password } = result;
          setEmail(email);
          setPassword(password);
          setRememberSession(true);
        } 
      } catch (error) {
        console.error("Error loading credentials:", error);
      }
    }
    loadCredentials();
  }, [])

  async function handleLogin(e: FormEvent) {
    e.preventDefault();

    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      if (rememberSession) {
        await saveCredentials({email: email, password: password});
      } else {
        clearCredentials();
      }
      const res = await invoke("login_once", {
        email: email,
        password: password,
      });

      console.log(res);
      setSuccess(true);

      if (rememberSession) {
        await invoke("start_auth", {
          email: email,
          password: password,
        });
      }
    } catch (error) {
      console.error(error);
      setError(String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col gap-5 p-4 relative bg-gradient-to-r from-slate-900 via-gray-800 to-gray-900">
      <img src={img} alt="" className="blur absolute" />
      <div className="p-5 relative z-10 flex flex-col items-center justify-center">
        <form className="flex flex-col gap-3 mb-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-medium">Inicio de sesión automático</h1>
            <p>Sistema Institucional UABC'nt</p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-white p-3 rounded-md mb-3">
              {error}
            </div>
          )}

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
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || success}
          />
          <Input
            id="password"
            type="password"
            label="Contraseña"
            placeholder="•••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            <label className="ml-2 text-sm text-gray-300 cursor-pointer select-none">
              Mantener sesión activa
            </label>
          </div>
        </form>
        <button
          onClick={(e) => handleLogin(e)}
          disabled={loading || success || !email || !password}
          className="w-full h-11 flex items-center justify-center rounded-md font-medium
                      bg-[#006633] hover:bg-[#005528] text-white 
                        disabled:opacity-70 disabled:cursor-not-allowed
                        transition-colors duration-200 shadow-sm cursor-pointer">
          {loading ? "Conectando..." : success ? "Conectado" : "Iniciar sesión"}
        </button>
      </div>
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => {
            window.open("https://github.com/yoyiyoniu/uabc_auto_auth", "_blank");
          }}
          className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors duration-200">
          <GithubIcon width={30} height={30} />
        </button>
      </div>
    </main>
  );
}

export default App;