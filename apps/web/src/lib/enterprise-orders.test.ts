import { describe, expect, test } from "bun:test";
import { orderSummary } from "./enterprise-orders";

describe("orderSummary", () => {
  test("summarizes dates without double-counting meal days", () => expect(orderSummary([{ schedule_date: "2026-08-31", order_count: 4 }, { schedule_date: "2026-09-01", order_count: 3 }, { schedule_date: "2026-09-01", order_count: 2 }], "2026-08-31")).toEqual({ todayOrders: 4, totalOrders: 9, upcomingDates: 1 }));
});
