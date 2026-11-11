import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['vendor/**', 'node_modules/**', 'coverage/**', '_site/**'] },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-implicit-coercion': ['error', { allow: ['!!'] }],
      'no-restricted-properties': [
        'error',
        { object: 'document', property: 'write', message: 'Build DOM nodes instead.' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "AssignmentExpression[left.property.name='innerHTML']",
          message:
            'Do not assign innerHTML. Use the h() helper or textContent so user input is never parsed as markup.',
        },
        { selector: "AssignmentExpression[left.property.name='outerHTML']", message: 'Do not assign outerHTML.' },
        {
          selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
          message: 'Do not parse HTML strings.',
        },
      ],
    },
  },
  { files: ['js/**/*.js'], languageOptions: { globals: globals.browser } },
  { files: ['sw.js'], languageOptions: { globals: globals.serviceworker } },
  { files: ['js/lib/**/*.js'], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
  { files: ['tests/**/*.js', 'scripts/**/*.mjs', 'eslint.config.js'], languageOptions: { globals: globals.node } },
];
