import { useEffect, useState } from "react";
import themesData from "./data/themes.generated.json";
import { getExportContent, getFormatLabel } from "./lib/exporters";
import type { ExportFormat, ThemeRecord } from "./types/theme";

const formats: ExportFormat[] = ["css", "json", "js", "tailwind"];
const themes = themesData as ThemeRecord[];
const rootKeys = Array.from(
  new Set(themes.flatMap((theme) => Object.keys(theme.colors)))
).sort((a, b) => a.localeCompare(b));

function hexLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const themeLuminance = new Map<string, number>(
  themes.map((t) => [t.id, hexLuminance(t.colors["--bg-color"] ?? "#000000")])
);

const themesByLuminance = [...themes].sort(
  (a, b) => (themeLuminance.get(a.id) ?? 0) - (themeLuminance.get(b.id) ?? 0)
);

const SWATCH_KEYS = [
  "--bg-color",
  "--sub-alt-color",
  "--sub-color",
  "--text-color",
  "--main-color",
  "--caret-color",
];

function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(value);
  }
  const el = document.createElement("textarea");
  el.value = value;
  el.setAttribute("readonly", "true");
  el.style.cssText = "position:absolute;left:-9999px";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  el.remove();
  return Promise.resolve();
}

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedThemeId, setSelectedThemeId] = useState(themes[0]?.id ?? "");
  const [hoveredThemeId, setHoveredThemeId] = useState<string | null>(null);
  const [activeFormat, setActiveFormat] = useState<ExportFormat>("css");
  const [copiedFormat, setCopiedFormat] = useState<ExportFormat | null>(null);
  const [sortMode, setSortMode] = useState<"alpha" | "luminance">("alpha");

  const baseList = sortMode === "luminance" ? themesByLuminance : themes;
  const normalized = query.trim().toLowerCase();
  const filteredThemes = normalized
    ? baseList.filter(
        (t) =>
          t.name.toLowerCase().includes(normalized) ||
          t.id.toLowerCase().includes(normalized)
      )
    : baseList;

  const activeTheme =
    themes.find((t) => t.id === hoveredThemeId) ??
    themes.find((t) => t.id === selectedThemeId) ??
    themes[0];

  useEffect(() => {
    if (!activeTheme) return;
    const root = document.documentElement;
    for (const key of rootKeys) {
      if (key in activeTheme.colors) {
        root.style.setProperty(key, activeTheme.colors[key]);
      } else {
        root.style.removeProperty(key);
      }
    }
    root.dataset.themeId = activeTheme.id;
  }, [activeTheme]);

  useEffect(() => {
    if (!copiedFormat) return;
    const t = window.setTimeout(() => setCopiedFormat(null), 1500);
    return () => window.clearTimeout(t);
  }, [copiedFormat]);

  if (!activeTheme) return null;

  const exportContent = getExportContent(activeTheme, activeFormat);
  const colorEntries = Object.entries(activeTheme.colors).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-top-row">
            <div className="sidebar-count">{themes.length} themes</div>
            <div className="sort-toggle">
              <button
                className={`sort-btn${sortMode === "alpha" ? " is-selected" : ""}`}
                type="button"
                onClick={() => setSortMode("alpha")}
              >
                A–Z
              </button>
              <button
                className={`sort-btn${sortMode === "luminance" ? " is-selected" : ""}`}
                type="button"
                onClick={() => setSortMode("luminance")}
              >
                ◐
              </button>
            </div>
          </div>
        </div>

        <div className="sidebar-search">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
          />
        </div>

        <div
          className="theme-list"
          onMouseLeave={() => setHoveredThemeId(null)}
        >
          {filteredThemes.map((theme) => {
            const isSelected = theme.id === selectedThemeId;
            const isActive = theme.id === activeTheme.id;
            return (
              <button
                key={theme.id}
                className={`theme-item${isSelected ? " is-selected" : ""}${isActive ? " is-active" : ""}`}
                type="button"
                onMouseEnter={() => setHoveredThemeId(theme.id)}
                onFocus={() => setHoveredThemeId(theme.id)}
                onClick={() => {
                  setSelectedThemeId(theme.id);
                  setHoveredThemeId(theme.id);
                }}
              >
                <div className="theme-swatches">
                  {SWATCH_KEYS.map((key) => (
                    <span
                      key={key}
                      className="swatch"
                      style={{
                        background: theme.colors[key] ?? "transparent",
                      }}
                    />
                  ))}
                </div>
                <span className="theme-item-name">{theme.name}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="content">
        <div className="content-header">
          <span className="content-name">{activeTheme.name}</span>
          <span className="content-meta-item">
            slug: <span>{activeTheme.id}</span>
          </span>
          <span className="content-meta-item">
            vars: <span>{colorEntries.length}</span>
          </span>
        </div>

        <div className="content-panels">
          {/* Palette */}
          <section className="palette-panel">
            <div className="panel-header">Palette</div>
            <div className="palette-body">
              {colorEntries.map(([key, value]) => (
                <div className="palette-row" key={key}>
                  <span
                    className="palette-block"
                    style={{ background: value }}
                  />
                  <span className="palette-var">{key}</span>
                  <span className="palette-hex">{value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Export */}
          <section className="export-panel">
            <div className="export-panel-header">
              <span className="export-panel-title">Export</span>
              <button
                className={`copy-btn${copiedFormat === activeFormat ? " is-copied" : ""}`}
                type="button"
                onClick={() => {
                  void copyText(exportContent).then(() =>
                    setCopiedFormat(activeFormat)
                  );
                }}
              >
                {copiedFormat === activeFormat ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="export-tabs">
              {formats.map((fmt) => (
                <button
                  key={fmt}
                  className={`tab-btn${fmt === activeFormat ? " is-selected" : ""}`}
                  type="button"
                  onClick={() => setActiveFormat(fmt)}
                >
                  {getFormatLabel(fmt)}
                </button>
              ))}
            </div>

            <pre className="export-code">{exportContent}</pre>
          </section>
        </div>
      </main>
    </div>
  );
}
