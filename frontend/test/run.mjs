import { createServer } from "vite";
import { fileURLToPath } from "node:url";

for (const key of ["localStorage", "sessionStorage"]) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: { getItem: () => null, setItem() {}, removeItem() {} },
  });
}

// Use the application's TypeScript/JSX transform and aliases without a second test toolchain.
const server = await createServer({
  configFile: false,
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  server: { middlewareMode: true, watch: null, hmr: false },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: "custom",
});
try {
  await server.ssrLoadModule("/test/workflow.test.tsx");
} finally {
  await server.close();
}
