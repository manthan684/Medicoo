// turns ?from=2026-10-01&to=2026-10-31 into a MongoDB date filter
exports.dateRange = (from, to) => {
  const range = {};

  if (from) {
    const d = new Date(from);
    if (isNaN(d)) return { error: "from is not a valid date" };
    d.setUTCHours(0, 0, 0, 0); // start of that day
    range.$gte = d;
  }

  if (to) {
    const d = new Date(to);
    if (isNaN(d)) return { error: "to is not a valid date" };
    d.setUTCHours(23, 59, 59, 999); // end of that day, so the whole day counts
    range.$lte = d;
  }

  return { range };
};