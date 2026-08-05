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

// True Mon-Fri, 9:30am-4:00pm America/New_York. Does not account for market holidays.
export function isMarketHours(date = new Date()) {
  const { weekday, hour, minute } = getEasternParts(date);

  if (weekday === "Sat" || weekday === "Sun") return false;

  const minutesSinceMidnight = hour * 60 + minute;
  const open = 9 * 60 + 30;
  const close = 16 * 60;

  return minutesSinceMidnight >= open && minutesSinceMidnight < close;
}
