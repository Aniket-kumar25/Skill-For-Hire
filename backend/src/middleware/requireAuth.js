import jwt from 'jsonwebtoken';
import User from '../models/User.js';
export default async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.p25_session;
    if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    const user = await User.findById(payload.sub).select('_id fullName email roles');
    if (!user) return res.status(401).json({ message: 'Account not found. Please sign in again.' });
    if (!user.roles?.length) { user.roles = ['student']; await user.save(); }
    if (user.roles.length > 1) { user.roles = [user.roles[0]]; await user.save(); }
    req.user = user; next();
  } catch { return res.status(401).json({ message: 'Your session is invalid or expired. Please sign in again.' }); }
}
