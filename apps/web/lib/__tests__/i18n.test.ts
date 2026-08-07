import { describe, it, expect, beforeEach } from "vitest";
import { t, setLocale, getLocale, AVAILABLE_LOCALES } from "../i18n";

describe("i18n", () => {
  beforeEach(() => {
    setLocale("en");
  });

  describe("t()", () => {
    it("returns the key as-is for English locale", () => {
      expect(t("Tree")).toBe("Tree");
      expect(t("Items")).toBe("Items");
      expect(t("some arbitrary string")).toBe("some arbitrary string");
    });

    it("translates to Chinese", () => {
      setLocale("zh");
      expect(t("Tree")).toBe("天赋树");
      expect(t("Items")).toBe("物品");
      expect(t("Skills")).toBe("技能");
    });

    it("translates to Korean", () => {
      setLocale("ko");
      expect(t("Tree")).toBe("스킬 트리");
      expect(t("Items")).toBe("아이템");
    });

    it("translates to Russian", () => {
      setLocale("ru");
      expect(t("Tree")).toBe("Дерево");
      expect(t("Items")).toBe("Предметы");
    });

    it("falls back to key for missing translations", () => {
      setLocale("zh");
      expect(t("some key not in translations")).toBe("some key not in translations");
    });
  });

  describe("setLocale / getLocale", () => {
    it("changes the current locale", () => {
      setLocale("ko");
      expect(getLocale()).toBe("ko");
    });

    it("getLocale defaults to en", () => {
      expect(getLocale()).toBe("en");
    });
  });

  describe("AVAILABLE_LOCALES", () => {
    it("includes all four locales", () => {
      const values = AVAILABLE_LOCALES.map((l) => l.value);
      expect(values).toContain("en");
      expect(values).toContain("zh");
      expect(values).toContain("ko");
      expect(values).toContain("ru");
    });

    it("each locale has a label", () => {
      for (const locale of AVAILABLE_LOCALES) {
        expect(locale.label).toBeTruthy();
      }
    });
  });
});
