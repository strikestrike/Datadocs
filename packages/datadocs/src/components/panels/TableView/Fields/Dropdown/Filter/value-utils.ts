import type {
  GridFilterCondition,
  GridFilterRule,
} from "@datadocs/canvas-datagrid-ng";

export function getCurrentCondition(
  rule: GridFilterRule,
  isValueHelper = false
): GridFilterCondition | undefined {
  if (isValueHelper) {
    if (rule.type === "condition") {
      return rule;
    }
  } else if (
    rule.type === "group" &&
    rule.rules.length === 1 &&
    rule.rules[0].type === "condition"
  ) {
    return rule.rules[0];
  }
}
