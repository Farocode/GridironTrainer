import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative base path: works correctly whether this is hosted at a
  // domain root or in a GitHub Pages project subdirectory
  // (username.github.io/repo-name/) without needing to hardcode the
  // repo name here.
  base: "./",
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
  },
});
