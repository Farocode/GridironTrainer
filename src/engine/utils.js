// Pure, framework-free helpers. No React here on purpose — keeps
// this file trivially unit-testable and reusable outside the UI.

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randInt(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

export function ordinal(n) {
  return ["", "1st", "2nd", "3rd", "4th"][n] || `${n}th`;
}

// Converts the internal 0-100 field scale into real football language.
// 0 = your own goal line, 100 = the goal line you're driving toward.
export function fieldPos(yardLine) {
  if (yardLine === 50) return "midfield";
  if (yardLine < 50) return `own ${yardLine}`;
  return `opp ${100 - yardLine}`;
}

export function fieldZone(yardLine) {
  if (yardLine < 10) return "Backed Up";
  if (yardLine < 50) return "Own Territory";
  if (yardLine < 80) return "Opponent Territory";
  if (yardLine < 90) return "Scoring Range";
  return "Red Zone";
}
