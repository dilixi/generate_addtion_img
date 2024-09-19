const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { exec } = require('child_process');
const app = express();
const PORT = process.env.PORT || 3000; 

// 设置静态文件目录
app.use(express.static(path.join(__dirname)));

// 路由：默认为 index.html
app.get('/', (req, res) => {  
    res.sendFile(path.join(__dirname, 'index.html'));  
});

// 设置 multer 用于文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // 指定存储目录
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // 使用上传时的原始文件名
    }
});
const upload = multer({ storage });

// 处理 YML 和 PNG 文件上传
app.post('/generate', (req, res) => {
    let body = '';

    // 获取请求体的 JSON 数据
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        const { ymlData, pngData } = JSON.parse(body);
        
        // 将 Base64 数据解码并保存为文件
        const ymlBuffer = Buffer.from(ymlData.split(",")[1], 'base64');
        const pngBuffer = Buffer.from(pngData.split(",")[1], 'base64');

        const ymlFilePath = path.join(__dirname, 'uploaded.yml');
        const pngFilePath = path.join(__dirname, 'uploaded.png');

        fs.writeFileSync(ymlFilePath, ymlBuffer);
        fs.writeFileSync(pngFilePath, pngBuffer);

        // 检查文件是否存在
        const buffer = Buffer.alloc(2);
        const fd = fs.openSync(ymlFilePath, 'r');
        fs.readSync(fd, buffer, 0, 2, 0);
        fs.closeSync(fd);

        const firstTwoBytesHex = buffer.toString('hex');

        // 提取语言代码
        const langCode = path.basename(ymlFilePath, '.yml'); // 从文件名中提取语言代码

        // 执行命令
        exec(`node lv_i18n.js compile -t uploaded.yml`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error.message}`);
                return res.status(500).json({ error: 'Failed to execute command' });
            }

            console.log(`Command output: ${stdout}`);

            // 检查是否生成了 output.img 文件
            const outputImgPath = path.join(__dirname, 'output.img');
            if (fs.existsSync(outputImgPath)) {
                res.json({ 
                    message: 'Files processed successfully!', 
                    bytes: firstTwoBytesHex, 
                    outputImgPath: '/output.img'  // 返回下载链接
                });
            } else {
                res.status(500).json({ error: 'Output file was not generated.' });
            }
        });
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
