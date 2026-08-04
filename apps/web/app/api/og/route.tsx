import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "Unnamed Build";
  const cls = searchParams.get("class") || "";
  const asc = searchParams.get("ascendancy") || "";
  const level = searchParams.get("level") || "1";
  const dps = searchParams.get("dps") || "0";
  const life = searchParams.get("life") || "0";
  const es = searchParams.get("es") || "0";

  function fmtNum(n: string): string {
    const num = parseInt(n);
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${Math.round(num / 1e3)}k`;
    return String(num);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #050810 0%, #0a1628 50%, #050810 100%)",
          fontFamily: "monospace",
          color: "white",
        }}
      >
        <div style={{ fontSize: "24px", color: "#06b6d4", marginBottom: "8px" }}>
          Twilight Strand
        </div>
        <div style={{ fontSize: "48px", fontWeight: "bold", marginBottom: "16px" }}>
          {name}
        </div>
        <div style={{ fontSize: "28px", color: "#9ca3af", marginBottom: "32px" }}>
          {asc || cls} Level {level}
        </div>
        <div style={{ display: "flex", gap: "48px", fontSize: "24px" }}>
          {parseInt(dps) > 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ color: "#06b6d4", fontSize: "36px", fontWeight: "bold" }}>{fmtNum(dps)}</span>
              <span style={{ color: "#6b7280" }}>DPS</span>
            </div>
          )}
          {parseInt(life) > 1 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ color: "#ef4444", fontSize: "36px", fontWeight: "bold" }}>{fmtNum(life)}</span>
              <span style={{ color: "#6b7280" }}>Life</span>
            </div>
          )}
          {parseInt(es) > 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ color: "#3b82f6", fontSize: "36px", fontWeight: "bold" }}>{fmtNum(es)}</span>
              <span style={{ color: "#6b7280" }}>ES</span>
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
