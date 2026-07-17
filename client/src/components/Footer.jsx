export default function Footer() {
  return (
    <footer className="mt-12 border-t border-gov-line bg-white">
      <div className="page-shell grid gap-6 py-8 text-sm text-slate-600 md:grid-cols-3">
        <div>
          <h2 className="font-semibold text-gov-navy">TendAI Helpdesk</h2>
          <p className="mt-2">Phone: 1800-000-4321</p>
          <p>Email: support@tendai.gov.in</p>
          <p>Working Hours: 09:00 to 18:00 IST</p>
        </div>
        <div>
          <h2 className="font-semibold text-gov-navy">Portal Links</h2>
          <p className="mt-2">Tender Guidelines</p>
          <p>Bidder Enrollment</p>
          <p>Blockchain Verification Policy</p>
        </div>
        <div>
          <h2 className="font-semibold text-gov-navy">Disclaimer</h2>
          <p className="mt-2">This UI prototype uses dummy data for demonstration. No tender, bid, AI score, or blockchain transaction shown here is legally binding.</p>
        </div>
      </div>
      <div className="border-t border-gov-line py-3 text-center text-xs text-slate-500">
        Copyright 2026 TendAI. Designed for transparent digital public procurement.
      </div>
    </footer>
  );
}
