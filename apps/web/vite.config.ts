import { defineConfig } from "vitest/config";
import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
    restoreMocks: true,
    // A test that prints a console error/warn it did not expect is a bug.
    coverage: {
      provider: "v8",
      // Count every source file, tested or not, so untouched code shows up as 0%.
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/test/**", "src/**/*.d.ts"],
      reporter: ["text-summary", "json-summary", "lcov"],
      reportsDirectory: "./coverage",
      // Ratchet: set just under the measured value so coverage can only go up. Raise these
      // when you add tests; never lower them. Unit tests only - the Playwright suite
      // covers the UI separately and is not counted here.
      thresholds: { lines: 33, functions: 31, branches: 33, statements: 34 },
    },
  },
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Optional: put the dependency cache outside node_modules (some sandboxes leave
  // root-owned files in node_modules/.vite, which makes Vite 404 every route).
  cacheDir: process.env["VITE_CACHE_DIR"],
  server: {
    proxy: {
      "/attachments": {
        target: "http://127.0.0.1:8000",
        changeOrigin: false,
        headers: {
          Host: "127.0.0.1",
        },
      },
      "/storage": {
        target: "http://127.0.0.1:8000",
        changeOrigin: false,
        headers: {
          Host: "127.0.0.1",
        },
      },
    },
  },
  build: {
    target: "es2020",
    cssMinify: true,
    rollupOptions: {
      external: [],
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Map + clustering in their own lazily-loaded chunk.
            if (
              id.includes("leaflet") ||
              id.includes("@map") ||
              id.includes("d3-") ||
              id.includes("rbush")
            ) {
              return "leaflet";
            }
            if (
              /node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)
            ) {
              return "react";
            }
            if (id.includes("@radix-ui") || id.includes("@floating-ui")) return "radix";
            if (id.includes("pusher-js") || id.includes("laravel-echo")) return "realtime";
            return "vendor";
          }
        },
      },
    },
  },
  esbuild: {
    legalComments: "inline",
  },
});
