import { defineConfig } from 'vite'

export default defineConfig({
    root: '.vite/build/',
    server: {
        host: true,
        port: 8080,
        https: false,
    },
})
