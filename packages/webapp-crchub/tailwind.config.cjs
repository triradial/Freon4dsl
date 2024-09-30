/** @type {import('tailwindcss').Config} */
const path = require('path');
module.exports = {
    content: [
    // This line is using an absolute path to the flowbite module
    // To use the root node_modules, you can change it to a relative path:
    path.resolve(__dirname, '../../node_modules/flowbite/**/*.js'),
    path.resolve(__dirname, './src/**/*.{html,js,svelte,ts}')
    ],
    plugins: [
        require('@tailwindcss/forms'),
        require('../../node_modules/flowbite/plugin')
    ]
}