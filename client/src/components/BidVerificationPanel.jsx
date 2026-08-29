import { useState } from "react";
import { ShieldAlert, ShieldCheck, TriangleAlert, X } from "lucide-react";
import { bidAPI } from "../services/api.js";
import { computeCommitHash, getBidOnChain } from "../blockchain/chain.js";
import { formatCurrency } from "../utils/format.js";

function HashRow({ label, value }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 py-1 text-xs">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="break-all font-mono text-slate-700">{value || "—"}</span>
    </div>
  );
}

export default function BidVerificationPanel({ bid, onClose }) {
  const [documentAmount, setDocumentAmount] = useState(String(bid.amount));
  const [documentName, setDocumentName] = useState("BidDocument.pdf");
  const [result, setResult] = useState(
    bid.verification?.status !== "Not Submitted" ? { data: bid.verification, source: "stored record" } : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runVerification(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      // Everything here runs in the browser: recompute the hash from the
      // claimed document amount + the bid's salt, read the bid's real
      // commitment straight from the blockchain (getBid), and compare the
      // two locally. No server round-trip decides the outcome.
      const recomputedHash = computeCommitHash(documentAmount, bid.salt);
      const onChain = await getBidOnChain(bid.id);

      if (!onChain.exists) {
        const failResult = {
          data: {
            status: "Failed",
            revealedAmount: Number(documentAmount),
            recomputedHash,
            onChainHash: "",
            reason: "No on-chain commitment exists for this bid ID — nothing to verify against."
          },
          source: "blockchain (client-side read)"
        };
        setResult(failResult);
        return;
      }

      const verified = recomputedHash.toLowerCase() === onChain.commitHash.toLowerCase();
      const verifyResult = {
        data: {
          status: verified ? "Verified" : "Failed",
          revealedAmount: Number(documentAmount),
          recomputedHash,
          onChainHash: onChain.commitHash,
          reason: verified
            ? "Document amount matches the on-chain commitment."
            : "Document amount does not match the on-chain commitment. Verification failed — possible tampering."
        },
        source: "blockchain (client-side read)"
      };
      setResult(verifyResult);

      // Best-effort: persist the outcome so the Admin Dashboard and public
      // transparency page can show it too. The verdict above already stands
      // on its own — this is just for other views, not a re-check.
      bidAPI
        .recordVerification(bid.id, {
          verified,
          documentAmount: Number(documentAmount),
          documentName,
          recomputedHash,
          onChainHash: onChain.commitHash
        })
        .catch(() => {});
    } catch (err) {
      setError(err.message || "Verification failed while reading the blockchain.");
    } finally {
      setLoading(false);
    }
  }

  function simulateAttack() {
    // Simulate a bidder (or attacker with document access) quietly lowering
    // the amount stated in the document *after* the on-chain commitment was
    // already made — e.g. after seeing a competitor's bid come in lower.
    const tampered = Math.max(1, Math.round(bid.amount * 0.9));
    setDocumentAmount(String(tampered));
    setDocumentName("BidDocument-edited.pdf");
    setResult(null);
  }

  function useHonestAmount() {
    setDocumentAmount(String(bid.amount));
    setDocumentName("BidDocument.pdf");
    setResult(null);
  }

  const verified = result?.data?.status === "Verified";
  const failed = result?.data?.status === "Failed";

  return (
    <div className="panel mt-4 border-2 border-gov-blue/20 p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-gov-navy">Bid Document Verification — {bid.id}</h3>
          <p className="mt-1 text-sm text-slate-600">
            Committed amount: <strong>{formatCurrency(bid.amount)}</strong> · Hashed with a random salt in your
            browser and committed on-chain by your wallet at submission.
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 rounded-md bg-slate-50 p-3 ring-1 ring-slate-200">
        <HashRow label="Commit Hash" value={bid.commitHash} />
        <HashRow label="Chain Tx" value={bid.txHash} />
        <HashRow label="Bidder Wallet" value={bid.bidderWalletAddress} />
      </div>

      <form onSubmit={runVerification} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <label className="block text-sm font-medium text-slate-700">
          Amount stated in document
          <input
            className="field mt-1"
            type="number"
            value={documentAmount}
            onChange={(event) => setDocumentAmount(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Document name
          <input
            className="field mt-1"
            type="text"
            value={documentName}
            onChange={(event) => setDocumentName(event.target.value)}
          />
        </label>
        <div className="flex items-end">
          <button className="btn-primary w-full" type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify Document"}
          </button>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={useHonestAmount} className="btn-secondary text-xs">
          Use actual committed amount
        </button>
        <button
          type="button"
          onClick={simulateAttack}
          className="inline-flex items-center gap-1.5 rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          <TriangleAlert className="h-3.5 w-3.5" /> Simulate tampering attack
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      {result && (
        <div
          className={`mt-4 rounded-md p-4 ring-1 ${
            verified ? "bg-emerald-50 ring-emerald-200" : "bg-rose-50 ring-rose-200"
          }`}
        >
          <div className={`flex items-center gap-2 text-sm font-semibold ${verified ? "text-emerald-800" : "text-rose-800"}`}>
            {verified ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            {verified ? "Verified — document matches the blockchain commitment" : "Verification Failed — tampering detected"}
          </div>
          <p className={`mt-1 text-sm ${verified ? "text-emerald-700" : "text-rose-700"}`}>{result.data.reason}</p>
          <div className="mt-3 rounded bg-white/70 p-3 ring-1 ring-black/5">
            <HashRow label="Document Amount" value={formatCurrency(result.data.revealedAmount)} />
            <HashRow label="Recomputed Hash" value={result.data.recomputedHash} />
            <HashRow label={`On-Chain Hash (${result.source})`} value={result.data.onChainHash} />
          </div>
          {failed && (
            <p className="mt-3 text-xs text-rose-600">
              The salt used to build this hash is stored openly in the database — that's safe, because without
              already knowing the original amount, the salt alone can't be used to forge a matching hash for a
              different amount. This is exactly why the mismatch above proves tampering rather than a false alarm.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
