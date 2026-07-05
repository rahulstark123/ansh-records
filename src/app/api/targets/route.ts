import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/api-response";
import {
  aggregateTargetsByDate,
  consolidateDuplicateDayTargets,
  DAILY_OUTREACH_TARGET,
  DAILY_TARGET_LABEL,
  getUtcDayBounds,
  findTargetsForDay
} from "@/lib/targets";

export async function GET() {
  try {
    await consolidateDuplicateDayTargets();

    const targets = await prisma.target.findMany({
      orderBy: { date: "asc" }
    });

    return jsonResponse(aggregateTargetsByDate(targets));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch targets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.reachedCount) {
      return NextResponse.json({ error: "Reached Count is required" }, { status: 400 });
    }

    const date = body.date ? new Date(body.date) : new Date();
    const reachedCount = parseInt(body.reachedCount) || 0;
    const { startOfDay } = getUtcDayBounds(date);

    await consolidateDuplicateDayTargets();
    const existing = await findTargetsForDay(date);

    if (existing.length > 0) {
      const primary = existing[0];
      const target = await prisma.target.update({
        where: { id: primary.id },
        data: {
          reachedCount: primary.reachedCount + reachedCount,
          focusedArea: DAILY_TARGET_LABEL,
          dailyTarget: parseInt(body.dailyTarget) || DAILY_OUTREACH_TARGET,
          notes: body.notes?.trim() || primary.notes
        }
      });
      return NextResponse.json(target);
    }

    const target = await prisma.target.create({
      data: {
        date: startOfDay,
        focusedArea: DAILY_TARGET_LABEL,
        reachedCount,
        dailyTarget: parseInt(body.dailyTarget) || DAILY_OUTREACH_TARGET,
        notes: body.notes?.trim() || null
      }
    });

    return NextResponse.json(target);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create target log" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Target log ID is required" }, { status: 400 });
    }

    const target = await prisma.target.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "Target log not found" }, { status: 404 });
    }

    const { startOfDay, endOfDay } = getUtcDayBounds(target.date);
    await prisma.target.deleteMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete target log" }, { status: 500 });
  }
}
