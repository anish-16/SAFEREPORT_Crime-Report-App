import { NextResponse } from 'next/server';
import { getSession } from '@/lib/server/session';
import { testAi } from '@/lib/server/ai';

/** POST /api/ai/test — pings the configured provider with a tiny prompt (admin). */
export async function POST(req: Request): Promise<Response> {
  if (getSession(req).user?.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Sign in as admin to test the AI connection' },
      { status: 401 }
    );
  }
  const result = await testAi();
  return Response.json({ result });
}
