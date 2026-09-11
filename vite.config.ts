import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function backgroundAssetsPlugin() {
  return {
    name: 'background-assets-server',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const decodedUrl = decodeURI(req.url || '').split('?')[0];
        if (decodedUrl.startsWith('/Background Assets ')) {
          const rootDir = process.cwd();
          const filePath = path.join(rootDir, decodedUrl.replace(/^\//, ''));
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'image/gif');
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            fs.createReadStream(filePath).pipe(res);
            return;
          }
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), backgroundAssetsPlugin()],
  server: {
    port: 5173,
    host: true
  }
});
