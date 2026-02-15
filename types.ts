
export type Role = 'ca' | 'customer';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  caCode: string; // For CA: their own code. For Customer: their linked CA's code.
  firmName?: string; // CA Only
  gstin?: string; // Customer Only (Simulated)
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
  content?: string; // Raw CSV data stored for conversion
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
}
