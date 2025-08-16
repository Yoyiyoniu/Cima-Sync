import Database from "@tauri-apps/plugin-sql";

interface credentials {
    email: string;
    password: string;
}

const sqliteCredentials = Object.freeze("sqlite:cima-sync.db");
const sqliteConfig = Object.freeze("sqlite:cima-config.db");

export async function saveCredentials({ email, password }: credentials) {
    try {
        const db = await Database.load(sqliteCredentials);
        await db.execute("CREATE TABLE IF NOT EXISTS credentials (email TEXT, password TEXT)");
        await db.execute("DELETE FROM credentials");
        await db.execute("INSERT INTO credentials (email, password) VALUES ($1, $2)", [email, password]);
    }
    catch (error) {
        console.error("Error saving credentials:", error);
    }
}

export async function getCredentials(): Promise<credentials | undefined> {
    try {
        const db = await Database.load(sqliteCredentials);
        await db.execute("CREATE TABLE IF NOT EXISTS credentials (email TEXT, password TEXT)");
        const result = await db.select("SELECT email, password FROM credentials LIMIT 1") as { email: string, password: string }[];
        return result[0] || null;
    } catch (error) {
        console.error(error);
        return undefined;
    }
}

export async function clearCredentials() {
    try {
        const db = await Database.load(sqliteCredentials);
        await db.execute("DELETE FROM credentials");
    } catch (error) {
        console.error(error);
    }
}

export async function setRememberSessionConfig(enabled: boolean) {
    try {
        const db = await Database.load(sqliteConfig);
        await db.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value INTEGER)");
        await db.execute("INSERT INTO settings (key, value) VALUES ('remember_session', $1) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [enabled ? 1 : 0]);
    } catch (error) {
        console.error("Error saving remember_session:", error);
    }
}

export async function getRememberSessionConfig(): Promise<boolean> {
    try {
        const db = await Database.load(sqliteConfig);
        await db.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value INTEGER)");
        const rows = await db.select("SELECT value FROM settings WHERE key = 'remember_session' LIMIT 1") as { value: number }[];
        if (!rows || rows.length === 0) return false;
        return rows[0].value === 1;
    } catch (error) {
        console.error("Error reading remember_session:", error);
        return false;
    }
}

export async function setHasSeenOnboarding(hasSeen: boolean) {
    try {
        const db = await Database.load(sqliteConfig);
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
        const db = await Database.load(sqliteConfig);
        await db.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value INTEGER)");
        const rows = await db.select("SELECT value FROM settings WHERE key = 'has_seen_onboarding' LIMIT 1") as { value: number }[];
        if (!rows || rows.length === 0) return false;
        return rows[0].value === 1;
    } catch (error) {
        console.error("Error reading has_seen_onboarding:", error);
        return false;
    }
}

export async function setLanguagePreference(language: string) {
    try {
        const db = await Database.load(sqliteConfig);
        // Usar una tabla separada para configuraciones de texto para evitar conflictos de tipo
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
        const db = await Database.load(sqliteConfig);
        await db.execute("CREATE TABLE IF NOT EXISTS text_settings (key TEXT PRIMARY KEY, value TEXT)");
        const rows = await db.select("SELECT value FROM text_settings WHERE key = 'language' LIMIT 1") as { value: string }[];
        if (!rows || rows.length === 0) return 'es'; // idioma por defecto
        return rows[0].value;
    } catch (error) {
        console.error("Error reading language preference:", error);
        return 'es'; // idioma por defecto en caso de error
    }
}



export async function clearConfig() {
    try {
        const db = await Database.load(sqliteConfig);
        await db.execute("DELETE FROM settings WHERE key ='remember_session'");
        await db.execute("DELETE FROM settings WHERE key ='has_seen_onboarding'");
        await db.execute("DELETE FROM text_settings WHERE key ='language'");
    } catch (error) {
        console.error(error);
    }
}

export async function removeDatabase() {
    try {
        const dbCreds = await Database.load(sqliteCredentials);
        await dbCreds.execute("DROP TABLE IF EXISTS credentials");
    } catch (error) {
        console.error(error);
    }
    try {
        const dbCfg = await Database.load(sqliteConfig);
        await dbCfg.execute("DROP TABLE IF EXISTS settings");
        await dbCfg.execute("DROP TABLE IF EXISTS text_settings");
    } catch (error) {
        console.error(error);
    }
}