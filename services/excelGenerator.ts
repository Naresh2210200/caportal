import { excelTemplate } from './excelTemplate';
import { GSTR1SheetMappings } from '../types';

declare const XLSX: any;
declare const saveAs: any;

export class ExcelGenerator {
    async loadTemplate(): Promise<any> {
        const templateBinary = Uint8Array.from(atob(excelTemplate.trim()), c => c.charCodeAt(0));
        return XLSX.read(templateBinary, { type: 'array', cellStyles: true });
    }

    updateExemptSheet(sheet: any, data: any[], columnMapping: any, sheetName?: string) {
        if (data.length === 0) return;
        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
        const templateHeaders: string[] = [];

        for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
            const cell = sheet[cellAddr];
            templateHeaders.push(cell && cell.v ? cell.v.toString().trim() : '');
        }

        data.forEach((csvRow) => {
            const csvDesc = (csvRow['Description'] || '').toString().trim();
            for (let row = 1; row <= range.e.r; row++) {
                const descCell = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
                const templateDesc = descCell && descCell.v ? descCell.v.toString().trim() : '';

                if (templateDesc === csvDesc) {
                    templateHeaders.forEach((templateHeader, colIndex) => {
                        if (!templateHeader || colIndex === 0) return;

                        let csvValue: any = '';
                        if (csvRow[templateHeader] !== undefined) {
                            csvValue = csvRow[templateHeader];
                        } else {
                            for (const [csvCol, excelCol] of Object.entries(columnMapping)) {
                                const excelCols = Array.isArray(excelCol) ? excelCol : [excelCol];
                                if ((excelCols as string[]).includes(templateHeader) && csvRow[csvCol] !== undefined) {
                                    csvValue = csvRow[csvCol];
                                    break;
                                }
                            }
                        }

                        const cellAddr = XLSX.utils.encode_cell({ r: row, c: colIndex });
                        if (!csvValue && csvValue !== 0) {
                            sheet[cellAddr] = { t: 'n', v: 0 };
                            return;
                        }

                        const numValue = parseFloat(csvValue.toString().replace(/,/g, ''));
                        if (!isNaN(numValue)) {
                            sheet[cellAddr] = { t: 'n', v: numValue };
                        } else {
                            sheet[cellAddr] = { t: 's', v: csvValue.toString().trim() };
                        }
                    });
                    break;
                }
            }
        });
    }

    appendDataToSheet(sheet: any, data: any[], columnMapping: any, sheetName?: string) {
        if (data.length === 0) return;

        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
        const templateHeaders: string[] = [];

        for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
            const cell = sheet[cellAddr];
            templateHeaders.push(cell && cell.v ? cell.v.toString().trim() : '');
        }

        let startRow = 1;
        let lastRowWithData = 0;

        for (let row = 1; row <= range.e.r; row++) {
            let hasData = false;
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
                const cell = sheet[cellAddr];
                if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
                    hasData = true;
                    break;
                }
            }
            if (hasData) lastRowWithData = row;
        }

        if (lastRowWithData > 0) startRow = lastRowWithData + 1;

        data.forEach((csvRow, rowIndex) => {
            const excelRowNum = startRow + rowIndex;

            templateHeaders.forEach((templateHeader, colIndex) => {
                if (!templateHeader) return;

                let csvValue: any = '';
                if (csvRow[templateHeader] !== undefined) {
                    csvValue = csvRow[templateHeader];
                } else {
                    for (const [csvCol, excelCol] of Object.entries(columnMapping)) {
                        const excelCols = Array.isArray(excelCol) ? excelCol : [excelCol];
                        if ((excelCols as string[]).includes(templateHeader) && csvRow[csvCol] !== undefined) {
                            csvValue = csvRow[csvCol];
                            break;
                        }
                    }
                }

                const cellAddr = XLSX.utils.encode_cell({ r: excelRowNum, c: colIndex });
                if (!csvValue && csvValue !== 0) {
                    sheet[cellAddr] = { t: 's', v: '' };
                    return;
                }

                let finalValue = csvValue;

                // Clean place of supply
                if (templateHeader.toLowerCase().includes('place of supply')) {
                    finalValue = finalValue.toString().trim().replace(/^\d+-\s*/, '').trim();
                }

                // Clean invoice type
                if (templateHeader === 'Invoice Type') {
                    finalValue = finalValue.toString().replace(' B2B', '').replace(' B2C', '').trim();
                }

                // Clean RCM
                if (templateHeader === 'RCM Applicable' || templateHeader === 'RCM') {
                    finalValue = finalValue === 'Y' ? 'Yes' : finalValue === 'N' ? 'No' : finalValue;
                }

                // Default Rate
                if (templateHeader === 'Rate' || templateHeader === 'GST%') {
                    if (!finalValue || finalValue === '') finalValue = 0;
                }

                // Format Date
                if (templateHeader.toLowerCase().includes('date')) {
                    const dateMatch = finalValue.toString().match(/(\d{1,2})-([A-Za-z]{3})-(\d{2})/);
                    if (dateMatch) {
                        const months: { [key: string]: number } = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
                        const day = parseInt(dateMatch[1]);
                        const month = months[dateMatch[2]];
                        const year = 2000 + parseInt(dateMatch[3]);
                        const dayStr = day.toString().padStart(2, '0');
                        const monthStr = (month + 1).toString().padStart(2, '0');
                        finalValue = `${dayStr}-${monthStr}-${year}`;
                    }
                }

                const numValue = parseFloat(finalValue.toString().replace(/,/g, ''));
                if (!isNaN(numValue) && finalValue.toString().match(/^-?\d+\.?\d*$/)) {
                    sheet[cellAddr] = { t: 'n', v: numValue };
                } else {
                    sheet[cellAddr] = { t: 's', v: finalValue.toString().trim() };
                }
            });
        });

        range.e.r = startRow + data.length - 1;
        sheet['!ref'] = XLSX.utils.encode_range(range);
    }

    generateExcel(workbook: any): Blob {
        const outputData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', cellStyles: true });
        return new Blob([outputData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }
}
