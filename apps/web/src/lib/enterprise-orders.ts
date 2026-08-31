type OrderRow = { schedule_date: string; order_count: number };

export function orderSummary(rows: OrderRow[], today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())) {
  return {
    todayOrders: rows.filter((row) => row.schedule_date === today).reduce((total, row) => total + row.order_count, 0),
    totalOrders: rows.reduce((total, row) => total + row.order_count, 0),
    upcomingDates: new Set(rows.filter((row) => row.schedule_date > today).map((row) => row.schedule_date)).size,
  };
}
