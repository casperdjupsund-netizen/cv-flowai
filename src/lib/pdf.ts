import { jsPDF } from "jspdf";
import { DOC_TYPE_LABELS, type DocType } from "@/lib/usage";

export interface DocumentRecord {
  id: string;
  type: string;
  created_at: string;
  job_posting: string | null;
  content: unknown;
}

/**
 * Muunna dokumentin sisältö selkokielisiksi osioiksi PDF:ää ja esikatselua varten.
 * Tukee tunnetut muodot (cv: sections-array, cover_letter/email: subject+body / text)
 * ja palauttaa muutoin JSON-tulosteen, jotta vanhat tai vapaat rakenteet näkyvät jotenkin.
 */
export function documentToSections(
  doc: DocumentRecord,
): { heading?: string; body: string }[] {
  const c = doc.content;

  if (c == null) return [{ body: "(Tyhjä dokumentti)" }];

  if (typeof c === "string") return [{ body: c }];

  if (typeof c === "object") {
    const obj = c as Record<string, unknown>;

    // CV: { sections: [{ heading, body }] }
    if (Array.isArray(obj.sections)) {
      return (obj.sections as Array<Record<string, unknown>>).map((s) => ({
        heading: typeof s.heading === "string" ? s.heading : undefined,
        body: typeof s.body === "string" ? s.body : JSON.stringify(s, null, 2),
      }));
    }

    // Cover letter / email: { subject?, body }
    if (typeof obj.body === "string") {
      const out: { heading?: string; body: string }[] = [];
      if (typeof obj.subject === "string" && obj.subject.trim()) {
        out.push({ heading: "Aihe", body: obj.subject });
      }
      out.push({ body: obj.body });
      return out;
    }

    if (typeof obj.text === "string") return [{ body: obj.text }];
  }

  return [{ body: JSON.stringify(c, null, 2) }];
}

export function downloadDocumentPdf(doc: DocumentRecord) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 56;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const writeLine = (
    text: string,
    opts: { size?: number; bold?: boolean; gap?: number } = {},
  ) => {
    const size = opts.size ?? 11;
    pdf.setFont("helvetica", opts.bold ? "bold" : "normal");
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(text, maxWidth) as string[];
    const lineHeight = size * 1.35;
    for (const line of lines) {
      if (y + lineHeight > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += lineHeight;
    }
    y += opts.gap ?? 0;
  };

  const typeLabel =
    DOC_TYPE_LABELS[doc.type as DocType] ?? doc.type;

  writeLine(typeLabel, { size: 22, bold: true, gap: 6 });
  writeLine(
    `Luotu ${new Date(doc.created_at).toLocaleDateString("fi-FI")}`,
    { size: 10, gap: 16 },
  );

  for (const section of documentToSections(doc)) {
    if (section.heading) writeLine(section.heading, { size: 14, bold: true, gap: 4 });
    writeLine(section.body, { gap: 12 });
  }

  const safeName = typeLabel.toLowerCase().replace(/\s+/g, "-");
  pdf.save(`${safeName}-${doc.id.slice(0, 8)}.pdf`);
}
