const router = require('express').Router()
const 

router.post('/register', (req, res, next) => {
  res.json({ message: 'register' })
})
router.post('/login', (req, res, next) => {
  res.json({ message: 'login' })
})
router.get('/logout', (req, res, next) => {
  res.json({ message: 'logout' })
})


module.exports = router;
