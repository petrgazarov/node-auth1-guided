const bcrypt = require('bcrypt');
const router = require("express").Router();

const User = require("../users/users-model.js");

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // 1. Check if there exists a user with this username
  // 2. If yes, verify that password matches. If it does, save the session and set the cookie. If it does not, send a 401
  // 3. If no, send a 401

  User
    .findBy({ username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(password, user.password)) {
        res.session.user = user;

        res.json({ message: `Welcome back ${user.username}, have a cookie!` });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    });
  
  res.json({});
});

module.exports = router;