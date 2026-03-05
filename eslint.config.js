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
    files: ["**/*.js", "**/*.mjs"],
  },
  {
    ...eslint.configs.recommended,
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    files: ["**/*.cjs"],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    ignores: ["frontend/", "public/", "dist/"],
    languageOptions: {
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
      semi: "error",
      "prefer-const": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", args: "all" },
      ],
    },
  },
]);
