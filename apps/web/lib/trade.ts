export interface TradePrice {
  min: number;
  median: number;
  max: number;
  currency: string;
  count: number;
}

export async function priceCheck(
  itemName: string,
  league: string = "Settlers",
): Promise<TradePrice | null> {
  try {
    const query = {
      query: {
        status: { option: "online" },
        name: itemName,
        type: itemName,
        stats: [{ type: "and", filters: [] }],
      },
      sort: { price: "asc" },
    };

    const resp = await fetch("/api/trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ league, query }),
    });

    if (!resp.ok) return null;
    const data = await resp.json();

    if (!data.results?.length) return null;

    const prices = data.results
      .filter((r: { price: number; currency: string }) => r.price && r.currency === "chaos")
      .map((r: { price: number }) => r.price);

    if (prices.length === 0) return null;
    prices.sort((a: number, b: number) => a - b);

    return {
      min: prices[0],
      median: prices[Math.floor(prices.length / 2)],
      max: prices[prices.length - 1],
      currency: "chaos",
      count: data.total || prices.length,
    };
  } catch {
    return null;
  }
}

export async function priceCheckClusterNotable(
  notable: string,
  league: string = "Settlers",
): Promise<TradePrice | null> {
  try {
    const query = {
      query: {
        status: { option: "online" },
        stats: [
          {
            type: "and",
            filters: [
              {
                id: "pseudo.pseudo_adds_passive_skill_" + notable.toLowerCase().replace(/\s+/g, "_"),
                value: {},
                disabled: false,
              },
            ],
          },
        ],
        filters: {
          type_filters: {
            filters: {
              category: { option: "jewel.cluster" },
            },
          },
        },
      },
      sort: { price: "asc" },
    };

    const resp = await fetch("/api/trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ league, query }),
    });

    if (!resp.ok) return null;
    const data = await resp.json();

    const prices = (data.results || [])
      .filter((r: { price: number }) => r.price)
      .map((r: { price: number }) => r.price);

    if (!prices.length) return null;
    prices.sort((a: number, b: number) => a - b);

    return {
      min: prices[0],
      median: prices[Math.floor(prices.length / 2)],
      max: prices[prices.length - 1],
      currency: "chaos",
      count: data.total || prices.length,
    };
  } catch {
    return null;
  }
}

export async function priceCheckUnique(
  name: string,
  base: string,
  league: string = "Settlers",
): Promise<TradePrice | null> {
  try {
    const query = {
      query: {
        status: { option: "online" },
        name,
        type: base,
        filters: {
          type_filters: { filters: { rarity: { option: "unique" } } },
        },
        stats: [{ type: "and", filters: [] }],
      },
      sort: { price: "asc" },
    };

    const resp = await fetch("/api/trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ league, query }),
    });

    if (!resp.ok) return null;
    const data = await resp.json();

    if (!data.results?.length) return null;

    const prices = data.results
      .filter((r: { price: number }) => r.price)
      .map((r: { price: number }) => r.price);

    if (prices.length === 0) return null;
    prices.sort((a: number, b: number) => a - b);

    return {
      min: prices[0],
      median: prices[Math.floor(prices.length / 2)],
      max: prices[prices.length - 1],
      currency: "chaos",
      count: data.total || prices.length,
    };
  } catch {
    return null;
  }
}
