/** @type {import("eslint").Linter.Config} */
const config = {
  extends: "./.eslintrc.cjs",
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
    "unused-imports/no-unused-imports": "warn",
  },
};

module.exports = config;
