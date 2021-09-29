const bcrypt = require('bcrypt');
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

    const [user] = await findBy({ username });

    if (user && bcrypt.compareSync(password, user.password)) {
      req.session.user = user;

      res.json({ message: 'Success' });
    } else {
      res.status(401).json({ message: 'Bad credentials!' });
    }
  } catch (e) {
    next(e);
  }
});

router.get('/logout', (req, res, next) => {
  if (req.session.user) {
    const { username } = req.session.user;
    
    req.session.destroy(err => {
      if (err) {
        next(err);
      } else {
        res.json({ message: `Bye, ${username}` });
      }
    });
  } else {
    res.status(400).json({ message: 'Do I know you?' });
  }
});

module.exports = router;