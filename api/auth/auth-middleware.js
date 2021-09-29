const authMiddleware = (req, res, next) => {
  if (!req.session.user) {
    res.status(401).json({ message: 'You shall not pass!' });
    return
  }

  next();
};

module.exports = authMiddleware;