const router = require('express').Router()
const User = require('../users/users-model')
const bcrypt = require('bcryptjs')

router.post('/register', (req, res, next) => {
  const { username, password } = req.body

  const hash = bcrypt.hashSync(
    password, // the string we're hashing
    8,        // 2 ^ 8 rounds of hashing
  )

  User.add({ username, password: hash })
    .then(user => {
      res.status(201).json({
        message: `We are happy to have you, ${user.username}`
      })
    })
    .catch(err => {
      next(err)
    })
})
router.post('/login', (req, res, next) => {
  const { username, password } = req.body

  User.findBy({ username })
    .then(([user]) => {
      if (user && bcrypt.compareSync(password, user.password)) {
        // there should be a req.session we can write to
        // if we change the req.session object
        //  1- the session gets persisted
        //  2- the response includes a SET-COOKIE with the session id
        req.session.user = user
        res.json({
          message: `Welcome back, ${user.username}`,
        })
      } else {
        next({
          status: 401,
          message: `Invalid credentials`,
        })
      }
    })
    .catch(err => {
      next(err)
    })
})
router.get('/logout', (req, res, next) => {
  if (req.session.user) {
    req.session.destroy(err => {
      
    })
  } else {
    res.json({
      message: 'do I know you?'
    })
  }
})
router.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    customMessage: 'something went wrong in auth router',
    message: err.message,
    stack: err.stack,
  })
})

module.exports = router;
