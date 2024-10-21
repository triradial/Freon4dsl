import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
        exclude: ["**/node_modules/**", "**/dist/**"],
        onConsoleLog(log, type) {
            if (log.includes("[MobX]")) {
                return false;
            }
            console.log(`>XX${log}\n`);
            return true;
        },
    },
    resolve: {
        alias: {
            "@bscotch/utility": path.resolve(__dirname, "../../../node_modules/@bscotch/utility"),
        },
    },
});
