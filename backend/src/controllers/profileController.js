import mongoose from 'mongoose';
import StudentProfile from '../models/StudentProfile.js';
import ClientProfile from '../models/ClientProfile.js';
import User from '../models/User.js';

const cleanString = (value, max = 1000) => typeof value === 'string' ? value.trim().slice(0, max) : '';

function normalizeProfile(body) {
  const skills = Array.isArray(body.skills) ? body.skills.slice(0, 40).map((s) => ({
    name: cleanString(s?.name, 60),
    level: ['Beginner', 'Intermediate', 'Advanced'].includes(s?.level) ? s.level : 'Beginner'
  })).filter((s) => s.name) : [];

  const portfolio = Array.isArray(body.portfolio) ? body.portfolio.slice(0, 30).map((p) => ({
    title: cleanString(p?.title, 100),
    description: cleanString(p?.description, 800),
    technologies: Array.isArray(p?.technologies) ? p.technologies.slice(0, 15).map((t) => cleanString(t, 40)).filter(Boolean) : [],
    projectUrl: cleanString(p?.projectUrl, 300),
    imageUrl: cleanString(p?.imageUrl, 500)
  })).filter((p) => p.title) : [];

  return {
    fullName: cleanString(body.fullName, 100),
    headline: cleanString(body.headline, 120),
    bio: cleanString(body.bio, 1000),
    department: cleanString(body.department, 100),
    studyYear: ['', '1st year', '2nd year', '3rd year', '4th year', 'Postgraduate'].includes(body.studyYear) ? body.studyYear : '',
    location: cleanString(body.location, 100),
    contactEmail: cleanString(body.contactEmail, 254).toLowerCase(),
    avatarUrl: cleanString(body.avatarUrl, 500),
    skills,
    portfolio,
    availability: ['Available', 'Busy', 'Unavailable'].includes(body.availability) ? body.availability : 'Available',
    weeklyHours: Number.isFinite(Number(body.weeklyHours)) ? Math.min(80, Math.max(0, Number(body.weeklyHours))) : 5
  };
}

export async function getMyProfile(req, res, next) {
  try {
    const studentId = req.user._id.toString();
    let profile = await StudentProfile.findOne({ studentId });
    if (!profile) profile = await StudentProfile.create({ studentId, fullName: req.user.fullName, contactEmail: req.user.email });
    res.json({ profile });
  } catch (error) { next(error); }
}

export async function updateMyProfile(req, res, next) {
  try {
    const studentId = req.user._id.toString();
    const data = normalizeProfile(req.body ?? {});
    if (data.fullName.length < 2) return res.status(400).json({ message: 'Full name must contain at least 2 characters.' });
    // Keep the editable profile name and the account identity in sync.
    await User.findByIdAndUpdate(req.user._id, { $set: { fullName: data.fullName } }, { runValidators: true });
    data.contactEmail = req.user.email;
    const profile = await StudentProfile.findOneAndUpdate(
      { studentId }, { $set: data, $setOnInsert: { studentId } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ message: 'Profile saved successfully.', profile });
  } catch (error) { next(error); }
}

export async function listProfiles(req, res, next) {
  try {
    const skill = cleanString(req.query.skill, 60);
    const filter = skill ? { 'skills.name': { $regex: skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }, availability: { $ne: 'Unavailable' } } : {};
    const profiles = await StudentProfile.find(filter)
      .select('studentId fullName headline department studyYear skills portfolio availability weeklyHours updatedAt')
      .sort({ updatedAt: -1 }).limit(100);
    res.json({ profiles });
  } catch (error) { next(error); }
}

const clientTypes = ['Individual', 'Startup', 'Company', 'Educational institution', 'Non-profit', 'Other'];
function normalizeClientProfile(body) {
  const website = cleanString(body.website, 300);
  if (website && !/^https?:\/\//i.test(website)) throw Object.assign(new Error('Website must start with http:// or https://.'), { status: 400 });
  return {
    displayName: cleanString(body.displayName, 120),
    companyName: cleanString(body.companyName, 120),
    clientType: clientTypes.includes(body.clientType) ? body.clientType : 'Individual',
    industry: cleanString(body.industry, 100),
    bio: cleanString(body.bio, 1200),
    website,
    location: cleanString(body.location, 120),
    contactPhone: cleanString(body.contactPhone, 30)
  };
}
export async function getMyClientProfile(req, res, next) {
  try {
    const userId = req.user._id;
    let profile = await ClientProfile.findOne({ userId });
    if (!profile) profile = await ClientProfile.create({ userId, displayName: req.user.fullName });
    res.json({ profile, email: req.user.email });
  } catch (error) { next(error); }
}
export async function updateMyClientProfile(req, res, next) {
  try {
    const userId = req.user._id;
    const data = normalizeClientProfile(req.body ?? {});
    const email = cleanString(req.body?.email, 254).toLowerCase();
    if (data.displayName.length < 2) return res.status(400).json({ message: 'Display name must contain at least 2 characters.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ message: 'Enter a valid account email address.' });
    }
    const existing = await User.findOne({ email, _id: { $ne: userId } }).select('_id');
    if (existing) return res.status(409).json({ message: 'This email is already associated with another account.' });
    const profile = await ClientProfile.findOneAndUpdate(
      { userId },
      { $set: data, $setOnInsert: { userId } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    try {
      await User.findByIdAndUpdate(userId, { $set: { email } }, { runValidators: true });
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ message: 'This email is already associated with another account.' });
      throw error;
    }
    res.json({ message: 'Client profile saved successfully.', profile, email });
  } catch (error) { next(error); }
}
