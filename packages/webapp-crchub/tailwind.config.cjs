/** @type {import('tailwindcss').Config} */
const path = require('path');
module.exports = {
    content: [
    // This line is using an absolute path to the flowbite module
    // To use the root node_modules, you can change it to a relative path:
    path.resolve(__dirname, '../../node_modules/flowbite/**/*.js'),
    path.resolve(__dirname, './src/**/*.{html,js,svelte,ts}')
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#F5F5F2',
                    100: '#FFF1EE',
                    200: '#FFE4DE',
                    300: '#FFD5CC',
                    400: '#FFBCAD',
                    500: '#FE795D',
                    600: '#EF562F',
                    700: '#EB4F27',
                    800: '#CC4522',
                    900: '#A5371B'
                }
            }
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('../../node_modules/flowbite/plugin')
    ]
}