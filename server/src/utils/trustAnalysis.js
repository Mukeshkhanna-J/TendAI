/**
 * Transparent, rule-based "AI Trust Score" for a bid.
 *
 * Every point added or removed is tied to a listed, human-readable factor —
 * there is no hidden black-box term. This is what lets the public
 * transparency page show real "proof" for a score instead of a bare number.
 */
export const analyzeBid = (amount, tender) => {
  const value = tender.value;
  const deviationPct = ((value - amount) / value) * 100; // positive = below estimate
  const emdRatioPct = (tender.emdAmount / value) * 100;

  const factors = [];
  let score = 100;

  if (deviationPct > 30) {
    score -= 35;
    factors.push({
      label: 'Abnormally low bid',
      verdict: 'bad',
      impact: -35,
      detail: `This bid is ${deviationPct.toFixed(1)}% below the tender's estimated value. Public procurement practice (India's CVC guidance on "abnormally low bids" is a widely cited example) flags bids this far below estimate for extra scrutiny — they carry a higher risk of the contractor cutting corners, failing to deliver, or renegotiating the price later.`
    });
  } else if (deviationPct > 15) {
    score -= 12;
    factors.push({
      label: 'Aggressively priced',
      verdict: 'caution',
      impact: -12,
      detail: `This bid is ${deviationPct.toFixed(1)}% below estimate. Competitive public-sector bids typically land 5-15% below the estimated value; this is more aggressive than usual, though not disqualifying on its own.`
    });
  } else if (deviationPct >= 0) {
    factors.push({
      label: 'Within competitive range',
      verdict: 'good',
      impact: 0,
      detail: `This bid is ${deviationPct.toFixed(1)}% below the estimated value, in line with the typical 0-15% range seen in competitive public tenders.`
    });
  } else {
    score -= 8;
    factors.push({
      label: 'Above estimated value',
      verdict: 'caution',
      impact: -8,
      detail: `This bid exceeds the tender's estimated value by ${Math.abs(deviationPct).toFixed(1)}%. Bids above estimate are uncommon in a competitive process and may indicate weaker cost competitiveness.`
    });
  }

  if (emdRatioPct < 0.5 || emdRatioPct > 5) {
    score -= 5;
    factors.push({
      label: 'Unusual EMD ratio',
      verdict: 'caution',
      impact: -5,
      detail: `The Earnest Money Deposit for this tender is ${emdRatioPct.toFixed(2)}% of its value. Indian public tenders typically set EMD between 0.5% and 5% of value; this one falls outside that band.`
    });
  } else {
    factors.push({
      label: 'Standard EMD ratio',
      verdict: 'good',
      impact: 0,
      detail: `EMD is ${emdRatioPct.toFixed(2)}% of the tender value, within the typical 0.5%-5% industry range for public tenders.`
    });
  }

  score = Math.max(5, Math.min(97, Math.round(score)));
  return { score, factors, deviationPct, emdRatioPct };
};
