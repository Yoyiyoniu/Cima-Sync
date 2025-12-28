import { invoke } from "@tauri-apps/api/core";
import Database from "@tauri-apps/plugin-sql";

interface Credentials {
	email: string;
	password: string;
}

const SQLITE_CONFIG = "sqlite:cima-config.db";

export async function initEncryption() {
	try {
		const db = await Database.load(SQLITE_CONFIG);

		await db.execute(
			"CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)",
		);

		await invoke("init_crypto");
	} catch (error) {
		console.error("Error initializing encryption:", error);
		try {
			await invoke("clear_crypto");
			await invoke("init_crypto");
		} catch (retryError) {
			console.error("Error initializing encryption:", retryError);
		}
	}
}

export async function saveCredentials({ email, password }: Credentials) {
	try {
		const db = await Database.load(SQLITE_CONFIG);
		await db.execute(
			"INSERT INTO settings (key, value) VALUES ('email', $1), ('password', $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
			[email, password],
		);
	} catch (error) {
		console.error("Error saving credentials:", error);
	}
}

export async function getCredentials(): Promise<Credentials | undefined> {
	try {
		const db = await Database.load(SQLITE_CONFIG);
		const rows = (await db.select(
			"SELECT key, value FROM settings WHERE key IN ('email', 'password')",
		)) as { key: string; value: string }[];

		const email = rows.find((r) => r.key === "email")?.value;
		const password = rows.find((r) => r.key === "password")?.value;

		if (email && password) {
			return { email, password };
		}
		return undefined;
	} catch (error) {
		console.error("Error getting credentials:", error);
		return undefined;
	}
}

export async function clearCredentials() {
	try {
		const db = await Database.load(SQLITE_CONFIG);
		await db.execute("DELETE FROM settings WHERE key IN ('email', 'password')");
	} catch (error) {
		console.error("Error clearing credentials:", error);
	}
}

export async function setRememberSessionConfig(enabled: boolean) {
	try {
		const db = await Database.load(SQLITE_CONFIG);
		await db.execute(
			"INSERT INTO settings (key, value) VALUES ('remember_session', $1) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
			[enabled ? "1" : "0"],
		);
	} catch (error) {
		console.error("Error saving remember_session:", error);
	}
}

export async function getRememberSessionConfig(): Promise<boolean> {
	try {
		const db = await Database.load(SQLITE_CONFIG);
		const rows = (await db.select(
			"SELECT value FROM settings WHERE key = 'remember_session' LIMIT 1",
		)) as { value: string }[];
		return rows[0]?.value === "1";
	} catch (error) {
		console.error("Error reading remember_session:", error);
		return false;
	}
}

export async function setHasSeenOnboarding(hasSeen: boolean) {
	try {
		const db = await Database.load(SQLITE_CONFIG);
		await db.execute(
			"INSERT INTO settings (key, value) VALUES ('has_seen_onboarding', $1) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
			[hasSeen ? "1" : "0"],
		);
	} catch (error) {
		console.error("Error saving has_seen_onboarding:", error);
	}
}

export async function getHasSeenOnboarding(): Promise<boolean> {
	try {
		const db = await Database.load(SQLITE_CONFIG);
		const rows = (await db.select(
			"SELECT value FROM settings WHERE key = 'has_seen_onboarding' LIMIT 1",
		)) as { value: string }[];
		return rows?.[0]?.value === "1" || false;
	} catch (error) {
		console.error("Error reading has_seen_onboarding:", error);
		return false;
	}
}

export async function setLanguagePreference(language: string) {
	try {
		const db = await Database.load(SQLITE_CONFIG);
		await db.execute(
			"INSERT INTO settings (key, value) VALUES ('language', $1) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
			[language],
		);
	} catch (error) {
		console.error("Error saving language preference:", error);
	}
}

export async function getLanguagePreference(): Promise<string> {
	try {
		const db = await Database.load(SQLITE_CONFIG);
		const rows = (await db.select(
			"SELECT value FROM settings WHERE key = 'language' LIMIT 1",
		)) as { value: string }[];
		return rows?.[0]?.value || "es";
	} catch (error) {
		console.error("Error reading language preference:", error);
		return "es";
	}
}

export async function setShowTour(show: boolean) {
	try {
		const db = await Database.load(SQLITE_CONFIG);
		await db.execute(
			"INSERT INTO settings (key, value) VALUES ('show_tour', $1) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
			[show ? "1" : "0"],
		);
	} catch (error) {
		console.error("Error saving show_tour:", error);
	}
}

export async function getShowTour(): Promise<boolean> {
	try {
		const db = await Database.load(SQLITE_CONFIG);
		const rows = (await db.select(
			"SELECT value FROM settings WHERE key = 'show_tour' LIMIT 1",
		)) as { value: string }[];
		return rows[0]?.value === "1";
	} catch (error) {
		console.error("Error reading show_tour:", error);
		return false;
	}
}

export async function clearConfig() {
	try {
		const db = await Database.load(SQLITE_CONFIG);
		await db.execute(
			"DELETE FROM settings WHERE key IN ('remember_session', 'has_seen_onboarding', 'show_tour', 'language')",
		);
	} catch (error) {
		console.error("Error clearing configuration:", error);
	}
}

export async function removeDatabase() {
	try {
		const db = await Database.load(SQLITE_CONFIG);
		await db.execute("DROP TABLE IF EXISTS settings");
		await db.execute("DROP TABLE IF EXISTS text_settings");
		await db.execute("DROP TABLE IF EXISTS credentials");
		await db.execute("DROP TABLE IF EXISTS crypto_keys");
		await db.close();
	} catch (error) {
		console.error("Error removing database:", error);
	}
}

export async function resetCredentialsSystem() {
	try {
		await clearCredentials();
		await setRememberSessionConfig(false);
		await invoke("clear_crypto");
	} catch (error) {
		console.error("Error resetting credentials system:", error);
	}
}
