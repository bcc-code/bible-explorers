const isCodeSandbox = 'SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env

const getCache = ({ name, pattern }) => ({
    urlPattern: pattern,
    handler: 'NetworkFirst',
    options: {
        cacheName: name,
        expiration: {
            maxEntries: 500,
            maxAgeSeconds: 60 * 60 * 24 * 365 * 2, // 2 years
        },
        cacheableResponse: {
            statuses: [0, 200],
        },
    },
})

import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

export default {
    root: 'src/',
    publicDir: '../static/',
    base: './',
    server: {
        host: true,
        port: 8080,
        https: true,
        open: !isCodeSandbox, // Open if it's not a CodeSandbox
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks: false,
                inlineDynamicImports: true,
                entryFileNames: `assets/[name].js`,
                assetFileNames: `assets/[name].[ext]`,
            },
        },
    },
    plugins: [
        basicSsl(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['*'],
            injectRegister: 'null',
            workbox: {
                swDest: './dist/sw.js',
                maximumFileSizeToCacheInBytes: 20000000,
                globPatterns: ['**/*.{js,css,html,jpg,png,svg,mp3,mp4,webm,riv,glb,gltf,wasm}'],
                globIgnores: ['index.html', 'assets/index.css', 'assets/index.js'],
                runtimeCaching: [
                    getCache({
                        pattern: 'index.html',
                        name: 'html',
                    }),
                    getCache({
                        pattern: 'assets/index.css',
                        name: 'style',
                    }),
                    getCache({
                        pattern: 'assets/index.js',
                        name: 'script',
                    }),
                    getCache({
                        pattern: 'https://www.gstatic.com/cast/sdk/libs/sender/1.0/cast_framework.js',
                        name: 'castFramework',
                    }),
                    getCache({
                        pattern: 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1',
                        name: 'castSender',
                    }),
                    getCache({
                        pattern: 'https://www.gstatic.com/eureka/clank/cast_sender.js',
                        name: 'castSenderClank',
                    }),
                    getCache({
                        pattern: 'https://unpkg.com/@rive-app/canvas@1.0.102/rive.js',
                        name: 'riveApp',
                    }),
                ],
            },
        }),
    ],
}
