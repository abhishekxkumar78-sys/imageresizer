const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
};

function serveFile(res, filePath, statusCode, ext) {
    fs.readFile(filePath, (readErr, data) => {
        if (readErr) {
            res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
            res.end(statusCode === 404 ? 'Not found' : 'Internal server error');
            return;
        }
        res.writeHead(statusCode, { 'Content-Type': MIME[ext] || 'text/html' });
        res.end(data);
    });
}

const server = http.createServer((req, res) => {
    let url = req.url.split('?')[0];


    // Generic clean URL rewriting
    if (url === '/') {
        url = '/index.html';
    } else {
        const directPath = path.join(__dirname, 'public', url);
        const htmlPath = path.join(__dirname, 'public', url + '.html');
        const indexPath = path.join(__dirname, 'public', url, 'index.html');

        if (fs.existsSync(htmlPath)) {
            url = url + '.html';
        } else if (fs.existsSync(indexPath)) {
            url = path.posix.join(url, 'index.html');
        }
    }

    const filePath = path.join(__dirname, 'public', url);
    const ext = path.extname(filePath);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                const errorPage = path.join(__dirname, 'public', '404.html');
                return serveFile(res, errorPage, 404, '.html');
            }
            const errorPage = path.join(__dirname, 'public', '500.html');
            return serveFile(res, errorPage, 500, '.html');
        }
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
