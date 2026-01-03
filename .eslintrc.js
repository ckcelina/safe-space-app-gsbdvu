
// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: [
    'expo',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'import'],
  root: true,
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  ignorePatterns: [
    '/dist/*',
    '/public/*',
    '/babel-plugins/*',
    '/backend/*',
    '*.md',
    '__tests__/*',
    '*.test.ts',
    '*.test.tsx',
    'scripts/*',
    'jest.setup.js',
    'jest.config.js',
    '.eslintcache'
  ],
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/prefer-as-const": "off",
    "@typescript-eslint/no-var-requires": "off",
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-empty-object-type": "off",
    "@typescript-eslint/no-wrapper-object-types": "off",
    "@typescript-eslint/ban-tslint-comment": "off",
    "react/no-unescaped-entities": "off",
    "import/no-unresolved": "off",
    "prefer-const": "off",
    "react/prop-types": "off",
    "no-case-declarations": "off",
    "no-empty": "off",
    "react/display-name": "off",
    "no-constant-condition": "off",
    "no-var": "off",
    "no-useless-escape": "off",
    "no-undef": "off",
  },
  overrides: [
    {
      files: ['*.js'],
      parser: 'espree',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  ]
};
