import { ColumnMapping, ParsedImportRow } from "@/types";

export interface FileParseResult {
  fileName: string;
  headers: string[];
  rawRows: Record<string, any>[];
  totalRows: number;
}

/**
 * Reads a user-uploaded CSV or Excel file completely on the client side with dynamic lazy-loading.
 */
export async function parseSpreadsheetFile(file: File): Promise<FileParseResult> {
  const isExcel =
    file.name.endsWith(".xlsx") ||
    file.name.endsWith(".xls") ||
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "application/vnd.ms-excel";

  if (isExcel) {
    const XLSX = await import("xlsx");
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Read with headers as first row
    const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
      defval: "",
      raw: false,
    });

    if (jsonRows.length === 0) {
      return {
        fileName: file.name,
        headers: [],
        rawRows: [],
        totalRows: 0,
      };
    }

    const headers = Object.keys(jsonRows[0] || {});
    return {
      fileName: file.name,
      headers,
      rawRows: jsonRows,
      totalRows: jsonRows.length,
    };
  }

  // Handle CSV file via dynamically imported PapaParse
  const PapaModule = await import("papaparse");
  const Papa = PapaModule.default || PapaModule;

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, any>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (results) => {
        const headers = results.meta.fields || [];
        resolve({
          fileName: file.name,
          headers,
          rawRows: results.data || [],
          totalRows: results.data.length,
        });
      },
      error: (err) => {
        reject(new Error(err.message || "Failed to parse CSV file"));
      },
    });
  });
}

/**
 * Intelligently auto-detects column mapping by inspecting header names.
 */
export function autoDetectColumnMapping(headers: string[]): ColumnMapping {
  const findMatch = (candidates: string[]) => {
    for (const candidate of candidates) {
      const match = headers.find((h) => {
        const norm = h.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
        const candNorm = candidate.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
        return norm === candNorm || norm.includes(candNorm);
      });
      if (match) return match;
    }
    return "";
  };

  return {
    date: findMatch([
      "date",
      "txn date",
      "transaction date",
      "timestamp",
      "booking date",
      "value date",
      "time",
    ]),
    title: findMatch([
      "description",
      "title",
      "narrative",
      "narration",
      "details",
      "memo",
      "merchant",
      "payee",
      "name",
      "particulars",
    ]),
    amount: findMatch([
      "amount",
      "net amount",
      "value",
      "total",
      "sum",
      "debit",
      "credit",
      "price",
    ]),
    type: findMatch([
      "type",
      "transaction type",
      "cr/dr",
      "dr/cr",
      "debit/credit",
      "action",
    ]),
    category: findMatch([
      "category",
      "tag",
      "classification",
      "expense category",
      "type category",
    ]),
    person: findMatch([
      "person",
      "counterparty",
      "friend",
      "with",
      "who",
      "contact",
      "paid to",
      "received from",
    ]),
  };
}

/**
 * Normalizes any date string or Excel serial number into a valid ISO string.
 */
function parseAnyDate(val: any): { iso: string; readable: string } | null {
  if (!val) return null;

  if (val instanceof Date && !isNaN(val.getTime())) {
    return {
      iso: val.toISOString(),
      readable: val.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };
  }

  const str = String(val).trim();
  if (!str) return null;

  // 1. Try standard Date.parse
  const directTimestamp = Date.parse(str);
  if (!isNaN(directTimestamp)) {
    const d = new Date(directTimestamp);
    return {
      iso: d.toISOString(),
      readable: d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };
  }

  // 2. Try DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const hours = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 12;
    const minutes = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;

    const d = new Date(year, month, day, hours, minutes);
    if (!isNaN(d.getTime())) {
      return {
        iso: d.toISOString(),
        readable: d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      };
    }
  }

  // 3. Try YYYY/MM/DD or YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const hours = ymdMatch[4] ? parseInt(ymdMatch[4], 10) : 12;
    const minutes = ymdMatch[5] ? parseInt(ymdMatch[5], 10) : 0;

    const d = new Date(year, month, day, hours, minutes);
    if (!isNaN(d.getTime())) {
      return {
        iso: d.toISOString(),
        readable: d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      };
    }
  }

  return null;
}

/**
 * Normalizes amount values, stripping symbols and detecting signs.
 */
function parseAnyAmount(val: any): { amount: number; isNegative: boolean } | null {
  if (val === undefined || val === null) return null;

  let str = String(val).trim();
  if (!str) return null;

  // Accounting negative notation: "(150.00)"
  const accountingMatch = str.match(/^\((.*)\)$/);
  let isNegative = false;
  if (accountingMatch) {
    isNegative = true;
    str = accountingMatch[1];
  } else if (str.startsWith("-")) {
    isNegative = true;
    str = str.replace(/^-/, "");
  }

  // Remove currency signs (₹, $, €, £) and commas
  const cleaned = str.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;

  return {
    amount: Math.abs(num),
    isNegative,
  };
}

/**
 * Evaluates raw rows against user column mapping and produces validated records.
 */
export function parseAndValidateRows(
  rawRows: Record<string, any>[],
  mapping: ColumnMapping
): ParsedImportRow[] {
  return rawRows.map((row, index) => {
    const rawDate = mapping.date ? row[mapping.date] : null;
    const rawTitle = mapping.title ? row[mapping.title] : null;
    const rawAmount = mapping.amount ? row[mapping.amount] : null;
    const rawType = mapping.type ? row[mapping.type] : null;
    const rawCategory = mapping.category ? row[mapping.category] : null;
    const rawPerson = mapping.person ? row[mapping.person] : null;

    let isValid = true;
    let errorMessage = "";

    // 1. Date Validation
    const parsedDate = parseAnyDate(rawDate);
    if (!parsedDate) {
      isValid = false;
      errorMessage = `Invalid date "${rawDate || ""}"`;
    }

    // 2. Amount Validation
    const parsedAmt = parseAnyAmount(rawAmount);
    if (!parsedAmt || parsedAmt.amount <= 0) {
      isValid = false;
      errorMessage = errorMessage
        ? `${errorMessage}, invalid amount "${rawAmount || ""}"`
        : `Invalid amount "${rawAmount || ""}"`;
    }

    // 3. Title / Description
    const title = rawTitle ? String(rawTitle).trim() : "Imported Transaction";
    if (!title) {
      isValid = false;
      errorMessage = errorMessage
        ? `${errorMessage}, missing title`
        : "Missing transaction title";
    }

    // 4. Type Derivation
    let resolvedType: "income" | "expense" = "expense";
    if (rawType) {
      const typeStr = String(rawType).toLowerCase().trim();
      if (
        typeStr.includes("cr") ||
        typeStr.includes("in") ||
        typeStr.includes("deposit") ||
        typeStr.includes("receive") ||
        typeStr.includes("salary")
      ) {
        resolvedType = "income";
      } else {
        resolvedType = "expense";
      }
    } else if (parsedAmt?.isNegative) {
      resolvedType = "expense";
    }

    // 5. Category
    const category = rawCategory ? String(rawCategory).trim() : "General";

    // 6. Person
    const personName =
      rawPerson && String(rawPerson).trim() && String(rawPerson).trim() !== "-"
        ? String(rawPerson).trim()
        : null;

    return {
      raw_row_index: index + 1,
      date: parsedDate?.iso || new Date().toISOString(),
      formatted_date: parsedDate?.readable || "Invalid Date",
      title,
      amount: parsedAmt ? parsedAmt.amount : 0,
      type: resolvedType,
      category: category || "General",
      person_name: personName,
      is_valid: isValid,
      error_message: errorMessage || undefined,
    };
  });
}
