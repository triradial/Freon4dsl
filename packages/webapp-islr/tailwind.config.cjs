/** @type {import('tailwindcss').Config} */
const path = require('path');
const { skeleton } = require('@skeletonlabs/skeleton-svelte');

module.exports = {
    content: [
    // This line is using an absolute path to the flowbite module
    // To use the root node_modules, you can change it to a relative path:
    path.resolve(__dirname, './src/**/*.{html,js,svelte,ts}'),
    path.resolve(__dirname, '../../node_modules/@skeletonlabs/skeleton-svelte/**/*.{html,js,svelte,ts}')
    ],
    plugins: [
        require('@tailwindcss/forms'),
        skeleton({
            themes: { preset: ['skeleton'] }
        })
    ]
}