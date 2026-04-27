/**
 * Экспорт приговора в PDF через pdfmake.
 *
 * Структура документа:
 *   1. Шапка (suд, дата, ФИО).
 *   2. Установочная часть (эпизоды).
 *   3. Резолютивная часть (наказания, режим, зачёт).
 *   4. Информация об УДО / замене.
 *   5. Приложение «Путь машины» — полный лог расчёта со ссылками на нормы.
 *
 * Шрифт — стандартный Roboto из vfs_fonts. Кириллица поддерживается «из
 * коробки», т. к. vfs_fonts включает соответствующие глифы.
 */

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';

import type { VerdictDoc } from './buildVerdict';

// pdfmake требует подмонтировать vfs (виртуальная файловая система шрифтов).
// ESM-вариант поставляется по-разному в разных версиях; делаем безопасное
// присваивание.
type PdfMakeWithVfs = typeof pdfMake & { vfs?: Record<string, string> };
const pm = pdfMake as PdfMakeWithVfs;
const fontsModule = pdfFonts as unknown as {
  pdfMake?: { vfs: Record<string, string> };
  vfs?: Record<string, string>;
};
pm.vfs = fontsModule.pdfMake?.vfs ?? fontsModule.vfs ?? {};

// ────────────────────────────────────────────────────────────────────────────

function buildDefinition(doc: VerdictDoc): TDocumentDefinitions {
  return {
    pageSize: 'A4',
    pageMargins: [60, 50, 50, 60],
    defaultStyle: { fontSize: 11, lineHeight: 1.35 },

    content: [
      ...sectionTitle(doc.heading[0] ?? 'ПРИГОВОР'),
      ...doc.heading.slice(1).map((line: string) => paragraph(line, { alignment: 'center' })),

      header('Установочная часть'),
      ...doc.findings.map((f) => paragraph(f)),

      header('Резолютивная часть'),
      ...doc.resolution.map((r) => paragraph(r)),

      header('Информация об освобождении'),
      ...doc.releaseInfo.map((s) => paragraph(s)),

      header('Приложение. Путь машины (Iustus Engine)'),
      paragraph(
        'Полный аудит-лог применённых правил с указанием норм УК и источника толкования (ППВС). ' +
          'Воспроизводимость: при тех же входных данных движок даст идентичный результат.',
        { italics: true, fontSize: 9 },
      ),
      enginePathTable(doc.enginePath),
    ],

    styles: {
      title: { fontSize: 16, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
      h2: { fontSize: 13, bold: true, margin: [0, 14, 0, 6] },
    },
  };
}

export function exportVerdictPdf(doc: VerdictDoc, fileName = 'verdict.pdf'): void {
  pdfMake.createPdf(buildDefinition(doc)).download(fileName);
}

/**
 * Возвращает blob: URL с PDF — для случаев, когда нативный download
 * недоступен (Telegram WebApp на iOS, встроенные WebView и т. п.).
 *
 * URL живёт до закрытия страницы (`URL.createObjectURL` авто-освобождается
 * браузером при unload).
 */
export function getVerdictPdfBlobUrl(doc: VerdictDoc): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      pdfMake.createPdf(buildDefinition(doc)).getBlob((blob: Blob) => {
        resolve(URL.createObjectURL(blob));
      });
    } catch (err) {
      reject(err);
    }
  });
}

/** Возвращает blob с PDF (без URL — пригодится для Web Share API). */
export function getVerdictPdfBlob(doc: VerdictDoc): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      pdfMake.createPdf(buildDefinition(doc)).getBlob((blob: Blob) => {
        resolve(blob);
      });
    } catch (err) {
      reject(err);
    }
  });
}

/** Возвращает PDF как base64 data:URL (для случаев, когда blob не работает). */
export function getVerdictPdfDataUrl(doc: VerdictDoc): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      pdfMake.createPdf(buildDefinition(doc)).getBase64((data: string) => {
        resolve(`data:application/pdf;base64,${data}`);
      });
    } catch (err) {
      reject(err);
    }
  });
}

// ────────────────────────────────────────────────────────────────────────────

function sectionTitle(text: string): Content[] {
  return [{ text, style: 'title' }];
}

function header(text: string): Content {
  return { text, style: 'h2' };
}

function paragraph(
  text: string,
  extra: Record<string, unknown> = {},
): Content {
  return {
    text,
    margin: [0, 0, 0, 6],
    alignment: 'justify',
    ...extra,
  } as Content;
}

function enginePathTable(
  path: { ruleId: string; norm: string; description: string; source?: string }[],
): Content {
  if (path.length === 0) {
    return paragraph('Никаких коэффициентов не применялось — санкция взята как есть.', {
      italics: true,
    });
  }
  return {
    table: {
      headerRows: 1,
      widths: [60, 95, '*'],
      body: [
        [
          { text: 'ID', bold: true },
          { text: 'Норма', bold: true },
          { text: 'Описание', bold: true },
        ],
        ...path.map((p) => [
          { text: p.ruleId, fontSize: 9, bold: true },
          { text: p.norm, fontSize: 9 },
          {
            text: p.description + (p.source ? `\n  ↳ ${p.source}` : ''),
            fontSize: 9,
          },
        ]),
      ],
    },
    layout: 'lightHorizontalLines',
  };
}
