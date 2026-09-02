import { db } from "@/lib/db";
import { meaningfulDecline, previousEquivalentRange, type QualityBreakdown, type QualityInsightData, type QualityInsightFilters, type QualityReview } from "@/lib/quality-insights";

const PAGE_SIZE = 30;

type StatsRow = { count: number; average: number | null; low_count: number };
type BreakdownRow = { dimension: QualityBreakdown["dimension"]; id: string; label: string; count: number; average: number };

export async function loadQualityInsights(filters: QualityInsightFilters, scopeEnterpriseId: string | null, offset = 0): Promise<QualityInsightData> {
  const sql = db();
  const previous = previousEquivalentRange(filters.from, filters.to);
  const enterpriseId = scopeEnterpriseId || filters.enterprise || null;
  const locationId = filters.location || null;
  const scheduledMealOnly = filters.menu === "scheduled-meal";
  const menuId = filters.menu && !scheduledMealOnly ? filters.menu : null;
  const ratingLow = filters.rating === "LOW";
  const ratingExact = /^([1-5])$/.test(filters.rating) ? Number(filters.rating) : null;
  const reviewWhere = (from: string, to: string) => sql`
    ms.schedule_date BETWEEN ${from}::date AND ${to}::date
    AND (${enterpriseId}::uuid IS NULL OR e.id=${enterpriseId}::uuid)
    AND (${locationId}::uuid IS NULL OR dl.id=${locationId}::uuid)
    AND (${menuId}::uuid IS NULL OR m.id=${menuId}::uuid)
    AND (NOT ${scheduledMealOnly} OR m.id IS NULL)
    AND (NOT ${ratingLow} OR mr.rating<=2)
    AND (${ratingExact}::int IS NULL OR mr.rating=${ratingExact}::int)
  `;
  const reviewJoins = sql`
    FROM meal_reviews mr JOIN menu_schedules ms ON ms.id=mr.schedule_id
    JOIN employees ep ON ep.id=mr.employee_id JOIN enterprises e ON e.id=ep.enterprise_id
    LEFT JOIN meal_preferences mp ON mp.schedule_id=mr.schedule_id AND mp.employee_id=mr.employee_id
    LEFT JOIN delivery_locations dl ON dl.id=COALESCE(mp.location_id,ep.location_id)
    LEFT JOIN menu_schedule_options mso ON mso.id=mp.selected_option_id LEFT JOIN menus m ON m.id=mso.menu_id
  `;

  const [statsRows, previousStatsRows, distributionRows, trendRows, currentBreakdowns, previousBreakdowns, allocationRows, incidentRows, reviewRows, enterpriseOptions, locationOptions, menuOptions] = await Promise.all([
    sql<StatsRow[]>`SELECT COUNT(mr.id)::int AS count,AVG(mr.rating)::float AS average,COUNT(mr.id) FILTER(WHERE mr.rating<=2)::int AS low_count ${reviewJoins} WHERE ${reviewWhere(filters.from, filters.to)}`,
    sql<StatsRow[]>`SELECT COUNT(mr.id)::int AS count,AVG(mr.rating)::float AS average,COUNT(mr.id) FILTER(WHERE mr.rating<=2)::int AS low_count ${reviewJoins} WHERE ${reviewWhere(previous.from, previous.to)}`,
    sql<{ rating: number; count: number }[]>`SELECT mr.rating::int,COUNT(mr.id)::int AS count ${reviewJoins} WHERE ${reviewWhere(filters.from, filters.to)} GROUP BY mr.rating ORDER BY mr.rating DESC`,
    sql<{ date: string; count: number; average: number }[]>`SELECT ms.schedule_date::text AS date,COUNT(mr.id)::int AS count,AVG(mr.rating)::float AS average ${reviewJoins} WHERE ${reviewWhere(filters.from, filters.to)} GROUP BY ms.schedule_date ORDER BY ms.schedule_date`,
    sql<BreakdownRow[]>`
      SELECT 'ENTERPRISE'::text AS dimension,e.id::text,e.name AS label,COUNT(mr.id)::int AS count,AVG(mr.rating)::float AS average ${reviewJoins} WHERE ${reviewWhere(filters.from, filters.to)} GROUP BY e.id,e.name
      UNION ALL SELECT 'LOCATION',dl.id::text,COALESCE(dl.name,'Unknown location'),COUNT(mr.id)::int,AVG(mr.rating)::float ${reviewJoins} WHERE ${reviewWhere(filters.from, filters.to)} GROUP BY dl.id,dl.name
      UNION ALL SELECT 'MENU',COALESCE(m.id::text,'scheduled-meal'),COALESCE(m.title,'Scheduled meal'),COUNT(mr.id)::int,AVG(mr.rating)::float ${reviewJoins} WHERE ${reviewWhere(filters.from, filters.to)} GROUP BY m.id,m.title
    `,
    sql<BreakdownRow[]>`
      SELECT 'ENTERPRISE'::text AS dimension,e.id::text,e.name AS label,COUNT(mr.id)::int AS count,AVG(mr.rating)::float AS average ${reviewJoins} WHERE ${reviewWhere(previous.from, previous.to)} GROUP BY e.id,e.name
      UNION ALL SELECT 'LOCATION',dl.id::text,COALESCE(dl.name,'Unknown location'),COUNT(mr.id)::int,AVG(mr.rating)::float ${reviewJoins} WHERE ${reviewWhere(previous.from, previous.to)} GROUP BY dl.id,dl.name
      UNION ALL SELECT 'MENU',COALESCE(m.id::text,'scheduled-meal'),COALESCE(m.title,'Scheduled meal'),COUNT(mr.id)::int,AVG(mr.rating)::float ${reviewJoins} WHERE ${reviewWhere(previous.from, previous.to)} GROUP BY m.id,m.title
    `,
    sql<{ count: number }[]>`
      SELECT COUNT(mp.id)::int AS count FROM meal_preferences mp JOIN menu_schedules ms ON ms.id=mp.schedule_id
      JOIN employees ep ON ep.id=mp.employee_id JOIN enterprises e ON e.id=ep.enterprise_id
      JOIN delivery_locations dl ON dl.id=mp.location_id LEFT JOIN menu_schedule_options mso ON mso.id=mp.selected_option_id LEFT JOIN menus m ON m.id=mso.menu_id
      WHERE mp.is_opted_in=TRUE AND ms.schedule_date BETWEEN ${filters.from}::date AND ${filters.to}::date
        AND (${enterpriseId}::uuid IS NULL OR e.id=${enterpriseId}::uuid) AND (${locationId}::uuid IS NULL OR dl.id=${locationId}::uuid) AND (${menuId}::uuid IS NULL OR m.id=${menuId}::uuid) AND (NOT ${scheduledMealOnly} OR m.id IS NULL)
    `,
    sql<{ count: number }[]>`
      SELECT COUNT(pf.id)::int AS count FROM platform_feedback pf LEFT JOIN enterprises e ON e.id=pf.enterprise_id
      LEFT JOIN app_users au ON au.id=pf.submitted_by_user_id LEFT JOIN employees ep ON ep.id=au.employee_id LEFT JOIN delivery_locations dl ON dl.id=ep.location_id
      WHERE pf.category='BUG' AND pf.quality_category IS NOT NULL AND pf.quality_status IN ('NEW','INVESTIGATING')
        AND COALESCE(pf.meal_service_date,pf.created_at::date) BETWEEN ${filters.from}::date AND ${filters.to}::date
        AND (${enterpriseId}::uuid IS NULL OR e.id=${enterpriseId}::uuid) AND (${locationId}::uuid IS NULL OR dl.id=${locationId}::uuid)
    `,
    sql<QualityReview[]>`
      SELECT mr.id,mr.rating,mr.comment,mr.created_at::text,ms.schedule_date::text,ep.full_name,
        e.id::text AS enterprise_id,e.name AS enterprise_name,dl.id::text AS location_id,COALESCE(dl.name,'Unknown location') AS location_name,
        m.id::text AS menu_id,COALESCE(m.title,'Scheduled meal') AS menu_title,mr.voice_url,mr.voice_duration_seconds,
        COALESCE((SELECT json_agg(json_build_object('url',rp.image_url,'thumbnailUrl',COALESCE(rp.thumbnail_url,rp.image_url)) ORDER BY rp.created_at) FROM review_photos rp WHERE rp.review_id=mr.id),'[]') AS photos
      ${reviewJoins} WHERE ${reviewWhere(filters.from, filters.to)} ORDER BY ms.schedule_date DESC,mr.created_at DESC LIMIT ${PAGE_SIZE + 1} OFFSET ${Math.max(0, offset)}
    `,
    sql<{ id: string; label: string }[]>`SELECT e.id::text,e.name AS label FROM enterprises e WHERE e.status='ACTIVE' AND (${scopeEnterpriseId}::uuid IS NULL OR e.id=${scopeEnterpriseId}::uuid) ORDER BY e.name`,
    sql<{ id: string; label: string }[]>`SELECT dl.id::text,dl.name AS label FROM delivery_locations dl WHERE dl.is_active=TRUE AND (${enterpriseId}::uuid IS NULL OR dl.enterprise_id=${enterpriseId}::uuid) ORDER BY dl.name`,
    sql<{ id: string; label: string }[]>`
      SELECT DISTINCT m.id::text,m.title AS label FROM menu_schedules ms JOIN menu_schedule_options mso ON mso.schedule_id=ms.id JOIN menus m ON m.id=mso.menu_id
      WHERE ms.schedule_date BETWEEN ${filters.from}::date AND ${filters.to}::date AND (${enterpriseId}::uuid IS NULL OR ms.enterprise_id=${enterpriseId}::uuid) ORDER BY m.title
    `,
  ]);

  const stats = statsRows[0] || { count: 0, average: null, low_count: 0 };
  const previousStats = previousStatsRows[0] || { count: 0, average: null, low_count: 0 };
  const change = stats.average !== null && previousStats.average !== null ? stats.average - previousStats.average : null;
  const previousByDimension = new Map(previousBreakdowns.map((row) => [`${row.dimension}:${row.id}`, row]));
  const breakdowns = currentBreakdowns.map((row) => {
    const prior = previousByDimension.get(`${row.dimension}:${row.id}`);
    const rowChange = prior ? row.average - prior.average : null;
    return { ...row, previousCount: prior?.count || 0, previousAverage: prior?.average ?? null, change: rowChange, meaningfulDecline: meaningfulDecline(row.count, prior?.count || 0, rowChange) };
  });
  const eligibleMeals = allocationRows[0]?.count || 0;
  return {
    filters,
    summary: { reviewCount: stats.count, average: stats.average, eligibleMeals, responseRate: eligibleMeals ? stats.count / eligibleMeals * 100 : 0, lowCount: stats.low_count, lowRate: stats.count ? stats.low_count / stats.count * 100 : 0, openIncidents: incidentRows[0]?.count || 0, previousAverage: previousStats.average, change },
    distribution: [5,4,3,2,1].map((rating) => ({ rating, count: distributionRows.find((row) => row.rating === rating)?.count || 0 })),
    trend: trendRows,
    breakdowns,
    reviews: reviewRows.slice(0, PAGE_SIZE),
    hasMore: reviewRows.length > PAGE_SIZE,
    options: { enterprises: enterpriseOptions, locations: locationOptions, menus: menuOptions },
  };
}
