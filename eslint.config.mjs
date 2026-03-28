import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import globals from "globals";

export default defineConfig([
  {
    ignores: ["frontend/", "public/", "dist/"],
  },
  {
    ...eslint.configs.recommended,
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    files: ["**/*.js"],
  },
  {
    files: ["**/*.ts"],
    ignores: ["frontend/", "public/", "dist/"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...tseslint.configs.eslintRecommended.rules,
      semi: "error",
      "prefer-const": "warn",
      curly: ["error", "all"],
      "arrow-body-style": ["error", "always"],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", args: "all" },
      ],
    },
  },
]);
