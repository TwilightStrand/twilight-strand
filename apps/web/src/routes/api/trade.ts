import { createAPIFileRoute } from "@tanstack/react-start/api";

const POE_TRADE_API = "https://www.pathofexile.com/api/trade";

export const APIRoute = createAPIFileRoute("/api/trade")({
  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { league, query } = body;

      if (!league || !query) {
        return Response.json({ error: "Missing league or query" }, { status: 400 });
      }

      const searchResp = await fetch(`${POE_TRADE_API}/search/${encodeURIComponent(league)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "TwilightStrand/1.0",
        },
        body: JSON.stringify(query),
      });

      if (!searchResp.ok) {
        return Response.json(
          { error: `Trade API returned ${searchResp.status}` },
          { status: searchResp.status === 429 ? 429 : 502 },
        );
      }

      const searchData = await searchResp.json();
      const resultIds = (searchData.result || []).slice(0, 10);

      if (resultIds.length === 0) {
        return Response.json({ results: [], total: searchData.total || 0 });
      }

      const fetchResp = await fetch(
        `${POE_TRADE_API}/fetch/${resultIds.join(",")}?query=${searchData.id}`,
        { headers: { "User-Agent": "TwilightStrand/1.0" } },
      );

      if (!fetchResp.ok) {
        return Response.json({ error: "Failed to fetch results" }, { status: 502 });
      }

      const fetchData = await fetchResp.json();

      const results = (fetchData.result || []).map((item: Record<string, unknown>) => {
        const listing = item.listing as Record<string, unknown> | undefined;
        const price = listing?.price as Record<string, unknown> | undefined;
        const account = listing?.account as Record<string, unknown> | undefined;
        const itemData = item.item as Record<string, unknown> | undefined;
        return {
          id: item.id,
          price: price?.amount,
          currency: price?.currency,
          name: itemData?.name || itemData?.typeLine,
          seller: account?.name,
        };
      });

      return Response.json({
        results,
        total: searchData.total || 0,
        queryId: searchData.id,
      });
    } catch (e) {
      return Response.json(
        { error: e instanceof Error ? e.message : "Unknown error" },
        { status: 500 },
      );
    }
  },
});
