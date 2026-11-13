import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import ClientProfile from '../models/ClientProfile.js';
const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 });
function publicUser(user) { const role = user.roles?.[0] || 'student'; return { id: user._id, fullName: user.fullName, email: user.email, role, roles: [role] }; }
function setSession(res, user) {
  const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' });
  res.cookie('p25_session', token, cookieOptions());
}
export async function register(req, res, next) {
  try {
    const fullName = typeof req.body.fullName === 'string' ? req.body.fullName.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const role = ['student', 'client'].includes(req.body.role) ? req.body.role : '';
    if (!role) return res.status(400).json({ message: 'Choose either Student or Client account type.' });
    const roles = [role];
    if (fullName.length < 2 || fullName.length > 100) return res.status(400).json({ message: 'Name must be between 2 and 100 characters.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 10 || password.length > 72) return res.status(400).json({ message: 'Password must be 10–72 characters long.' });
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) return res.status(400).json({ message: 'Password must include uppercase, lowercase and a number.' });
    if (await User.exists({ email })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const user = await User.create({ fullName, email, passwordHash: await bcrypt.hash(password, 12), roles });
    if (roles.includes('student')) await StudentProfile.create({ studentId: user._id.toString(), fullName: user.fullName, contactEmail: user.email });
    if (roles.includes('client')) await ClientProfile.create({ userId: user._id, displayName: user.fullName });
    setSession(res, user);
    res.status(201).json({ message: 'Account created successfully.', user: publicUser(user) });
  } catch (error) { if (error.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.' }); next(error); }
}
export async function login(req, res, next) {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Invalid email or password.' });
    if (!user.roles?.length) { user.roles = ['student']; await user.save(); }
    if (user.roles.length > 1) { user.roles = [user.roles[0]]; await user.save(); }
    setSession(res, user);
    res.json({ message: 'Signed in successfully.', user: publicUser(user) });
  } catch (error) { next(error); }
}
export function logout(_req, res) { res.clearCookie('p25_session', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' }); res.json({ message: 'Signed out successfully.' }); }
export function currentUser(req, res) { res.json({ user: publicUser(req.user) }); }
