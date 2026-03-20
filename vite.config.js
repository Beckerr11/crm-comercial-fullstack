import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// The repository is opened through a Windows junction in this workspace.
// Preserving symlinks keeps Vite/Rollup from resolving HTML entry paths to
// the real target path and emitting invalid relative asset names on build.
export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      preserveSymlinks: true,
    },
  },
})
