const jwt = require("jsonwebtoken");
const { clearSessionCookieOptions } = require("../config/authCookie");

function readToken(req) {
  return req.cookies?.token;
}

function safeNextPath(raw) {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) return "/app";
  return raw;
}

/** Dashboard HTML: only serve if the JWT cookie is present and valid. */
function requireLoginForAppPage(req, res, next) {
  const token = readToken(req);
  const nextParam = encodeURIComponent(safeNextPath(req.originalUrl || "/app"));
  if (!token) {
    return res.redirect(302, `/login?next=${nextParam}`);
  }
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    res.clearCookie("token", clearSessionCookieOptions());
    return res.redirect(302, `/login?next=${nextParam}`);
  }
}

/** Avoid showing login/signup when already signed in. */
function redirectToAppIfLoggedIn(req, res, next) {
  const token = readToken(req);
  if (!token) return next();
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return res.redirect(302, "/app");
  } catch {
    return next();
  }
}

module.exports = { requireLoginForAppPage, redirectToAppIfLoggedIn, safeNextPath };
