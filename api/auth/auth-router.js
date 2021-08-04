const bcrypt = require('bcrypt');
const router = require("express").Router();

const User = require("../users/users-model.js");

router.post('/login', (req, res) => {
  req.session.something = 123;
  
  res.json({});
});

module.exports = router;