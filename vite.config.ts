import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function disableHmrClientWebSocket(): Plugin {
  return {
    name: 'disable-hmr-client-websocket',
    apply: 'serve',
    transform(code, id) {
      if (id.includes('vite/dist/client/client.mjs')) {
        return {
          code: code.replace(
            'transport.connect(createHMRHandler(handleMessage));',
            '/* HMR WebSocket disabled */'
          ),
          map: null,
        };
      }
      return null;
    },
  };
}

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: false,
    ws: false,
  },
  plugins: [disableHmrClientWebSocket(), react()],
});

