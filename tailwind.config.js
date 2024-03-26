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
            screens: {
                tv: '1920px',
            },
            colors: {
                bke: {
                    darkpurple: 'hsl(250, 38%, 6%)',
                    purple: 'hsl(254, 39%, 31%)',
                    orange: 'hsl(34, 97%, 65%)',
                    blue: 'hsl(201, 97%, 45%)',
                },
            },
            gridTemplateColumns: {
                'screens-layout': '40% 27% 33%',
            },
            backgroundImage: {
                'control-room': "url('../../static/textures/control-room.png')",
                'chapter-room': "url('../../static/textures/control-room-2.png')",
                'task-background': "url('../../static/textures/Task_BG.jpg)",
                'main-screen': "url('../../static/frames/Screen_1.png')",
                'helper-screen': "url('../../static/frames/Screen_2.png')",
                'top-mid-screen': "url('../../static/frames/Screen_3.png')",
                'top-left-screen': "url('../../static/frames/Screen_4.png')",
            },
            boxShadow: {
                hover: '-4px 6px 0 theme(colors.bke.orange)',
                focused: '-6px 8px 0 theme(colors.bke.orange), 0 0 0 2px theme(colors.bke.orange)',
                border: '0 0 0 2px theme(colors.bke.orange)',
                wrong: '-6px 8px 0 theme(colors.red.500), 0 0 0 2px theme(colors.red.500)',
                correct: '-6px 8px 0 theme(colors.green.500), 0 0 0 2px theme(colors.green.500)',
            },
            keyframes: {
                credits: {
                    '0%': { top: '100%' },
                    '100%': { top: '-500%' },
                },
            },
            animation: {
                credits: 'credits 60s linear infinite',
            },
        },
    },
    plugins: [require('@tailwindcss/typography')],
}
