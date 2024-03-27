import { defineConfig } from 'vite'

export default defineConfig({
    root: 'src/',
    publicDir: '../static/',
    base: './',
    build: {
        outDir: '../.vite/build',
    },
})
