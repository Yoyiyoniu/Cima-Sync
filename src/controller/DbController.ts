import Database from "@tauri-apps/plugin-sql";

interface credentials {
    email: string;
    password: string;
}

export async function saveCredentials({ email, password }: credentials) {
    try {
        const db = await Database.load("sqlite:uabc_auto_auth_credentials.db");
        // Table Name: credentials
        // Columns: email, password 
        await db.execute("CREATE TABLE IF NOT EXISTS credentials (email TEXT, password TEXT)");
        await db.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value INTEGER)");
        await db.execute("DELETE FROM credentials");
        await db.execute("DELETE FROM settings WHERE key = 'remember_session'");
        await db.execute("INSERT INTO credentials (email, password) VALUES ($1, $2)", [email, password]);
    }
    catch (error) {
        console.error("Error saving credentials:", error);
    }
}

export async function getCredentials(): Promise<credentials | undefined> {
    try {
        const db = await Database.load("sqlite:uabc_auto_auth_credentials.db");

        await db.execute("CREATE TABLE IF NOT EXISTS credentials (email TEXT, password TEXT)");
        await db.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value INTEGER)");

        const result = await db.select("SELECT email, password FROM credentials LIMIT 1") as { email: string, password: string }[];
        return result[0] || null;
    } catch (error) {
        console.error(error);
        return undefined;
    }
}

export async function clearCredentials() {
    try {
        const db = await Database.load("sqlite:uabc_auto_auth_credentials.db");
        await db.execute("DELETE FROM credentials");
        await db.execute("DELETE FROM settings WHERE key ='remember_session'");
    } catch (error) {
        console.error(error);
    }
}