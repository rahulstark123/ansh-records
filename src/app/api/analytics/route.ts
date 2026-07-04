import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/api-response";

const clientAnalyticsSelect = {
  source: true,
  country: true,
  contactMode: true,
  state: true,
  area: true,
  createdAt: true,
  isConverted: true,
  amountPaid: true,
  seatsCount: true,
  status: true
} as const;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "all";

    // Compute date bounds based on selected range
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let currentStart = new Date(startOfToday);
    let currentEnd = new Date(now);

    switch (range) {
      case "today":
        currentStart = startOfToday;
        break;
      case "7d":
        currentStart = new Date(startOfToday);
        currentStart.setDate(currentStart.getDate() - 7);
        break;
      case "this_month":
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "last_month":
        currentStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        currentEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case "3m":
        currentStart = new Date(startOfToday);
        currentStart.setDate(currentStart.getDate() - 90);
        break;
      case "6m":
        currentStart = new Date(startOfToday);
        currentStart.setDate(currentStart.getDate() - 180);
        break;
      case "this_year":
        currentStart = new Date(now.getFullYear(), 0, 1);
        break;
      case "last_year":
        currentStart = new Date(now.getFullYear() - 1, 0, 1);
        currentEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
        break;
      case "all":
      default:
        currentStart = new Date(2000, 0, 1);
        break;
    }

    // Duration of current period for previous period comparison
    const duration = currentEnd.getTime() - currentStart.getTime();
    const prevStart = new Date(currentStart.getTime() - duration);
    const prevEnd = new Date(currentStart);

    const [currentClients, previousClients, totalAllTime] = await Promise.all([
      prisma.client.findMany({
        where: { createdAt: { gte: currentStart, lte: currentEnd } },
        select: clientAnalyticsSelect
      }),
      prisma.client.findMany({
        where: { createdAt: { gte: prevStart, lt: prevEnd } },
        select: clientAnalyticsSelect
      }),
      prisma.client.count()
    ]);

    // --- Aggregations ---

    // Source breakdown
    const sourceCounts: Record<string, number> = {};
    currentClients.forEach((c) => {
      sourceCounts[c.source] = (sourceCounts[c.source] || 0) + 1;
    });

    // Country breakdown
    const countryCounts: Record<string, number> = {};
    currentClients.forEach((c) => {
      countryCounts[c.country] = (countryCounts[c.country] || 0) + 1;
    });

    // Contact mode breakdown
    const contactModeCounts: Record<string, number> = {};
    currentClients.forEach((c) => {
      contactModeCounts[c.contactMode] = (contactModeCounts[c.contactMode] || 0) + 1;
    });

    // State breakdown (top 10)
    const stateCounts: Record<string, number> = {};
    currentClients.forEach((c) => {
      const key = `${c.state} (${c.country})`;
      stateCounts[key] = (stateCounts[key] || 0) + 1;
    });

    // Area breakdown
    const areaCounts: Record<string, number> = {};
    currentClients.forEach((c) => {
      areaCounts[c.area] = (areaCounts[c.area] || 0) + 1;
    });

    // Timeline - group by period-appropriate bucket
    const formatLabel = (date: Date) => {
      if (range === "today") return `${date.getHours()}:00`;
      if (range === "7d") return date.toLocaleDateString("en-US", { weekday: "short" });
      if (range === "this_month" || range === "last_month") return `Day ${date.getDate()}`;
      return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    };

    const timelineMap: Record<string, { current: number; previous: number }> = {};
    currentClients.forEach((c) => {
      const label = formatLabel(new Date(c.createdAt));
      if (!timelineMap[label]) timelineMap[label] = { current: 0, previous: 0 };
      timelineMap[label].current += 1;
    });
    previousClients.forEach((c) => {
      const relativeDate = new Date(new Date(c.createdAt).getTime() + duration);
      const label = formatLabel(relativeDate);
      if (!timelineMap[label]) timelineMap[label] = { current: 0, previous: 0 };
      timelineMap[label].previous += 1;
    });

    const timelineData = Object.entries(timelineMap).map(([name, val]) => ({
      name,
      "This Period": val.current,
      "Previous Period": val.previous
    }));

    // Conversion stats
    const convertedClients = currentClients.filter((c) => c.isConverted);
    const totalRevenue = convertedClients.reduce((sum, c) => sum + (c.amountPaid || 0), 0);
    const totalSeats = convertedClients.reduce((sum, c) => sum + (c.seatsCount || 0), 0);

    // Active ratio
    const activeCount = currentClients.filter((c) => c.status === "Active").length;
    const prevActiveCount = previousClients.filter((c) => c.status === "Active").length;

    const activeRatio = currentClients.length > 0 ? (activeCount / currentClients.length) * 100 : 0;
    const prevActiveRatio = previousClients.length > 0 ? (prevActiveCount / previousClients.length) * 100 : 0;

    // Top channel
    let topChannel = "None";
    let topChannelCount = 0;
    Object.entries(sourceCounts).forEach(([ch, cnt]) => {
      if (cnt > topChannelCount) { topChannel = ch; topChannelCount = cnt; }
    });

    const topChannelShare = currentClients.length > 0 ? (topChannelCount / currentClients.length) * 100 : 0;

    // Trend
    const prevTotal = previousClients.length;
    const currTotal = currentClients.length;
    let totalTrend = 0;
    if (prevTotal > 0) {
      totalTrend = ((currTotal - prevTotal) / prevTotal) * 100;
    } else if (currTotal > 0) {
      totalTrend = 100;
    }

    return jsonResponse({
      summary: {
        totalAllTime,
        currentTotal: currTotal,
        prevTotal,
        totalTrend,
        activeCount,
        activeRatio,
        prevActiveRatio,
        activeRatioTrend: activeRatio - prevActiveRatio,
        convertedCount: convertedClients.length,
        totalRevenue,
        totalSeats,
        topChannel,
        topChannelShare
      },
      sourceCounts,
      countryCounts,
      contactModeCounts,
      stateCounts,
      areaCounts,
      timelineData
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch analytics" }, { status: 500 });
  }
}
