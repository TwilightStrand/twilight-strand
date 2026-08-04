// Auth is optional - requires DATABASE_URL + OAuth credentials
// Uses indirect require to prevent Turbopack from tracing into auth deps

/* eslint-disable @typescript-eslint/no-implied-eval */
const _require = typeof require !== "undefined" ? require : null;
const dynamicRequire = (mod: string) => {
  if (!_require) throw new Error("require not available");
  return _require(mod);
};

let _auth: any = null;

function getAuth() {
  if (_auth) return _auth;

  const NextAuth = dynamicRequire("next-auth").default;
  const GitHub = dynamicRequire("next-auth/providers/github").default;
  const Discord = dynamicRequire("next-auth/providers/discord").default;
  const { DrizzleAdapter } = dynamicRequire("@auth/drizzle-adapter");
  const { db } = dynamicRequire("@/db");

  _auth = NextAuth({
    adapter: DrizzleAdapter(db),
    providers: [
      GitHub({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      }),
      Discord({
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
      }),
    ],
    pages: { signIn: "/login" },
    callbacks: {
      session({ session, user }: { session: any; user: any }) {
        if (session.user) session.user.id = user.id;
        return session;
      },
    },
  });

  return _auth;
}

export const handlers = {
  GET: (req: any) => getAuth().handlers.GET(req),
  POST: (req: any) => getAuth().handlers.POST(req),
};

export const auth = (...args: any[]) => getAuth().auth(...args);
export const signIn = (...args: any[]) => getAuth().signIn(...args);
export const signOut = (...args: any[]) => getAuth().signOut(...args);
