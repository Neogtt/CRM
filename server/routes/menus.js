const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getAllowedMenus } = require('../config/users');

// Kullanıcının erişebileceği menüleri döndür
router.get('/allowed', authenticateToken, (req, res) => {
  const username = req.user.username;
  const menus = getAllowedMenus(username);
  res.json(menus);
});

module.exports = router;

