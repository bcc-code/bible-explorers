/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js}'],
    corePlugins: {
        container: false,
    },
    theme: {
        fontFamily: {
            sans: ['Source Sans Pro', ' sans-serif'],
        },
        extend: {
            colors: {
                bke: {
                    darkpurple: '#0c0a16',
                    purple: '#3e306d',
                    orange: '#fcb04e',
                    blue: '#0396e3',
                },
            },
            backgroundImage: {
                'control-room': "url('../../static/HighresScreenshot00070.png')",
                'chapter-room': "url('../../static/HighresScreenshot00071.png')",
            },
        },
    },
    plugins: [require('@tailwindcss/typography')],
}
