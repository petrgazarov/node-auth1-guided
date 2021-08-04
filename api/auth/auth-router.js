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
        req.session.user = user;

        res.json({ message: `Welcome back ${user.username}, have a cookie!` });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    })
    .catch(next);
});

router.get('/logout', (req, res) => {
  if (req.session.user) {
    // 1. Hold on to username
    // 2. Destroy session
    // 3. Handle possible error in database call
    // 4. If successful, send back a custom message

    req.session.destroy(err => {
      if (err) {
        res.json({ message: `You can never leave, ${username}` });
      } else {
        res.json({ message: `Bye ${username}, thanks for playing` });
      }
    });
  } else {
    res.json({ message: 'Excuse me, do I know you?'});
  }
});

module.exports = router;