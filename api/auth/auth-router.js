const bcrypt = require('bcrypt');
const { json } = require('express');
const router = require('express').Router();
const { add, findBy } = require('../users/users-model');

router.post('/register', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const hashedPassword = bcrypt.hashSync(password, 8);

    const user = await add({ username, password: hashedPassword });

    res.status(201).json(user);
  } catch(e) {
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const [existingUser] = await findBy({ username });

    if (existingUser && bcrypt.compareSync(password, existingUser.password)) {
      // TODO
      res.json({ message: 'Success' });
    } else {
      res.status(401).json({ message: 'Bad credentials!' });
    }
  } catch (e) {
    next(e);
  }
});

module.exports = router;