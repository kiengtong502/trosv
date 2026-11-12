import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";

/*
  Size and complexity limits. New code must stay under LIMITS. The files below
  already exceed them (see docs/reports/TECH-DEBT-AUDIT-2026-11.md): each is frozen
  at today's worst function so it can only shrink. When you refactor one, LOWER its
  numbers (or delete the entry once it fits). Never raise a number or add a file.
*/
const LIMITS = { complexity: 12, lines: 120 };
const DEBT = {
  "src/features/ai/components/AiChatWidget.tsx": { complexity: 12, lines: 158 },
  "src/features/listings/components/ListingCard.tsx": { complexity: 14, lines: 170 },
  "src/features/listings/components/ListingMap.tsx": { complexity: 12, lines: 149 },
  "src/app/shell.tsx": { complexity: 12, lines: 153 },
  "src/features/landlord/hooks/useListingForm.ts": { complexity: 12, lines: 117 },
  "src/features/ai/pages/AiRoommates.tsx": { complexity: 12, lines: 143 },
  "src/features/messaging/pages/ConversationDetail.tsx": { complexity: 19, lines: 155 },
  "src/features/favorites/pages/Favorites.tsx": { complexity: 12, lines: 141 },
  "src/features/landlord/pages/LandlordDashboard.tsx": { complexity: 12, lines: 210 },
  "src/features/messaging/pages/MessagesList.tsx": { complexity: 12, lines: 168 },
  "src/features/auth/pages/Register.tsx": { complexity: 12, lines: 154 },
  "src/features/messaging/components/MessageBubble.tsx": { complexity: 14, lines: 120 },
  "src/features/messaging/components/thread/threadLayout.ts": { complexity: 15, lines: 120 },
  "src/features/profile/components/ProfileHabitsCard.tsx": { complexity: 12, lines: 170 },
  "src/features/room/components/RoomContactCard.tsx": { complexity: 16, lines: 120 },
  "src/shared/ui/illustrations.tsx": { complexity: 12, lines: 161 },
};

const sizeRules = ({ complexity, lines }) => ({
  complexity: ["error", complexity],
  "max-lines-per-function": ["error", { max: lines, skipBlankLines: true, skipComments: true }],
});

export default tseslint.config(
  {
    ignores: [
      "dist",
      "node_modules",
      "coverage",
      "playwright-report",
      "test-results",
      "playwright.config.ts",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs["recommended-latest"].rules,
      "react-refresh/only-export-components": "off",
      /* Fatal for the banned patterns: any, ts-ignore, non-null assert. */
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      /* Numbers in template literals are intentional (prices, ids). */
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true, allowBoolean: true },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  { files: ["src/**/*.{ts,tsx}"], rules: sizeRules(LIMITS) },
  {
    /* Layering: app -> features -> shared. Lower layers never import upwards. */
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "@/app/*"],
              message:
                "shared/ must not depend on features/ or app/ (layering: app > features > shared).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/*"],
              message: "features/ must not depend on app/ (layering: app > features > shared).",
            },
          ],
        },
      ],
    },
  },
  ...Object.entries(DEBT).map(([file, limits]) => ({
    files: [file],
    rules: sizeRules(limits),
  })),
  {
    /* Specs: a null from boundingBox()/getAttribute() should fail the test loudly,
       so `!` is the idiomatic assertion there. Everything else stays strict. */
    files: ["e2e/**/*.ts"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-console": "off",
    },
  },
  {
    ignores: ["eslint.config.js", "vite.config.ts"],
  },
  prettier,
);
