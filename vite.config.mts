import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

// import dts from 'vite-plugin-dts'

const localWobyExists = fs.existsSync(path.resolve(__dirname, '../woby/src/index.ts'))

const config = defineConfig({
    publicDir: './public',
    build: {
        minify: false,
        sourcemap: true,
    },
    esbuild: {
        jsx: 'automatic',
        target: 'es2022',
        supported: {
            'top-level-await': true,
        },
    },
    plugins: [
        // dts({ entryRoot: './src', outputDir: './dist/types', exclude: './nodes_modules' })
        tsconfigPaths({ ignoreConfigErrors: true }),
        viteStaticCopy({
            targets: [
                {
                    src: './public/textures',
                    dest: './'
                },
                {
                    src: './public/output.css',
                    dest: './'
                },
                {
                    src: './public/screenshots',
                    dest: './'
                }
            ]
        }),
        tailwindcss(),
    ],
    resolve: {
        dedupe: ['three'],
        alias: {
            '@woby/three/jsx-runtime': path.resolve(__dirname, '../code/lib/jsx/jsx-runtime.tsx'),
            '@woby/three/jsx-dev-runtime': path.resolve(__dirname, '../code/lib/jsx/jsx-dev-runtime.tsx'),
            '@woby/three/src': path.resolve(__dirname, '../code/src'),
            '@woby/three/lib': path.resolve(__dirname, '../code/lib'),
            '@woby/three/examples/jsm': path.resolve(__dirname, '../code/examples/jsm'),
            ...(localWobyExists ? {
                'woby/jsx-runtime': path.resolve(__dirname, '../woby/src/jsx/runtime'),
                'woby/jsx-dev-runtime': path.resolve(__dirname, '../woby/src/jsx/runtime'),
                'woby': path.resolve(__dirname, '../woby/src/index'),
            } : {}),
        },
    },
})


export default config
