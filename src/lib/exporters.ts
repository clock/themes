import type { ExportFormat, ThemeRecord } from "../types/theme";

function formatObjectLines(entries: Array<[string, string]>, indent: string): string {
  return entries.map(([key, value]) => `${indent}"${key}": "${value}"`).join(",\n");
}

function toTokenEntries(theme: ThemeRecord): Array<[string, string]> {
  return Object.entries(theme.colors).sort(([left], [right]) => left.localeCompare(right));
}

export function getExportContent(theme: ThemeRecord, format: ExportFormat): string {
  const entries = toTokenEntries(theme);

  if (format === "css") {
    return theme.cssText.trim();
  }

  if (format === "json") {
    return `{
${formatObjectLines(entries, "  ")}
}`;
  }

  if (format === "js") {
    return `export const theme = {
${formatObjectLines(entries, "  ")}
};`;
  }

  const tailwindEntries = entries
    .map(([key, value]) => `        "${key.replace(/^--/, "")}": "${value}"`)
    .join(",\n");

  return `export default {
  theme: {
    extend: {
      colors: {
${tailwindEntries}
      }
    }
  }
};`;
}

export function getFormatLabel(format: ExportFormat): string {
  if (format === "css") return "CSS Variables";
  if (format === "json") return "JSON";
  if (format === "js") return "JS Object";
  return "Tailwind";
}