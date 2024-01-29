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
                'control-room': "url('../../static/textures/control-room.png')",
                'chapter-room': "url('../../static/textures/control-room-2.png')",
                'big-screen': "url('../../static/textures/big-screen.svg')",
                'small-screen': "url('../../static/textures/small-screen.svg')",
            },
        },
    },
    plugins: [require('@tailwindcss/typography')],
}
