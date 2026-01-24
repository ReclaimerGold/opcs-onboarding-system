module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-essential', // Less strict than vue3-recommended
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Vue-specific (per CONTRIBUTING.md)
    'vue/multi-word-component-names': 'off', // Allow Step1W4Form.vue pattern
    'vue/component-api-style': ['error', ['script-setup']], // Enforce <script setup>
    'vue/define-macros-order': ['warn', { order: ['defineProps', 'defineEmits'] }],
    'vue/no-unused-vars': 'warn',
    'vue/block-order': ['warn', { order: ['template', 'script', 'style'] }], // Match CONTRIBUTING.md structure
    
    // Naming conventions (per CONTRIBUTING.md: camelCase for variables/functions)
    'camelcase': ['warn', { properties: 'never', ignoreDestructuring: true }],
    
    // ES6+ enforcement (per CONTRIBUTING.md: async/await, destructuring, arrow functions)
    'prefer-const': 'error',
    'prefer-arrow-callback': 'warn',
    'prefer-destructuring': ['warn', { array: false, object: true }],
    'no-var': 'error',
    'object-shorthand': 'warn',
    
    // General
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
  },
}
