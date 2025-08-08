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

export async function clearConfig() {
    try {
        const db = await Database.load(sqliteConfig);
        await db.execute("DELETE FROM settings WHERE key ='remember_session'");
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
    } catch (error) {
        console.error(error);
    }
}