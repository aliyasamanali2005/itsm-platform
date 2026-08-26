import {
  addBusinessMinutes,
} from "../src/modules/sla/sla.business-hours";

describe("SLA Business Hours", () => {
  const config = {
    startTime: "09:00",
    endTime: "17:00",
    timezone: "Asia/Karachi",
    workingDays: [1, 2, 3, 4, 5],
  };

  // ==========================================
  // WITHIN BUSINESS HOURS
  // ==========================================

  it("should calculate SLA within business hours", () => {
    const start = new Date(
      "2026-08-24T05:00:00.000Z"
    );

    const result =
      addBusinessMinutes(
        start,
        30,
        config
      );

    expect(result).toEqual(
      new Date(
        "2026-08-24T05:30:00.000Z"
      )
    );
  });

  // ==========================================
  // AFTER BUSINESS HOURS
  // ==========================================

  it("should move SLA to next business day after closing", () => {
    // 12:50 UTC = 17:50 PKT
    // Business hours have ended.
    //
    // Next business day:
    // 09:00 PKT = 04:00 UTC
    //
    // + 30 minutes = 04:30 UTC

    const start = new Date(
      "2026-08-24T12:50:00.000Z"
    );

    const result =
      addBusinessMinutes(
        start,
        30,
        config
      );

    expect(result).toEqual(
      new Date(
        "2026-08-25T04:30:00.000Z"
      )
    );
  });

  // ==========================================
  // SKIP WEEKENDS
  // ==========================================

  it("should skip weekends", () => {
    // Friday 12:50 UTC = 17:50 PKT
    //
    // Friday is finished.
    // Saturday + Sunday are non-working days.
    //
    // Monday:
    // 09:00 PKT = 04:00 UTC
    // + 30 minutes = 04:30 UTC

    const start = new Date(
      "2026-08-28T12:50:00.000Z"
    );

    const result =
      addBusinessMinutes(
        start,
        30,
        config
      );

    expect(result).toEqual(
      new Date(
        "2026-08-31T04:30:00.000Z"
      )
    );
  });

  // ==========================================
  // BEFORE BUSINESS HOURS
  // ==========================================

  it("should start at business opening when created before business hours", () => {
    // 03:00 UTC = 08:00 PKT
    //
    // Business opens at:
    // 09:00 PKT = 04:00 UTC
    //
    // + 30 minutes = 04:30 UTC

    const start = new Date(
      "2026-08-24T03:00:00.000Z"
    );

    const result =
      addBusinessMinutes(
        start,
        30,
        config
      );

    expect(result).toEqual(
      new Date(
        "2026-08-24T04:30:00.000Z"
      )
    );
  });

  // ==========================================
  // NON-WORKING DAY
  // ==========================================

  it("should skip non-working days", () => {
    // Sunday 10:00 UTC = 15:00 PKT
    //
    // Sunday is non-working.
    //
    // Monday:
    // 09:00 PKT = 04:00 UTC
    // + 30 minutes = 04:30 UTC

    const start = new Date(
      "2026-08-30T10:00:00.000Z"
    );

    const result =
      addBusinessMinutes(
        start,
        30,
        config
      );

    expect(result).toEqual(
      new Date(
        "2026-08-31T04:30:00.000Z"
      )
    );
  });
});