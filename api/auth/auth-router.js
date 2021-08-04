const bcrypt = require('bcrypt');
const router = require("express").Router();

const User = require("../users/users-model.js");

router.post('/login', (req, res) => {
  console.log('req.session', req.session);
  
  res.json({});
});

module.exports = router;