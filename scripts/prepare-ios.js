const fs = require('fs');
const path = require('path');

const wwwDir = path.join(__dirname, 'www');
const texturesDir = path.join(wwwDir, 'textures');

// 1. 清理并创建 www 目录
if (fs.existsSync(wwwDir)) {
    fs.rmSync(wwwDir, { recursive: true, force: true });
}
fs.mkdirSync(wwwDir);
fs.mkdirSync(texturesDir);

// 2. 复制 solar_system.html 并重命名为 index.html
fs.copyFileSync('solar_system.html', path.join(wwwDir, 'index.html'));

// 3. 复制 textures 目录
const srcTextures = path.join(__dirname, 'textures');
if (fs.existsSync(srcTextures)) {
    fs.readdirSync(srcTextures).forEach(file => {
        fs.copyFileSync(path.join(srcTextures, file), path.join(texturesDir, file));
    });
}

console.log('Web assets prepared in ./www');

