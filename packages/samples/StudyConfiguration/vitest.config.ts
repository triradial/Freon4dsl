import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        globals: true,
        environment: "jsdom",
        include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
        exclude: ["**/node_modules/**", "**/dist/**"],
    },
    resolve: {
        alias: {
            "@bscotch/utility": path.resolve(__dirname, "../../../node_modules/@bscotch/utility"),
        },
    },
});
