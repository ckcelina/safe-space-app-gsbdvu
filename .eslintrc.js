
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
    '__tests__/*',
    'jest.setup.js'
  ],
  env: {
    browser: true,
    node: true,
    es2021: true,
    jest: true,
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['node_modules', './'],
      },
      typescript: {
        alwaysTryTypes: true,
      },
    },
    'import/ignore': [
      'node_modules',
      '\\.(coffee|scss|css|less|hbs|svg|json)$',
      'better-auth',
      '@better-auth',
      'expo-secure-store',
      '@testing-library',
    ],
  },
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/prefer-as-const": "off",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-redeclare": "warn",
    "@typescript-eslint/array-type": ["warn", { default: "array" }],
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-empty-object-type": "off",
    "@typescript-eslint/no-wrapper-object-types": "off",
    "@typescript-eslint/ban-tslint-comment": "off",
    "react/no-unescaped-entities": "off",
    "react-hooks/exhaustive-deps": "warn",
    "import/no-unresolved": ["error", {
      ignore: [
        '^better-auth',
        '^@better-auth',
        '^expo-secure-store',
        '^@testing-library',
      ]
    }],
    "prefer-const": "off",
    "react/prop-types": 1,
    "no-case-declarations": "off",
    "no-empty": "off",
    "react/display-name": "off",
    "no-constant-condition": "off",
    "no-var": "off",
    "no-useless-escape": "off"
  },
  overrides: [
    {
      files: ['metro.config.js', 'babel.config.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off'
      }
    },
    {
      files: ['**/__tests__/**/*', '*.test.ts', '*.test.tsx', 'jest.setup.js'],
      env: {
        jest: true,
      },
      globals: {
        jest: 'readonly',
      },
      rules: {
        'import/no-unresolved': 'off',
        'no-undef': 'off',
      }
    }
  ]
};
