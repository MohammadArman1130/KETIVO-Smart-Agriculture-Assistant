import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import analyzeDiseaseHandler from './api/analyze-disease.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json'
};

const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0];

  if (urlPath === '/api/analyze-disease') {
    let body = '';

    req.on('data', chunk => {
      body += chunk;

      if (body.length > 8 * 1024 * 1024) {
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch {
        req.body = {};
      }

      const wrappedRes = {
        status(code) {
          res.statusCode = code;
          return this;
        },

        json(payload) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));
        }
      };

      await analyzeDiseaseHandler(req, wrappedRes);
    });

    return;
  }

  let filePath = path.join(
    __dirname,
    urlPath === '/' ? 'index.html' : urlPath
  );

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, {
        'Content-Type': 'text/plain'
      });

      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();

    res.writeHead(200, {
      'Content-Type':
        MIME_TYPES[ext] || 'application/octet-stream'
    });

    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`KETHIVO running at http://localhost:${PORT}`);
});