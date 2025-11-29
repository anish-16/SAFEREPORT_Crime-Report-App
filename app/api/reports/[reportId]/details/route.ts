import { NextResponse, NextRequest } from "next/server";
import { PrismaClient, ReportStatus } from "@prisma/client";
import { getServerSession } from "next-auth/next";

const prisma = new PrismaClient();

// GET handler
export async function GET(
  request: NextRequest,
  context: { params: { reportId: string } }
) {
  try {
    const { reportId } = context.params;

    const report = await prisma.report.findUnique({
      where: { reportId },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error fetching report details:", error);
    return NextResponse.json(
      { error: "Failed to fetch report details" },
      { status: 500 }
    );
  }
}

// PATCH handler
export async function PATCH(
  request: NextRequest,
  context: { params: { reportId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { status?: string };
    const statusStr = body.status;

    if (!statusStr || typeof statusStr !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing 'status' in request body" },
        { status: 400 }
      );
    }

    const allowed = Object.values(ReportStatus) as string[];
    if (!allowed.includes(statusStr)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed: ${allowed.join(", ")}` },
        { status: 400 }
      );
    }

    const status = statusStr as ReportStatus;

    const updated = await prisma.report.update({
      where: { reportId: context.params.reportId },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Error updating report" },
      { status: 500 }
    );
  }
}