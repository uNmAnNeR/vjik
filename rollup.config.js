import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import { eslint } from 'rollup-plugin-eslint';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import polyfill from 'rollup-plugin-polyfill';
import multiInput from 'rollup-plugin-multi-input';
import dev from 'rollup-plugin-dev';
import livereload from 'rollup-plugin-livereload';


const WATCH = process.env.ROLLUP_WATCH;
const commonPlugins = [
  resolve(),
  babel(),
];

const umdBundles = WATCH ? [false] : [false, true];
export default [
  ...umdBundles.map(min => ({
    input: 'src/index.js',
    output: {
      file: `dist/vjik${min ? '.min' : ''}.js`,
      format: 'umd',
      name: 'Vjik',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      WATCH && dev({
        port: 3000,
        spa: './example.html',
      }),
      WATCH && livereload(),
      // TODO eslint({configFile: '.eslintrc'}),
      ...commonPlugins,
      commonjs(),
      polyfill(['./polyfills.js']),
      min && terser(),
    ],
    watch: {
      clearScreen: false,
    }
  })),
  !WATCH && {
    input: ['src/**/*.js'],
    output: {
      format: 'esm',
      dir: 'esm',
    },
    plugins: [
      multiInput(),
      ...commonPlugins,
    ]
  }
].filter(Boolean);
