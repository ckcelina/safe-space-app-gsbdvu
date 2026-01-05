
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
  ignorePatterns: ['/dist/*', '/public/*', '/babel-plugins/*', '/backend/*'],
  env: {
    browser: true,
    es2021: true,
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    },
    react: {
      version: 'detect'
    }
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
    "@typescript-eslint/no-redeclare": "off",
    "@typescript-eslint/array-type": "off",
    "react/no-unescaped-entities": "off",
    "react/prop-types": "off",
    "react/display-name": "off",
    "prefer-const": "off",
    "no-case-declarations": "off",
    "no-empty": "off",
    "no-constant-condition": "off",
    "no-var": "off",
    "no-useless-escape": "off",
    "react-hooks/exhaustive-deps": "warn",
    "import/no-unresolved": ["error", {
      ignore: [
        'better-auth',
        '@better-auth',
        'expo-secure-store',
        '@testing-library'
      ]
    }]
  },
  overrides: [
    {
      // Node.js scripts
      files: ['scripts/**/*.js', 'metro.config.js', 'babel.config.js'],
      env: {
        node: true,
        browser: false
      },
      globals: {
        '__dirname': 'readonly',
        '__filename': 'readonly',
        'process': 'readonly',
        'require': 'readonly',
        'module': 'readonly',
        'exports': 'readonly'
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'no-undef': 'off'
      }
    },
    {
      // Jest test files
      files: [
        '**/__tests__/**/*',
        '**/*.test.ts',
        '**/*.test.tsx',
        'jest.setup.js',
        'jest.config.js'
      ],
      env: {
        jest: true,
        node: true
      },
      globals: {
        'jest': 'readonly',
        'describe': 'readonly',
        'it': 'readonly',
        'test': 'readonly',
        'expect': 'readonly',
        'beforeEach': 'readonly',
        'afterEach': 'readonly',
        'beforeAll': 'readonly',
        'afterAll': 'readonly'
      },
      rules: {
        'import/no-unresolved': 'off',
        'no-undef': 'off',
        '@typescript-eslint/no-var-requires': 'off'
      }
    }
  ]
};
