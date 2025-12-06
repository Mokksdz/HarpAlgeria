/**
 * Simple CSV generator without external dependencies
 */

type CSVField<T> = {
  label: string;
  value: keyof T | ((row: T) => string | number | null | undefined);
};

export function generateCSV<T extends Record<string, any>>(
  data: T[],
  fields: CSVField<T>[]
): string {
  // Header row
  const header = fields.map((f) => escapeCSV(f.label)).join(",");

  // Data rows
  const rows = data.map((row) => {
    return fields
      .map((field) => {
        let value: any;
        if (typeof field.value === "function") {
          value = field.value(row);
        } else {
          value = row[field.value];
        }
        return escapeCSV(value);
      })
      .join(",");
  });

  return [header, ...rows].join("\n");
}

function escapeCSV(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
