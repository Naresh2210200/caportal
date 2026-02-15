
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
