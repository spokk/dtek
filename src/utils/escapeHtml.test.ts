import { escapeHtml } from "./escapeHtml.js";

describe("escapeHtml", () => {
  it("escapes & < > and quotes", () => {
    expect(escapeHtml('Tom & Jerry <script>"hi"</script>')).toBe(
      "Tom &amp; Jerry &lt;script&gt;&quot;hi&quot;&lt;/script&gt;",
    );
  });

  it("returns plain strings unchanged", () => {
    expect(escapeHtml("Hello world")).toBe("Hello world");
  });

  it("handles non-string values", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
    expect(escapeHtml(42)).toBe("42");
  });
});
