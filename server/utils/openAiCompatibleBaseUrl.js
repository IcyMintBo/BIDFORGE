const versionSegmentPattern = /^v\d+$/i;

function stripKnownEndpointSegments(segments) {
  const next = [...segments];
  const last = next.at(-1)?.toLowerCase();
  const previous = next.at(-2)?.toLowerCase();

  if (last === "models" || last === "responses" || last === "completions") {
    next.pop();
  }

  if (previous === "chat" && last === "completions") {
    next.pop();
    next.pop();
  }

  return next;
}

export function normalizeOpenAiCompatibleBaseUrl(value) {
  const rawValue = String(value ?? "").trim();
  if (!rawValue) {
    return "";
  }

  const url = new URL(rawValue);
  const segments = stripKnownEndpointSegments(url.pathname.split("/").filter(Boolean));
  const lastSegment = segments.at(-1) ?? "";

  if (!versionSegmentPattern.test(lastSegment)) {
    segments.push("v1");
  }

  url.pathname = `/${segments.join("/")}`;
  url.search = "";
  url.hash = "";

  return url.toString().replace(/\/$/, "");
}
