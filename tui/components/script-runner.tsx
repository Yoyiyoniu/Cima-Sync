import React, { useEffect, useState, useRef } from 'react';
import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import { execa } from 'execa';
import type { ScriptInfo } from '../utils/scripts.js';

interface ScriptRunnerProps {
  script: ScriptInfo;
  onComplete: (exitCode: number) => void;
}

export function ScriptRunner({ script, onComplete }: ScriptRunnerProps) {
  const [output, setOutput] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const outputRef = useRef<string[]>([]);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const subprocess = execa(script.path, [], { shell: true, all: true });

        subprocess.all?.on('data', (data: Buffer) => {
          if (!cancelled) {
            const text = data.toString();
            outputRef.current = [...outputRef.current, text];
            setOutput([...outputRef.current]);
          }
        });

        const result = await subprocess;
        if (!cancelled) {
          setExitCode(result.exitCode ?? 0);
          setFinished(true);
          onComplete(result.exitCode ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          const code = (err as any)?.exitCode ?? 1;
          setExitCode(code);
          setFinished(true);
          onComplete(code);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [script.path, onComplete]);

  const lastLines = output.slice(-50).join('').split('\n').slice(-15);

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="cyan">
          {'╭─ Running Script '.padEnd(50, '─') + '╮'}
        </Text>
        <Text bold color="cyan">
          {'╰'.padEnd(51, '─') + '╯'}
        </Text>
      </Box>

      <Box flexDirection="column" paddingX={1} paddingY={1} borderStyle="round" borderColor="cyan">
        <Box gap={2}>
          <Text bold>{script.name}</Text>
          {!finished ? (
            <Box>
              <Spinner label={`Running... ${elapsed}s`} />
            </Box>
          ) : (
            <Text color={exitCode === 0 ? 'green' : 'red'} bold>
              {exitCode === 0 ? '✓ Completed' : `✗ Failed (exit ${exitCode})`}
            </Text>
          )}
        </Box>
        {script.description !== 'No description' && (
          <Text dimColor>{script.description}</Text>
        )}
      </Box>

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={finished ? (exitCode === 0 ? 'green' : 'red') : 'yellow'}
        paddingX={1}
        paddingY={0}
        marginTop={1}
      >
        {lastLines.length === 0 && !finished && (
          <Text dimColor>Waiting for output...</Text>
        )}
        {lastLines.map((line, i) => (
          <Text key={i}>{line || ' '}</Text>
        ))}
      </Box>
    </Box>
  );
}
