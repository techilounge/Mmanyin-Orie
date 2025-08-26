// This module must be client-side
'use client';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

// Augment the jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

/**
 * Replaces known currency symbols with their respective codes for PDF compatibility.
 * @param text The text to process.
 * @returns The text with currency symbols replaced.
 */
function replaceCurrencySymbolsForPdf(text: string | number | null | undefined): string {
    if (text === null || text === undefined) return '';
    const str = String(text);
    // Add more currency mappings here as needed
    return str
      .replace(/₦/g, 'NGN ')
      .replace(/€/g, 'EUR ')
      .replace(/£/g, 'GBP ')
      .replace(/¥/g, 'JPY ')
      .replace(/\$/g, 'USD '); // Note: basic dollar sign is often supported, but this ensures consistency
}


/**
 * Generates and downloads a PDF document from a data array.
 * @param title The title of the report.
 * @param headers An array of strings for the table headers.
 * @param data An array of objects, where each object represents a row.
 */
export function generatePdf(title: string, headers: string[], data: any[]) {
  // Determine orientation based on number of columns.
  const orientation = headers.length > 5 ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation });
  
  doc.setFont('Helvetica');

  doc.text(title, 14, 20);
  doc.setFontSize(12);
  doc.text(`Generated on: ${format(new Date(), 'PPP p')}`, 14, 28);

  const tableData = data.map(row => 
    headers.map(header => replaceCurrencySymbolsForPdf(row[header]))
  );
  
  doc.autoTable({
    startY: 35,
    head: [headers.map(h => replaceCurrencySymbolsForPdf(h))],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] }, // Indigo primary color
  });
  
  doc.save(`${title.toLowerCase().replace(/ /g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}


/**
 * Generates and downloads a CSV file from a data array.
 * @param filename The name of the file to download.
 * @param data An array of objects, where each object represents a row.
 */
export function generateCsv(filename: string, data: any[]) {
  if (data.length === 0) {
    alert('No data to export.');
    return;
  }
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // header row
    ...data.map(row => 
      headers.map(fieldName => {
        const value = String(row[fieldName] || '');
        // Escape commas and quotes
        const escaped = value.replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    )
  ];

  const csvString = csvRows.join('\n');
  
  // Add BOM for UTF-8 support in Excel
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
