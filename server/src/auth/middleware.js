import { verifyToken } from "./jwt.js";

// Attaches req.userId when a valid Bearer token is present; 401s otherwise.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "authentication required" });

  try {
    req.userId = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "invalid or expired token" });
  }
}
