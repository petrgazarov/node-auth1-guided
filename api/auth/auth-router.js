const bcrypt = require('bcrypt');
const router = require('express').Router();
const { add } = require('../users/users-model');

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

module.exports = router;