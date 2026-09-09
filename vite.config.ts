// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro, VITE_* env injection, @ path alias, React/TanStack dedupe, error logger plugins,
//     and sandbox detection (port/host/strictPort).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Use the Vercel Nitro preset for production deployments. The Lovable config
    // otherwise defaults Nitro to Cloudflare, which is not the correct runtime for Vercel.
    server: {
      entry: "server",
      preset: "vercel",
    },
  },
});
