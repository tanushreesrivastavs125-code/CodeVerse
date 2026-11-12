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
 * Custom dark cyber theme for CodeVerse Blockly editor.
 */
export const codeVerseTheme = Blockly.Theme.defineTheme('codeverseCyber', {
  base: Blockly.Themes.Classic,
  componentStyles: {
    workspaceBackgroundColour: '#0b0f19',
    toolboxBackgroundColour: '#111827',
    toolboxForegroundColour: '#9ca3af',
    flyoutBackgroundColour: '#1f2937',
    flyoutForegroundColour: '#f3f4f6',
    flyoutOpacity: 0.95,
    scrollbarColour: '#374151',
    scrollbarOpacity: 0.7,
    insertionMarkerColour: '#06b6d4',
    insertionMarkerOpacity: 0.8,
    markerColour: '#06b6d4',
    cursorColour: '#06b6d4'
  },
  fontStyle: {
    family: "'JetBrains Mono', monospace",
    weight: '600',
    size: 11
  }
});

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
