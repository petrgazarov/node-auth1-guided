const bcrypt = require('bcrypt');
const router = require("express").Router();

const User = require("../users/users-model.js");

router.post('/login', (req, res, next) => {
  const { username, password } = req.body;

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
    })
    .catch(next);
});

module.exports = router;