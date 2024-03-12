//@ts-check
/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ["@commitlint/config-conventional"],
  /**
   * `[0]` represents disabling the rule
   * @see https://github.com/conventional-changelog/commitlint/blob/master/docs/reference-rules.md
   */
  rules: {
    "header-max-length": [0],
    "footer-max-length": [0],
    "body-max-line-length": [0],
    "type-enum": [
      2,
      "always",
      [
        "build", // Changes to the build process or external dependencies affecting the exported artifacts
        "chore", // Maintaining the project only
        "ci", // Changes in CI code/configurations
        "deps", // Commit for updating dependencies/lock-file
        "docs", // Commit containing only document changes
        "feat", // A new feature
        "fix", // A bug fix
        "perf", // A code change that improves performance
        "refactor", // A code change that neither fixes a bug, nor adds a feature, nor implement a performance improvement
        "revert", // Revert a previous commit
        "style", // Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
        "test", // Adding/Updating tests 
        "wip", // Working in progress
      ],
    ],
    "subject-case": [1, "always", ["sentence-case"]],
  },
};
module.exports = config;
