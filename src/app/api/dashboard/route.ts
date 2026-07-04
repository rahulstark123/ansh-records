import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalClients,
      activeClients,
      convertedClients,
      countryGroups,
      revenueAgg,
      stateGroups,
      sourceGroups,
      contactModeGroups,
      recentClients,
      targetStats,
      todayTargets
    ] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { status: "Active" } }),
      prisma.client.count({ where: { isConverted: true } }),
      prisma.client.groupBy({ by: ["country"], _count: { country: true } }),
      prisma.client.aggregate({ _sum: { amountPaid: true, seatsCount: true } }),
      prisma.client.groupBy({
        by: ["state", "country"],
        _count: { state: true },
        orderBy: { _count: { state: "desc" } },
        take: 6
      }),
      prisma.client.groupBy({
        by: ["source"],
        _count: { source: true },
        orderBy: { _count: { source: "desc" } }
      }),
      prisma.client.groupBy({
        by: ["contactMode"],
        _count: { contactMode: true },
        orderBy: { _count: { contactMode: "desc" } }
      }),
      prisma.client.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          name: true,
          company: true,
          area: true,
          state: true,
          country: true,
          source: true,
          createdAt: true,
          isConverted: true
        }
      }),
      prisma.target.aggregate({
        _sum: { reachedCount: true },
        _avg: { reachedCount: true }
      }),
      prisma.target.findMany({
        where: { date: { gte: todayStart, lte: todayEnd } },
        select: { reachedCount: true }
      })
    ]);

    const totalCountries = countryGroups.length;
    const totalRevenue = revenueAgg._sum.amountPaid || 0;
    const totalSeats = revenueAgg._sum.seatsCount || 0;
    const todayReached = todayTargets.reduce((sum, t) => sum + t.reachedCount, 0);

    return jsonResponse({
      stats: {
        totalClients,
        activeClients,
        convertedClients,
        totalCountries,
        totalRevenue,
        totalSeats,
        activeRatio: totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0,
        conversionRate: totalClients > 0 ? Math.round((convertedClients / totalClients) * 100) : 0
      },
      targets: {
        totalReached: targetStats._sum.reachedCount || 0,
        avgReached: Math.round(targetStats._avg.reachedCount || 0),
        todayReached
      },
      topRegions: stateGroups.map((g) => ({
        state: g.state,
        country: g.country,
        count: g._count.state
      })),
      sourceBreakdown: sourceGroups.map((g) => ({
        source: g.source,
        count: g._count.source
      })),
      contactModeBreakdown: contactModeGroups.map((g) => ({
        mode: g.contactMode,
        count: g._count.contactMode
      })),
      recentActivity: recentClients.map((c) => ({
        name: c.name,
        company: c.company,
        location: `${c.area}, ${c.country}`,
        source: c.source,
        createdAt: c.createdAt,
        isConverted: c.isConverted
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch dashboard data" }, { status: 500 });
  }
}
