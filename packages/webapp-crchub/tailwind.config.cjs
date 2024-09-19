/** @type {import('tailwindcss').Config} */
const path = require('path');
module.exports = {
    content: [
    path.resolve(__dirname, '/home/gmcgibbon64/crchub-freonx1/Freon4dsl/node_modules/flowbite/**/*.js'),
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
        require('/home/gmcgibbon64/crchub-freonx1/Freon4dsl/node_modules/flowbite/plugin')
    ]
}