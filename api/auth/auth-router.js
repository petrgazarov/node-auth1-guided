const router = require('express').Router()
const User = require('../users/users-model')
const bcrypt = require('bcryptjs')

router.post('/register', (req, res, next) => {
  const { username, password } = req.body

  const hash = bcrypt.hashSync(
    password, // the string we're hashing
    8,        // 2 ^ 8 rounds of hashing
  )

})
router.post('/login', (req, res, next) => {
  res.json({ message: 'login' })
})
router.get('/logout', (req, res, next) => {
  res.json({ message: 'logout' })
})


module.exports = router;
