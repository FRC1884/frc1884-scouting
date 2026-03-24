import vue from '@vitejs/plugin-vue';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
  const base =
    command === 'serve' ? '/' : process.env.SCOUTING_VIEWER_BASE_PATH ?? '/viewer/';

  return {
    base,
    clearScreen: false,
    plugins: [vue()],
    resolve: {
      alias: {
        '~/': `${path.resolve(__dirname, 'src')}/`,
      },
      dedupe: ['vue'],
    },
    server: {
      proxy: {
        '/trpc': {
          target:
            process.env.SCOUTING_CONTROLLER_ORIGIN ?? 'http://127.0.0.1:8080',
          changeOrigin: true,
        },
      },
    },
  };
});
