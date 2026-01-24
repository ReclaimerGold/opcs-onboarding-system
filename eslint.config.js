/**
 * Shared ESLint rules for all workspaces
 */
export const sharedRules = {
  // Naming conventions
  camelcase: ["warn", { properties: "never", ignoreDestructuring: true }],

  // ES6+ enforcement
  "prefer-const": "error",
  "prefer-arrow-callback": "warn",
  "prefer-destructuring": ["warn", { array: false, object: true }],
  "no-var": "error",
  "object-shorthand": "warn",

  // General
  "no-unused-vars": ["warn"],
  "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
};

/**
 * Shared language options
 */
export const sharedLanguageOptions = {
  ecmaVersion: "latest",
  sourceType: "module",
};
