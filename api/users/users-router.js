const router = require("express").Router();

const Users = require("./users-model.js");

const protected = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    next({
      message: 'You shall not pass!'
    })
  }
}

router.get("/", protected, (req, res, next) => {
  Users.find()
    .then(users => {
      res.status(200).json(users);
    })
    .catch(next);
});

router.use((err, req, res, next) => { // eslint-disable-line
  res.status(err.status || 500).json({
    message: err.message,
    stack: err.stack,
    customMessage: 'Something went wrong inside the users router'
  });
});

module.exports = router;
