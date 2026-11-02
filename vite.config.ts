import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function directDiskSavePlugin(): Plugin {
  return {
    name: 'direct-disk-save-plugin',
    configureServer(server) {
      server.middlewares.use('/api/save-database', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body);
              const dataDir = path.resolve(__dirname, 'src', 'data');
              if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
              }

              // 1. If shows provided, write src/data/dramas.json directly
              if (payload.shows && Array.isArray(payload.shows)) {
                const dramasFilePath = path.join(dataDir, 'dramas.json');
                fs.writeFileSync(dramasFilePath, JSON.stringify(payload.shows, null, 2), 'utf-8');
              }

              // 2. Write full database backup to src/data/full_backup.json directly
              const fullBackupFilePath = path.join(dataDir, 'full_backup.json');
              fs.writeFileSync(fullBackupFilePath, JSON.stringify(payload, null, 2), 'utf-8');

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Saved directly to disk' }));
            } catch (err: any) {
              console.error('Error saving to disk:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err?.message || 'Server error' }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), directDiskSavePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
