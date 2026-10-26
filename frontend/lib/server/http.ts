/** Tiny JSON helpers shared by the route handlers. */
export function jsonError(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

export function jsonOk<T extends object>(body: T, status = 200): Response {
  return Response.json(body, { status });
}
