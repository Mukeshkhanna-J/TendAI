import { Upload } from "lucide-react";
import { useState } from "react";

export default function CreateTender() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    event.currentTarget.reset();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gov-navy">Create Tender</h1>
        <p className="mt-2 text-sm text-slate-600">Draft a mock tender notice. This form does not upload files or call a backend.</p>
      </div>
      {submitted && <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">Mock tender saved locally for this session.</div>}
      <form className="panel p-6" onSubmit={handleSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700 md:col-span-2">Title<input className="field mt-1" required /></label>
          <label className="block text-sm font-medium text-slate-700 md:col-span-2">Description<textarea className="field mt-1 min-h-28" required /></label>
          <label className="block text-sm font-medium text-slate-700">Category<select className="field mt-1" required><option>Infrastructure</option><option>IT Services</option><option>Energy</option><option>Healthcare</option><option>Maintenance</option></select></label>
          <label className="block text-sm font-medium text-slate-700">Closing Date<input className="field mt-1" type="date" required /></label>
          <label className="block text-sm font-medium text-slate-700">EMD Amount<input className="field mt-1" type="number" min="0" required /></label>
          <label className="block text-sm font-medium text-slate-700">Estimated Value<input className="field mt-1" type="number" min="0" required /></label>
          <label className="block text-sm font-medium text-slate-700 md:col-span-2">Eligibility Criteria<textarea className="field mt-1 min-h-24" required /></label>
          <label className="block text-sm font-medium text-slate-700 md:col-span-2">Document Upload
            <div className="mt-1 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 text-center">
              <Upload className="h-8 w-8 text-slate-400" />
              <span className="mt-2 text-sm font-medium text-slate-700">Choose tender documents</span>
              <span className="text-xs text-slate-500">UI only. Files are not uploaded.</span>
              <input className="sr-only" type="file" multiple />
            </div>
          </label>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button className="btn-secondary" type="reset">Clear</button>
          <button className="btn-primary" type="submit">Publish Mock Tender</button>
        </div>
      </form>
    </div>
  );
}
