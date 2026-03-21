import { defineConfig } from 'vite'
import path from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

// import dts from 'vite-plugin-dts'

const config = defineConfig({
    build: {
        minify: false,
        lib: {
            entry: ["./index.html"],
            name: "@woby/three-demo",
            formats: ['es'],
            fileName: (format: string, entryName: string) => `${entryName}.${format}.js`
        },
        sourcemap: true,
    },
    esbuild: {
        jsx: 'automatic',
    },
    plugins: [
        // dts({ entryRoot: './src', outputDir: './dist/types', exclude: './nodes_modules' })
        tsconfigPaths(),
        viteStaticCopy({
            targets: [
                {
                    src: './public/textures',
                    dest: './'
                }
            ]
        }),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@woby/three/jsx-runtime': path.resolve('../three/dist/jsx-runtime.es.js'),
            '@woby/three/jsx-dev-runtime': path.resolve('../three/dist/jsx-dev-runtime.es.js'),
            '@woby/three/src': path.resolve('../three/code/src'),
            '@woby/three/lib': path.resolve('../three/code/lib'),
            '@woby/three/examples/jsm': path.resolve('../three/code/examples/jsm'),
            'woby/jsx-runtime': process.argv.includes('dev') ? path.resolve('../woby/src/jsx/runtime') : 'woby',
            'woby/jsx-dev-runtime': process.argv.includes('dev') ? path.resolve('../woby/src/jsx/runtime') : 'woby',
            'woby': process.argv.includes('dev') ? path.resolve('../woby/src/index') : 'woby',
        },
    },
})


export default config
