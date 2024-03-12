import type { FromDuckDbThis } from '../internal-types';
import type {
  GridFilterRule,
  GridFilterTarget,
  GridSavedFilter,
  GridSavedSimpleFilter,
} from '@datadocs/canvas-datagrid-ng';
import { deepCopyFilterTarget } from '@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/utils';
import { Tick } from '../utils';
import {
  GRID_FILTER_CONDITION_TYPE_FORMULA,
  GRID_FILTER_SIMPLE_RULE_LIMIT,
} from '@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/constants';

export async function setFilterNg(
  this: FromDuckDbThis,
  filterTarget: GridFilterTarget,
  columnId: string,
) {
  const previous = this.currentFilter
    ? structuredClone(this.currentFilter)
    : undefined;
  const isAdvanced = !columnId;

  filterTarget =
    !filterTarget || filterTarget.filter.rules.length === 0
      ? undefined
      : deepCopyFilterTarget(filterTarget);

  if (columnId) {
    const savedFilter = getSimpleFilter(this.currentFilter);

    if (filterTarget) {
      savedFilter.targets[columnId] = filterTarget;
    } else {
      delete savedFilter.targets[columnId];
    }

    if (Object.keys(savedFilter).length > 0) {
      this.currentFilter = savedFilter;
    } else {
      this.currentFilter = undefined;
    }
  } else {
    if (filterTarget) {
      const target = deepCopyFilterTarget(filterTarget);
      this.currentFilter = {
        type: 'advanced',
        target,
        simplified: trySimplifyingFilter(deepCopyFilterTarget(target)),
      };
    } else {
      this.currentFilter = undefined;
    }
  }

  const dispatchEvent = () => {
    this.dispatchEvent({
      name: 'filter',
      previous,
      current: structuredClone(this.currentFilter),
    });
  };

  if (await this.rowsLoader.updateState()) {
    this.updateState();
    dispatchEvent();
    const t = new Tick('preload for setFilter');
    const promises = this.preload();
    if (promises.wait) await promises.wait;
    t.tick('wait');
    if (promises.idle) {
      setTimeout(() => {
        t.tick();
        promises.idle().then(() => t.tick('idle'));
      }, 15);
    }
    return true;
  }

  if (isAdvanced) {
    console.info("Saved an advanced filter that didn't change the query");
    dispatchEvent();
  } else {
    this.currentFilter = previous;
  }
  return false;
}

export function trySimplifyingFilter(
  filterTarget: GridFilterTarget,
): GridSavedSimpleFilter | undefined {
  const simplified = simplifyRule(filterTarget.filter);

  if (!simplified) {
    filterTarget.filter.rules = [];
  } else if (simplified.type === 'group') {
    filterTarget.filter = simplified;
  } else {
    filterTarget.filter.rules = [simplified];
  }

  const { rules } = filterTarget.filter;
  const targets: Record<string, GridFilterTarget> = {};

  for (const rule of rules) {
    if (rule.type == 'group') {
      if (rule.rules.length > GRID_FILTER_SIMPLE_RULE_LIMIT) return;
      let previousColumnId: string | undefined;
      for (const subrule of rule.rules) {
        // Deeply nested groups or a single-level group that targets multiple
        // fields are considered advanced.

        if (
          subrule.type === 'group' ||
          (previousColumnId && previousColumnId !== subrule.target.columnId) ||
          (subrule.target.conditionType ===
            GRID_FILTER_CONDITION_TYPE_FORMULA &&
            !subrule.target.columnId)
        ) {
          return;
        }
        previousColumnId = subrule.target.columnId;
      }

      const existingTarget = targets[previousColumnId];
      // Merging of two groups targeting the same field requires the use of the
      // same conjunction, and also the total condition size shouldn't exceed
      // the simple filter limit.
      if (
        existingTarget &&
        (existingTarget.filter.conjunction !== rule.conjunction ||
          existingTarget.filter.rules.length + rule.rules.length >
            GRID_FILTER_SIMPLE_RULE_LIMIT)
      ) {
        return;
      }

      if (existingTarget) {
        for (const subrule of rule.rules) {
          existingTarget.filter.rules.push(subrule);
        }
      } else {
        targets[previousColumnId] = {
          filter: rule,
        };
      }
    } else {
      let target = targets[rule.target.columnId];
      if (!target) {
        target = {
          filter: {
            conjunction: filterTarget.filter.conjunction,
            type: 'group',
            rules: [],
          },
        };
        targets[rule.target.columnId] = target;
      }

      if (target.filter.rules.length >= GRID_FILTER_SIMPLE_RULE_LIMIT) return;
      target.filter.rules.push(rule);
    }
  }

  // By design, simple filters targeting different fields can only use the
  // conjunction "and". So, if there are multiple fields defined in the advanced
  // filter and the top-level group is using "or", it cannot be simplified.
  if (
    Object.values(targets).length > 1 &&
    filterTarget.filter.conjunction === 'or'
  ) {
    return;
  }

  return {
    type: 'simple',
    targets,
  };
}

function getSimpleFilter(
  savedFilter: GridSavedFilter | undefined,
): GridSavedSimpleFilter | undefined {
  if (savedFilter?.type === 'advanced') {
    return savedFilter.simplified;
  }
  return savedFilter ?? { type: 'simple', targets: {} };
}

function simplifyRule(rule: GridFilterRule): GridFilterRule {
  if (rule.type == 'condition') return rule;

  const { rules } = rule;
  const newRules: GridFilterRule[] = [];
  for (const subrule of rules) {
    const simplified = simplifyRule(subrule);
    if (!simplified) continue;

    newRules.push(simplified);
  }

  if (newRules.length === 0) return;
  if (newRules.length === 1) return newRules[0];

  rule.rules = newRules;
  return rule;
}
