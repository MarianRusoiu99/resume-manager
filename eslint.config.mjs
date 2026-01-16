import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // React Compiler rules
  {
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../../*"],
              message: "Please use absolute imports with `@/` for cross-module imports (more than 1 level up).",
            },
          ],
        },
      ],
    },
  },

  // Guardrails: layering / boundaries
  {
    files: ["lib/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/**", "@/components/**", "app/**", "components/**"],
              message:
                "Boundary rule: `lib/*` must not import from `app/*` or `components/*`. Move shared code/types into `lib/`.",
            },
          ],
        },
      ],
    },
  },

  // Guardrails: discourage service-to-service imports (prefer workflows/orchestrators)
  {
    files: ["lib/services/**/*.{js,jsx,ts,tsx}"],
    ignores: [
      "lib/services/index.ts",
      "lib/services/container.ts",
      "lib/services/**/*.workflow.ts",
      "lib/services/**/*.orchestrator.ts",
      "lib/services/interfaces/**",
      "lib/services/utils/**",
    ],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "ImportDeclaration[source.value=/\\.service$/]",
          message:
            "Avoid importing one service from another service. Prefer a workflow/orchestrator, or depend on repositories/utilities.",
        },
        {
          selector: "ImportExpression[source.value=/\\.service$/]",
          message:
            "Avoid importing one service from another service. Prefer a workflow/orchestrator, or depend on repositories/utilities.",
        },
      ],
    },
  },
]);

export default eslintConfig;
