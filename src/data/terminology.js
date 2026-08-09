// Display-label presets. The grading engine only ever uses internal
// ids (keep/killflip/rpohot, checkdown/short/intermediate/deep,
// mofo/mofc) — everything here is presentation only, so adding a
// new preset (or a future editable/custom preset) never touches
// src/engine.

export const TERM_PRESETS = {
  standard: {
    name: "Standard",
    example: "Keep / Kill-Flip / RPO-Hot \u00b7 Checkdown / Short / Intermediate / Deep \u00b7 MOFO / MOFC",
    run: { keep: "Keep the Call", killflip: "Kill \u2014 Flip It", rpohot: "RPO / Get It Out" },
    pass: { checkdown: "Checkdown", short: "Short", intermediate: "Intermediate", deep: "Deep" },
    mofo: "MOFO (two-high)", mofc: "MOFC (one-high)", press: "press", off: "off",
  },
  alert: {
    name: "Alert System",
    example: "Check / Kill / Alert \u00b7 Hot / Quick / Intermediate / Shot \u00b7 Middle-Open / Middle-Closed",
    run: { keep: "Check", killflip: "Kill", rpohot: "Alert" },
    pass: { checkdown: "Hot", short: "Quick", intermediate: "Intermediate", deep: "Shot" },
    mofo: "Middle-Open", mofc: "Middle-Closed", press: "press", off: "off",
  },
  simple: {
    name: "Simplified",
    example: "Run It / Switch Sides / Throw Now \u00b7 Safe / Short / Medium / Long \u00b7 Two-Safety / One-Safety",
    run: { keep: "Run It", killflip: "Switch Sides", rpohot: "Throw Now" },
    pass: { checkdown: "Safe", short: "Short", intermediate: "Medium", deep: "Long" },
    mofo: "Two-Safety", mofc: "One-Safety", press: "tight", off: "soft",
  },
};
