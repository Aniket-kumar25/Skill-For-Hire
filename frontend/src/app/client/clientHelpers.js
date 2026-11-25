export const AUTH_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const GIG_API = process.env.NEXT_PUBLIC_GIG_API_URL || 'http://localhost:5001/api';

export const INITIAL_GIG_FORM = {
  title: '',
  description: '',
  category: 'Web Development',
  requiredSkills: '',
  budgetMin: '1000',
  budgetMax: '5000',
  deadline: ''
};

export function formatBudget(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);
}

export function formatDate(value) {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function isClientAccount(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }

  if (Array.isArray(user.roles)) {
    return user.roles.includes('client');
  }

  if (typeof user.role === 'string') {
    return user.role === 'client';
  }

  return null;
}

export async function requestJson(url, options = {}, fallbackMessage = 'Request failed.') {
  const fetchOptions = {
    method: options.method || 'GET',
    credentials: 'include'
  };

  if (options.body !== undefined) {
    fetchOptions.headers = { 'Content-Type': 'application/json' };
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);
  const data = await response.json().catch(() => {
    return {};
  });

  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
}

// Verifies the logged-in user session and ensures the account has the client role.
export async function verifyClientSession() {
  const response = await fetch(`${AUTH_API}/auth/me`, {
    credentials: 'include'
  });

  if (response.status === 401) {
    return { status: 'unauthenticated', user: null };
  }

  const data = await response.json().catch(() => {
    return {};
  });

  if (!response.ok) {
    throw new Error(data.message || 'Could not verify your account.');
  }

  const clientAllowed = isClientAccount(data.user);
  if (clientAllowed === null) {
    throw new Error('Could not verify your account.');
  }

  if (!clientAllowed) {
    return { status: 'forbidden', user: data.user };
  }

  return { status: 'authorized', user: data.user };
}

// Validates the Create Gig form inputs before sending them to Module 2 backend.
export function validateGigForm(form) {
  const title = form.title.trim();
  const description = form.description.trim();
  const requiredSkills = form.requiredSkills
    .split(',')
    .map((item) => {
      return item.trim();
    })
    .filter((item) => {
      return Boolean(item);
    });

  if (title.length < 5) {
    return { error: 'Gig title must contain at least 5 characters.' };
  }

  if (description.length < 20) {
    return { error: 'Description must contain at least 20 characters.' };
  }

  if (requiredSkills.length === 0) {
    return { error: 'Enter at least one required skill.' };
  }

  if (requiredSkills.length > 20) {
    return { error: 'You can list at most 20 required skills.' };
  }

  const minText = String(form.budgetMin).trim();
  const maxText = String(form.budgetMax).trim();
  const budgetMin = minText !== '' ? Number(minText) : NaN;
  const budgetMax = maxText !== '' ? Number(maxText) : NaN;

  if (!Number.isFinite(budgetMin) || !Number.isFinite(budgetMax) || budgetMin < 0 || budgetMax < 0) {
    return { error: 'Enter valid non-negative minimum and maximum budgets.' };
  }

  if (budgetMax < budgetMin) {
    return { error: 'Maximum budget must be at least minimum budget.' };
  }

  const parsedDeadline = new Date(form.deadline);
  if (!form.deadline || Number.isNaN(parsedDeadline.getTime()) || parsedDeadline <= new Date()) {
    return { error: 'Gig deadline must be a valid future date.' };
  }

  return {
    payload: {
      title,
      description,
      category: form.category,
      requiredSkills,
      budgetMin,
      budgetMax,
      deadline: form.deadline
    }
  };
}
