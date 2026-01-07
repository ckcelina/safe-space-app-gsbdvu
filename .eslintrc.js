
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
    'jest.setup.js',
    'supabase/*',
    'supabase-edge-function-example.ts',
    'scripts/*'
  ],
  env: {
    browser: true,
    node: true,
    jest: true,
    es2021: true
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    }
  },
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/prefer-as-const": "off",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-redeclare": "off",
    "@typescript-eslint/array-type": "off",
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-empty-object-type": "off",
    "@typescript-eslint/no-wrapper-object-types": "off",
    "@typescript-eslint/ban-tslint-comment": "off",
    "react/no-unescaped-entities": "off",
    "import/no-unresolved": ["error", {
      ignore: [
        '@testing-library/react-native',
        '@testing-library/jest-native',
        'jsr:',
        'npm:',
        'https://deno.land'
      ]
    }],
    "prefer-const": "off",
    "react/prop-types": 1,
    "no-case-declarations": "off",
    "no-empty": "off",
    "react/display-name": "off",
    "no-constant-condition": "off",
    "no-var": "off",
    "no-useless-escape": "off",
    "no-undef": "off",
    "react-hooks/exhaustive-deps": "off"
  },
  overrides: [
    {
      files: ['metro.config.js', 'babel.config.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off'
      }
    },
    {
      files: ['**/__tests__/**', '*.test.ts', '*.test.tsx', 'jest.setup.js'],
      env: {
        jest: true
      },
      rules: {
        'no-undef': 'off',
        'import/no-unresolved': 'off'
      }
    },
    {
      files: ['supabase/**/*', 'scripts/**/*'],
      rules: {
        'import/no-unresolved': 'off',
        'no-undef': 'off'
      }
    }
  ]
};
