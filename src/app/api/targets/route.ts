import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const targets = await prisma.target.findMany({
      orderBy: { date: "asc" }
    });

    return jsonResponse(targets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch targets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.focusedArea || !body.reachedCount) {
      return NextResponse.json({ error: "Focused Area and Reached Count are required" }, { status: 400 });
    }

    const target = await prisma.target.create({
      data: {
        date: body.date ? new Date(body.date) : new Date(),
        focusedArea: body.focusedArea,
        reachedCount: parseInt(body.reachedCount) || 0,
        dailyTarget: parseInt(body.dailyTarget) || 100,
        notes: body.notes || null
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

    await prisma.target.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete target log" }, { status: 500 });
  }
}
