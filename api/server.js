//----------------------------------------------------------------------------//
// There are two new modules for this topic. express-session basically manages
// session data in a store of some kind, and manages the processing of inbound
// cookies, and outbound cookies, related to the session.
//
// Remember that session data can be stored in memory, or in a database. A
// "memcache" system is basically an exotic database that is stored in memory
// chips on a remote server. It has the performance of memory, with the
// persistence of a database on magnetic media (like a disk drive array or a
// SAN, etc). The point is that session data is stored so that when future
// requests come in with a cookie that has a session ID in it, the "session
// manager" (software that manages the creation, access to, and maintenance of
// session data) can find the session data and make it available.
//
// The express-session session manager automatically creates a "req.session"
// object for every inbound request. If the inbound request includes a cookie
// that matches the "name" parameter of the express-session middleware (see
// sessionConfig below), then express-session will look in its store (depending
// on how it's configured... we have it configured to use a database through
// knex) and try to find a session that has the session id ("sid") in the store.
// If it does find one, and it's not expired (also a configuration option in
// sessionConfig below), then it will take any additional data stored with the
// session record in the store and add it to the req.session object.
//
// connect-session-knex is a module that allows express-session to use knex to
// store session/cookie data. However knex is configured (whether to use
// sqlite3, mysql, mssql, oracle, postgres, etc.) is where the actual session
// data is stored. express-session is configured to use a new instance of
// connect-session-knex as its store. See the require() below for more notes.
//
// Note that all cookies contain is the session identifier. When the server
// (through express-session) creates a session record, a session ID is assigned.
// The server then sends in the response a "set-cookie" header, with the value
// containing nothing but an encrypted version of the session ID.
//
// When the browser receives the response, and sees the "set-cookie" header, it
// will create a cookie in its local cookie database. Part of that cookie
// includes the domain name or URL that the cookie is meant for. The browser
// knows that on every request it sends to a server at that url, it should
// create a header called "cookie", and the value of the header should be the
// value of the cookie from its local cookie database.
//
// In this way, the server can take some data that is meaningful to the
// "session" for the user, and store it in a local store (like a sqlite3
// database), and then instruct the browser to keep the *id* of that session
// record in it's local cookie store, and send that id when it sends another
// request. The UI/client-side developer doesn't have to do anything... the
// browser has all of this logic built into it. Handling the set-cookie headers
// (on responses from servers) and the cookie headers (on requests sent to
// servers) is part of a standard for managing cookies, and nearly every browser
// supports these headers according to the standard.
//----------------------------------------------------------------------------//
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
// connect-session-knex exports a function. This function takes an
// express-session object as a parameter, and returns a class constructor
// function (which you can use with the "new" keyword, as we do below in the
// sessionConfig object). When you use this method to create a new object, you
// pass it a JSON object comprised configuration properties that tell it where
// to find our knex config file, and what table and column name to create in our
// database, in order to store session records. The object returned by this
// class function has properties and methods that allow express-session to store
// session data through it.
const KnexSessionStore = require('connect-session-knex')(session);

// Get our express routers
const usersRouter = require('./users/users-router.js');
const authRouter = require('./auth/auth-router.js');

// Create the server object
const server = express();

//----------------------------------------------------------------------------//
// Create the config object for express-session. This will be passed to
// "session" when it is set up as global middleware, below.
//
// Most of these options have to do with how the cookies are managed, and how
// session data is stored.
//
// See express-session documentation at npmjs.org for info on these and other
// options.
//
// Note that the options under "store:" are for connect-session-knex.
//----------------------------------------------------------------------------//
const sessionConfig = {
  name: 'monkey',
  secret: 'keep it secret, keep it safe!',
  cookie: {
    maxAge: 1000 * 60 * 60,
    secure: false, // if true the cookie is not set unless it's an https connection
    httpOnly: false, // if true the cookie is not accessible through document.cookie
  },
  rolling: true,
  resave: false, // some data stores need this set to true
  saveUninitialized: false, // privacy implications, if false no cookie is set on client unless the req.session is changed
  store: new KnexSessionStore({
    knex: require('../database/db-config.js'), // configured instance of knex
    tablename: 'sessions', // table that will store sessions inside the db, name it anything you want
    sidfieldname: 'sid', // column that will hold the session id, name it anything you want
    createtable: true, // if the table does not exist, it will create it automatically
    clearInterval: 1000 * 60 * 60, // time it takes to check for old sessions and remove them from the database to keep it clean and performant
  }),
};

// Static pages/files served with express.static
server.use(express.static(path.join(__dirname, '../client')));

// Global middleware
server.use(helmet());
server.use(express.json());

//----------------------------------------------------------------------------//
// The session object is a function that returns a middleware method. By calling
// it, and passing our sessionConfig object to it, it creates and returns a
// function that complies with Express middleware criteria (i.e. takes the req,
// res, and next parameters, and can either call next(), or end the chain by a
// call to res.json(), res.send(), res.end(), etc.)
//
// You might remember from your React sessions that a function that returns
// another function is considered a "higher order function". By that definition,
// session() is a higher order function - it returns a middleware function.
// (Also, higher order functions take functions as parameters - so by that
// definition, server.use() is also a higher order function).
//
// By server.use()'ing the middleware function output of session() here, without
// a METHOD or url, we ensure that it is called for every API request.
//
// This middleware will basically manage cookie processing and sending, and
// related session data in the store. For every request received (because we
// didn't specify a METHOD, or a url/path), this middleware will search for
// "cookie" headers. The values of any cookie headers included in the request by
// the browser are used to search the store for a record with a "session id"
// (sid) equal to the cookie value. Note that the browser sends back the cookie
// value that it first received from the server.
//
// A typical authentication flow is as follows:
//
//     * Client sends credentials
//     * Server verifies credentials
//     * Server creates a session for the client [and stores it in the store]
//     * Server produces and sends back a cookie [containing the "id" of the
//       stored session information; with express-session, this "id" is
//       encrypted using symmetric encryption - this ensures that when the browser
//       sends the value back, the server can *decrypt* it, and see the actual
//       session id]
//     * Client [browser] stores the cookie [either in its memory or on disk
//       depending on the type of the cookie]
//     * Client [browser] sends cookie [back to the server] on every request
//       [where the request is to the same domain and path that is stored with
//       the cookie. This is automatic - the "client software" running on the
//       browser doesn't have to add the cookie as a header... the browser
//       itself will do it automatically]
//     * Server verifies that the cookie is valid [ - this is handled
//       automatically by the express-session middleware that we added to our
//       Express middleware chain by our server.use() below. It searches the
//       store - configured in sessionConfig (we are using connect-session-knex)
//       - for a record with a session id that matches the cookie value.]
//     * Server provides access to the resource [ - the entire value of the session
//       record in the store is added to the req object by the express-session
//       middleware, if 1) the session ID is valid, and 2) the session hasn't
//       expired - the expiration timeout is a setting in sessionConfig]
//
// Whether or not the session ID is valid, this middleware method will create an
// object on req called "session". It's just an object that contains info about
// the cookie that came from the browser, or default values from sessionConfig
// if there is no matching session (or no cookie). If there is a matching
// session record in the store, express-session will add the actual cookie data,
// as well as any other data that was added by us (our code) to the session
// before (in a previous request handling). See the /login handler to see how we
// add something to req.session so that our authMiddleware() middleware can tell if
// the request came with a valid cookie. /login tries to validate the username
// and password, using bcrypt, and if they are valid, the username is added to
// the req.session object. This does 2 things: 1) it makes req.session.username
// available to every other middleware method that will process the request, and
// 2) it makes express-session save the data that we added (the username, in
// this case) to the session data in the store. Any modification to req.session
// is duplicated in the session record in the store. That way, when another
// request comes in from the browser with a cookie that has that same session
// ID, express-session will retrieve the session record, including our custom
// data, and middleware processing the request will see that the request came in
// with a valid cookie (otherwise, the req.session object would be vanilla - it
// wouldn't include the custom data we added before). Note also that
// express-session will take care of cleaning out our session table in the
// store. When sessions expire, they are automatically removed. So if a browser
// sends a request with a cookie that has the session ID of a session that is
// expired, the session won't be found. (That shouldn't normally happen though,
// because the session expiration timeout is the same as the cookie expiration
// timeout, and the browser also takes care of removing expired persistent
// cookies from its cookie store - usually).
//----------------------------------------------------------------------------//
server.use(session(sessionConfig));

server.use('/api/users', usersRouter);
server.use('/api/auth', authRouter);

server.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

server.use('*', (req, res, next) => {
  next({ status: 404, message: 'not found!' });
});

server.use((err, req, res, next) => { // eslint-disable-line
  res.status(err.status || 500).json({
    message: err.message,
    stack: err.stack,
  });
});

module.exports = server;
