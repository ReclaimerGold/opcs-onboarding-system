import vue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import { sharedRules, sharedLanguageOptions } from "../eslint.config.js";

export default [
  {
    files: ["**/*.{js,vue}"],
    ignores: ["node_modules/**"],
    languageOptions: {
      ...sharedLanguageOptions,
      // TypeScript support: vue-tsc handles type checking.
      // Add @typescript-eslint/parser when TS linting is needed.
      parser: vueParser,
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
      },
    },
    plugins: {
      vue,
    },
    rules: {
      ...sharedRules,
      // Vue-specific rules
      "vue/multi-word-component-names": "off",
      "vue/component-api-style": ["error", ["script-setup"]],
      "vue/define-macros-order": ["warn", { order: ["defineProps", "defineEmits"] }],
      "vue/no-unused-vars": "warn",
      "vue/block-order": ["warn", { order: ["template", "script", "style"] }],
      // Frontend-specific overrides
      "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    },
    settings: {},
  },
];
