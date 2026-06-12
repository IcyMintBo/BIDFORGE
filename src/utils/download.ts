export function downloadMarkdown(fileName: string, markdown: string): void {
  const normalizedFileName = fileName.toLowerCase().endsWith(".md") ? fileName : `${fileName}.md`;
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = normalizedFileName;
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 0);
}
