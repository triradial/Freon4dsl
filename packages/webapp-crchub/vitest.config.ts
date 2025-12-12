import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
    root: __dirname,
    test: {
        globals: true,
        environment: "node",
        include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
        exclude: ["**/node_modules/**", "**/dist/**"],
        onConsoleLog(log, type) {
            if (log.includes("[MobX]")) {
                return false;
            }
            return true;
        },
    },
    resolve: {
        alias: {
            "@bscotch/utility": path.resolve(__dirname, "../../../node_modules/@bscotch/utility"),
        },
    },
});

