export type ThemeRecord = {
  id: string;
  name: string;
  colors: Record<string, string>;
  cssText: string;
};

export type ExportFormat = "css" | "json" | "js" | "tailwind";