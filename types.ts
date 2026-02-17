
export type Role = 'ca' | 'customer';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  caCode: string;
  firmName?: string;
  gstin?: string;
}

export type FileStatus = 'Pending' | 'Processing' | 'Completed' | 'Error';

export interface UploadedFile {
  id: string;
  customerId: string;
  caCode: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  financialYear: string;
  month: string;
  note: string;
  status: FileStatus;
  processedFileUrl?: string;
  content?: string;
}

export interface ProcessingLog {
  id: string;
  timestamp: string;
  action: string;
  fileName: string;
  result: string;
  status: string;
  caCode: string;
  customerId: string;
  errorCount?: number;
  migratedAmount?: number;
}

export type GSTR1Format = 'standard' | 'tally';

export interface GSTR1ColumnMapping {
  [csvColumn: string]: string | string[];
}

export interface GSTR1SheetMappings {
  b2b: GSTR1ColumnMapping;
  b2cl: GSTR1ColumnMapping;
  b2cs: GSTR1ColumnMapping;
  export: GSTR1ColumnMapping;
  Nil_exempt_NonGST: GSTR1ColumnMapping;
  cdnr: GSTR1ColumnMapping;
  cdnur: GSTR1ColumnMapping;
  adv_tax: GSTR1ColumnMapping;
  adv_tax_adjusted: GSTR1ColumnMapping;
  Docs_issued: GSTR1ColumnMapping;
  hsn: GSTR1ColumnMapping;
}

export interface ProcessingProgress {
  percent: number;
  message: string;
  status: 'info' | 'success' | 'error';
}
