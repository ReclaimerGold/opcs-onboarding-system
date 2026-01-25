import { sharedRules, sharedLanguageOptions } from "../eslint.config.js";

export default [
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**", "coverage/**"],
    languageOptions: {
      ...sharedLanguageOptions,
      globals: {
        // Node.js globals
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
      },
    },
    rules: {
      ...sharedRules,
      // Backend-specific overrides
      "no-console": "off",
    },
  },
];
