import { AccidentCase, InjuryAnswer } from '../types';
import { esc, row, sectionTitle, waitForImages, canvasToMultiPagePdf, toDataUrl, PDF_COLORS } from './pdfExport';
import { getMediaBlob } from './accidentMediaDb';
import { formatDate } from '../utils/dateUtils';
import { SCENE_CATEGORY_LABELS } from '../constants/accidentScene';

const { PURPLE, PURPLE_DARK, PURPLE_LIGHT, INK, MUTED } = PDF_COLORS;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}

/**
 * Pre-load every embeddable (image) blob for a case as data URLs, keyed by
 * MediaRef.id, so html2canvas can rasterize them. Non-image media (audio,
 * video, PDF documents) and any failed loads are simply absent from the map
 * — callers list those by filename only, never block report generation on
 * a missing/corrupt blob.
 */
async function loadImageDataUrls(kase: AccidentCase): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const imageRefs = [
    ...kase.sceneMedia.flatMap(sc => sc.media.filter(m => m.kind === 'photo')),
    ...kase.otherParties.flatMap(p => p.documents.filter(d => d.mimeType.startsWith('image/'))),
  ];
  await Promise.all(
    imageRefs.map(async ref => {
      try {
        const blob = await getMediaBlob(ref.id);
        if (blob) map.set(ref.id, await blobToDataUrl(blob));
      } catch {
        // no preview available — still listed by filename in its section
      }
    }),
  );
  return map;
}

function injuryLabel(a?: InjuryAnswer): string {
  if (a === 'yes') return 'כן';
  if (a === 'no') return 'לא';
  if (a === 'unsure') return 'לא בטוח';
  return '';
}

function vehicleSectionHtml(kase: AccidentCase): string {
  const v = kase.vehicleSnapshot;
  if (!v) return '';
  const photo = v.photo
    ? `<img src="${v.photo}" style="width:72px;height:72px;border-radius:12px;object-fit:cover;border:2px solid ${PURPLE_LIGHT};flex-shrink:0;" />`
    : `<div style="width:72px;height:72px;border-radius:12px;background:${PURPLE_LIGHT};display:flex;align-items:center;justify-content:center;font-size:34px;flex-shrink:0;">🚗</div>`;
  const details =
    row('נהג/ת', v.driverName) +
    row('סוג הרכב', v.vehicleType) +
    row('מספר לוחית רישוי', v.licensePlate) +
    row('רישיון רכב בתוקף עד', v.licenseExpiryDate ? formatDate(v.licenseExpiryDate) : undefined) +
    row('ביטוח בתוקף עד', v.insuranceExpiryDate ? formatDate(v.insuranceExpiryDate) : undefined);
  return (
    sectionTitle('🚗 הרכב שהיה מעורב') +
    `<div style="background:#fff;border:1px solid #E5E7EB;border-inline-start:4px solid ${PURPLE};border-radius:14px;padding:14px 16px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        ${photo}
        <div style="font-size:16px;font-weight:800;color:${INK};">${esc(v.driverName)}</div>
      </div>
      ${details}
    </div>`
  );
}

function basicsSectionHtml(kase: AccidentCase): string {
  const details =
    row('תאריך', kase.accidentDate ? formatDate(kase.accidentDate) : undefined) +
    row('שעה', kase.accidentTime) +
    row('מיקום', kase.locationText) +
    row('כיוון נסיעה', kase.directionOfTravel) +
    row('תנאי דרך/מזג אוויר', kase.roadConditions) +
    row('האם יש נפגעים או חשש לפגיעה', injuryLabel(kase.injuryAnswer));
  const desc = kase.description?.trim()
    ? `<div style="margin-top:8px;font-size:13px;color:${INK};line-height:1.6;background:#F9FAFB;border-radius:8px;padding:10px 12px;">${esc(kase.description)}</div>`
    : '';
  const notes = kase.notes?.trim()
    ? `<div style="margin-top:8px;"><div style="font-size:12px;font-weight:700;color:${PURPLE};margin-bottom:2px;">📝 הערות נוספות</div><div style="font-size:13px;color:${INK};line-height:1.6;">${esc(kase.notes)}</div></div>`
    : '';
  if (!details && !desc && !notes) return '';
  return (
    sectionTitle('📋 פרטי האירוע') +
    `<div style="background:#fff;border:1px solid #E5E7EB;border-radius:14px;padding:14px 16px;margin-bottom:12px;">${details}${desc}${notes}</div>`
  );
}

function sceneSectionHtml(kase: AccidentCase, images: Map<string, string>): string {
  const nonEmpty = kase.sceneMedia.filter(sc => sc.media.length > 0 || sc.note?.trim());
  if (nonEmpty.length === 0) return '';
  const cards = nonEmpty
    .map(sc => {
      const label = SCENE_CATEGORY_LABELS[sc.category];
      const photos = sc.media.filter(m => m.kind === 'photo' && images.has(m.id));
      const otherCount = sc.media.length - photos.length;
      const thumbs = photos
        .map(
          m =>
            `<img src="${images.get(m.id)}" style="width:96px;height:72px;object-fit:cover;border-radius:8px;border:1px solid #E5E7EB;" />`,
        )
        .join('');
      const extra =
        otherCount > 0
          ? `<div style="font-size:11.5px;color:${MUTED};margin-top:4px;">+ ${otherCount} קבצי וידאו/מדיה נוספים (רשומים בנספח הקבצים)</div>`
          : '';
      const note = sc.note?.trim()
        ? `<div style="font-size:12.5px;color:${MUTED};margin-top:4px;">${esc(sc.note)}</div>`
        : '';
      return `<div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:10px;padding:10px 12px;margin-bottom:8px;break-inside:avoid;">
        <div style="font-size:13px;font-weight:700;color:${INK};margin-bottom:6px;">${esc(label)}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">${thumbs}</div>
        ${extra}${note}
      </div>`;
    })
    .join('');
  return sectionTitle('📷 תיעוד הזירה') + cards;
}

function otherPartiesSectionHtml(kase: AccidentCase, images: Map<string, string>): string {
  const withData = kase.otherParties.filter(
    p =>
      p.driverName || p.phone || p.idNumber || p.licensePlate || p.vehicleModel ||
      p.insuranceCompany || p.policyNumber || p.notes?.trim() || p.documents.length > 0,
  );
  if (withData.length === 0) return '';
  const cards = withData
    .map((p, i) => {
      const details =
        row('שם הנהג/ת', p.driverName) +
        row('טלפון', p.phone) +
        row('תעודת זהות', p.idNumber) +
        row('לוחית רישוי', p.licensePlate) +
        row('סוג/דגם רכב', p.vehicleModel) +
        row('חברת ביטוח', p.insuranceCompany) +
        row('מספר פוליסה', p.policyNumber);
      const notes = p.notes?.trim()
        ? `<div style="font-size:12.5px;color:${MUTED};margin-top:6px;">${esc(p.notes)}</div>`
        : '';
      const imageDocs = p.documents.filter(d => images.has(d.id));
      const otherDocs = p.documents.filter(d => !images.has(d.id));
      const docThumbs = imageDocs
        .map(
          d =>
            `<img src="${images.get(d.id)}" style="width:110px;height:80px;object-fit:contain;background:#fff;border-radius:8px;border:1px solid #E5E7EB;" />`,
        )
        .join('');
      const docList = otherDocs.length
        ? `<div style="font-size:11.5px;color:${MUTED};margin-top:4px;">📎 ${otherDocs.map(d => esc(d.fileName)).join(', ')}</div>`
        : '';
      return `<div style="background:#fff;border:1px solid #E5E7EB;border-inline-start:4px solid ${PURPLE};border-radius:14px;padding:14px 16px;margin-bottom:12px;break-inside:avoid;">
        <div style="font-size:14px;font-weight:800;color:${INK};margin-bottom:6px;">רכב/נהג נוסף ${withData.length > 1 ? `#${i + 1}` : ''}</div>
        ${details}${notes}
        ${docThumbs ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">${docThumbs}</div>` : ''}
        ${docList}
      </div>`;
    })
    .join('');
  return sectionTitle('🚙 פרטי הרכב/הנהג השני') + cards;
}

function witnessesSectionHtml(kase: AccidentCase): string {
  const withData = kase.witnesses.filter(w => w.name || w.phone || w.note?.trim());
  if (withData.length === 0) return '';
  const rows = withData
    .map(w => {
      const note = w.note?.trim() ? ` <span style="color:${MUTED};">— ${esc(w.note)}</span>` : '';
      return `<li style="margin:4px 0;font-size:13px;color:${INK};">👤 <strong>${esc(w.name || 'עד/ה')}</strong>${w.phone ? ` · ${esc(w.phone)}` : ''}${note}</li>`;
    })
    .join('');
  return (
    sectionTitle('👥 עדים') +
    `<div style="background:#fff;border:1px solid #E5E7EB;border-radius:14px;padding:12px 16px;"><ul style="list-style:none;padding:0;margin:0;">${rows}</ul></div>`
  );
}

function authoritiesSectionHtml(kase: AccidentCase): string {
  const police = kase.policeInfo;
  const ambulance = kase.ambulanceInfo;
  const towing = kase.towingInfo;

  const policeHtml =
    police && (police.arrived || police.reportNumber || police.notes?.trim())
      ? row('משטרה — הגיעה לזירה', police.arrived ? 'כן' : 'לא') +
        row('מספר דו״ח/אירוע', police.reportNumber) +
        row('הערות משטרה', police.notes)
      : '';
  const ambulanceHtml =
    ambulance && (ambulance.arrived || ambulance.notes?.trim())
      ? row('אמבולנס — הגיע לזירה', ambulance.arrived ? 'כן' : 'לא') + row('הערות אמבולנס', ambulance.notes)
      : '';
  const towingHtml =
    towing && (towing.ordered || towing.company || towing.phone || towing.takenTo || towing.notes?.trim())
      ? row('גרר — הוזמן', towing.ordered ? 'כן' : 'לא') +
        row('חברת גרירה', towing.company) +
        row('טלפון גרר', towing.phone) +
        row('הרכב נלקח אל', towing.takenTo) +
        row('הערות גרר', towing.notes)
      : '';

  const body = policeHtml + ambulanceHtml + towingHtml;
  if (!body) return '';
  return (
    sectionTitle('🚓 משטרה / אמבולנס / גרר') +
    `<div style="background:#fff;border:1px solid #E5E7EB;border-radius:14px;padding:12px 16px;">${body}</div>`
  );
}

function attachmentsListHtml(kase: AccidentCase): string {
  const nonImageScene = kase.sceneMedia.flatMap(sc => sc.media.filter(m => m.kind !== 'photo'));
  const voice = kase.voiceRecordings;
  const nonImageDocs = kase.otherParties.flatMap(p => p.documents.filter(d => !d.mimeType.startsWith('image/')));
  const all = [...nonImageScene, ...voice, ...nonImageDocs];
  if (all.length === 0) return '';
  const kindLabel = { video: '🎥 וידאו', audio: '🎙️ הקלטת קול', document: '📄 מסמך', photo: '📷 תמונה' } as const;
  const rows = all
    .map(m => `<li style="margin:3px 0;font-size:12.5px;color:${INK};">${kindLabel[m.kind]}: ${esc(m.fileName || m.id)}</li>`)
    .join('');
  return (
    sectionTitle('📎 קבצים מצורפים נוספים (שמורים באפליקציה, לא מוטמעים ב-PDF)') +
    `<div style="background:#fff;border:1px solid #E5E7EB;border-radius:14px;padding:12px 16px;"><ul style="list-style:none;padding:0;margin:0;">${rows}</ul></div>`
  );
}

async function buildAccidentReportElement(kase: AccidentCase): Promise<HTMLElement> {
  const logo = await toDataUrl('/app-logo.png');
  const images = await loadImageDataUrls(kase);
  const today = formatDate(new Date().toISOString().slice(0, 10));
  const dateLabel = kase.accidentDate ? formatDate(kase.accidentDate) : today;

  const html = `
    <div style="background:linear-gradient(135deg,${PURPLE_DARK},${PURPLE});border-radius:16px;padding:22px;text-align:center;margin-bottom:16px;">
      ${logo ? `<img src="${logo}" style="height:64px;width:auto;margin:0 auto 8px;display:block;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.35));" />` : ''}
      <div style="font-size:24px;font-weight:800;color:#fff;">דוח תאונה</div>
      <div style="font-size:13px;color:#E9D5FF;margin-top:2px;">קצין רכב · ${esc(dateLabel)}${kase.accidentTime ? ` · ${esc(kase.accidentTime)}` : ''}</div>
    </div>
    ${basicsSectionHtml(kase)}
    ${vehicleSectionHtml(kase)}
    ${sceneSectionHtml(kase, images)}
    ${otherPartiesSectionHtml(kase, images)}
    ${witnessesSectionHtml(kase)}
    ${authoritiesSectionHtml(kase)}
    ${attachmentsListHtml(kase)}
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

/** Render one accident case to a multi-page A4 PDF and return it as a Blob. */
export async function generateAccidentPdfBlob(kase: AccidentCase): Promise<Blob> {
  const el = await buildAccidentReportElement(kase);
  return canvasToMultiPagePdf(el, '#F3F4F6');
}

/** Suggested ASCII filename (Hebrew filenames break some download flows). */
export function accidentReportFileName(kase: AccidentCase): string {
  const d = kase.accidentDate ?? new Date().toISOString().slice(0, 10);
  return `accident-report-${d}-${kase.id.slice(0, 8)}.pdf`;
}
