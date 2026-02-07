export function escapeHtml(text) {
  if (typeof text !== "string") return String(text ?? "");

  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
