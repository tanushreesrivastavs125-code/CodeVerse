import * as Blockly from 'blockly';
import 'blockly/blocks';
import * as En from 'blockly/msg/en';

Blockly.setLocale(En);

/**
 * Initializes and registers custom CodeVerse drone programming blocks.
 * Safe to invoke multiple times (idempotent).
 */
export function registerCodeVerseBlocks() {
  if (Blockly.Blocks.cv_move) {
    return; // Already registered
  }

  const actionBlocks = [
    {
      type: 'cv_move',
      message0: 'move forward',
      previousStatement: null,
      nextStatement: null,
      colour: 185,
      tooltip: 'Advance the drone one tile in its current heading.'
    },
    {
      type: 'cv_left',
      message0: 'turn left ↶',
      previousStatement: null,
      nextStatement: null,
      colour: 215,
      tooltip: 'Rotate the drone 90 degrees counter-clockwise without changing position.'
    },
    {
      type: 'cv_right',
      message0: 'turn right ↷',
      previousStatement: null,
      nextStatement: null,
      colour: 215,
      tooltip: 'Rotate the drone 90 degrees clockwise without changing position.'
    },
    {
      type: 'cv_collect',
      message0: 'collect energy ◈',
      previousStatement: null,
      nextStatement: null,
      colour: 45,
      tooltip: 'Collect an energy shard on the drone’s current tile.'
    },
    {
      type: 'cv_jump',
      message0: 'jump across breach',
      previousStatement: null,
      nextStatement: null,
      colour: 275,
      tooltip: 'Leap forward two tiles, bypassing hazards or gaps.'
    },
    {
      type: 'cv_activate',
      message0: 'activate terminal ⌘',
      previousStatement: null,
      nextStatement: null,
      colour: 155,
      tooltip: 'Activate a terminal switch on the current tile to deploy bridges.'
    },
    {
      type: 'cv_pulse',
      message0: 'fire pulse ⚡',
      previousStatement: null,
      nextStatement: null,
      colour: 330,
      tooltip: 'Emit an energy pulse discharging against guardians up to 3 tiles forward.'
    },
    {
      type: 'cv_sensor',
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'SENSOR',
          options: [
            ['wall ahead', 'wall'],
            ['energy on tile', 'energy'],
            ['hazard ahead', 'hazard'],
            ['on terminal', 'terminal'],
            ['guardian ahead', 'guardian']
          ]
        }
      ],
      output: 'Boolean',
      colour: 190,
      tooltip: 'Scan the world around the drone.'
    },
    {
      type: 'cv_repeat',
      message0: 'repeat %1 times %2 %3',
      args0: [
        {
          type: 'field_number',
          name: 'COUNT',
          value: 3,
          min: 1,
          max: 30,
          precision: 1
        },
        {
          type: 'input_dummy'
        },
        {
          type: 'input_statement',
          name: 'DO'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 245,
      tooltip: 'Repeat enclosed actions a specified number of times.'
    },
    {
      type: 'cv_if',
      message0: 'if %1 then %2 %3',
      args0: [
        {
          type: 'input_value',
          name: 'SENSOR',
          check: 'Boolean'
        },
        {
          type: 'input_dummy'
        },
        {
          type: 'input_statement',
          name: 'DO'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 260,
      tooltip: 'Execute actions only when the sensor condition is met.'
    },
    {
      type: 'cv_if_else',
      message0: 'if %1 then %2 %3 else %4 %5',
      args0: [
        {
          type: 'input_value',
          name: 'SENSOR',
          check: 'Boolean'
        },
        {
          type: 'input_dummy'
        },
        {
          type: 'input_statement',
          name: 'DO'
        },
        {
          type: 'input_dummy'
        },
        {
          type: 'input_statement',
          name: 'ELSE'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 260,
      tooltip: 'Execute the first branch if sensor detected, otherwise execute else branch.'
    }
  ];

  Blockly.defineBlocksWithJsonArray(actionBlocks);
}

/**
 * Custom Dark Theme for CodeVerse Blockly editor.
 */
export const codeVerseDarkTheme = Blockly.Theme.defineTheme('codeverseDark', {
  base: Blockly.Themes.Classic,
  componentStyles: {
    workspaceBackgroundColour: '#0e1520',
    toolboxBackgroundColour: '#131d2b',
    toolboxForegroundColour: '#9cb3c9',
    flyoutBackgroundColour: '#162232',
    flyoutForegroundColour: '#e6edf3',
    flyoutOpacity: 0.98,
    scrollbarColour: '#2a3e56',
    scrollbarOpacity: 0.75,
    insertionMarkerColour: '#38bdf8',
    insertionMarkerOpacity: 0.85,
    markerColour: '#38bdf8',
    cursorColour: '#38bdf8'
  },
  fontStyle: {
    family: "'JetBrains Mono', monospace",
    weight: '600',
    size: 11
  }
});

/**
 * Custom Light Theme for CodeVerse Blockly editor.
 */
export const codeVerseLightTheme = Blockly.Theme.defineTheme('codeverseLight', {
  base: Blockly.Themes.Classic,
  componentStyles: {
    workspaceBackgroundColour: '#f8fafc',
    toolboxBackgroundColour: '#ffffff',
    toolboxForegroundColour: '#334155',
    flyoutBackgroundColour: '#ffffff',
    flyoutForegroundColour: '#0f172a',
    flyoutOpacity: 0.98,
    scrollbarColour: '#cbd5e1',
    scrollbarOpacity: 0.75,
    insertionMarkerColour: '#0284c7',
    insertionMarkerOpacity: 0.85,
    markerColour: '#0284c7',
    cursorColour: '#0284c7'
  },
  fontStyle: {
    family: "'JetBrains Mono', monospace",
    weight: '600',
    size: 11
  }
});

/**
 * Custom Soft Contrast Theme for CodeVerse Blockly editor.
 */
export const codeVerseSoftTheme = Blockly.Theme.defineTheme('codeverseSoft', {
  base: Blockly.Themes.Classic,
  componentStyles: {
    workspaceBackgroundColour: '#1a2029',
    toolboxBackgroundColour: '#232934',
    toolboxForegroundColour: '#97a6b8',
    flyoutBackgroundColour: '#262c38',
    flyoutForegroundColour: '#dbe3ed',
    flyoutOpacity: 0.98,
    scrollbarColour: '#3b4657',
    scrollbarOpacity: 0.75,
    insertionMarkerColour: '#5eaad9',
    insertionMarkerOpacity: 0.85,
    markerColour: '#5eaad9',
    cursorColour: '#5eaad9'
  },
  fontStyle: {
    family: "'JetBrains Mono', monospace",
    weight: '600',
    size: 11
  }
});

/**
 * Backward compatibility alias for codeVerseTheme.
 */
export const codeVerseTheme = codeVerseDarkTheme;

/**
 * Helper to select the Blockly theme matching the active application theme.
 */
export function getBlocklyTheme(themeName) {
  if (themeName === 'light') return codeVerseLightTheme;
  if (themeName === 'soft') return codeVerseSoftTheme;
  return codeVerseDarkTheme;
}

/**
 * Standard toolbox configuration with Actions, Control, and Sensors.
 */
export const gameToolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Actions',
      colour: '#06b6d4',
      contents: [
        { kind: 'block', type: 'cv_move' },
        { kind: 'block', type: 'cv_left' },
        { kind: 'block', type: 'cv_right' },
        { kind: 'block', type: 'cv_collect' },
        { kind: 'block', type: 'cv_jump' },
        { kind: 'block', type: 'cv_activate' },
        { kind: 'block', type: 'cv_pulse' }
      ]
    },
    {
      kind: 'category',
      name: 'Control',
      colour: '#8b5cf6',
      contents: [
        { kind: 'block', type: 'cv_repeat' },
        { kind: 'block', type: 'cv_if' },
        { kind: 'block', type: 'cv_if_else' },
        {
          kind: 'block',
          type: 'controls_repeat_ext',
          inputs: {
            TIMES: {
              shadow: {
                type: 'math_number',
                fields: { NUM: 3 }
              }
            }
          }
        },
        { kind: 'block', type: 'controls_if' }
      ]
    },
    {
      kind: 'category',
      name: 'Sensors',
      colour: '#10b981',
      contents: [
        { kind: 'block', type: 'cv_sensor' }
      ]
    }
  ]
};
