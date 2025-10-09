import { invoke } from "@tauri-apps/api/core";
import Database from "@tauri-apps/plugin-sql";

interface Credentials {
  email: string;
  password: string;
}

const SQLITE_CREDENTIALS = "sqlite:cima-sync.db";
const SQLITE_CONFIG = "sqlite:cima-config.db";

export async function initEncryption() {
  try {
    const existingKey = await loadEncryptionKey();
    if (existingKey) {
      try {
        await invoke("set_crypto_key", { keyB64: existingKey });
      } catch (keyError) {
        console.error("Error al cargar clave existente:", keyError);
        
        await clearEncryptionKey();
        await clearCredentials();        
        const sessionKey = await invoke("init_crypto") as string;
        
        await saveEncryptionKey(sessionKey);
      }
    } else {
      const sessionKey = await invoke("init_crypto") as string;
      
      await saveEncryptionKey(sessionKey);
    }
  } catch (error) {
    console.error("Error al inicializar encriptación:", error);
    await clearEncryptionKey();
    await clearCredentials();
    await invoke("clear_crypto");
    
    try {
      const sessionKey = await invoke("init_crypto") as string;
      await saveEncryptionKey(sessionKey);
    } catch (retryError) {
      console.error("Error al reinicializar sistema de encriptación:", retryError);
    }
  }
}

export async function saveCredentials({ email, password }: Credentials) {
  try {
    const encryptedEmail = await invoke("encrypt_credentials", { plaintext: email }) as string;
    const encryptedPassword = await invoke("encrypt_credentials", { plaintext: password }) as string;

    const db = await Database.load(SQLITE_CREDENTIALS);
    await db.execute("CREATE TABLE IF NOT EXISTS credentials (email TEXT, password TEXT)");
    await db.execute("DELETE FROM credentials");
    await db.execute("INSERT INTO credentials (email, password) VALUES ($1, $2)", [encryptedEmail, encryptedPassword]);
  } catch (error) {
    console.error("Error saving credentials:", error);
  }
}

export async function getCredentials(): Promise<Credentials | undefined> {
  try {
    const db = await Database.load(SQLITE_CREDENTIALS);
    await db.execute("CREATE TABLE IF NOT EXISTS credentials (email TEXT, password TEXT)");
    const result = await db.select("SELECT email, password FROM credentials LIMIT 1") as Credentials[];
    if (Array.isArray(result) && result.length > 0 && result[0]?.email && result[0]?.password) {
      const decryptedEmail = await invoke("decrypt_credentials", { ciphertext: result[0].email }) as string;
      const decryptedPassword = await invoke("decrypt_credentials", { ciphertext: result[0].password }) as string;
      return { email: decryptedEmail, password: decryptedPassword };
    }
    return undefined;
  } catch (error) {
    console.error("Error getting credentials:", error);
    return undefined;
  }
}

export async function clearCredentials() {
  try {
    const db = await Database.load(SQLITE_CREDENTIALS);
    await db.execute("DELETE FROM credentials");
    await invoke("clear_crypto");
  } catch (error) {
    console.error("Error clearing credentials:", error);
  }
}

export async function setRememberSessionConfig(enabled: boolean) {
  try {
    const db = await Database.load(SQLITE_CONFIG);
    await db.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value INTEGER)");
    await db.execute(
      "INSERT INTO settings (key, value) VALUES ('remember_session', $1) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [enabled ? 1 : 0]
    );
  } catch (error) {
    console.error("Error saving remember_session:", error);
  }
}

export async function getRememberSessionConfig(): Promise<boolean> {
  try {
    const db = await Database.load(SQLITE_CONFIG);
    await db.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value INTEGER)");
    const rows = await db.select("SELECT value FROM settings WHERE key = 'remember_session' LIMIT 1") as { value: number }[];
    return rows[0]?.value === 1;
  } catch (error) {
    console.error("Error reading remember_session:", error);
    return false;
  }
}

export async function setHasSeenOnboarding(hasSeen: boolean) {
  try {
    const db = await Database.load(SQLITE_CONFIG);
    await db.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value INTEGER)");
    await db.execute(
      "INSERT INTO settings (key, value) VALUES ('has_seen_onboarding', $1) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [hasSeen ? 1 : 0]
    );
  } catch (error) {
    console.error("Error saving has_seen_onboarding:", error);
  }
}

export async function getHasSeenOnboarding(): Promise<boolean> {
  try {
    const db = await Database.load(SQLITE_CONFIG);
    await db.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value INTEGER)");
    const rows = await db.select("SELECT value FROM settings WHERE key = 'has_seen_onboarding' LIMIT 1") as { value: number }[];
    return rows?.[0]?.value === 1 || false;
  } catch (error) {
    console.error("Error reading has_seen_onboarding:", error);
    return false;
  }
}

export async function setLanguagePreference(language: string) {
  try {
    const db = await Database.load(SQLITE_CONFIG);
    await db.execute("CREATE TABLE IF NOT EXISTS text_settings (key TEXT PRIMARY KEY, value TEXT)");
    await db.execute(
      "INSERT INTO text_settings (key, value) VALUES ('language', $1) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [language]
    );
  } catch (error) {
    console.error("Error saving language preference:", error);
  }
}

export async function getLanguagePreference(): Promise<string> {
  try {
    const db = await Database.load(SQLITE_CONFIG);
    await db.execute("CREATE TABLE IF NOT EXISTS text_settings (key TEXT PRIMARY KEY, value TEXT)");
    const rows = await db.select("SELECT value FROM text_settings WHERE key = 'language' LIMIT 1") as { value: string }[];
    return rows?.[0]?.value || 'es';
  } catch (error) {
    console.error("Error reading language preference:", error);
    return 'es';
  }
}

export async function setShowTour(show: boolean) {
  try {
    const db = await Database.load(SQLITE_CONFIG);
    await db.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value INTEGER)");
    await db.execute(
      "INSERT INTO settings (key, value) VALUES ('show_tour', $1) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [show ? 1 : 0]
    );
  } catch (error) {
    console.error("Error saving show_tour:", error);
  }
}

export async function getShowTour(): Promise<boolean> {
  try {
    const db = await Database.load(SQLITE_CONFIG);
    await db.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value INTEGER)");
    const rows = await db.select("SELECT value FROM settings WHERE key = 'show_tour' LIMIT 1") as { value: number }[];
    return rows[0]?.value === 1;
  } catch (error) {
    console.error("Error reading show_tour:", error);
    return false;
  }
}

export async function clearConfig() {
  try {
    const db = await Database.load(SQLITE_CONFIG);
    await db.execute("DELETE FROM settings WHERE key ='remember_session'");
    await db.execute("DELETE FROM settings WHERE key ='has_seen_onboarding'");
    await db.execute("DELETE FROM settings WHERE key ='show_tour'");
    await db.execute("DELETE FROM text_settings WHERE key ='language'");
  } catch (error) {
    console.error("Error clearing config:", error);
  }
}

export async function saveEncryptionKey(keyB64: string) {
  try {
    const db = await Database.load(SQLITE_CONFIG);
    await db.execute("CREATE TABLE IF NOT EXISTS crypto_keys (key_data TEXT)");
    await db.execute("DELETE FROM crypto_keys");
    await db.execute("INSERT INTO crypto_keys (key_data) VALUES ($1)", [keyB64]);
  } catch (error) {
    console.error("Error saving encryption key:", error);
  }
}

export async function loadEncryptionKey(): Promise<string | undefined> {
  try {
    const db = await Database.load(SQLITE_CONFIG);
    await db.execute("CREATE TABLE IF NOT EXISTS crypto_keys (key_data TEXT)");
    const result = await db.select("SELECT key_data FROM crypto_keys LIMIT 1") as { key_data: string }[];
    if (Array.isArray(result) && result.length > 0 && typeof result[0]?.key_data === 'string') {
      return result[0].key_data;
    }
    return undefined;
  } catch (error) {
    console.error("Error loading encryption key:", error);
    return undefined;
  }
}

export async function removeDatabase() {
  try {
    const dbCreds = await Database.load(SQLITE_CREDENTIALS);
    await dbCreds.execute("DROP TABLE IF EXISTS credentials");
  } catch (error) {
    console.error("Error removing credentials database:", error);
  }
  
  try {
    const dbCfg = await Database.load(SQLITE_CONFIG);
    await dbCfg.execute("DROP TABLE IF EXISTS settings");
    await dbCfg.execute("DROP TABLE IF EXISTS text_settings");
    await dbCfg.execute("DROP TABLE IF EXISTS crypto_keys");
  } catch (error) {
    console.error("Error removing config database:", error);
  }
}

export async function resetCredentialsSystem() {
  try {
    await clearCredentials();
    
    await setRememberSessionConfig(false);
    
    await clearEncryptionKey();
    
    await invoke("clear_crypto");
  } catch (error) {
    console.error("Error reseteando sistema de credenciales:", error);
  }
}

export async function clearEncryptionKey() {
  try {
    const db = await Database.load(SQLITE_CONFIG);
    await db.execute("DELETE FROM crypto_keys");
  } catch (error) {
    console.error("Error clearing encryption key:", error);
  }
}