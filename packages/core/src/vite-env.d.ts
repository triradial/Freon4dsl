/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_ENVIRONMENT: string
    // Add other Vite env variables if needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv
} 