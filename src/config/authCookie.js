/**
 * HTTP-only session cookie for JWT. `secure` is on in production so browsers
 * only send it over HTTPS (Railway, etc.). Set COOKIE_SECURE=false to force
 * off even in production (e.g. unusual TLS termination setups).
 */
function isSecureCookie() {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  return process.env.NODE_ENV === "production";
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: isSecureCookie(),
  };
}

/** Options Express needs to clear the cookie reliably (must match `path` / `secure`). */
function clearSessionCookieOptions() {
  const { maxAge, ...rest } = sessionCookieOptions();
  return rest;
}

module.exports = { sessionCookieOptions, clearSessionCookieOptions, isSecureCookie };
