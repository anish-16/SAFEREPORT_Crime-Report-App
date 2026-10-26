export async function GET(): Promise<Response> {
  return Response.json({ ok: true, service: 'safereport-api', time: new Date().toISOString() });
}
