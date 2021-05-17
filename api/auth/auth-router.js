const router = require('express').Router()
const User = require('../users/users-model')
const bcrypt = require('bcryptjs')

router.post('/register', (req, res, next) => {
  
})
router.post('/login', (req, res, next) => {
  res.json({ message: 'login' })
})
router.get('/logout', (req, res, next) => {
  res.json({ message: 'logout' })
})


module.exports = router;
