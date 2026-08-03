import { describe, it, expect } from "vitest";
import { decodePobCode, encodePobCode, classifyBuildInput } from "./index";

describe("decodePobCode", () => {
  it("returns null for empty or short input", () => {
    expect(decodePobCode("")).toBeNull();
    expect(decodePobCode("abc")).toBeNull();
    expect(decodePobCode("short")).toBeNull();
  });

  it("returns null for non-base64 input", () => {
    expect(decodePobCode("this is not a valid base64 string!!!")).toBeNull();
  });

  it("returns null for valid base64 that doesn't inflate to XML", () => {
    const b64 = btoa("hello world this is not xml at all");
    expect(decodePobCode(b64)).toBeNull();
  });
});

describe("encodePobCode", () => {
  it("produces a URL-safe base64 string", () => {
    const xml = '<?xml version="1.0"?><PathOfBuilding></PathOfBuilding>';
    const code = encodePobCode(xml);
    expect(code).toBeTruthy();
    expect(code).not.toContain("+");
    expect(code).not.toContain("/");
    expect(/^[A-Za-z0-9_=-]+$/.test(code)).toBe(true);
  });
});

describe("encode/decode roundtrip", () => {
  it("roundtrips a simple PoB XML", () => {
    const xml =
      '<?xml version="1.0"?><PathOfBuilding><Build level="95" className="Witch" ascendClassName="Necromancer"></Build></PathOfBuilding>';
    const code = encodePobCode(xml);
    const decoded = decodePobCode(code);
    expect(decoded).toBe(xml);
  });

  it("roundtrips XML with special characters", () => {
    const xml =
      '<?xml version="1.0"?><PathOfBuilding><Build level="1" className="Scion"><Note>Test &amp; notes "here"</Note></Build></PathOfBuilding>';
    const code = encodePobCode(xml);
    const decoded = decodePobCode(code);
    expect(decoded).toBe(xml);
  });

  it("handles URL-safe base64 characters correctly", () => {
    const xml =
      '<?xml version="1.0"?><PathOfBuilding><Build level="42" className="Shadow" ascendClassName="Assassin"></Build><Items></Items><Skills></Skills></PathOfBuilding>';
    const code = encodePobCode(xml);
    // Ensure no standard base64 chars leaked through
    expect(code).not.toContain("+");
    expect(code).not.toContain("/");
    const decoded = decodePobCode(code);
    expect(decoded).toBe(xml);
  });
});

describe("classifyBuildInput", () => {
  it("detects raw XML", () => {
    expect(classifyBuildInput('<?xml version="1.0"?><PathOfBuilding>')).toBe(
      "raw-xml"
    );
    expect(classifyBuildInput("<PathOfBuilding>")).toBe("raw-xml");
  });

  it("detects pastebin URLs", () => {
    expect(classifyBuildInput("https://pastebin.com/abc123")).toBe(
      "pastebin-url"
    );
    expect(classifyBuildInput("pastebin.com/xyz")).toBe("pastebin-url");
  });

  it("detects pobb.in URLs", () => {
    expect(classifyBuildInput("https://pobb.in/abc123")).toBe("pobbin-url");
    expect(classifyBuildInput("pobb.in/xyz")).toBe("pobbin-url");
  });

  it("detects PoB codes (long base64)", () => {
    const longCode = "A".repeat(100);
    expect(classifyBuildInput(longCode)).toBe("pob-code");
  });

  it("detects PoB codes with URL-safe chars", () => {
    const code = "eNp1k91u2zAMhV9F0P2WbrtZAdtF-rOggJOmc7pdDqzExGplyZDk";
    expect(classifyBuildInput(code)).toBe("pob-code");
  });

  it("returns unknown for unrecognized input", () => {
    expect(classifyBuildInput("hello")).toBe("unknown");
    expect(classifyBuildInput("")).toBe("unknown");
    expect(classifyBuildInput("12345")).toBe("unknown");
  });
});
