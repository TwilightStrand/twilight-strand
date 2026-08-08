import { Auth } from "@auth/core";
import type { AuthConfig, Session } from "@auth/core/types";
import GitHub from "@auth/core/providers/github";
import Discord from "@auth/core/providers/discord";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

let _db: any = null;

async function getDb() {
  if (_db) return _db;
  const mod = await import("@/db");
  _db = mod.db;
  return _db;
}

async function getConfig(): Promise<AuthConfig> {
  const db = await getDb();

  return {
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
    secret: process.env.AUTH_SECRET,
    trustHost: true,
    basePath: "/api/auth",
    callbacks: {
      session({ session, user }: { session: Session; user: any }) {
        if (session.user) session.user.id = user.id;
        return session;
      },
    },
  };
}

export const handlers = {
  GET: async (request: Request) => Auth(request, await getConfig()),
  POST: async (request: Request) => Auth(request, await getConfig()),
};

export async function auth(request?: Request): Promise<Session | null> {
  if (!request) {
    return null;
  }

  const url = new URL("/api/auth/session", request.url);
  const sessionRequest = new Request(url, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });

  const config = await getConfig();
  const response = await Auth(sessionRequest, config);
  const data = await response.json();

  if (!data || !Object.keys(data).length) return null;
  return data as Session;
}
