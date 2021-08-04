const router = require("express").Router();
const Users = require("./users-model.js");
const authMiddleware = require('../auth/auth-middleware');

// The /api/users endpoint is protected by the "authMiddleware"
// function. This middleware checks to see if req.session has a "user" object.
// It will if : 1) the session object is not expired, and 2) the session
// object was modified by the /login handler, by adding a "user" property to it.
//
// The session object is kept in express-session's "store". When a request
// comes in, express-session looks for a cookie that matches the cookie
// config in the session config object. If it finds one, it decrypts the
// cookie value, and uses the value as an identifier for the session object
// that was created before. If it is a valid session ID, the session object
// is retrieved from the store, and added to the req object.
//
// If we ever modify the req.session object, the new session object with our
// modifications is saved back to the store, and the session ID is sent as an
// encrypted cookie (using the settings we set up).
//
// If that id is returned in a request, the corresponding session object, with
// our modifications, which were saved along with it (such as the "user" object
// we add in the /login handler), is saved to the req.session property.
//
// This is how the authMiddleware has access to it. The modified
// session object is added to the req object, if the incoming request has a
// valid session ID in the right cookie.
router.get("/", authMiddleware, (req, res, next) => {
  Users.find()
    .then(users => {
      res.status(200).json(users);
    })
    .catch(next);
});

router.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message,
    stack: err.stack,
    customMessage: 'Something went wrong inside the users router'
  });
});

module.exports = router;
