/**
 * Canonical beginner learning curriculum seed data for CodeVerse.
 * Covers foundational computational thinking and progressive web/logic realms.
 */
export const beginnerTopics = [
  {
    title: 'Computational Thinking',
    slug: 'computational-thinking',
    description: 'Master foundational algorithmic logic, sequential instructions, and pattern decomposition.',
    category: 'core',
    difficulty: 'beginner',
    order: 1,
    isActive: true,
    isLocked: false,
    concepts: [
      {
        title: 'Algorithmic Sequencing',
        slug: 'algorithmic-sequencing',
        description: 'Step-by-step instruction execution and order of operations.',
        order: 1
      },
      {
        title: 'Pattern Recognition',
        slug: 'pattern-recognition',
        description: 'Identifying repeated structures and recurring logic.',
        order: 2
      },
      {
        title: 'Problem Decomposition',
        slug: 'problem-decomposition',
        description: 'Breaking complex challenges into solvable micro-steps.',
        order: 3
      }
    ]
  },
  {
    title: 'HTML Structure Realm',
    slug: 'html-structure',
    description: 'Explore the Structure Realm: build web page skeletons using semantic elements and layout hierarchy.',
    category: 'frontend',
    difficulty: 'beginner',
    order: 2,
    isActive: true,
    isLocked: false,
    concepts: [
      {
        title: 'Elements & Tags',
        slug: 'elements-and-tags',
        description: 'Syntax of opening tags, attributes, content, and closing tags.',
        order: 1
      },
      {
        title: 'Document Tree Hierarchy',
        slug: 'document-tree',
        description: 'Parent, child, and sibling relationships in the DOM tree.',
        order: 2
      },
      {
        title: 'Semantic Page Markup',
        slug: 'semantic-markup',
        description: 'Using header, main, section, nav, and footer for accessible structure.',
        order: 3
      }
    ]
  },
  {
    title: 'CSS Style Realm',
    slug: 'css-styling',
    description: 'Enter the Style Realm: transform raw markup into visual experiences with colors, selectors, and the box model.',
    category: 'frontend',
    difficulty: 'beginner',
    order: 3,
    isActive: true,
    isLocked: false,
    concepts: [
      {
        title: 'Selectors & Properties',
        slug: 'selectors-and-properties',
        description: 'Targeting elements with class, id, and tag selectors.',
        order: 1
      },
      {
        title: 'The Box Model',
        slug: 'box-model',
        description: 'Mastering margin, border, padding, and content dimensions.',
        order: 2
      },
      {
        title: 'Flexbox Layout Basics',
        slug: 'flexbox-basics',
        description: '1D alignment and flexible space distribution.',
        order: 3
      }
    ]
  },
  {
    title: 'Variables & Data State',
    slug: 'variables-and-data',
    description: 'Conquer the Logic Realm: store, read, and mutate data using state containers and primitive types.',
    category: 'frontend',
    difficulty: 'beginner',
    order: 4,
    isActive: true,
    isLocked: false,
    concepts: [
      {
        title: 'Variable Declarations',
        slug: 'variable-declarations',
        description: 'Using let and const to manage state and memory.',
        order: 1
      },
      {
        title: 'Primitive Data Types',
        slug: 'primitive-data-types',
        description: 'Numbers, Strings, Booleans, null, and undefined.',
        order: 2
      },
      {
        title: 'Expressions & Arithmetic',
        slug: 'expressions-and-arithmetic',
        description: 'Mathematical operators and string concatenation.',
        order: 3
      }
    ]
  },
  {
    title: 'Conditionals & Logic Gates',
    slug: 'conditionals-and-logic',
    description: 'Empower programs to make dynamic decisions using boolean logic, comparison operators, and branching.',
    category: 'dsa',
    difficulty: 'beginner',
    order: 5,
    isActive: true,
    isLocked: false,
    concepts: [
      {
        title: 'Comparison Operators',
        slug: 'comparison-operators',
        description: 'Strict equality (===), inequality (!==), and relational checks.',
        order: 1
      },
      {
        title: 'If / Else Branching',
        slug: 'if-else-branching',
        description: 'Executing alternative code paths based on state conditions.',
        order: 2
      },
      {
        title: 'Logical Gates (AND / OR / NOT)',
        slug: 'logical-gates',
        description: 'Combining compound conditions using &&, ||, and !.',
        order: 3
      }
    ]
  },
  {
    title: 'Loops & Iteration',
    slug: 'loops-and-iteration',
    description: 'Automate repetitive computational tasks and iterate through sequential data structures.',
    category: 'dsa',
    difficulty: 'beginner',
    order: 6,
    isActive: true,
    isLocked: false,
    concepts: [
      {
        title: 'While Loops',
        slug: 'while-loops',
        description: 'Executing repeated instructions while a condition remains true.',
        order: 1
      },
      {
        title: 'For Loops & Counters',
        slug: 'for-loops',
        description: 'Index-driven iteration with initializers, conditions, and increments.',
        order: 2
      },
      {
        title: 'Loop Control (Break & Continue)',
        slug: 'loop-control',
        description: 'Premature exit and cycle skipping inside iterative blocks.',
        order: 3
      }
    ]
  }
];

export default beginnerTopics;
