const router = require('express').Router()
const User = require('../users/users-model')
const bcrypt = require('bcryptjs')

router.post('/register', (req, res, next) => {
  const { username, password } = req.body

  const hash = bcrypt.hashSync(
    password, // the string we're hashing
    14,        // 2 ^ 8 rounds of hashing
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
  res.json({ message: 'login' })
})
router.get('/logout', (req, res, next) => {
  res.json({ message: 'logout' })
})
router.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    customMessage: 'something went wrong in auth router',
    message: err.message,
    stack: err.stack,
  })
})

module.exports = router;
