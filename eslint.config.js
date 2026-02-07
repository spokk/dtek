import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";

export default defineConfig([
  { files: ["**/*.js"], languageOptions: { globals: globals.node } },
  {
    files: ["**/*.test.js", "**/*.spec.js", "jest.setup.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  { files: ["**/*.js"], plugins: { js }, extends: ["js/recommended"] },
]);
