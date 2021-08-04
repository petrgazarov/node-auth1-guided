const bcrypt = require('bcrypt');
const router = require("express").Router();

const User = require("../users/users-model.js");

router.post('/register', (req, res, next) => {
  const { username, password } = req.body;

  // 1. Calculate the hash of the password
  // 2. Save the hash to the db

  const passwordHash = bcrypt.hashSync(password, 8);

  User
    .add({ username, password: passwordHash })
    .then(({ username }) => res.status(201).json({ message: `Great to have you with us, ${username}`}))
    .catch(next);
});

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
    const { username } = req.session.user;

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