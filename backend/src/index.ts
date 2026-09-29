import { app, resolvePort } from './app';

// Standalone backend entry (split dev). Production and unified runs use the
// repo-root server.ts instead, which mounts this same app.
const PORT = resolvePort(4000);

app.listen(PORT, () => {
  console.log(`🛡  SafeReport API listening on http://localhost:${PORT}`);
});
