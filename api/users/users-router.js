const router = require("express").Router();

const authMiddleware = require("../auth/auth-middleware.js");
const Users = require("./users-model.js");

router.get("/", authMiddleware, (req, res, next) => {
  Users.find()
    .then(users => {
      res.status(200).json(users);
    })
    .catch(next);
});

module.exports = router;
