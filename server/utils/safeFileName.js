export function safeFileName(value, fallback = "untitled") {
  const normalized = String(value ?? "")
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .replace(/[.\s-]+$/g, "")
    .trim();

  return (normalized || fallback).slice(0, 80);
}
