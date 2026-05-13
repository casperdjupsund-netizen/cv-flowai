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

  // "Modern Professional" palette
  const accent: [number, number, number] = [37, 99, 235]; // blue-600
  const ink: [number, number, number] = [17, 24, 39]; // gray-900
  const muted: [number, number, number] = [107, 114, 128]; // gray-500
  const rule: [number, number, number] = [229, 231, 235]; // gray-200

  let y = 0;
  let pageNum = 1;

  const setFill = (rgb: [number, number, number]) =>
    pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
  const setText = (rgb: [number, number, number]) =>
    pdf.setTextColor(rgb[0], rgb[1], rgb[2]);
  const setDraw = (rgb: [number, number, number]) =>
    pdf.setDrawColor(rgb[0], rgb[1], rgb[2]);

  const typeLabel = DOC_TYPE_LABELS[doc.type as DocType] ?? doc.type;
  const dateLabel = new Date(doc.created_at).toLocaleDateString("fi-FI", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const drawHeader = () => {
    // accent bar
    setFill(accent);
    pdf.rect(0, 0, pageWidth, 6, "F");

    // title
    setText(ink);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.text(typeLabel, margin, 64);

    // meta
    setText(muted);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(dateLabel.toUpperCase(), margin, 84);

    // divider
    setDraw(rule);
    pdf.setLineWidth(0.5);
    pdf.line(margin, 100, pageWidth - margin, 100);

    y = 130;
  };

  const drawFooter = () => {
    setText(muted);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(
      `${typeLabel}  ·  ${dateLabel}`,
      margin,
      pageHeight - 24,
    );
    pdf.text(
      `Sivu ${pageNum}`,
      pageWidth - margin,
      pageHeight - 24,
      { align: "right" },
    );
  };

  const newPage = () => {
    drawFooter();
    pdf.addPage();
    pageNum += 1;
    drawHeader();
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 56) newPage();
  };

  const writeText = (
    text: string,
    opts: {
      size?: number;
      bold?: boolean;
      color?: [number, number, number];
      gap?: number;
      lineHeight?: number;
    } = {},
  ) => {
    const size = opts.size ?? 10.5;
    const lh = (opts.lineHeight ?? 1.5) * size;
    setText(opts.color ?? ink);
    pdf.setFont("helvetica", opts.bold ? "bold" : "normal");
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(text, maxWidth) as string[];
    for (const line of lines) {
      ensureSpace(lh);
      pdf.text(line, margin, y);
      y += lh;
    }
    y += opts.gap ?? 0;
  };

  const writeHeading = (heading: string) => {
    ensureSpace(40);
    // small accent square
    setFill(accent);
    pdf.rect(margin, y - 9, 3, 12, "F");
    setText(ink);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text(heading.toUpperCase(), margin + 12, y);
    y += 8;
    // thin underline
    setDraw(rule);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 14;
  };

  drawHeader();

  const sections = documentToSections(doc);
  sections.forEach((section, i) => {
    if (section.heading) writeHeading(section.heading);
    writeText(section.body, { gap: i < sections.length - 1 ? 18 : 0 });
  });

  drawFooter();

  const safeName = typeLabel.toLowerCase().replace(/\s+/g, "-");
  pdf.save(`${safeName}-${doc.id.slice(0, 8)}.pdf`);
}

