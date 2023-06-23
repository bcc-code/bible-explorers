const isCodeSandbox = 'SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env

import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

export default {
    root: 'src/',
    publicDir: '../static/',
    base: './',
    server:
    {
        host: true,
        port: 8080,
        https: true,
        open: !isCodeSandbox // Open if it's not a CodeSandbox
    },
    build:
    {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: true
    },
    plugins: [
        basicSsl(),
        VitePWA({
            injectRegister: 'null',
            registerType: 'autoUpdate',
            includeAssets: ['*'],
            injectManifest: {
                swSrc: './src/js/sw/sw.js',
                swDest: './sw.js',
                maximumFileSizeToCacheInBytes: 20000000,
                globPatterns: ['**/*.{js,css,html,png,svg,mp3,mp4}']
            }
        })
    ]
}