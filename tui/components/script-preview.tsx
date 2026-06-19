import React from 'react';
import { Box, Text } from 'ink';
import { readFileSync, statSync } from 'node:fs';
import { ConfirmInput } from '@inkjs/ui';
import type { ScriptInfo } from '../utils/scripts.js';

interface ScriptPreviewProps {
  script: ScriptInfo;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ScriptPreview({ script, onConfirm, onCancel }: ScriptPreviewProps) {
  const content = readFileSync(script.path, 'utf-8');
  const lines = content.split('\n');
  const stats = statSync(script.path);
  const isExecutable = !!(stats.mode & 0o111);
  const previewLines = lines.slice(0, 20);
  const remaining = lines.length - 20;

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="cyan">
          {'╭─ Script Preview '.padEnd(50, '─') + '╮'}
        </Text>
        <Text bold color="cyan">
          {'╰'.padEnd(51, '─') + '╯'}
        </Text>
      </Box>

      <Box flexDirection="column" paddingX={1} paddingY={1} borderStyle="round" borderColor="cyan">
        <Box gap={2}>
          <Text bold>{script.name}</Text>
          <Text color={isExecutable ? 'green' : 'yellow'}>
            {isExecutable ? '● executable' : '○ non-executable'}
          </Text>
          <Text dimColor>{lines.length} lines</Text>
          <Text dimColor>{(stats.size / 1024).toFixed(1)} KB</Text>
        </Box>
        {script.description !== 'No description' && (
          <Text dimColor>{script.description}</Text>
        )}
      </Box>

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="gray"
        paddingX={1}
        paddingY={0}
        marginTop={1}
      >
        {previewLines.map((line, i) => {
          const lineNum = String(i + 1).padStart(3, ' ');
          if (line.trim().startsWith('#')) {
            return (
              <Box key={i}>
                <Text dimColor>{lineNum} </Text>
                <Text color="green">{line}</Text>
              </Box>
            );
          }
          if (line.trim() === '') {
            return (
              <Box key={i}>
                <Text dimColor>{lineNum} </Text>
              </Box>
            );
          }
          return (
            <Box key={i}>
              <Text dimColor>{lineNum} </Text>
              <Text>{line}</Text>
            </Box>
          );
        })}
        {remaining > 0 && (
          <Text dimColor>··· {remaining} more line{remaining !== 1 ? 's' : ''}</Text>
        )}
      </Box>

      <Box flexDirection="column" gap={1} marginTop={1}>
        <Text bold>Run this script?</Text>
        <ConfirmInput onConfirm={onConfirm} onCancel={onCancel} />
      </Box>
    </Box>
  );
}
