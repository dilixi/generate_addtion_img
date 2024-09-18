const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // 这里可以添加逻辑来验证用户名和密码
    if (username === 'admin' && password === 'password') {
        res.send('Login successful!');
    } else {
        res.send('Login failed. Please try again.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
