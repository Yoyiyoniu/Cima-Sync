import React, { useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { ConfirmInput } from "@inkjs/ui";
import { getScripts, type ScriptInfo } from "./utils/scripts.js";
import { ScriptList } from "./components/script-list.js";
import { ScriptPreview } from "./components/script-preview.js";
import { ScriptRunner } from "./components/script-runner.js";

type Step = "list" | "confirm" | "running" | "done";

function DoneStep({
	exitCode,
	scriptName,
	onRunAgain,
	onExit,
}: {
	exitCode: number;
	scriptName: string;
	onRunAgain: () => void;
	onExit: () => void;
}) {
	const success = exitCode === 0;

	return (
		<Box flexDirection="column" paddingX={1} paddingY={1}>
			<Box flexDirection="column" marginBottom={1}>
				<Text bold color="cyan">
					{"╭─ Finished ".padEnd(50, "─") + "╮"}
				</Text>
				<Text bold color="cyan">
					{"╰".padEnd(51, "─") + "╯"}
				</Text>
			</Box>

			<Box
				flexDirection="column"
				paddingX={1}
				paddingY={1}
				borderStyle="round"
				borderColor={success ? "green" : "red"}
			>
				<Box gap={1}>
					<Text color={success ? "green" : "red"} bold>
						{success ? "✓" : "✗"}
					</Text>
					<Box flexDirection="column">
						<Text bold>{scriptName}</Text>
						<Text color={success ? "green" : "red"}>
							{success
								? "Completed successfully"
								: `Failed with exit code ${exitCode}`}
						</Text>
					</Box>
				</Box>
			</Box>

			<Box flexDirection="column" gap={1} marginTop={1}>
				<Text bold>Run another script?</Text>
				<ConfirmInput
					defaultChoice="confirm"
					onConfirm={onRunAgain}
					onCancel={onExit}
				/>
			</Box>
		</Box>
	);
}

function EmptyState() {
	return (
		<Box flexDirection="column" paddingX={1} paddingY={1}>
			<Box flexDirection="column" marginBottom={1}>
				<Text bold color="cyan">
					{"╭─ Cima‑Sync · Script Picker ".padEnd(50, "─") + "╮"}
				</Text>
				<Text bold color="cyan">
					{"╰".padEnd(51, "─") + "╯"}
				</Text>
			</Box>
			<Box borderStyle="round" borderColor="yellow" padding={1}>
				<Text color="yellow">No scripts found in ./scripts/</Text>
			</Box>
		</Box>
	);
}

export function App() {
	const [step, setStep] = useState<Step>("list");
	const [selectedScript, setSelectedScript] = useState<ScriptInfo | null>(null);
	const [exitCode, setExitCode] = useState<number | null>(null);
	const { exit } = useApp();

	useInput((_input, key) => {
		if (key.escape || (key.ctrl && _input === "c")) {
			exit();
		}
	});

	const scripts = getScripts();

	const handleSelect = (script: ScriptInfo) => {
		setSelectedScript(script);
		setStep("confirm");
	};

	const handleConfirm = () => {
		setStep("running");
	};

	const handleCancel = () => {
		setSelectedScript(null);
		setStep("list");
	};

	const handleComplete = (code: number) => {
		setExitCode(code);
		setStep("done");
	};

	const handleRunAgain = () => {
		setSelectedScript(null);
		setExitCode(null);
		setStep("list");
	};

	const handleExit = () => {
		exit();
	};

	if (step === "list") {
		if (scripts.length === 0) return <EmptyState />;
		return <ScriptList scripts={scripts} onSelect={handleSelect} />;
	}

	if (step === "confirm" && selectedScript) {
		return (
			<ScriptPreview
				script={selectedScript}
				onConfirm={handleConfirm}
				onCancel={handleCancel}
			/>
		);
	}

	if (step === "running" && selectedScript) {
		return <ScriptRunner script={selectedScript} onComplete={handleComplete} />;
	}

	if (step === "done" && exitCode !== null && selectedScript) {
		return (
			<DoneStep
				exitCode={exitCode}
				scriptName={selectedScript.name}
				onRunAgain={handleRunAgain}
				onExit={handleExit}
			/>
		);
	}

	return null;
}
