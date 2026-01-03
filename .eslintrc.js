
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
    'jest.setup.js',
    'jest.config.js',
    '**/*.test.ts',
    '**/*.test.tsx',
    '__tests__/**/*',
    '*.config.js',
    'metro.config.js',
    'babel.config.js',
    'scripts/**/*',
    '.eslintrc.js'
  ],
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  globals: {
    __DEV__: 'readonly',
    jest: 'readonly',
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
    "import/no-unresolved": "error",
    "prefer-const": "off",
    "react/prop-types": 1,
    "no-case-declarations": "off",
    "no-empty": "off",
    "react/display-name": "off",
    "no-constant-condition": "off",
    "no-var": "off",
    "no-useless-escape": "off",
    "no-undef": "off"
  },
  overrides: [
    {
      files: ['*.js', '*.cjs', '*.mjs'],
      env: {
        node: true,
        commonjs: true
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'no-undef': 'off'
      }
    },
    {
      files: ['jest.setup.js', 'jest.config.js', '**/*.test.js', '**/*.test.ts', '**/*.test.tsx', '__tests__/**/*'],
      env: {
        jest: true,
        node: true
      },
      globals: {
        jest: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly'
      },
      rules: {
        'no-undef': 'off',
        '@typescript-eslint/no-var-requires': 'off'
      }
    },
    {
      files: ['scripts/**/*.js'],
      env: {
        node: true
      },
      rules: {
        'no-undef': 'off',
        '@typescript-eslint/no-var-requires': 'off'
      }
    }
  ],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json'
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    },
    react: {
      version: 'detect'
    }
  }
};
