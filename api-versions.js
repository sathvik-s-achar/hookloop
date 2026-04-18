const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

// 🟢 V1: The Healthy Production API
app.get('/api/v1/user-profile', (req, res) => {
    res.json({
        userId: 1024,
        username: "admin_ninja",
        accountBalance: 500.50,
        preferences: { darkMode: true }
    });
});

// 🔴 V2: The Buggy Update (userId is now a string, darkMode is missing)
app.get('/api/v2/user-profile', (req, res) => {
    res.json({
        userId: "1024", // BUG: Type changed to String
        username: "admin_ninja",
        accountBalance: 500.50,
        preferences: {} // BUG: Key removed
    });
});

app.listen(5010, () => console.log('📡 API Version Simulator running on port 5010'));