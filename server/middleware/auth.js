const jwt = require('jsonwebtoken');
const { users, canAccessMenu } = require('../config/users');

const JWT_SECRET = process.env.JWT_SECRET || 'expo-crm-secret-key-change-in-production';

// Token doğrulama middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Erişim reddedildi. Token bulunamadı.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Geçersiz token.' });
    }
    req.user = user;
    next();
  });
}

// Menü erişim kontrolü middleware
function checkMenuAccess(menuPath) {
  return (req, res, next) => {
    if (!req.user || !req.user.username) {
      return res.status(401).json({ error: 'Kullanıcı bilgisi bulunamadı.' });
    }

    if (!canAccessMenu(req.user.username, menuPath)) {
      return res.status(403).json({ error: 'Bu menüye erişim yetkiniz yok.' });
    }

    next();
  };
}

// Token oluştur
function generateToken(username) {
  const user = users[username];
  if (!user) {
    return null;
  }

  return jwt.sign(
    { 
      username: username,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

module.exports = {
  authenticateToken,
  checkMenuAccess,
  generateToken,
  JWT_SECRET
};

