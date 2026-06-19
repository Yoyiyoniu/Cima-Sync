import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { ScriptInfo } from '../utils/scripts.js';

interface ScriptListProps {
  scripts: ScriptInfo[];
  onSelect: (script: ScriptInfo) => void;
}

export function ScriptList({ scripts, onSelect }: ScriptListProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  useInput((_input, key) => {
    if (key.downArrow) {
      setFocusedIndex(i => Math.min(i + 1, scripts.length - 1));
    }
    if (key.upArrow) {
      setFocusedIndex(i => Math.max(i - 1, 0));
    }
    if (key.return) {
      onSelect(scripts[focusedIndex]);
    }
  });

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="cyan">
          {'╭─ Cima‑Sync · Script Picker '.padEnd(50, '─') + '╮'}
        </Text>
        <Text bold color="cyan">
          {'╰'.padEnd(51, '─') + '╯'}
        </Text>
      </Box>

      <Text dimColor>
        {scripts.length} script{scripts.length !== 1 ? 's' : ''} available
      </Text>

      <Box flexDirection="column" marginTop={1} gap={0}>
        {scripts.map((script, i) => {
          const isFocused = i === focusedIndex;
          return (
            <Box key={script.path} flexDirection="column">
              <Box>
                <Text color={isFocused ? 'cyan' : undefined} bold={isFocused}>
                  {isFocused ? '▸ ' : '  '}
                </Text>
                <Text
                  color={isFocused ? 'cyan' : undefined}
                  bold={isFocused}
                  inverse={isFocused}
                >
                  {' ' + script.name + ' '}
                </Text>
                {script.description !== 'No description' && (
                  <Text dimColor>  {script.description}</Text>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>↑↓ navigate</Text>
        <Text color="gray">  ·  </Text>
        <Text dimColor>enter select</Text>
        <Text color="gray">  ·  </Text>
        <Text dimColor>esc quit</Text>
      </Box>
    </Box>
  );
}
