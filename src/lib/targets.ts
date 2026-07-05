import { prisma } from "@/lib/prisma";

export const DAILY_OUTREACH_TARGET = 100;
export const DAILY_TARGET_LABEL = "Daily Total";

export function getUtcDayBounds(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
}

export function getUtcDayKey(date: Date) {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized.toISOString();
}

type TargetRow = {
  id: string;
  date: Date;
  focusedArea: string;
  reachedCount: number;
  dailyTarget: number;
  notes: string | null;
};

export function aggregateTargetsByDate(rows: TargetRow[]) {
  const map = new Map<
    string,
    {
      id: string;
      date: Date;
      focusedArea: string;
      reachedCount: number;
      dailyTarget: number;
      notes: string | null;
    }
  >();

  for (const row of rows) {
    const key = getUtcDayKey(row.date);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        id: row.id,
        date: new Date(row.date),
        focusedArea: DAILY_TARGET_LABEL,
        reachedCount: row.reachedCount,
        dailyTarget: row.dailyTarget,
        notes: row.notes
      });
      continue;
    }

    existing.reachedCount += row.reachedCount;
    if (row.notes) {
      existing.notes = existing.notes ? `${existing.notes}\n${row.notes}` : row.notes;
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

export async function consolidateDuplicateDayTargets() {
  const all = await prisma.target.findMany({ orderBy: { date: "asc" } });
  const byDay = new Map<string, TargetRow[]>();

  for (const row of all) {
    const key = getUtcDayKey(row.date);
    const list = byDay.get(key) ?? [];
    list.push(row);
    byDay.set(key, list);
  }

  for (const rows of byDay.values()) {
    if (rows.length <= 1) {
      if (rows[0].focusedArea !== DAILY_TARGET_LABEL) {
        await prisma.target.update({
          where: { id: rows[0].id },
          data: { focusedArea: DAILY_TARGET_LABEL }
        });
      }
      continue;
    }

    const total = rows.reduce((sum, row) => sum + row.reachedCount, 0);
    const notes = rows
      .map((row) => row.notes)
      .filter(Boolean)
      .join("\n");

    await prisma.target.update({
      where: { id: rows[0].id },
      data: {
        reachedCount: total,
        focusedArea: DAILY_TARGET_LABEL,
        notes: notes || null,
        dailyTarget: DAILY_OUTREACH_TARGET
      }
    });

    for (let i = 1; i < rows.length; i++) {
      await prisma.target.delete({ where: { id: rows[i].id } });
    }
  }
}

export async function findTargetsForDay(date: Date) {
  const { startOfDay, endOfDay } = getUtcDayBounds(date);
  return prisma.target.findMany({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    orderBy: { createdAt: "asc" }
  });
}

export async function incrementDailyTarget(date: Date, note?: string) {
  await consolidateDuplicateDayTargets();
  const dayTargets = await findTargetsForDay(date);
  const { startOfDay } = getUtcDayBounds(date);

  if (dayTargets.length === 0) {
    return prisma.target.create({
      data: {
        date: startOfDay,
        focusedArea: DAILY_TARGET_LABEL,
        reachedCount: 1,
        dailyTarget: DAILY_OUTREACH_TARGET,
        notes: note || null
      }
    });
  }

  const primary = dayTargets[0];
  return prisma.target.update({
    where: { id: primary.id },
    data: {
      reachedCount: { increment: 1 },
      focusedArea: DAILY_TARGET_LABEL,
      notes: note
        ? primary.notes
          ? `${primary.notes}\n${note}`
          : note
        : primary.notes
    }
  });
}

export async function decrementDailyTarget(date: Date) {
  await consolidateDuplicateDayTargets();
  const dayTargets = await findTargetsForDay(date);
  if (dayTargets.length === 0) return;

  const primary = dayTargets[0];
  if (primary.reachedCount > 1) {
    await prisma.target.update({
      where: { id: primary.id },
      data: { reachedCount: { decrement: 1 } }
    });
    return;
  }

  await prisma.target.delete({ where: { id: primary.id } });
}
