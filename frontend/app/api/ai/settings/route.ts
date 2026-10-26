import { NextResponse } from 'next/server';
import { getSession } from '@/lib/server/session';
import { clearAiKey, getAiSettingsPublic, saveAiSettings } from '@/lib/server/ai';

/**
 * GET    /api/ai/settings — masked view of the AI configuration (never the key).
 * POST   /api/ai/settings — save provider/model/base URL/API key (admin only).
 * DELETE /api/ai/settings — forget the stored key (an env key still applies).
 *
 * Reading is open so every visitor can see which model is analysing reports;
 * changing it is admin-only because a custom base URL could redirect report
 * text, and the admin account is the app owner's.
 */

function adminError(): NextResponse {
  return NextResponse.json(
    { error: 'Sign in as admin to change AI settings (admin@safereport.app)' },
    { status: 401 }
  );
}

export async function GET(): Promise<Response> {
  const settings = await getAiSettingsPublic();
  return Response.json({ settings });
}

export async function POST(req: Request): Promise<Response> {
  if (getSession(req).user?.role !== 'ADMIN') return adminError();
  try {
    const body = (await req.json()) as {
      provider?: string;
      model?: string;
      baseUrl?: string;
      apiKey?: string;
      enabled?: boolean;
      detect?: boolean;
    };
    // Auto-detect: guess the provider from the pasted key unless one was chosen.
    if (body.detect && body.apiKey?.trim()) {
      const { detectProvider } = await import('@/lib/server/ai');
      body.provider = detectProvider(body.apiKey).id;
    }
    await saveAiSettings(body);
    return Response.json({ settings: await getAiSettingsPublic() });
  } catch (err) {
    console.error('ai settings save error', err);
    return NextResponse.json({ error: 'Failed to save AI settings' }, { status: 400 });
  }
}

export async function DELETE(req: Request): Promise<Response> {
  if (getSession(req).user?.role !== 'ADMIN') return adminError();
  await clearAiKey();
  return Response.json({ settings: await getAiSettingsPublic() });
}
