const express = require('express');
const path = require('path');
const http = require('http');
const app = express();
const PORT = process.env.PORT || 3000;
const cmd_compile = require('./lib/cmd_compile');
const fs = require('fs');

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

app.use(express.json({ limit: '10mb' }));

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/generate', (req, res) => {
    const { ymlData, pngData } = req.body;
    let ymlBuffer;
    let pngBuffer;
 
    try {
        if (ymlData) {
            ymlBuffer = Buffer.from(ymlData.split(",")[1], 'base64');
        } else {
            ymlBuffer = fs.readFileSync('en-GB.yml'); // 默认语言文件
        }

        if (pngData) {
            pngBuffer = Buffer.from(pngData.split(",")[1], 'base64');
        } else {
            pngBuffer = fs.readFileSync('default_panda.png'); // 默认熊猫图片
        }

        const img_buffer = cmd_compile.generate_img(ymlBuffer, pngBuffer);

        if (!img_buffer) {
            throw new AppError('Failed to execute command: img_buffer is null', 500);
        }

        res.send(img_buffer); // 直接发送 Buffer 数据
    } catch (error) {
        res.status(500).json({
            message: error.message || 'An unexpected error occurred',
            stack: error.stack
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
