import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/api-response";
import { decrementDailyTarget, incrementDailyTarget } from "@/lib/targets";
import { normalizeContactModes } from "@/lib/contact-modes";

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { clientId: "desc" }
    });

    return jsonResponse(clients);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Auto-compute next clientId sequential number CXXX
    const lastClient = await prisma.client.findFirst({
      orderBy: { clientId: "desc" }
    });
    
    let nextIdNum = 1;
    if (lastClient && lastClient.clientId.startsWith("C")) {
      const match = lastClient.clientId.match(/\d+/);
      if (match) {
        nextIdNum = parseInt(match[0]) + 1;
      }
    }
    const nextClientId = `C${String(nextIdNum).padStart(3, "0")}`;

    const clientDate = body.date ? new Date(body.date) : new Date();

    const client = await prisma.client.create({
      data: {
        clientId: nextClientId,
        name: body.name,
        company: body.company,
        email: body.email?.trim() || null,
        phone: body.phone,
        pincode: body.pincode,
        source: body.source,
        sourceLink: body.sourceLink || null,
        contactMode: normalizeContactModes(body.contactMode),
        country: body.country,
        state: body.state,
        city: body.city,
        area: body.area,
        manualAddress: body.manualAddress?.trim() || null,
        status: body.status || "Active",
        notes: body.notes || null,
        isConverted: !!body.isConverted,
        appsTaken: body.appsTaken || [],
        amountPaid: parseFloat(body.amountPaid) || 0,
        seatsCount: parseInt(body.seatsCount) || 1,
        conversionNotes: body.conversionNotes || null,
        convertedAt: body.convertedAt || null,
        createdAt: clientDate
      }
    });

    await incrementDailyTarget(
      clientDate,
      `Auto-logged from client registration (${body.name} - ${body.company})`
    );

    return NextResponse.json(client);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create client" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Database client identifier is required" }, { status: 400 });
    }

    // Build update object with only fields present in the request body
    const updateData: Record<string, any> = {};
    if (data.name !== undefined)          updateData.name = data.name;
    if (data.company !== undefined)       updateData.company = data.company;
    if (data.email !== undefined)         updateData.email = data.email?.trim() || null;
    if (data.phone !== undefined)         updateData.phone = data.phone;
    if (data.pincode !== undefined)       updateData.pincode = data.pincode;
    if (data.source !== undefined)        updateData.source = data.source;
    if (data.sourceLink !== undefined)    updateData.sourceLink = data.sourceLink || null;
    if (data.contactMode !== undefined)   updateData.contactMode = normalizeContactModes(data.contactMode);
    if (data.country !== undefined)       updateData.country = data.country;
    if (data.state !== undefined)         updateData.state = data.state;
    if (data.city !== undefined)          updateData.city = data.city;
    if (data.area !== undefined)          updateData.area = data.area;
    if (data.manualAddress !== undefined) updateData.manualAddress = data.manualAddress?.trim() || null;
    if (data.status !== undefined)        updateData.status = data.status;
    if (data.notes !== undefined)         updateData.notes = data.notes || null;
    if (data.isConverted !== undefined)   updateData.isConverted = !!data.isConverted;
    if (data.appsTaken !== undefined)     updateData.appsTaken = data.appsTaken;
    if (data.amountPaid !== undefined)    updateData.amountPaid = parseFloat(data.amountPaid) || 0;
    if (data.seatsCount !== undefined)    updateData.seatsCount = parseInt(data.seatsCount) || 1;
    if (data.conversionNotes !== undefined) updateData.conversionNotes = data.conversionNotes || null;
    if (data.convertedAt !== undefined)   updateData.convertedAt = data.convertedAt || null;
    if (data.date !== undefined)          updateData.createdAt = new Date(data.date);

    const updated = await prisma.client.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Database client identifier is required" }, { status: 400 });
    }

    // Sync outreach target when a registered client is removed
    const client = await prisma.client.findUnique({
      where: { id }
    });

    if (client) {
      await decrementDailyTarget(client.createdAt);
    }

    await prisma.client.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete client" }, { status: 500 });
  }
}
