const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { exec } = require('child_process');
const app = express();

// 设置静态文件目录
app.use(express.static(path.join(__dirname, '..')));

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

// 处理 YML 文件上传
app.post('/generate', upload.single('ymlFile'), (req, res) => {
    console.log("enter /generate");

    // 检查文件是否存在
    if (!req.file) {
        return res.status(400).json({ error: 'Please select a YML file!' });
    }

    // 获取 YML 文件路径
    const ymlFilePath = path.join(__dirname, req.file.path);

    // 创建临时 PNG 文件
    const tempPngFilePath = path.join(__dirname, 'uploads', 'template.png'); // 这里需要一个实际的 PNG 文件
    fs.copyFileSync('path/to/template.png', tempPngFilePath); // 请将路径替换为实际的 PNG 文件路径

    // 执行命令
    exec(`node lv_i18n.js compile -t ${ymlFilePath} -l de -o out.img`, (error, stdout, stderr) => {
        // 删除临时文件
        fs.unlink(ymlFilePath, (err) => {
            if (err) console.error(`Error deleting YML file: ${err.message}`);
        });
        fs.unlink(tempPngFilePath, (err) => {
            if (err) console.error(`Error deleting PNG file: ${err.message}`);
        });

        if (error) {
            console.error(`Error executing command: ${error.message}`);
            return res.status(500).json({ error: 'Failed to execute command', output: stderr });
        }

        console.log(`Command output: ${stdout}`);
        // 读取生成的文件内容
        const generatedFilePath = path.join(__dirname, 'out.img');
        fs.readFile(generatedFilePath, (err, data) => {
            if (err) {
                console.error('Error reading generated file:', err);
                return res.status(500).json({ error: 'Failed to read generated file' });
            }

            // 删除生成的文件
            fs.unlink(generatedFilePath, (err) => {
                if (err) console.error(`Error deleting generated file: ${err.message}`);
            });

            // 设置响应头并返回文件
            res.set('Content-Type', 'application/octet-stream');
            res.set('Content-Disposition', 'attachment; filename=out.img');
            res.json({ output: stdout }); // 发送执行结果
        });
    });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
