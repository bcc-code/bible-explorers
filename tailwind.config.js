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
                'big-screen-frame': "url('../../static/textures/big-screen-frame.svg')",
                'small-screen-frame': "url('../../static/textures/small-screen-frame.svg')",
                'map-texture': "url('../../static/textures/map.jpg')",
                'lever-texture': "url('../../static/textures/lever.png')",
            },
        },
    },
    plugins: [require('@tailwindcss/typography')],
}
