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
        transitionDuration: {
            DEFAULT: '300ms',
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
            boxShadow: {
                hover: '-4px 6px 0 theme(colors.bke.orange)',
                focused: '-6px 8px 0 theme(colors.bke.orange), 0 0 0 2px theme(colors.bke.orange)',
                border: '0 0 0 2px theme(colors.bke.orange)',
            },
        },
    },
    plugins: [require('@tailwindcss/typography')],
}
