const express = require('express');
const router = express.Router();
const { users } = require('../config/users');
const { generateToken, authenticateToken } = require('../middleware/auth');

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre gereklidir.' });
  }

  const user = users[username];

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
  }

  const token = generateToken(username);
  if (!token) {
    return res.status(500).json({ error: 'Token oluşturulamadı.' });
  }

  res.json({
    success: true,
    token: token,
    user: {
      username: username,
      role: user.role
    }
  });
});

// Logout (client-side token silme için)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Başarıyla çıkış yapıldı.' });
});

// Kullanıcı bilgilerini kontrol et
router.get('/me', authenticateToken, (req, res) => {
  const username = req.user.username;
  const user = users[username];

  if (!user) {
    return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
  }

  res.json({
    username: username,
    role: user.role
  });
});

module.exports = router;

