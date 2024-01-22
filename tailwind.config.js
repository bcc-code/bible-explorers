/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js}'],
  corePlugins: {
    container: false,
  },
  theme: {
    extend: {
      colors: {
        bke: {
          dark: '#0c0a16',
          primary: '#3e306d',
          accent: '#fcb04e',
          outline: '#0396e3',
        },
      },
      backgroundImage: {
        'control-room': "url('../../static/HighresScreenshot00070.png')",
        'chapter-room': "url('../../static/HighresScreenshot00071.png')",
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
