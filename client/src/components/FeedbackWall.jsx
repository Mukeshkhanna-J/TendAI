import { useEffect, useState } from "react";
import { MessageSquare, Star } from "lucide-react";
import { feedbackAPI } from "../services/api.js";
import { formatDateTime } from "../utils/format.js";

function StarInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(value === star ? null : star)}
          className="text-amber-400"
          aria-label={`${star} star`}
        >
          <Star className={`h-5 w-5 ${value && star <= value ? "fill-amber-400" : "fill-transparent"}`} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

export default function FeedbackWall() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", message: "", rating: null });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await feedbackAPI.getAll();
      setFeedback(data || []);
    } catch (err) {
      console.error("Failed to load feedback:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.message.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await feedbackAPI.submit(form);
      setForm({ name: "", message: "", rating: null });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-gov-navy">
        <MessageSquare className="h-5 w-5" /> Public Feedback on This Work
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Share your thoughts on the transparency initiative, the AI scoring approach, or the blockchain verification
        shown above. Feedback is public and shown immediately below.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-md border border-slate-200 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            className="field"
            type="text"
            placeholder="Your name (optional)"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            maxLength={80}
          />
          <div className="flex items-center gap-2 sm:justify-end">
            <span className="text-xs text-slate-500">Rating (optional)</span>
            <StarInput value={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
          </div>
        </div>
        <textarea
          className="field min-h-[80px]"
          placeholder="What do you think about this project?"
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          maxLength={1000}
          required
        />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading feedback...</p>
        ) : feedback.length === 0 ? (
          <p className="text-sm text-slate-500">No feedback yet — be the first to share yours.</p>
        ) : (
          feedback.map((entry) => (
            <div key={entry._id} className="rounded-md border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">{entry.name || "Anonymous"}</span>
                <span className="text-xs text-slate-400">{formatDateTime(entry.createdAt)}</span>
              </div>
              {entry.rating && (
                <div className="mt-1 flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${star <= entry.rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300"}`}
                    />
                  ))}
                </div>
              )}
              <p className="mt-2 text-sm text-slate-700">{entry.message}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
