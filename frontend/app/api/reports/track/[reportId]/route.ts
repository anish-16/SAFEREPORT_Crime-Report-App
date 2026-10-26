import { prisma } from '@/lib/server/prisma';
import { jsonError, jsonOk } from '@/lib/server/http';

/** GET /api/reports/track/:reportId — public tracking view (no identity). */
export async function GET(_req: Request, ctx: { params: Promise<{ reportId: string }> }): Promise<Response> {
  const { reportId } = await ctx.params;
  const report = await prisma.report.findUnique({
    where: { reportId: reportId.toUpperCase() },
    include: { events: { orderBy: { createdAt: 'asc' } } },
  });
  if (!report) return jsonError(404, 'Report not found');

  // strip reporter identity and internal scoring fields
  const { userId: _u, deviceId: _d, keywords: _k, mediaHash: _m, ...rest } = report;
  void _u;
  void _d;
  void _k;
  void _m;
  return jsonOk({ report: rest });
}
