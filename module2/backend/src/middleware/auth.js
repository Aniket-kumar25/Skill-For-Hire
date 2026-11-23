import jwt from 'jsonwebtoken';
import mongoose from '../../../../backend/node_modules/mongoose/index.js';
import User from '../../../../backend/src/models/User.js';

export default function auth(req, res, next) {
  const token = req.cookies?.p25_session;
  if (!token) {
    return res.status(401).json({ message: 'Please sign in.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ message: 'Session invalid or expired.' });
  }

  if (!payload?.sub || !mongoose.isValidObjectId(payload.sub)) {
    return res.status(401).json({ message: 'Invalid session.' });
  }

  req.userId = payload.sub;
  next();
}

export function allowRole(role) {
  return async (req, res, next) => {
    let user;
    try {
      user = await User.findById(req.userId).select('roles');
    } catch (error) {
      return next(error);
    }

    if (!user || !Array.isArray(user.roles) || !user.roles.includes(role)) {
      return res.status(403).json({
        message: `A ${role} account is required to access this feature.`
      });
    }

    req.account = user;
    next();
  };
}

