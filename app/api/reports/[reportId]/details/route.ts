// app/api/reports/[reportId]/details/route.ts

// 1. CHANGE: Import NextRequest from 'next/server'
import { NextResponse, NextRequest } from "next/server"; 
import { PrismaClient } from "@prisma/client";
import type { ReportStatus } from "@prisma/client"; 
import { getServerSession } from "next-auth/next";

const prisma = new PrismaClient();

// 2. CHANGE: Simplify the type definition for Params
// This is the structure Next.js expects for the context object
interface RouteContext { 
    params: { reportId: string };
}

// 3. CHANGE: Use NextRequest for the request argument
export async function GET(request: NextRequest, context: RouteContext) { 
  try {
    const { reportId } = context.params; // Use 'context' here

    const report = await prisma.report.findUnique({
      where: {
        reportId,
      },
    });
// ... rest of GET is correct ...
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

// 4. CHANGE: Use NextRequest for the request argument
export async function PATCH(request: NextRequest, context: RouteContext) { 
  try {
    // auth check (keep or remove as per your app)
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // You can now access .json() on NextRequest without casting 'request'
    const body = (await request.json()) as { status?: string }; 
// ... rest of PATCH is correct ...
    const statusStr = body.status;

    if (!statusStr || typeof statusStr !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing 'status' in request body" },
        { status: 400 }
      );
    }

    // Get the runtime enum values from Prisma and validate
    // (use require to ensure runtime enum object is available)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ReportStatus: ReportStatusRuntime } = require("@prisma/client");
    const allowed = Object.values(ReportStatusRuntime) as string[];

    if (!allowed.includes(statusStr)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed: ${allowed.join(", ")}` },
        { status: 400 }
      );
    }

    // Cast to the Prisma enum type so TS + Prisma accept it
    const status = statusStr as ReportStatus;

    const updated = await prisma.report.update({
      where: {
        // <-- IMPORTANT: confirm your Prisma model key
        reportId: context.params.reportId, // Use 'context.params' here
      },
      data: {
        status, // now correctly typed as ReportStatus
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json({ error: "Error updating report" }, { status: 500 });
  }
}