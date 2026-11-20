import * as Blockly from 'blockly';
import 'blockly/blocks';
import * as En from 'blockly/msg/en';
import { getLevelCurriculum } from '../../../../../shared/curriculum.js';

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
      tooltip: 'Move Forward: Advance the drone one tile forward in its current facing direction.\nWhen to use: To step forward onto open floor tiles.\nSyntax: move()'
    },
    {
      type: 'cv_left',
      message0: 'turn left ↶',
      previousStatement: null,
      nextStatement: null,
      colour: 215,
      tooltip: 'Turn Left ↶: Rotate the drone 90 degrees counter-clockwise in place without changing position.\nWhen to use: To reorient heading before stepping.\nSyntax: turnLeft()'
    },
    {
      type: 'cv_right',
      message0: 'turn right ↷',
      previousStatement: null,
      nextStatement: null,
      colour: 215,
      tooltip: 'Turn Right ↷: Rotate the drone 90 degrees clockwise in place without changing position.\nWhen to use: To reorient heading before stepping.\nSyntax: turnRight()'
    },
    {
      type: 'cv_collect',
      message0: 'collect energy ◈',
      previousStatement: null,
      nextStatement: null,
      colour: 45,
      tooltip: 'Collect Energy ◈: Pick up an energy shard on the drone’s current tile.\nWhen to use: When standing directly on a diamond shard (C) tile.\nSyntax: collect()'
    },
    {
      type: 'cv_jump',
      message0: 'jump across breach',
      previousStatement: null,
      nextStatement: null,
      colour: 275,
      tooltip: 'Jump Across Breach: Leap forward exactly two tiles in current heading.\nWhen to use: To fly safely over red corruption hazards (H) or gaps.\nSyntax: jump()'
    },
    {
      type: 'cv_activate',
      message0: 'activate terminal ⌘',
      previousStatement: null,
      nextStatement: null,
      colour: 155,
      tooltip: 'Activate Terminal ⌘: Trigger a switch on the current tile to deploy retracted bridges.\nWhen to use: When standing directly on a terminal (T) tile.\nSyntax: activate()'
    },
    {
      type: 'cv_pulse',
      message0: 'fire pulse ⚡',
      previousStatement: null,
      nextStatement: null,
      colour: 330,
      tooltip: 'Fire Pulse ⚡: Emit an energy pulse straight forward (1 to 3 tiles).\nWhen to use: Align with firewall guardian (X) to deplete its shield.\nSyntax: pulse()'
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
      tooltip: 'Sensor Input: Scan environmental conditions around the drone.\nWhen to use: Snap into the condition slot of an If or If/Else block.\nSyntax: sensor("wall")'
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
      tooltip: 'Repeat N Times: Loop enclosed blocks a specified number of times.\nWhen to use: To eliminate repetitive actions and keep code within budget.\nSyntax: repeat(N) { ... }'
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
      tooltip: 'If Condition: Execute enclosed actions only when the attached sensor condition is true.\nWhen to use: To adapt actions based on real-time board sensing.\nSyntax: if (sensor) { ... }'
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
      tooltip: 'If / Else Branch: Two-way decision. Runs first branch if true, otherwise runs else branch.\nWhen to use: To handle branching paths like wall avoidance.\nSyntax: if (sensor) { ... } else { ... }'
    },
    {
      type: 'cv_var_set',
      message0: 'set variable %1 to %2',
      args0: [
        {
          type: 'field_input',
          name: 'VAR',
          text: 'count'
        },
        {
          type: 'field_number',
          name: 'VALUE',
          value: 0,
          min: -10000,
          max: 10000,
          precision: 1
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 310,
      tooltip: 'Set Variable: Store a value in a named variable.\nWhen to use: To initialize or reassign a variable.\nSyntax: let count = 0;'
    },
    {
      type: 'cv_var_change',
      message0: 'change %1 by %2',
      args0: [
        {
          type: 'field_input',
          name: 'VAR',
          text: 'count'
        },
        {
          type: 'field_number',
          name: 'AMOUNT',
          value: 1,
          min: -10000,
          max: 10000,
          precision: 1
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 310,
      tooltip: 'Change Variable: Increment or decrement a variable by an integer amount.\nWhen to use: Inside a loop to track progress or steps.\nSyntax: count += 1;'
    },
    {
      type: 'cv_var_get',
      message0: 'variable %1',
      args0: [
        {
          type: 'field_input',
          name: 'VAR',
          text: 'count'
        }
      ],
      output: null,
      colour: 310,
      tooltip: 'Variable Value: Read the value currently stored in a variable.\nWhen to use: Plug into comparison blocks.\nSyntax: count'
    },
    {
      type: 'cv_compare',
      message0: '%1 %2 %3',
      args0: [
        {
          type: 'input_value',
          name: 'LEFT'
        },
        {
          type: 'field_dropdown',
          name: 'OP',
          options: [
            ['<', '<'],
            ['<=', '<='],
            ['==', '=='],
            ['!=', '!='],
            ['>', '>'],
            ['>=', '>=']
          ]
        },
        {
          type: 'input_value',
          name: 'RIGHT'
        }
      ],
      output: 'Boolean',
      colour: 140,
      tooltip: 'Compare: Compare two values (<, <=, ==, !=, >, >=).\nWhen to use: Snap into the condition slot of an If or While block.\nSyntax: a < b'
    },
    {
      type: 'cv_while',
      message0: 'repeat while %1 %2 %3',
      args0: [
        {
          type: 'input_value',
          name: 'CONDITION',
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
      colour: 245,
      tooltip: 'While Loop: Repeat enclosed actions while condition remains true.\nWhen to use: For repeating actions until a variable counter reaches a threshold.\nSyntax: while (condition) { ... }'
    },
    {
      type: 'cv_val_num',
      message0: '%1',
      args0: [
        {
          type: 'field_number',
          name: 'NUM',
          value: 0,
          min: -10000,
          max: 10000,
          precision: 1
        }
      ],
      output: 'Number',
      colour: 140,
      tooltip: 'Number: An integer value to plug into comparison blocks.'
    },
    {
      type: 'cv_fn_def',
      message0: 'define routine %1 %2 %3',
      args0: [
        {
          type: 'field_input',
          name: 'NAME',
          text: 'my_routine'
        },
        {
          type: 'input_dummy'
        },
        {
          type: 'input_statement',
          name: 'DO'
        }
      ],
      colour: 285,
      tooltip: 'Define Routine: Bundle reusable instructions under a name.\nWhen to use: To eliminate repeated command sequences.\nSyntax: function name() { ... }'
    },
    {
      type: 'cv_fn_def_param',
      message0: 'define routine %1 with parameter %2 %3 %4',
      args0: [
        {
          type: 'field_input',
          name: 'NAME',
          text: 'my_routine'
        },
        {
          type: 'field_input',
          name: 'PARAM',
          text: 'steps'
        },
        {
          type: 'input_dummy'
        },
        {
          type: 'input_statement',
          name: 'DO'
        }
      ],
      colour: 285,
      tooltip: 'Define Routine with Parameter: Reusable instructions receiving a numeric parameter.\nWhen to use: To parameterize distance, repeats, or comparisons.\nSyntax: function name(param) { ... }'
    },
    {
      type: 'cv_fn_call',
      message0: 'call routine %1',
      args0: [
        {
          type: 'field_input',
          name: 'NAME',
          text: 'my_routine'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 285,
      tooltip: 'Call Routine: Execute a defined routine from your program.\nWhen to use: When you want to run your routine.\nSyntax: name();'
    },
    {
      type: 'cv_fn_call_param',
      message0: 'call routine %1 with %2',
      args0: [
        {
          type: 'field_input',
          name: 'NAME',
          text: 'my_routine'
        },
        {
          type: 'input_value',
          name: 'ARG'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 285,
      tooltip: 'Call Routine with Argument: Pass a numeric argument into a routine.\nWhen to use: To invoke a parameterized routine with different values.\nSyntax: name(value);'
    },
    {
      type: 'cv_array_create',
      message0: 'create array %1 with values %2',
      args0: [
        {
          type: 'field_input',
          name: 'NAME',
          text: 'cells'
        },
        {
          type: 'field_input',
          name: 'VALUES',
          text: '1, 2, 3'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 35,
      tooltip: 'Create Array: Create a fixed-length list of integer values stored in memory cells.\nWhen to use: When storing a sequence of codes or energy values.\nSyntax: cells = [1, 2, 3];'
    },
    {
      type: 'cv_array_get',
      message0: '%1 [ %2 ]',
      args0: [
        {
          type: 'field_input',
          name: 'NAME',
          text: 'cells'
        },
        {
          type: 'input_value',
          name: 'INDEX',
          check: 'Number'
        }
      ],
      output: 'Number',
      colour: 35,
      tooltip: 'Read Array Element: Read the item at zero-based index (0 to length - 1).\nWhen to use: To inspect an array cell value.\nSyntax: cells[index]'
    },
    {
      type: 'cv_array_set',
      message0: 'set %1 [ %2 ] to %3',
      args0: [
        {
          type: 'field_input',
          name: 'NAME',
          text: 'cells'
        },
        {
          type: 'input_value',
          name: 'INDEX',
          check: 'Number'
        },
        {
          type: 'input_value',
          name: 'VALUE',
          check: 'Number'
        }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 35,
      tooltip: 'Update Array Element: Change the value stored at a zero-based index.\nWhen to use: To modify an energy cell or buffer element.\nSyntax: cells[index] = value;'
    },
    {
      type: 'cv_array_length',
      message0: 'length of %1',
      args0: [
        {
          type: 'field_input',
          name: 'NAME',
          text: 'cells'
        }
      ],
      output: 'Number',
      colour: 35,
      tooltip: 'Array Length: Returns the number of cells in the array.\nWhen to use: In loop conditions like i < length of cells.\nSyntax: cells.length'
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
 * Standard toolbox configuration with Actions, Variables, Control, and Logic/Sensors.
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
      name: 'Variables',
      colour: '#ec4899',
      contents: [
        { kind: 'block', type: 'cv_var_set' },
        { kind: 'block', type: 'cv_var_change' },
        { kind: 'block', type: 'cv_var_get' }
      ]
    },
    {
      kind: 'category',
      name: 'Control',
      colour: '#8b5cf6',
      contents: [
        { kind: 'block', type: 'cv_repeat' },
        {
          kind: 'block',
          type: 'cv_while',
          inputs: {
            CONDITION: {
              shadow: {
                type: 'cv_compare',
                fields: { OP: '<' },
                inputs: {
                  LEFT: {
                    shadow: {
                      type: 'cv_var_get',
                      fields: { VAR: 'count' }
                    }
                  },
                  RIGHT: {
                    shadow: {
                      type: 'math_number',
                      fields: { NUM: 5 }
                    }
                  }
                }
              }
            }
          }
        },
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
        {
          kind: 'block',
          type: 'cv_compare',
          inputs: {
            LEFT: {
              shadow: {
                type: 'cv_var_get',
                fields: { VAR: 'count' }
              }
            },
            RIGHT: {
              shadow: {
                type: 'math_number',
                fields: { NUM: 3 }
              }
            }
          }
        },
        { kind: 'block', type: 'cv_sensor' },
        { kind: 'block', type: 'math_number' }
      ]
    },
    {
      kind: 'category',
      name: 'Routines',
      colour: '#a855f7',
      contents: [
        { kind: 'block', type: 'cv_fn_def' },
        { kind: 'block', type: 'cv_fn_def_param' },
        { kind: 'block', type: 'cv_fn_call' },
        {
          kind: 'block',
          type: 'cv_fn_call_param',
          inputs: {
            ARG: {
              shadow: {
                type: 'math_number',
                fields: { NUM: 3 }
              }
            }
          }
        }
      ]
    },
    {
      kind: 'category',
      name: 'Arrays',
      colour: '#f59e0b',
      contents: [
        { kind: 'block', type: 'cv_array_create' },
        {
          kind: 'block',
          type: 'cv_array_get',
          inputs: {
            INDEX: {
              shadow: {
                type: 'math_number',
                fields: { NUM: 0 }
              }
            }
          }
        },
        {
          kind: 'block',
          type: 'cv_array_set',
          inputs: {
            INDEX: {
              shadow: {
                type: 'math_number',
                fields: { NUM: 0 }
              }
            },
            VALUE: {
              shadow: {
                type: 'math_number',
                fields: { NUM: 1 }
              }
            }
          }
        },
        { kind: 'block', type: 'cv_array_length' }
      ]
    }
  ]
};

/**
 * Returns a staged, progressive toolbox tailored to the active level curriculum.
 * If showAll is true or level is not provided, returns the full standard toolbox.
 *
 * @param {object | null} level
 * @param {boolean} showAll
 * @returns {object} Blockly category toolbox definition
 */
export function getToolboxForLevel(level, showAll = false) {
  if (showAll || !level) {
    return gameToolbox;
  }

  const curriculum = getLevelCurriculum(level.id);
  const allowed = new Set(curriculum?.allowedBlocks || []);
  if (allowed.size === 0) return gameToolbox;

  const categories = [];

  for (const cat of gameToolbox.contents) {
    const filteredBlocks = cat.contents.filter((item) => {
      if (item.type && allowed.has(item.type)) return true;
      // Allow controls_repeat_ext if cv_repeat is allowed
      if (item.type === 'controls_repeat_ext' && allowed.has('cv_repeat')) return true;
      if (item.type === 'controls_if' && (allowed.has('cv_if') || allowed.has('cv_if_else'))) return true;
      // Allow math_number if cv_compare, cv_var_set, cv_array_get, or cv_array_set is allowed
      if (item.type === 'math_number' && (allowed.has('cv_compare') || allowed.has('cv_var_set') || allowed.has('cv_var_change') || allowed.has('cv_fn_call_param') || allowed.has('cv_val_num') || allowed.has('cv_array_get') || allowed.has('cv_array_set'))) return true;
      return false;
    });

    if (filteredBlocks.length > 0) {
      categories.push({
        ...cat,
        contents: filteredBlocks
      });
    }
  }

  if (categories.length === 0) return gameToolbox;

  return {
    kind: 'categoryToolbox',
    contents: categories
  };
}
