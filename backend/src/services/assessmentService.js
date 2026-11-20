import { levels, simulate } from '../../../shared/game.js';

/**
 * Authoritative private assessment suites for search algorithm verification.
 * Stored strictly on the backend and completely absent from public frontend bundles and API payloads.
 */
export const LEVEL_ASSESSMENTS = {
  47: {
    type: 'linear',
    arrayName: 'codes',
    targetVar: 'target',
    foundVar: 'found',
    fixtures: [
      // 1. Target present in middle (original displayed target)
      { array: [14, 9, 27, 42, 6], target: 27, desc: 'Target in middle of array' },
      // 2. Target absent
      { array: [14, 9, 27, 42, 6], target: 99, desc: 'Target absent from array' },
      // 3. Target at start (index 0)
      { array: [100, 200, 300], target: 100, desc: 'Target at first element (index 0)' },
      // 4. Target at end (last index)
      { array: [5, 12, 19, 31, 88], target: 88, desc: 'Target at last element' },
      // 5. Duplicates (linear search requires first matching index)
      { array: [7, 7, 7, 7], target: 7, desc: 'Duplicate elements - first matching index required' },
      // 6. Single-element array (found)
      { array: [42], target: 42, desc: 'Single-element array (target present)' },
      // 7. Single-element array (missing)
      { array: [42], target: 99, desc: 'Single-element array (target absent)' },
      // 8. Empty array
      { array: [], target: 15, desc: 'Empty array (target absent)' },
      // 9. Varied array different from displayed example
      { array: [8, 3, 11, 24], target: 11, desc: 'Varied array elements' }
    ]
  },
  50: {
    type: 'binary',
    arrayName: 'coreKeys',
    targetVar: 'target',
    foundVar: 'found',
    fixtures: [
      // 1. Target in middle (original displayed target)
      { array: [1, 5, 12, 18, 25, 33, 42, 59], target: 18, desc: 'Target present in middle' },
      // 2. Target at first index
      { array: [1, 5, 12, 18, 25, 33, 42, 59], target: 1, desc: 'Target at minimum bound (index 0)' },
      // 3. Target at last index
      { array: [1, 5, 12, 18, 25, 33, 42, 59], target: 59, desc: 'Target at maximum bound (last index)' },
      // 4. Absent within range
      { array: [1, 5, 12, 18, 25, 33, 42, 59], target: 20, desc: 'Target absent within range' },
      // 5. Absent below range
      { array: [1, 5, 12, 18, 25, 33, 42, 59], target: 0, desc: 'Target absent below minimum' },
      // 6. Absent above range
      { array: [1, 5, 12, 18, 25, 33, 42, 59], target: 99, desc: 'Target absent above maximum' },
      // 7. Single-element array (found)
      { array: [10], target: 10, desc: 'Single-element sorted array (found)' },
      // 8. Single-element array (missing)
      { array: [10], target: 5, desc: 'Single-element sorted array (missing)' },
      // 9. Empty array
      { array: [], target: 10, desc: 'Empty sorted array (missing)' },
      // 10. Sorted array with duplicates (any matching index acceptable)
      { array: [2, 4, 4, 4, 8, 16], target: 4, desc: 'Duplicates in sorted array' },
      // 11. Varied sorted array with negative numbers
      { array: [-50, -20, -5, 0, 15, 30], target: -5, desc: 'Sorted array with negative elements' },
      // 12. Odd-length sorted array
      { array: [3, 9, 21, 35, 47, 51, 68], target: 35, desc: 'Odd-length sorted array' },
      // 13. 10-element sorted array with target at end to enforce logarithmic efficiency
      { array: [2, 5, 8, 12, 16, 23, 38, 45, 56, 72], target: 72, desc: '10-element sorted array target at end' }
    ]
  }
};

/**
 * Authoritatively executes learner program against private test fixtures for algorithmic levels.
 *
 * @param {number} levelId
 * @param {Array<object>} program
 * @returns {{ passed: boolean, message?: string }}
 */
export function runLevelAssessment(levelId, program) {
  const assessment = LEVEL_ASSESSMENTS[levelId];
  if (!assessment) {
    return { passed: true };
  }

  const level = levels.find((l) => l.id === levelId);
  if (!level) {
    return { passed: true };
  }

  for (const fixture of assessment.fixtures) {
    let simOutcome;
    try {
      simOutcome = simulate(level, program, {
        isAssessmentCase: true,
        isTestCase: true,
        initialArraysOverride: { [assessment.arrayName]: [...fixture.array] },
        initialVariablesOverride: {
          [assessment.targetVar]: fixture.target,
          [assessment.foundVar]: -1,
          i: 0,
          low: 0,
          high: fixture.array.length - 1
        },
        readOnlyVariables: [assessment.targetVar],
        readOnlyArrays: [assessment.arrayName]
      });
    } catch (err) {
      return {
        passed: false,
        message: `Assessment failed on test case ("${fixture.desc}"): Runtime error: ${err.message}`
      };
    }

    // 1. Every evaluation case must satisfy successful termination without interpreter/runtime failure
    if (!simOutcome.passed || simOutcome.state?.crashed) {
      return {
        passed: false,
        message: `Assessment failed on test case ("${fixture.desc}"): Program halted or crashed before completion (${simOutcome.message || 'Simulation stopped'}).`
      };
    }

    // 2. The required result
    const studentFound = simOutcome.state.variables[assessment.foundVar] ?? -1;

    if (assessment.type === 'linear') {
      const isPresent = fixture.array.includes(fixture.target);
      if (isPresent) {
        const expectedIndex = fixture.array.indexOf(fixture.target);
        if (studentFound !== expectedIndex) {
          return {
            passed: false,
            message: `Linear search evaluation failed on test case ("${fixture.desc}"): Expected first matching index ${expectedIndex}, but received ${studentFound}.`
          };
        }
      } else {
        if (studentFound !== -1) {
          return {
            passed: false,
            message: `Linear search evaluation failed on test case ("${fixture.desc}"): Expected -1 for absent target, but received ${studentFound}.`
          };
        }
      }

      // Check early loop termination if required by level
      if (level.requireSearchExit && isPresent && fixture.array.length > 1 && simOutcome.executedBreaks === 0) {
        return {
          passed: false,
          message: `Linear search evaluation failed on test case ("${fixture.desc}"): Did not break out of loop early once target was found.`
        };
      }
    } else if (assessment.type === 'binary') {
      const isPresent = fixture.array.includes(fixture.target);
      if (isPresent) {
        const isValidMatch =
          studentFound >= 0 &&
          studentFound < fixture.array.length &&
          fixture.array[studentFound] === fixture.target;

        if (!isValidMatch) {
          return {
            passed: false,
            message: `Binary search evaluation failed on test case ("${fixture.desc}"): Index ${studentFound} does not contain target ${fixture.target}.`
          };
        }
      } else {
        if (studentFound !== -1) {
          return {
            passed: false,
            message: `Binary search evaluation failed on test case ("${fixture.desc}"): Expected -1 for absent target, but received ${studentFound}.`
          };
        }
      }

      // Binary search logarithmic efficiency limit (at most 3 comparisons per halving iteration + 1 exit)
      const maxIter = fixture.array.length > 0 ? Math.floor(Math.log2(fixture.array.length)) + 1 : 0;
      const maxComparisonsBudget = fixture.array.length > 0 ? 3 * maxIter + 1 : 1;
      if (simOutcome.executedComparisons > maxComparisonsBudget) {
        return {
          passed: false,
          message: `Binary search comparison budget exceeded on test case ("${fixture.desc}"): ${simOutcome.executedComparisons} comparisons performed (budget: ${maxComparisonsBudget}). Expected logarithmic search efficiency.`
        };
      }
    }
  }

  return { passed: true };
}
