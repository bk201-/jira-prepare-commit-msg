import type { RollupOptions } from 'rollup';

import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';

import packageJson from './package.json';

// const isProduction = process.env.NODE_ENV === 'production';

const config: RollupOptions = {
  input: 'src/index.ts',
  output: [
    {
      dir: 'bin',
      format: 'cjs',
      // sourcemap: isProduction ? false : 'inline',
    },
  ],
  external: Object.keys(packageJson.dependencies),
  plugins: [
    replace({
      preventAssignment: true,
      values: {
        __APP_VERSION__: packageJson.version,
        __APP_NAME__: packageJson.name,
        __APP_DESCRIPTION__: packageJson.description,
      },
    }),
    nodeResolve(),
    typescript(),
    (() => {
      return {
        name: 'banner',
        renderChunk(code) {
          return '#!/usr/bin/env node\n\n' + code;
        },
      };
    })(),
  ],
};

export default config;
