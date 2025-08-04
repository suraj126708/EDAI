// Middleware to check if user is authenticated
export function ensureUserAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect("/user-login");
}

// Middleware to check if NGO is authenticated
export function ensureNGOAuthenticated(req, res, next) {
  if (req.session && req.session.ngo) {
    return next();
  }
  return res.redirect("/ngo-login");
}
