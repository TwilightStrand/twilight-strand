// Auth is optional - requires DATABASE_URL + OAuth credentials
// TODO: Replace next-auth with @auth/core for TanStack Start compatibility

let _auth: any = null;

async function getAuth() {
  if (_auth) return _auth;

  // next-auth was removed during the TanStack Start migration.
  // Auth requires reinstalling with a framework-agnostic adapter.
  throw new Error(
    "Auth not available: next-auth was removed during TanStack Start migration. " +
    "Install @auth/core and configure a framework-agnostic adapter."
  );
}

export const handlers = {
  GET: async (req: any) => (await getAuth()).handlers.GET(req),
  POST: async (req: any) => (await getAuth()).handlers.POST(req),
};

export const auth = async (...args: any[]) => (await getAuth()).auth(...args);
export const signIn = async (...args: any[]) => (await getAuth()).signIn(...args);
export const signOut = async (...args: any[]) => (await getAuth()).signOut(...args);
