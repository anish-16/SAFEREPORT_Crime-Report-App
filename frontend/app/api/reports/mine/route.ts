import { prisma } from '@/lib/server/prisma';
import { getSession } from '@/lib/server/session';
import { jsonError, jsonOk } from '@/lib/server/http';

const STATUS_FLOW = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'] as const;
type Status = (typeof STATUS_FLOW)[number];

/**
 * GET /api/reports/mine — this account's reports, or this device's reports
 * when the visitor has no session (passwordless guest dashboard).
 */
export async function GET(req: Request): Promise<Response> {
  const session = getSession(req);
  const status = new URL(req.url).searchParams.get('status') ?? undefined;

  let where: { userId?: string; deviceId?: string } = {};
  if (session.user) where = { userId: session.user.id };
  else if (session.deviceId) where = { deviceId: session.deviceId };
  else return jsonError(401, 'Missing device identity — reload the page and try again');

  const reports = await prisma.report.findMany({
    where: {
      ...where,
      ...(status && STATUS_FLOW.includes(status as Status) ? { status: status as Status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: { events: { orderBy: { createdAt: 'asc' } } },
  });

  return jsonOk({ reports, view: session.user ? 'account' : 'device' });
}
