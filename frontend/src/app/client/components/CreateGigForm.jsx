const CATEGORIES = [
  'Web Development',
  'UI/UX Design',
  'Content Writing',
  'Data & AI',
  'Marketing',
  'Other'
];

function getTomorrowDateString() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export default function CreateGigForm({ form, onChange, onSubmit, submitting }) {
  const minDeadlineDate = getTomorrowDateString();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <h2 className="text-xl font-bold">Create a gig</h2>
      <p className="mt-1 text-sm text-slate-500">
        Describe the work and the skills you need.
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <label className="block text-sm font-semibold">
          Gig title
          <input
            required
            minLength={5}
            maxLength={100}
            value={form.title}
            onChange={(event) => onChange('title', event.target.value)}
            placeholder="e.g. Build a responsive portfolio website"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal"
          />
        </label>

        <label className="block text-sm font-semibold">
          Description
          <textarea
            required
            minLength={20}
            maxLength={5000}
            rows={4}
            value={form.description}
            onChange={(event) => onChange('description', event.target.value)}
            placeholder="Explain the project, expected outcome and scope…"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Category
            <select
              value={form.category}
              onChange={(event) => onChange('category', event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-normal"
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold">
            Required skills
            <input
              required
              value={form.requiredSkills}
              onChange={(event) => onChange('requiredSkills', event.target.value)}
              placeholder="React, JavaScript, CSS"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-semibold">
            Min budget (₹)
            <input
              type="number"
              min="0"
              required
              value={form.budgetMin}
              onChange={(event) => onChange('budgetMin', event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal"
            />
          </label>

          <label className="block text-sm font-semibold">
            Max budget (₹)
            <input
              type="number"
              min="0"
              required
              value={form.budgetMax}
              onChange={(event) => onChange('budgetMax', event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal"
            />
          </label>

          <label className="block text-sm font-semibold">
            Deadline
            <input
              type="date"
              required
              min={minDeadlineDate}
              value={form.deadline}
              onChange={(event) => onChange('deadline', event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60"
        >
          {submitting ? 'Publishing…' : 'Publish gig →'}
        </button>
      </form>
    </section>
  );
}
