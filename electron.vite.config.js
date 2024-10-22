import { resolve } from 'path'

export default {
    main: {
        root: 'src',
        build: {
            lib: {
                entry: 'main/main.ts',
            },
            outDir: '../.vite/build',
            minify: true,
        },
    },
    preload: {
        root: 'src',
        build: {
            lib: {
                entry: 'preload/preload.js',
            },
            outDir: '../.vite/build',
            minify: true,
        },
    },
    renderer: {
        root: 'src',
        publicDir: '../static',
        build: {
            emptyOutDir: false,
            rollupOptions: {
                input: resolve(__dirname, 'src/index.html'),
            },
            outDir: '.vite/build',
            minify: true,
        },
        server: {
            host: true,
            port: 8080,
            https: false,
        },
    },
}
