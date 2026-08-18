const MARKET_TZ = "America/New_York";

// Returns { weekday, hour, minute } for the given instant in America/New_York.
function getEasternParts(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MARKET_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    weekday: map.weekday,
    hour: Number(map.hour),
    minute: Number(map.minute),
  };
}

function isWithinWeekdayWindow(date, openMinutes, closeMinutes) {
  const { weekday, hour, minute } = getEasternParts(date);

  if (weekday === "Sat" || weekday === "Sun") return false;

  const minutesSinceMidnight = hour * 60 + minute;
  return minutesSinceMidnight >= openMinutes && minutesSinceMidnight < closeMinutes;
}

// True Mon-Fri, 9:30am-4:00pm America/New_York. Does not account for market holidays.
// Used to gate quote polling - Finnhub's free tier quote endpoint freezes at the
// regular-session close, so polling outside this window just burns API calls on
// data that can't have changed (confirmed empirically: last trade timestamp stays
// pinned to 4:00pm ET no matter when you poll after hours).
export function isMarketHours(date = new Date()) {
  return isWithinWeekdayWindow(date, 9 * 60 + 30, 16 * 60);
}

// True Mon-Fri, 4:00am-10:00pm America/New_York. Wider than isMarketHours because,
// unlike quotes, news isn't frozen outside the regular session - confirmed
// empirically that ~60% of a ticker's daily news volume is published pre-market
// or after-hours (e.g. earnings releases), which the narrower window would miss.
export function isNewsHours(date = new Date()) {
  return isWithinWeekdayWindow(date, 4 * 60, 22 * 60);
}
