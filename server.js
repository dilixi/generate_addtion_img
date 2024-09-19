const express = require('express');
const path = require('path');
const multer = require('multer');
const { exec } = require('child_process');
const app = express();
const PORT = process.env.PORT || 3000;
const fs = require('fs');

// 解析 JSON 请求体
app.use(express.json({ limit: '10mb' })); // 增加请求体大小限制

// 设置静态文件目录
app.use(express.static(path.join(__dirname)));

// 路由：默认为 index.html
app.get('/', (req, res) => {  
    res.sendFile(path.join(__dirname, 'index.html'));  
});

// 处理 YML 和 PNG 文件上传
app.post('/generate', (req, res) => {
    const { ymlData, pngData } = req.body;

    if (!ymlData || !pngData) {
        return res.status(400).json({ error: '请上传 YML 和 PNG 文件!' });
    }

    // 将 Base64 数据解码
    const ymlBuffer = Buffer.from(ymlData.split(",")[1], 'base64');
    const pngBuffer = Buffer.from(pngData.split(",")[1], 'base64');

    // 此时 ymlBuffer 和 pngBuffer 是文件的内容，您可以直接在内存中处理它们
    // 检查 YML 文件的前两个字节
    const firstTwoBytesHex = ymlBuffer.toString('hex', 0, 2);

    // 提取语言代码
    const langCode = 'your_lang_code'; // 这里可以根据需要设置语言代码

    // 将 YML 文件内容临时保存到内存（可选，取决于执行的命令是否需要文件）
    const ymlFilePath = path.join(__dirname, 'temp.yml');
    const pngFilePath = path.join(__dirname, 'temp.png');
    
    // 创建临时文件的 Buffer
    fs.writeFileSync(ymlFilePath, ymlBuffer);
    fs.writeFileSync(pngFilePath, pngBuffer);

    // 执行命令
    exec(`node lv_i18n.js compile -t ${ymlFilePath}`, (error, stdout, stderr) => {
        // 删除临时文件（可选，视情况而定）
        fs.unlinkSync(ymlFilePath);
        fs.unlinkSync(pngFilePath);

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

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
