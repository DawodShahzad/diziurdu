import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function getDatabaseFilePath(): string {
  const srcFile = path.resolve(__dirname, 'src', 'full_backup.json');
  if (fs.existsSync(srcFile)) return srcFile;
  const dataFile = path.resolve(__dirname, 'src', 'data', 'full_backup.json');
  if (fs.existsSync(dataFile)) return dataFile;
  return srcFile;
}

function directDiskSavePlugin(): Plugin {
  return {
    name: 'direct-disk-save-plugin',
    handleHotUpdate({ file }) {
      if (file.includes('full_backup.json') || file.includes('src/data')) {
        return [];
      }
    },
    configureServer(server) {
      try {
        server.watcher.unwatch(path.resolve(__dirname, 'src', 'full_backup.json'));
        server.watcher.unwatch(path.resolve(__dirname, 'src', 'data', 'full_backup.json'));
      } catch {}

      // Serve live full_backup.json directly from disk on localhost (checks src/full_backup.json)
      server.middlewares.use('/api/database', (req, res) => {
        if (req.method === 'GET') {
          const fullBackupFilePath = getDatabaseFilePath();
          if (fs.existsSync(fullBackupFilePath)) {
            const fileData = fs.readFileSync(fullBackupFilePath, 'utf-8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(fileData);
          } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'full_backup.json not found in src/' }));
          }
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });

      server.middlewares.use('/api/save-database', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body);
              const jsonString = JSON.stringify(payload, null, 2);

              // Write 100% full database backup to src/full_backup.json directly
              const srcFilePath = path.resolve(__dirname, 'src', 'full_backup.json');
              fs.writeFileSync(srcFilePath, jsonString, 'utf-8');

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Saved 100% full database directly to src/full_backup.json' }));
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

function socialShareCrawlerPlugin(): Plugin {
  return {
    name: 'social-share-crawler-plugin',
    transformIndexHtml(html, ctx) {
      try {
        const urlStr = ctx.originalUrl || (ctx as any).url || '';
        let slug = '';
        if (urlStr.includes('/watch/')) {
          const match = urlStr.match(/\/watch\/([a-zA-Z0-9_-]+)/);
          if (match) slug = match[1];
        } else if (urlStr.includes('watch=')) {
          const match = urlStr.match(/[?&]watch=([a-zA-Z0-9_-]+)/);
          if (match) slug = match[1];
        }

        if (slug) {
          const fullBackupFilePath = getDatabaseFilePath();
          if (fs.existsSync(fullBackupFilePath)) {
            const raw = fs.readFileSync(fullBackupFilePath, 'utf-8');
            const data = JSON.parse(raw);
            const shows = Array.isArray(data.shows) ? data.shows : [];
            const show = shows.find((s: any) =>
              (s.slug && s.slug.toLowerCase() === slug.toLowerCase()) ||
              (s.id && s.id.toLowerCase() === slug.toLowerCase()) ||
              (s.title && s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === slug.toLowerCase())
            );

            if (show) {
              const req = (ctx as any)?.req;
              const currentHost = (req?.headers?.host as string) || 'localhost:3000';
              const protocol = req?.headers?.['x-forwarded-proto'] || (req?.socket?.encrypted ? 'https' : 'http');
              const siteName = (data.adminSettings && data.adminSettings.platformName) ? data.adminSettings.platformName : currentHost;
              const title = `${show.title} - ${siteName}`;
              
              // Guarantee absolute URL for social crawlers (WhatsApp, Facebook, Twitter, Discord)
              let rawBackdrop = show.backdropUrl || show.posterLandscapeUrl || show.posterVerticalUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1280&q=80';
              if (rawBackdrop.startsWith('/')) {
                rawBackdrop = `${protocol}://${currentHost}${rawBackdrop}`;
              }
              const backdrop = rawBackdrop;

              const maturity = show.maturityRating || '16+';
              const genreList = Array.isArray(show.genres) && show.genres.length > 0 ? show.genres.join(', ') : 'Drama';
              const year = show.releaseYear || '2025';
              const durationOrSeasons = show.type === 'series'
                ? (show.durationOrSeasons || (show.seasons && show.seasons.length > 0 ? `${show.seasons.length} Season${show.seasons.length > 1 ? 's' : ''}` : '1 Season'))
                : (show.durationOrSeasons || 'Feature Film');
              const details = show.synopsis || show.description || show.shortDescription || '';
              const desc = `${maturity} • ${genreList} • ${year} • ${durationOrSeasons}${details ? ` • ${details}` : ''}`;
              const shareUrl = `${protocol}://${currentHost}/watch/${slug}`;

              html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
              html = html.replace(/<meta\s+property=["']og:title["'].*?>/i, `<meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />`);
              html = html.replace(/<meta\s+property=["']og:description["'].*?>/i, `<meta property="og:description" content="${desc.replace(/"/g, '&quot;')}" />`);
              html = html.replace(/<meta\s+property=["']og:image["'].*?>/i, `<meta property="og:image" content="${backdrop}" />\n    <meta property="og:image:secure_url" content="${backdrop}" />\n    <meta property="og:image:width" content="1280" />\n    <meta property="og:image:height" content="720" />`);
              html = html.replace(/<meta\s+property=["']og:url["'].*?>/i, `<meta property="og:url" content="${shareUrl}" />`);
              html = html.replace(/<meta\s+property=["']og:site_name["'].*?>/i, `<meta property="og:site_name" content="${siteName.replace(/"/g, '&quot;')}" />`);
              html = html.replace(/<meta\s+name=["']twitter:title["'].*?>/i, `<meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />`);
              html = html.replace(/<meta\s+name=["']twitter:description["'].*?>/i, `<meta name="twitter:description" content="${desc.replace(/"/g, '&quot;')}" />`);
              html = html.replace(/<meta\s+name=["']twitter:image["'].*?>/i, `<meta name="twitter:image" content="${backdrop}" />`);
            }
          }
        }
      } catch {}
      return html;
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), directDiskSavePlugin(), socialShareCrawlerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/src/data/**', '**/full_backup.json']
      },
    },
  };
});
