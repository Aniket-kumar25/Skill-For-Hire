import mongoose from '../../../../backend/node_modules/mongoose/index.js';
import Gig from '../models/Gig.js';
import Application from '../models/Application.js';
import StudentProfile from '../../../../backend/src/models/StudentProfile.js';
import Work from '../../../../module3/backend/src/models/Work.js';

const SKILL_ALIASES = {
  js: 'javascript',
  ts: 'typescript',
  reactjs: 'react',
  'react.js': 'react',
  nodejs: 'node',
  'node.js': 'node',
  nextjs: 'next',
  'next.js': 'next',
  expressjs: 'express',
  'express.js': 'express',
  mongo: 'mongodb',
  postgres: 'postgresql',
  py: 'python',
  html5: 'html',
  css3: 'css',
  'tailwind css': 'tailwind',
  tailwindcss: 'tailwind',
  'ui/ux design': 'ui/ux'
};

function normalizeSkill(skill) {
  const cleaned = String(skill || '').trim().toLowerCase();
  return SKILL_ALIASES[cleaned] || cleaned;
}

function cleanSkills(rawSkills) {
  if (!Array.isArray(rawSkills)) {
    return [];
  }

  const uniqueSkills = [];
  const seen = new Set();

  for (const item of rawSkills) {
    const trimmed = String(item || '').trim();
    if (!trimmed) {
      continue;
    }

    const key = normalizeSkill(trimmed);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueSkills.push(trimmed);
    }

    if (uniqueSkills.length >= 20) {
      break;
    }
  }

  return uniqueSkills;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseRequiredNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseOptionalNumber(value) {
  if (value === undefined || value === null) {
    return { provided: false, value: undefined };
  }

  if (typeof value === 'string' && value.trim() === '') {
    return { provided: false, value: undefined };
  }

  const parsed = parseRequiredNumber(value);
  if (parsed === null) {
    return { provided: true, value: NaN };
  }

  return { provided: true, value: parsed };
}

export async function createGig(req, res, next) {
  try {
    const {
      title,
      description,
      category,
      requiredSkills,
      budgetMin,
      budgetMax,
      deadline
    } = req.body || {};

    const skills = cleanSkills(requiredSkills);

    if (
      typeof title !== 'string' ||
      title.trim().length < 5 ||
      typeof description !== 'string' ||
      description.trim().length < 20 ||
      typeof category !== 'string' ||
      !category.trim() ||
      skills.length === 0 ||
      !deadline
    ) {
      return res.status(400).json({
        message: 'Enter a title (5+ chars), description (20+ chars), category, required skills and deadline.'
      });
    }

    const minBudget = parseRequiredNumber(budgetMin);
    const maxBudget = parseRequiredNumber(budgetMax);

    if (minBudget === null || maxBudget === null || minBudget < 0 || maxBudget < minBudget) {
      return res.status(400).json({
        message: 'Enter valid budgets; maximum must be at least minimum.'
      });
    }

    const dueDate = new Date(deadline);
    if (Number.isNaN(dueDate.getTime()) || dueDate <= new Date()) {
      return res.status(400).json({ message: 'Gig deadline must be in the future.' });
    }

    const gig = await Gig.create({
      clientId: req.userId,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      requiredSkills: skills,
      budgetMin: minBudget,
      budgetMax: maxBudget,
      deadline: dueDate
    });

    res.status(201).json({ gig });
  } catch (error) {
    next(error);
  }
}

export async function listGigs(req, res, next) {
  try {
    const { q, category, skill, minBudget, maxBudget } = req.query;
    const filter = {
      status: 'open',
      deadline: { $gte: new Date() }
    };

    if (category !== undefined) {
      if (typeof category !== 'string') {
        return res.status(400).json({ message: 'Invalid category filter.' });
      }
      if (category.trim()) {
        filter.category = category.trim();
      }
    }

    if (skill !== undefined) {
      if (typeof skill !== 'string') {
        return res.status(400).json({ message: 'Invalid skill filter.' });
      }
      if (skill.trim()) {
        filter.requiredSkills = {
          $in: [new RegExp(escapeRegex(skill.trim()), 'i')]
        };
      }
    }

    if (q !== undefined) {
      if (typeof q !== 'string') {
        return res.status(400).json({ message: 'Invalid search query.' });
      }
      if (q.trim()) {
        filter.$text = { $search: q.trim() };
      }
    }

    const minResult = parseOptionalNumber(minBudget);
    const maxResult = parseOptionalNumber(maxBudget);

    if (minResult.provided && (!Number.isFinite(minResult.value) || minResult.value < 0)) {
      return res.status(400).json({ message: 'Enter a valid non-negative minimum budget.' });
    }

    if (maxResult.provided && (!Number.isFinite(maxResult.value) || maxResult.value < 0)) {
      return res.status(400).json({ message: 'Enter a valid non-negative maximum budget.' });
    }

    if (minResult.provided && maxResult.provided && minResult.value > maxResult.value) {
      return res.status(400).json({ message: 'Minimum budget cannot exceed maximum budget.' });
    }

    if (minResult.provided) {
      filter.budgetMax = { $gte: minResult.value };
    }

    if (maxResult.provided) {
      filter.budgetMin = { $lte: maxResult.value };
    }

    const gigs = await Gig.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ gigs });
  } catch (error) {
    next(error);
  }
}

export async function getGig(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid gig ID.' });
    }

    const gig = await Gig.findById(req.params.id).lean();
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found.' });
    }

    res.json({ gig });
  } catch (error) {
    next(error);
  }
}

export async function applyToGig(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid gig ID.' });
    }

    const gig = await Gig.findOne({
      _id: req.params.id,
      status: 'open',
      deadline: { $gte: new Date() }
    });

    if (!gig) {
      return res.status(404).json({ message: 'This gig is no longer accepting applications.' });
    }

    if (gig.clientId.toString() === req.userId) {
      return res.status(403).json({ message: 'You cannot apply to your own gig.' });
    }

    const proposal = typeof req.body?.proposal === 'string' ? req.body.proposal.trim() : '';
    if (proposal.length < 30) {
      return res.status(400).json({ message: 'Your proposal must contain at least 30 characters.' });
    }

    const budgetResult = parseOptionalNumber(req.body?.proposedBudget);
    if (budgetResult.provided && (!Number.isFinite(budgetResult.value) || budgetResult.value < 0)) {
      return res.status(400).json({ message: 'Proposed budget must be a valid non-negative number.' });
    }

    const daysResult = parseOptionalNumber(req.body?.estimatedDays);
    if (daysResult.provided && (!Number.isFinite(daysResult.value) || daysResult.value < 1)) {
      return res.status(400).json({ message: 'Estimated days must be at least 1.' });
    }

    const profile = await StudentProfile.findOne({ studentId: req.userId }).lean();
    if (!profile) {
      return res.status(400).json({ message: 'Complete your student profile before applying.' });
    }

    const studentSkillSet = new Set(
      (profile.skills || [])
        .map((skill) => normalizeSkill(typeof skill === 'string' ? skill : skill?.name))
        .filter(Boolean)
    );

    const requiredSkills = cleanSkills(gig.requiredSkills);
    const matchedSkills = requiredSkills.filter((requiredSkill) =>
      studentSkillSet.has(normalizeSkill(requiredSkill))
    );
    const matchScore =
      requiredSkills.length > 0
        ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
        : 0;

    const application = await Application.create({
      gigId: gig._id,
      studentId: req.userId,
      proposal,
      proposedBudget: budgetResult.value,
      estimatedDays: daysResult.value,
      matchedSkills,
      matchScore
    });

    res.status(201).json({ message: 'Application submitted.', application });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You have already applied to this gig.' });
    }
    next(error);
  }
}

export async function myApplications(req, res, next) {
  try {
    const applications = await Application.find({ studentId: req.userId })
      .populate('gigId')
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (error) {
    next(error);
  }
}

export async function clientApplications(req, res, next) {
  try {
    const gigs = await Gig.find({ clientId: req.userId }).select('_id');
    if (gigs.length === 0) {
      return res.json({ applications: [] });
    }

    const gigIds = gigs.map((gig) => gig._id);
    const applications = await Application.find({ gigId: { $in: gigIds } })
      .populate('gigId', 'title')
      .populate('studentId', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (error) {
    next(error);
  }
}

export async function updateApplication(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.applicationId)) {
      return res.status(400).json({ message: 'Invalid application ID.' });
    }

    const existingApplication = await Application.findById(req.params.applicationId).populate('gigId');
    if (!existingApplication) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    if (!existingApplication.gigId) {
      return res.status(404).json({ message: 'Associated gig not found.' });
    }

    if (existingApplication.gigId.clientId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the gig owner can review applications.' });
    }

    const nextStatus = req.body?.status;
    if (!['accepted', 'rejected'].includes(nextStatus)) {
      return res.status(400).json({ message: 'Invalid application status.' });
    }

    const updatedApplication = await Application.findOneAndUpdate(
      { _id: existingApplication._id, status: 'pending' },
      { $set: { status: nextStatus } },
      { new: true, runValidators: true }
    ).populate('gigId');

    if (!updatedApplication) {
      return res.status(409).json({ message: 'This application has already been reviewed.' });
    }

    if (updatedApplication.status === 'accepted') {
      try {
        await Work.findOneAndUpdate(
          { applicationId: updatedApplication._id },
          {
            $setOnInsert: {
              applicationId: updatedApplication._id,
              gigId: updatedApplication.gigId._id || updatedApplication.gigId,
              clientId: req.userId,
              studentId: updatedApplication.studentId,
              title: updatedApplication.gigId.title,
              description: updatedApplication.gigId.description,
              status: 'active',
              milestones: []
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (workError) {
        try {
          await Application.updateOne(
            { _id: updatedApplication._id, status: 'accepted' },
            { $set: { status: 'pending' } }
          );
        } catch (rollbackError) {
          console.error('Failed to roll back application status after Work creation error:', rollbackError);
        }
        throw workError;
      }
    }

    res.json({ application: updatedApplication });
  } catch (error) {
    next(error);
  }
}

export async function myGigs(req, res, next) {
  try {
    const gigs = await Gig.find({ clientId: req.userId }).sort({ createdAt: -1 }).lean();
    res.json({ gigs });
  } catch (error) {
    next(error);
  }
}

export async function updateGigStatus(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid gig ID.' });
    }

    const status = req.body?.status;
    if (!['open', 'paused', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Choose open, paused or closed.' });
    }

    const gig = await Gig.findOneAndUpdate(
      { _id: req.params.id, clientId: req.userId },
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!gig) {
      return res.status(404).json({ message: 'Gig not found.' });
    }

    res.json({ gig });
  } catch (error) {
    next(error);
  }
}

