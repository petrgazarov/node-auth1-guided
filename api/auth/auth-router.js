const router = require('express').Router()


router.post('/register', (req, res, next) => {
  res.json({ message: ''})
})
router.post('/login', (req, res, next) => {
  res.json({ message: ''})
})
router.verb('/logout', (req, res, next) => {
  res.json({ message: ''})
})



module.exports = router;
