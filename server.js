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

// 处理 YML 文件上传
app.post('/generate', upload.fields([{ name: 'ymlFile' }, { name: 'pngFile' }]), (req, res) => {
    

    // 检查文件是否存在
    // if (!req.files || !req.files['ymlFile'] || !req.files['pngFile']) {
    //     return res.status(400).json({ error: 'Please select both YML and PNG files!' });
    // }

    // 获取 YML 文件路径
    const ymlFilePath = path.join(__dirname, req.files['ymlFile'][0].path);
    const buffer = Buffer.alloc(2);
    
    console.log("ymlFilePath = "+ymlFilePath);

    // 读取文件的头两个字节
    const fd = fs.openSync(ymlFilePath, 'r');
    fs.readSync(fd, buffer, 0, 2, 0);
    fs.closeSync(fd);

    const firstTwoBytesHex = buffer.toString('hex');
    console.log('YML file first two bytes:', firstTwoBytesHex); // 打印头两个字节的十六进制表示

    // 处理 PNG 文件
    // const pngFilePath = path.join(__dirname, req.files['pngFile'][0].path);
    
    // console.log("pngFilePath = "+pngFilePath);

    // 使用 Image 模块获取 PNG 文件的宽度和高度
    //const img = new Image();
    //img.src = pngFilePath;

    //img.onload = function() 
    //{
       // console.log(`PNG Width: ${img.width}, Height: ${img.height}`);

        // 执行命令
        exec(`node lv_i18n.js compile -t translations/*.yml -l de`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error.message}`);
                return res.status(500).json({ error: 'Failed to execute command' });
            }
            console.log(`Command output: ${stdout}`);
            // 返回成功的响应，同时包含头两个字节和PNG的宽高
            res.json({ message: 'File uploaded successfully!', bytes: firstTwoBytesHex });
        });
    //};

    //img.onerror = function() {
       // console.error('Error loading PNG image');
      //  res.status(500).json({ error: 'Failed to load PNG image' });
    //};
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
