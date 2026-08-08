import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/import")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const importUrl = url.searchParams.get("url");
        if (!importUrl) {
          return Response.json({ error: "Missing url parameter" }, { status: 400 });
        }

        try {
          let codeUrl: string;

          if (importUrl.includes("pobb.in/")) {
            const id = importUrl.split("pobb.in/").pop()?.split(/[?#]/)[0];
            if (!id) throw new Error("Invalid pobb.in URL");
            codeUrl = `https://pobb.in/pob/${id}`;
          } else if (importUrl.includes("pastebin.com/")) {
            const id = importUrl
              .split("pastebin.com/")
              .pop()
              ?.replace("raw/", "")
              .split(/[?#]/)[0];
            if (!id) throw new Error("Invalid pastebin URL");
            codeUrl = `https://pastebin.com/raw/${id}`;
          } else if (importUrl.includes("poe.ninja/") && importUrl.includes("/pob/")) {
            codeUrl = importUrl.includes("/pob/raw/") ? importUrl : importUrl.replace("/pob/", "/pob/raw/");
          } else {
            return Response.json({ error: "Unsupported URL" }, { status: 400 });
          }

          const resp = await fetch(codeUrl, {
            headers: { "User-Agent": "TwilightStrand/1.0" },
          });

          if (!resp.ok) {
            return Response.json({ error: `Upstream returned ${resp.status}` }, { status: 502 });
          }

          const code = await resp.text();
          return Response.json({ code: code.trim() });
        } catch (e) {
          return Response.json(
            { error: e instanceof Error ? e.message : "Unknown error" },
            { status: 500 },
          );
        }
      },
    },
  },
});
