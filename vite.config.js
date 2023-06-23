const isCodeSandbox = 'SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env

const getCache = ({ name, pattern }) => ({
    urlPattern: pattern,
    handler: "NetworkFirst",
    options: {
      cacheName: name,
      expiration: {
        maxEntries: 500,
        maxAgeSeconds: 60 * 60 * 24 * 365 * 2 // 2 years
      },
      cacheableResponse: {
        statuses: [0, 200]
      }
    }
})

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
            registerType: 'autoUpdate',
            includeAssets: ['*'],
            injectRegister: 'null',
            injectManifest: {
                swSrc: './src/js/sw/sw.js',
                swDest: './sw.js',
                maximumFileSizeToCacheInBytes: 20000000,
                globPatterns: ['**/*.{js,css,html,png,svg,mp3,mp4}']
            },
            workbox: {
                maximumFileSizeToCacheInBytes: 20000000,
                runtimeCaching: [
                    getCache({ 
                        pattern: "https://www.gstatic.com/cast/sdk/libs/sender/1.0/cast_framework.js", 
                        name: "castFramework" 
                    }),
                    getCache({ 
                        pattern: "https://unpkg.com/@rive-app/canvas@1.0.102", 
                        name: "riveApp" 
                    })
                ]
            }
        })
    ]
}