import Database from "@tauri-apps/plugin-sql";

interface Credentials {
  email: string;
  password: string;
}

const SQLITE_CREDENTIALS = "sqlite:cima-sync.db";
const SQLITE_CONFIG = "sqlite:cima-config.db";

export async function saveCredentials({ email, password }: Credentials) {
  try {
    const db = await Database.load(SQLITE_CREDENTIALS);
    await db.execute("CREATE TABLE IF NOT EXISTS credentials (email TEXT, password TEXT)");
    await db.execute("DELETE FROM credentials");
    await db.execute("INSERT INTO credentials (email, password) VALUES ($1, $2)", [email, password]);
  } catch (error) {
    console.error("Error saving credentials:", error);
  }
}

export async function getCredentials(): Promise<Credentials | undefined> {
  try {
    const db = await Database.load(SQLITE_CREDENTIALS);
    await db.execute("CREATE TABLE IF NOT EXISTS credentials (email TEXT, password TEXT)");
    const result = await db.select("SELECT email, password FROM credentials LIMIT 1") as Credentials[];
    return result[0] || null;
  } catch (error) {
    console.error("Error getting credentials:", error);
    return undefined;
  }
}

export async function clearCredentials() {
  try {
    const db = await Database.load(SQLITE_CREDENTIALS);
    await db.execute("DELETE FROM credentials");
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
    return rows?.[0]?.value === 1 || false;
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
    return rows?.[0]?.value === 1 || false;
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
  } catch (error) {
    console.error("Error removing config database:", error);
  }
}