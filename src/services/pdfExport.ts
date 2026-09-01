import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Vehicle, Checklist } from '../types';
import { getActiveAlerts } from './notifications';
import { SUBSCRIPTION_DEFS, isSubscriptionFilled } from '../constants/subscriptions';
import { formatDate, getDaysUntil } from '../utils/dateUtils';

export interface ReportData {
  vehicles:   Vehicle[];
  checklists: Checklist[];
}

// ── Brand palette (kept inline so the report is independent of global.css) ──
const PURPLE = '#6D28D9';
const PURPLE_DARK = '#4C1D95';
const PURPLE_LIGHT = '#EDE9FE';
const INK = '#1F2937';
const MUTED = '#6B7280';

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

export function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string),
  );
}

/** Fetch a same-origin asset and inline it as a data URL (so html2canvas captures it). */
export async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise(resolve => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function waitForImages(el: HTMLElement): Promise<unknown> {
  const imgs = Array.from(el.querySelectorAll('img'));
  return Promise.all(
    imgs.map(img =>
      img.complete
        ? Promise.resolve()
        : new Promise(res => {
            img.onload = () => res(undefined);
            img.onerror = () => res(undefined);
          }),
    ),
  );
}

/** A coloured status pill for an expiry date, or '' when no date. */
export function dateStatus(dateStr?: string): string {
  const days = getDaysUntil(dateStr);
  if (days === null) return '';
  let color = '#16A34A';
  let text = 'בתוקף';
  if (days < 0)      { color = '#DC2626'; text = `פג תוקף לפני ${Math.abs(days)} ימים`; }
  else if (days === 0) { color = '#DC2626'; text = 'פג תוקף היום'; }
  else if (days <= 7)  { color = '#F97316'; text = `עוד ${days} ימים`; }
  else if (days <= 30) { color = '#CA8A04'; text = `עוד ${days} ימים`; }
  return `<span style="display:inline-block;margin-inline-start:8px;padding:1px 9px;border-radius:100px;background:${color}1A;color:${color};font-size:11px;font-weight:700;">${text}</span>`;
}

/** One labelled detail row; returns '' when the value is empty. */
export function row(label: string, value?: string, extra = ''): string {
  if (!value && !extra) return '';
  return `<div style="display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid #F3F4F6;font-size:13px;">
    <span style="color:${MUTED};">${esc(label)}</span>
    <span style="color:${INK};font-weight:600;text-align:left;">${esc(value ?? '')}${extra}</span>
  </div>`;
}

export function sectionTitle(text: string): string {
  return `<div style="font-size:15px;font-weight:800;color:${PURPLE_DARK};margin:22px 0 10px;padding-bottom:6px;border-bottom:2px solid ${PURPLE_LIGHT};">${esc(text)}</div>`;
}

// Shared brand tokens, exported so sibling report builders (e.g. the accident
// report) stay visually identical without redefining the palette.
export const PDF_COLORS = { PURPLE, PURPLE_DARK, PURPLE_LIGHT, INK, MUTED };

// ──────────────────────────────────────────────────────────────────────────
// Per-vehicle block
// ──────────────────────────────────────────────────────────────────────────

function subscriptionsHtml(v: Vehicle): string {
  const filled = (v.subscriptions ?? []).filter(isSubscriptionFilled);
  if (filled.length === 0) return '';
  const items = filled
    .map(s => {
      const def = SUBSCRIPTION_DEFS.find(d => d.key === s.key);
      if (!def) return '';
      const note = s.notes?.trim() ? ` <span style="color:${MUTED};">— ${esc(s.notes)}</span>` : '';
      const mark = s.active ? '✓' : '•';
      return `<li style="margin:3px 0;font-size:13px;color:${INK};"><span style="color:${PURPLE};font-weight:800;">${mark}</span> ${esc(def.label)}${note}</li>`;
    })
    .join('');
  return `<div style="margin-top:8px;"><div style="font-size:12px;font-weight:700;color:${PURPLE};margin-bottom:2px;">🎫 מנויים ושירותים</div><ul style="list-style:none;padding:0;margin:0;">${items}</ul></div>`;
}

function notesHtml(v: Vehicle): string {
  if (!v.notes?.length) return '';
  const items = v.notes
    .map(n => {
      const tag = n.type === 'treatment' ? '🔧 טיפול' : '📝 הערה';
      const title = n.title?.trim() ? `<div style="font-weight:700;color:${INK};font-size:13px;">${esc(n.title)}</div>` : '';
      const desc = n.description?.trim() ? `<div style="color:${MUTED};font-size:12.5px;line-height:1.5;">${esc(n.description)}</div>` : '';
      return `<div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:8px;padding:8px 10px;margin:5px 0;">
        <div style="font-size:11px;color:${MUTED};margin-bottom:2px;">${esc(formatDate(n.date))} · ${tag}</div>
        ${title}${desc}
      </div>`;
    })
    .join('');
  return `<div style="margin-top:8px;"><div style="font-size:12px;font-weight:700;color:${PURPLE};margin-bottom:2px;">📝 טיפולים ורשומות</div>${items}</div>`;
}

function documentsHtml(v: Vehicle): string {
  if (!v.documents?.length) return '';
  const items = v.documents
    .map(d => {
      const label = d.docType === 'license' ? 'רישיון רכב' : 'מסמך ביטוח';
      let extra: string;
      if (!d.fileData) {
        extra = ` <span style="color:${MUTED};">(ללא תצוגה מקדימה)</span>`;
      } else if (d.mimeType.startsWith('image/')) {
        extra = `<div><img src="${d.fileData}" style="max-width:160px;max-height:120px;border-radius:8px;border:1px solid #E5E7EB;margin-top:4px;" /></div>`;
      } else {
        // PDFs can't be rasterised by html2canvas — list the name + a note.
        extra = ` <span style="color:${MUTED};">(PDF — לצפייה במסמך המלא יש לפתוח באפליקציה)</span>`;
      }
      return `<li style="margin:3px 0;font-size:12.5px;color:${INK};">📎 ${esc(label)}: <span style="color:${MUTED};">${esc(d.fileName)}</span>${extra}</li>`;
    })
    .join('');
  return `<div style="margin-top:8px;"><div style="font-size:12px;font-weight:700;color:${PURPLE};margin-bottom:2px;">📄 מסמכים</div><ul style="list-style:none;padding:0;margin:0;">${items}</ul></div>`;
}

function vehicleCard(v: Vehicle, archived: boolean): string {
  const photo = v.photo
    ? `<img src="${v.photo}" style="width:84px;height:84px;border-radius:12px;object-fit:cover;border:2px solid ${PURPLE_LIGHT};flex-shrink:0;" />`
    : `<div style="width:84px;height:84px;border-radius:12px;background:${PURPLE_LIGHT};display:flex;align-items:center;justify-content:center;font-size:38px;flex-shrink:0;">🚗</div>`;

  const archBadge = archived
    ? `<span style="background:${PURPLE_LIGHT};color:${PURPLE};border-radius:100px;padding:2px 10px;font-size:11px;font-weight:700;">🗄️ בארכיון${v.archivedAt ? ` · ${esc(formatDate(v.archivedAt.slice(0, 10)))}` : ''}</span>`
    : '';

  const details =
    row('סוג הרכב', v.vehicleType) +
    row('מספר לוחית רישוי', v.licensePlate) +
    (v.licenseExpiryDate ? row('רישיון רכב', formatDate(v.licenseExpiryDate), archived ? '' : dateStatus(v.licenseExpiryDate)) : '') +
    (v.insuranceExpiryDate ? row('ביטוח', formatDate(v.insuranceExpiryDate), archived ? '' : dateStatus(v.insuranceExpiryDate)) : '');

  return `<div style="background:#fff;border:1px solid #E5E7EB;border-inline-start:4px solid ${PURPLE};border-radius:14px;padding:14px 16px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,0.05);break-inside:avoid;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
      ${photo}
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="font-size:17px;font-weight:800;color:${INK};">${esc(v.driverName)}</span>
          ${archBadge}
        </div>
      </div>
    </div>
    ${details}
    ${subscriptionsHtml(v)}
    ${notesHtml(v)}
    ${documentsHtml(v)}
  </div>`;
}

// ──────────────────────────────────────────────────────────────────────────
// Other sections
// ──────────────────────────────────────────────────────────────────────────

function alertsHtml(vehicles: Vehicle[]): string {
  const alerts = getActiveAlerts(vehicles);
  if (alerts.length === 0) return '';
  const byId = new Map(vehicles.map(v => [v.id, v]));
  const rows = [...alerts]
    .sort((a, b) => a.days - b.days)
    .map(a => {
      const v = byId.get(a.vehicleId);
      const who = v ? esc(v.driverName) : '';
      const what = a.docType === 'license' ? 'רישיון רכב' : 'ביטוח';
      const when =
        a.days < 0 ? `פג תוקף לפני ${Math.abs(a.days)} ימים` :
        a.days === 0 ? 'פג תוקף היום' :
        a.days === 1 ? 'פג תוקף מחר' : `עוד ${a.days} ימים`;
      return `<li style="margin:4px 0;font-size:13px;color:${INK};">🔔 <strong>${who}</strong> — ${what}: <span style="color:#DC2626;font-weight:700;">${when}</span> (${esc(formatDate(a.expiryDate))})</li>`;
    })
    .join('');
  return sectionTitle('🔔 התראות פעילות') +
    `<div style="background:#fff;border:1px solid #E5E7EB;border-radius:14px;padding:12px 16px;"><ul style="list-style:none;padding:0;margin:0;">${rows}</ul></div>`;
}

function checklistsHtml(checklists: Checklist[]): string {
  if (checklists.length === 0) return '';
  const cards = checklists
    .map(c => {
      const total = c.items.length;
      const done = c.items.filter(it => it.completed).length;
      const desc = c.description?.trim()
        ? `<div style="font-size:12.5px;color:${MUTED};margin-bottom:6px;">${esc(c.description)}</div>` : '';
      const items = c.items
        .map(it => {
          const note = it.notes?.trim() ? ` <span style="color:${MUTED};">— ${esc(it.notes)}</span>` : '';
          const mark = it.completed ? '☑' : '☐';
          const strike = it.completed ? 'text-decoration:line-through;color:#9CA3AF;' : '';
          return `<li style="margin:3px 0;font-size:13px;color:${INK};"><span style="color:${PURPLE};font-weight:800;">${mark}</span> <span style="${strike}">${esc(it.title)}</span>${note}</li>`;
        })
        .join('');
      return `<div style="background:#fff;border:1px solid #E5E7EB;border-inline-start:4px solid ${PURPLE};border-radius:14px;padding:14px 16px;margin-bottom:12px;break-inside:avoid;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="font-size:15px;font-weight:800;color:${INK};">${esc(c.name)}</span>
          <span style="font-size:12px;font-weight:700;color:${PURPLE};">${done}/${total} הושלמו</span>
        </div>
        ${desc}
        <ul style="list-style:none;padding:0;margin:0;">${items}</ul>
      </div>`;
    })
    .join('');
  return sectionTitle("📋 צ'ק ליסטים") + cards;
}

function summaryHtml(active: number, archived: number, treatments: number, alerts: number, checklists: number): string {
  const stat = (n: number, label: string) =>
    `<div style="flex:1;text-align:center;padding:10px 6px;background:#fff;border-radius:12px;border:1px solid #E5E7EB;">
      <div style="font-size:22px;font-weight:800;color:${PURPLE};">${n}</div>
      <div style="font-size:11px;color:${MUTED};margin-top:2px;">${esc(label)}</div>
    </div>`;
  return `<div style="display:flex;gap:8px;margin-bottom:8px;">
    ${stat(active, 'רכבים פעילים')}${stat(alerts, 'התראות')}${stat(treatments, 'טיפולים')}${stat(checklists, "צ'ק ליסטים")}${stat(archived, 'בארכיון')}
  </div>`;
}

// ──────────────────────────────────────────────────────────────────────────
// Report assembly + PDF generation
// ──────────────────────────────────────────────────────────────────────────

async function buildReportElement(data: ReportData): Promise<HTMLElement> {
  const logo = await toDataUrl('/app-logo.png');
  const active = data.vehicles.filter(v => !v.archived);
  const archived = data.vehicles.filter(v => v.archived);
  const treatmentCount = active.reduce(
    (n, v) => n + (v.notes?.filter(note => note.type === 'treatment').length ?? 0), 0,
  );
  const today = formatDate(new Date().toISOString().slice(0, 10));

  const activeSection = active.length
    ? sectionTitle('🚗 רכבים פעילים') + active.map(v => vehicleCard(v, false)).join('')
    : '';
  const archivedSection = archived.length
    ? sectionTitle('🗄️ רכבים בארכיון') + archived.map(v => vehicleCard(v, true)).join('')
    : '';

  const html = `
    <div style="background:linear-gradient(135deg,${PURPLE_DARK},${PURPLE});border-radius:16px;padding:22px;text-align:center;margin-bottom:16px;">
      ${logo ? `<img src="${logo}" style="height:64px;width:auto;margin:0 auto 8px;display:block;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.35));" />` : ''}
      <div style="font-size:26px;font-weight:800;color:#fff;">קצין רכב</div>
      <div style="font-size:13px;color:#E9D5FF;margin-top:2px;">גיבוי וסיכום נתונים · ${esc(today)}</div>
    </div>
    ${summaryHtml(active.length, archived.length, treatmentCount, getActiveAlerts(data.vehicles).length, data.checklists.length)}
    ${alertsHtml(data.vehicles)}
    ${activeSection}
    ${archivedSection}
    ${checklistsHtml(data.checklists)}
    <div style="text-align:center;color:#9CA3AF;font-size:11px;margin-top:20px;padding-top:12px;border-top:1px solid #E5E7EB;">
      הופק מאפליקציית "קצין רכב" · ${esc(today)}
    </div>
  `;

  const el = document.createElement('div');
  el.setAttribute('dir', 'rtl');
  el.style.cssText =
    'position:fixed;top:0;left:-10000px;width:794px;padding:24px;box-sizing:border-box;' +
    "background:#F3F4F6;font-family:'Segoe UI',Arial,sans-serif;color:#1F2937;line-height:1.4;";
  el.innerHTML = html;
  document.body.appendChild(el);
  await waitForImages(el);
  return el;
}

/**
 * Rasterize an (already-mounted, off-screen) report element and paginate it
 * into a multi-page A4 PDF. Shared by every report builder in the app —
 * removes the element from the DOM when done, success or failure.
 */
export async function canvasToMultiPagePdf(el: HTMLElement, backgroundColor = '#F3F4F6'): Promise<Blob> {
  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor,
      logging: false,
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const pageH = 297;
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    const imgData = canvas.toDataURL('image/jpeg', 0.9);

    let heightLeft = imgH;
    let position = 0;
    pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
    heightLeft -= pageH;
    while (heightLeft > 0) {
      position -= pageH;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
      heightLeft -= pageH;
    }
    return pdf.output('blob');
  } finally {
    document.body.removeChild(el);
  }
}

/** Render the report to a multi-page A4 PDF and return it as a Blob. */
export async function generatePdfBlob(data: ReportData): Promise<Blob> {
  const el = await buildReportElement(data);
  return canvasToMultiPagePdf(el, '#F3F4F6');
}

/** Suggested ASCII filename (Hebrew filenames break some download flows). */
export function reportFileName(): string {
  return `kzin-rechev-backup-${new Date().toISOString().slice(0, 10)}.pdf`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export type EmailResult = 'shared' | 'cancelled' | 'download-mailto';

/**
 * Send the PDF by email. On capable devices (mostly mobile) uses the Web Share
 * API to attach the file directly to an email/WhatsApp. Otherwise downloads the
 * PDF and opens the default mail client with a pre-filled message.
 */
export async function emailPdf(
  blob: Blob,
  filename: string,
  opts?: { title?: string; text?: string; mailtoNote?: string },
): Promise<EmailResult> {
  const title = opts?.title ?? 'קצין רכב — גיבוי נתונים';
  const text = opts?.text ?? 'מצורף קובץ גיבוי הנתונים מאפליקציית קצין רכב.';
  const mailtoNote = opts?.mailtoNote ?? 'מצורף קובץ הגיבוי מאפליקציית קצין רכב.';

  const file = new File([blob], filename, { type: 'application/pdf' });
  const nav = navigator as Navigator & {
    canShare?: (d: { files: File[] }) => boolean;
    share?: (d: { files: File[]; title?: string; text?: string }) => Promise<void>;
  };

  if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title, text });
      return 'shared';
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return 'cancelled';
      // fall through to download + mailto
    }
  }

  downloadBlob(blob, filename);
  const subject = encodeURIComponent(title);
  const body = encodeURIComponent(
    `${mailtoNote}\n\n` + 'הקובץ הורד למכשיר — יש לצרף אותו ידנית להודעה זו לפני השליחה.',
  );
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
  return 'download-mailto';
}
