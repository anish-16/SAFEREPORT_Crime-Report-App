import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

export async function PATCH(
  request: Request,
  context: { params: { reportId: string } }
) {
  try {
    // Ensure the user is authenticated
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { status } = await request.json();

    if (!status || typeof status !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing 'status' field" },
        { status: 400 }
      );
    }

    // Update the report
    const report = await prisma.report.update({
      where: { id: context.params.reportId },
      data: { status },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Error updating report" },
      { status: 500 }
    );
  }
}