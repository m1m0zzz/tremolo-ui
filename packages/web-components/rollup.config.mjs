/* eslint-disable import/order */
import { rollupPluginHTML } from '@web/rollup-plugin-html';
import {copy} from '@web/rollup-plugin-copy';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
// import minifyHTML from 'rollup-plugin-minify-html-literals';
import summary from 'rollup-plugin-summary';

export default {
  plugins: [
    // Entry point for application build; can specify a glob to build multiple
    // HTML files for non-SPA app
    rollupPluginHTML({
      input: 'index.html',
    }),
    // Resolve bare module specifiers to relative paths
    resolve(),
    // Minify HTML template literals
    // minifyHTML(),
    // Minify JS
    terser({
      ecma: 2021,
      module: true,
      warnings: true,
    }),
    // Print bundle summary
    summary(),
    // Optional: copy any static assets to build directory
    copy({
      patterns: ['public/**/*'],
    }),
  ],
  output: {
    dir: 'build',
  },
  preserveEntrySignatures: 'strict',
};
