import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

export function toPdf(title: string, rows: unknown) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(title, 16, 18);
  doc.setFontSize(10);
  const text = JSON.stringify(rows, null, 2);
  const lines = doc.splitTextToSize(text, 180);
  doc.text(lines, 16, 30);
  return Buffer.from(doc.output("arraybuffer"));
}

export function toExcel(sheetName: string, rows: unknown) {
  const data = Array.isArray(rows) ? rows : [rows];
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
