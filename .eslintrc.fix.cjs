/** @type {import("eslint").Linter.Config} */
const config = {
  extends: "./.eslintrc.cjs",
  plugins: ["import", "unused-imports", "@stylistic/eslint-plugin-js"],
  rules: {
    "import/order": [
      "warn",
      {
        "newlines-between": "always",
        alphabetize: { order: "asc", caseInsensitive: true },
      },
    ],
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      {
        prefer: "no-type-imports",
      },
    ],
    "@stylistic/js/padding-line-between-statements": [
      "warn",
      { blankLine: "always", prev: "import", next: "*" },
      { blankLine: "any", prev: "import", next: "import" },
      { blankLine: "always", prev: "*", next: "export" },
      { blankLine: "any", prev: "export", next: "export" },
    ],
    "unused-imports/no-unused-imports": "warn",
  },
};

module.exports = config;
