import { defineConfig } from 'vite'

export default defineConfig({
    root: 'src/',
    publicDir: '../static/',
    base: './',
    server: {
        host: true,
        port: 8080,
        https: false,
    },
})
