import {addDays, formatCampusDate, formatCountdown, getCampusDate, getSecondsToNextBatch} from "./CampusTime";

describe("campus time", () => {
  it("reads the campus calendar date of an instant", () => {
    expect(getCampusDate(new Date("2026-10-04T03:59:59Z"))).toBe("2026-10-03");
    expect(getCampusDate(new Date("2026-10-04T04:00:00Z"))).toBe("2026-10-04");
  });

  it("adds days across a month boundary", () => {
    expect(addDays("2026-10-01", -1)).toBe("2026-09-30");
  });

  it("formats a campus date for display", () => {
    expect(formatCampusDate("2026-10-04")).toBe("Sun, Oct 4");
  });

  it("counts down to campus midnight", () => {
    expect(getSecondsToNextBatch(new Date("2026-10-04T03:59:59Z"))).toBe(1);
    expect(getSecondsToNextBatch(new Date("2026-10-04T04:00:00Z"))).toBe(86400);
    expect(formatCountdown(7 * 3600 + 12 * 60 + 44)).toBe("07:12:44");
  });
});
