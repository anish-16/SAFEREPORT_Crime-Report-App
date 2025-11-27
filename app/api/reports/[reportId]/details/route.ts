// app/api/reports/[reportId]/details/route.ts

import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
// FIX: Use standard import for the ReportStatus type and runtime enum
import { ReportStatus } from "@prisma/client"; 
import { getServerSession } from "next-auth/next";

const prisma = new PrismaClient();

// NO SEPARATE INTERFACE USED HERE TO AVOID TYPE CONFLICTS

// GET handler to fetch report details
export async function GET(
  request: NextRequest, 
  // FIX: Use INLINE TYPE for params to ensure build compatibility
  { params }: { params: { reportId: string } } 
) { 
  try {
    const { reportId } = params;

    const report = await prisma.report.findUnique({
      where: {
        reportId,
      },
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

// PATCH handler to update report status
export async function PATCH(
  request: NextRequest, 
  // FIX: Use INLINE TYPE for params to ensure build compatibility
  { params }: { params: { reportId: string } } 
) { 
  try {
    // Auth check
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

    // Get the runtime enum values directly from the imported ReportStatus enum
    const allowed = Object.values(ReportStatus) as string[];

    if (!allowed.includes(statusStr)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed: ${allowed.join(", ")}` },
        { status: 400 }
      );
    }

    // Cast to the Prisma enum type
    const status = statusStr as ReportStatus;

    const updated = await prisma.report.update({
      where: {
        reportId: params.reportId,
      },
      data: {
        status,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json({ error: "Error updating report" }, { status: 500 });
  }
}