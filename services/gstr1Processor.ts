
import { parseCSV, trimAllFields, readFileAsText } from './csvParser';
import { ExcelGenerator } from './excelGenerator';
import { GSTR1Format, GSTR1SheetMappings, ProcessingProgress } from '../types';

export class GSTR1Processor {
    private excelGenerator: ExcelGenerator;

    constructor() {
        this.excelGenerator = new ExcelGenerator();
    }

    // Standard format mappings
    private standardMappings: GSTR1SheetMappings = {
        'b2b': {
            'GSTIN/UIN of Recipient': 'GSTIN/UIN',
            'Invoice Number': 'Invoice No',
            'Invoice date': 'Date of Invoice',
            'Invoice Value': 'Invoice Value',
            'Rate': 'GST%',
            'Taxable Value': 'Taxable Value',
            'Cess Amount': 'CESS',
            'Place Of Supply': 'Place Of Supply',
            'Reverse Charge': 'RCM Applicable',
            'Invoice Type': 'Invoice Type',
            'E-Commerce GSTIN': 'E-Commerce GSTIN'
        },
        'b2cl': {
            'Invoice Number': 'Invoice No',
            'Invoice date': 'Date of Invoice',
            'Invoice Value': 'Invoice Value',
            'Place Of Supply': 'Place Of Supply',
            'Rate': 'GST%',
            'Taxable Value': 'Taxable Value',
            'Cess Amount': 'CESS',
            'E-Commerce GSTIN': 'E-Commerce GSTIN'
        },
        'b2cs': {
            'Type': 'Type',
            'Place Of Supply': 'Place Of Supply',
            'Rate': 'GST%',
            'Taxable Value': 'Taxable Value',
            'Cess Amount': 'CESS',
            'E-Commerce GSTIN': 'E-Commerce GSTIN'
        },
        'export': {
            'Export Type': 'Export Type',
            'Invoice Number': 'Invoice No',
            'Invoice date': 'Date of Invoice',
            'Invoice Value': 'Invoice Value',
            'Port Code': 'Port Code',
            'Shipping Bill Number': 'Shipping Bill No',
            'Shipping Bill Date': 'Shipping Bill Date',
            'Rate': 'GST%',
            'Taxable Value': 'Taxable Value'
        },
        'Nil_exempt_NonGST': {
            'Description': 'Description',
            'Nil Rated Supplies': 'Nil Rated Supplies',
            'Exempted (other than nil rated/non GST supply)': 'Exempted(other than nil rated/non GST supply)',
            'Non-GST supplies': 'Non-GST Supplies'
        },
        'cdnr': {
            'GSTIN/UIN of Recipient': 'GSTIN/UIN',
            'Note Number': 'Dr./ Cr. No.',
            'Note Date': 'Dr./Cr. Date',
            'Note Type': 'Type of note                (Dr/ Cr)',
            'Place Of Supply': 'Place of supply',
            'Reverse Charge': 'RCM',
            'Note Supply Type': 'Invoice Type',
            'Note Value': 'Dr./Cr. Value',
            'Rate': 'GST%',
            'Taxable Value': 'Taxable Value',
            'Cess Amount': 'CESS'
        },
        'cdnur': {
            'UR Type': 'Supply Type',
            'Note/Refund Voucher Number': 'Dr./ Cr. Note No.',
            'Note/Refund Voucher date': 'Dr./ Cr. Note Date',
            'Document Type': 'Type of note (Dr./ Cr.)',
            'Place Of Supply': 'Place of supply',
            'Note/Refund Voucher Value': 'Dr./Cr. Note Value',
            'Rate': 'GST%',
            'Taxable Value': 'Taxable Value',
            'Cess Amount': 'CESS'
        },
        'adv_tax': {
            'Place Of Supply': 'Place Of Supply',
            'Rate': 'GST%',
            'Gross Advance Received': 'Gross Advance Received',
            'Cess Amount': 'CESS'
        },
        'adv_tax_adjusted': {
            'Place Of Supply': 'Place Of Supply',
            'Rate': 'GST%',
            'Gross Advance Adjusted': 'Gross Advance Adjusted',
            'Cess Amount': 'CESS'
        },
        'Docs_issued': {
            'Nature of Document': ['Nature of Document', 'Type of Document'],
            'Sr.No.From': ['Sr.No.From', 'Series From'],
            'Sr.No.To': ['Sr.No.To', 'Series To'],
            'Total Number': ['Total Number'],
            'Cancelled': ['Cancelled'],
            'Net Issued': ['Net Issued']
        },
        'hsn': {
            'Type': 'Type',
            'HSN': 'HSN',
            'Description': 'Description',
            'UQC': 'UQC',
            'Total Quantity': 'Total Quantity',
            'Total Value': 'Total Value',
            'Rate': 'Rate',
            'Taxable Value': 'Total Taxable Value',
            'Integrated Tax Amount': 'IGST',
            'Central Tax Amount': 'CGST',
            'State/UT Tax Amount': 'SGST',
            'Cess Amount': 'CESS'
        }
    };

    // Tally format mappings (same structure as standard for now, but easily extensible)
    private tallyMappings: GSTR1SheetMappings = {
        ...this.standardMappings,
        'Docs_issued': {
            'Nature of Document': ['Nature of Document', 'Type of Document'],
            'Sr.No.From': ['Sr.No.From', 'Sr. No. From', 'Series From'],
            'Sr.No.To': ['Sr.No.To', 'Sr. No. To', 'Series To'],
            'Total Number': ['Total Number'],
            'Cancelled': ['Cancelled'],
            'Net Issued': ['Net Issued']
        }
    };

    getSheetNameFromFile(fileName: string): string | null {
        const upper = fileName.toUpperCase();
        if (upper.includes('HSN')) return 'hsn';
        if (upper.includes('B2B')) return 'b2b';
        if (upper.includes('B2CL')) return 'b2cl';
        if (upper.includes('B2CS')) return 'b2cs';
        if (upper.includes('EXP')) return 'export';
        if (upper.includes('EXEMP')) return 'Nil_exempt_NonGST';
        if (upper.includes('CDNR') && !upper.includes('CDNUR')) return 'cdnr';
        if (upper.includes('CDNUR')) return 'cdnur';
        if (upper.includes('ATADJ')) return 'adv_tax_adjusted';
        if (upper.includes('AT') && !upper.includes('ATADJ')) return 'adv_tax';
        if (upper.includes('DOC')) return 'Docs_issued';
        return null;
    }

    processDocsIssued(data: any[]): any[] {
        return data.map(row => {
            const cleaned = trimAllFields(row);
            const totalNumber = parseFloat(cleaned['Total Number']) || 0;
            const cancelled = parseFloat(cleaned['Cancelled']) || 0;
            return {
                'Nature of Document': cleaned['Nature of Document'] || cleaned['Type of Document'] || '',
                'Sr.No.From': cleaned['Sr.No.From'] || cleaned['Sr. No. From'] || cleaned['Series From'] || '',
                'Sr.No.To': cleaned['Sr.No.To'] || cleaned['Sr. No. To'] || cleaned['Series To'] || '',
                'Total Number': totalNumber,
                'Cancelled': cancelled,
                'Net Issued': totalNumber - cancelled
            };
        });
    }

    processHSNData(data: any[], fileName: string): any[] {
        const isB2B = fileName.toUpperCase().includes('B2B');
        const isB2C = fileName.toUpperCase().includes('B2C');
        return data.map(row => {
            const cleaned = trimAllFields(row);
            if (isB2B) cleaned['Type'] = 'B2B';
            else if (isB2C) cleaned['Type'] = 'B2C';
            if (!cleaned['Rate'] || cleaned['Rate'] === '') cleaned['Rate'] = 0;
            return cleaned;
        });
    }

    async processFiles(
        files: File[],
        format: GSTR1Format,
        onProgress: (progress: ProcessingProgress) => void
    ): Promise<Blob> {
        try {
            onProgress({ percent: 10, message: 'Loading template...', status: 'info' });
            const workbook = await this.excelGenerator.loadTemplate();

            const columnMappings = format === 'tally' ? this.tallyMappings : this.standardMappings;

            let processed = 0;
            const totalCsvs = files.length;
            onProgress({ percent: 20, message: 'Processing CSV files...', status: 'info' });

            for (const file of files) {
                const fileName = file.name;
                const sheetName = this.getSheetNameFromFile(fileName);

                if (!sheetName) {
                    processed++;
                    continue;
                }

                const csvText = await readFileAsText(file);
                let csvData = parseCSV(csvText);

                if (csvData.length === 0) {
                    processed++;
                    continue;
                }

                if (fileName.toUpperCase().includes('DOC')) {
                    csvData = this.processDocsIssued(csvData);
                } else if (fileName.toUpperCase().includes('HSN')) {
                    csvData = this.processHSNData(csvData, fileName);
                } else {
                    csvData = csvData.map(row => trimAllFields(row));
                }

                const sheet = workbook.Sheets[sheetName];
                if (!sheet) continue;

                const mapping = (columnMappings as any)[sheetName] || {};

                if (sheetName === 'Nil_exempt_NonGST') {
                    this.excelGenerator.updateExemptSheet(sheet, csvData, mapping);
                } else {
                    this.excelGenerator.appendDataToSheet(sheet, csvData, mapping);
                }

                processed++;
                const percent = 20 + Math.round((processed / totalCsvs) * 60);
                onProgress({ percent, message: `Processed ${fileName}`, status: 'info' });
            }

            onProgress({ percent: 90, message: 'Generating Excel...', status: 'info' });
            const blob = this.excelGenerator.generateExcel(workbook);
            onProgress({ percent: 100, message: 'Done!', status: 'success' });
            return blob;

        } catch (error: any) {
            onProgress({ percent: 0, message: error.message, status: 'error' });
            throw error;
        }
    }
}

export const gstr1Processor = new GSTR1Processor();
