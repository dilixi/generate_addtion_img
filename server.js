const express = require('express');
const path = require('path');
const http = require('http');
const app = express();
const PORT = process.env.PORT || 3000;
const cmd_compile = require('./lib/cmd_compile');

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

// 解析 JSON 请求体
app.use(express.json({ limit: '10mb' })); // 增加请求体大小限制

// 设置静态文件目录
app.use(express.static(path.join(__dirname)));

// 路由：默认为 index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index_bak.html'));
});

// 处理 YML 和 PNG 文件上传
app.post('/generate', (req, res) => {
    const { ymlData, pngData } = req.body;

    if (!ymlData || !pngData) {
        return res.status(400).json({ error: '请上传 YML 和 PNG 文件!' });
    }

    try {
        // 将 Base64 数据解码
        const ymlBuffer = Buffer.from(ymlData.split(",")[1], 'base64');
        const pngBuffer = Buffer.from(pngData.split(",")[1], 'base64');
        const img_buffer = cmd_compile.generate_img(ymlBuffer, pngBuffer);

        if (!img_buffer) {
            throw new AppError('Failed to execute command: img_buffer is null', 500);
        }
 
        res.send(img_buffer);  // 直接发送 Buffer 数据

    } catch (error) {
        // 将详细错误信息返回给客户端，包括堆栈信息
        res.status(500).json({
            message: error.message || 'An unexpected error occurred',
            stack: error.stack
        });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
