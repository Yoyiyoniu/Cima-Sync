import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export interface ScriptInfo {
	name: string;
	path: string;
	description: string;
}

export function getScripts(): ScriptInfo[] {
	const scriptsDir = join(process.cwd(), "scripts");
	if (!existsSync(scriptsDir)) return [];

	return readdirSync(scriptsDir)
		.filter((f) => f.endsWith(".sh"))
		.map((f) => {
			const fullPath = join(scriptsDir, f);
			const content = readFileSync(fullPath, "utf-8");
			const lines = content.split("\n");
			const comments = lines
				.filter((l) => l.trim().startsWith("#"))
				.map((l) => l.trim().replace(/^#\s?/, ""))
				.filter((l) => !l.startsWith("!") && !l.startsWith("/"));

			return {
				name: f,
				path: fullPath,
				description: comments[0] || "No description",
			};
		});
}
