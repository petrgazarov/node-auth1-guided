const bcrypt = require('bcrypt');
const router = require("express").Router();
// This is the users model, with methods that access the database through knex.
// This allows us to look users up, add them to the database, etc.
const Users = require('../users/users-model');

//----------------------------------------------------------------------------//
// POST /api/auth/register
//
// In this method, we extract the user object info from the req.body. we then
// hash the password using bcrypt and store the hash on the user object before
// passing it in to Users.add, so it's the *hash* that is stored in the DB, not
// the plain text password.
//
// note that the hash is a hash of the user's password, plus a "salt" string.
// Salt is a random string that is appended to the password before the hashing
// algorithm is executed. The salt can be provided by you, or you can allow
// bcrypt to generate a salt string automatically (this is the default).
//
// This way, the hash that we put in our database is not easily recognizable.
// Someone with a "rainbow table" can't do a simple lookup for the hash you have
// stored. (A rainbow table is a list of pre-computed hashes that they can use
// to try to look up a password, after they gain unauthorized access to  your
// database).
//
//----------------------------------------------------------------------------//
router.post('/register', (req, res, next) => {
  const { username, password } = req.body;

  // The format of this hash is $[version]$[cost]$[salt][hash]. "cost" is a factor
  // that indicates how many times the hash algorithm should be run. The hash
  // algorithm is computationally expensive, so every additional run takes
  // longer and longer. A cost factor of 3 is twice is long as a cost factor
  // of 2... 2^cost is the number of times the algorithm is executed. The salt
  // is randomly generated by bcryptjs by default. The salt and the cost
  // factor are stored with the hash, so when bcrypt is asked to "compare" a
  // password "guess" to this hash (which means it will try to recompute the
  // hash using the provided password, and compare the newly-computed hash with
  // the original hash), it will have the same salt that was originally used,
  // and the same cost factor. Without these, together with the correct
  // password, it would not be able to generate the same hash. (Note that
  // there are multiple versions of the algorithm that bcrypt uses, and the
  // version indicator is also saved with the hash, so it is sure to use the
  // right version).
  const passwordHash = bcrypt.hashSync(password, 8);

  Users
    .add({ username, password: passwordHash })
    .then(({ username }) => res.status(201).json({ message: `Great to have you with us, ${username}` }))
    .catch(next); // Our custom err handling middleware will trap this
});

//----------------------------------------------------------------------------//
// Here we pull the username/password from the body, and use them to validate
// the password "guess".
//
// One thing that I discovered in my testing is that the req.session object is
// always created by express-session, whether there is a cookie or not, and
// whether or not the cookie has a valid session ID for an unexpired session. It
// always creates a req.session object. What's more, req.session.id (and
// req.sessionID, which are the same value) always has a value. That value will
// be the value that came in a cookie header, if one was sent (and if it is
// valid). Otherwise, it will be a randomized identifier created by
// express-session. Express-session will automatically create a session record
// in the store IFF the req.session object has been modified. The identifier in
// the session record will be the randomly-generated value. The session record
// is saved when the HTTP request is ended, and a response is sent (again, only
// if it has been modified - based on the sessionConfig property
// "saveUninitialized".) So the act of setting req.session.user will result
// in a session object being created, and a set-cookie header being added to the
// response. This is true even if req.session.user is set to false! We must
// not modify req.session *unless* we are certain that we want a session record
// created.
//
// On successful login, we not only send a 200 back, but we also store something
// on the req.session object, so that other middleware methods (like our
// authMiddleware() function) can tell that this handler validated the credentials.
// Essentially, adding this value to the req.session object indicates to the
// rest of our middleware methods that the session is "valid" or "active". In
// addition, modifying req.session will cause it to be saved as a session record
// (together with any data we added to it), which will be stored in our store.
// And, doing that will cause express-session to add a set-cookie header on our
// response, causing the browser to 1) store the cookie value (which is an
// encrypted form of the session ID), and 2) include it in a cookie header in
// subsequent requests (until the cookie expires). That way, every subsequent
// request has a value that express-session can attempt to decrypt, and if it
// succeeds, it can then check the session store to see if it is for a valid
// session, and if it is, it can add the session record from the store to the
// req.session object. That way, our authMiddleware middleware can check to see if
// the req.session object is the default vanilla one, or if it came from our
// store, which means that a valid session ID was sent in by the browser.
//----------------------------------------------------------------------------//
router.post('/login', (req, res, next) => {
  const { username, password } = req.body;

  Users
    .findBy({ username })
    .first()
    .then(user => {
      // .compareSync() uses the algorithm version, cost factor, and salt,
      // all from the hash we pass in (the one we read from the database),
      // and combined with the user's password guess, computes a new hash.
      // It then compares the newly computed hash with the one we read
      // from the database, and returns "true" if they are a match.
      if (user && bcrypt.compareSync(password, user.password)) {
        // Once we are here, we are authenticated. We want to add
        // something to req.session to indicate success here. One
        // option is:
        //
        //    req.session.user = username
        //
        // You can put whatever you want in req.session, just so that
        // you know what to look for in other middleware functions so
        // they know that this login succeeded.
        //
        // Another option is:
        //
        //    req.session.user = user;
        //
        // Remember that this will force a session record to be created,
        // and a set-cookie header to be sent back to the browser.
        req.session.user = user;

        res.json({ message: `Welcome back ${user.username}, have a cookie!` });
      } else {
        // req.session.user will not exist if we end up here.
        res.status(401).json({ message: 'Invalid Credentials' });
      }
    })
    .catch(next);
});

//----------------------------------------------------------------------------//
// Log out
//----------------------------------------------------------------------------//
router.get('/logout', (req, res) => {
  if (req.session && req.session.user) {
    const { username } = req.session.user

    req.session.destroy(err => {
      if (err) {
        res.json({
          message: `You can never leave, ${username}...`
        });
      } else {
        res.json({
          message: `Bye ${username}, thanks for playing`
        });
      }
    });
  } else {
    res.json({
      message: `Excuse me, do I know you?`
    });
  }
});

router.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message,
    stack: err.stack,
    customMessage: 'Something went wrong inside the auth router'
  });
});

module.exports = router;
