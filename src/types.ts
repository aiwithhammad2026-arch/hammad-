/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "ADMIN" | "RECEPTIONIST" | "DOCTOR" | "LAB_TECH" | "RADIOLOGIST" | "ACCOUNTANT";

export interface PermissionMatrix {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  print: boolean;
  export: boolean;
  approve: boolean;
  validate: boolean;
}

export interface UserGroup {
  id: string;
  name: string; // e.g. "Front Office Officers", "Medical Pathologists", "Senior Accountants"
  role: UserRole;
  permissions: Record<string, PermissionMatrix>; // moduleName -> permissions
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  groupId: string;
  isLoggedIn: boolean;
  lastLoginAt?: string;
  sessionToken?: string;
}

export interface LoginHistoryEntry {
  id: string;
  userId: string;
  username: string;
  role: UserRole;
  timestamp: string;
  ipAddress: string;
  deviceInfo: string;
  status: "Success" | "Failed";
}

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone: string;
  address: string;
  bloodGroup?: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  fee: number;
  sharePercentage: number; // For doctor share reports
  phone: string;
  availableDays: string[];
}

export type OPDStatus = "Waiting" | "In_Consultation" | "Completed" | "Cancelled";

export interface OPDVisit {
  id: string;
  tokenNumber: string;
  patientId: string;
  doctorId: string;
  symptoms: string;
  vitals: {
    bp: string;       // e.g. 120/80
    temp: string;     // e.g. 98.6 F
    pulse: string;    // e.g. 72 bpm
    weight: string;   // e.g. 70 kg
  };
  fee: number;
  status: OPDStatus;
  createdAt: string;
  isArchived?: boolean;
  prescription?: {
    diagnosis: string;
    medicines: Array<{ name: string; dosage: string; duration: string }>;
    notes: string;
  };
  dischargeSummary?: {
    id: string;
    dischargeDate: string;
    conditionAtDischarge: string;
    dischargeAdvice: string;
    followUpDate?: string;
    summaryNotes?: string;
  };
}

// Lab Models
export interface LabParameter {
  id: string;
  name: string;
  unit: string;
  referenceRange: string;
  minNormal?: number;
  maxNormal?: number;
}

export interface LabTemplate {
  id: string;
  name: string;
  department: 
    | "Hematology" 
    | "Biochemistry" 
    | "Immunology" 
    | "Microbiology" 
    | "Urine Analysis" 
    | "Histopathology" 
    | "Cytology" 
    | "Surgical Pathology"
    | "Serology"
    | "Neurology"
    | "Radiology";
  price: number;
  parameters: LabParameter[];
}

export type LabOrderStatus = "Pending_Sample" | "Sample_Collected" | "Result_Entered" | "Validated";

export interface LabOrder {
  id: string;
  invoiceId: string;
  patientId: string;
  doctorId?: string;
  templateId: string;
  barcode: string;
  status: LabOrderStatus;
  results: Record<string, string>; // parameterId -> value
  notes?: string;
  orderedAt: string;
  collectedAt?: string;
  resultEnteredAt?: string;
  validatedAt?: string;
  validatedBy?: string;
}

// Radiology Models
export type RadiologyType = "X-Ray" | "Ultrasound" | "CT Scan" | "MRI" | "Doppler" | "ECG";

export interface RadiologyOrder {
  id: string;
  invoiceId: string;
  patientId: string;
  doctorId?: string;
  technicianId?: string;
  radiologyType: RadiologyType;
  title: string;
  scheduledAt: string;
  status: "Scheduled" | "Image_Uploaded" | "Report_Written" | "Validated";
  reportedBy?: string;
  reportNotes?: string;
  imageUrl?: string;
  fee: number;
  validatedAt?: string;
}

// Financial Accounting Models
export type AccountCategory = "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";

export interface Account {
  id: string;
  code: string; // e.g. "1001-Cash", "4001-OPD Revenue"
  name: string;
  category: AccountCategory;
  isSubLedger: boolean;
  parentCode?: string;
  balance: number;
}

export type VoucherType = "Receipt" | "Payment" | "Journal" | "Contra";

export interface VoucherEntry {
  accountId: string;
  debit: number;
  credit: number;
  narration?: string;
}

export interface FinancialVoucher {
  id: string;
  voucherNo: string;
  voucherType: VoucherType;
  date: string;
  narration: string;
  entries: VoucherEntry[];
  recordedBy: string;
  status: "Draft" | "Posted";
}

// Referrals
export interface ReferralContract {
  id: string;
  partnerName: string;
  partnerSpecialty: string;
  commissionPercentage: number;
  phone: string;
  casesDirected: number;
  totalCommissionsEarned: number;
}

// Patient Feedback
export interface PatientFeedback {
  id: string;
  patientId: string;
  patientName: string;
  department: string;
  rating: number; // 1 to 5 stars
  complaintType?: string;
  details: string;
  suggestion: string;
  status: "Pending" | "In_Review" | "Resolved";
  resolutionNotes?: string;
  createdAt: string;
}

// General Invoicing
export interface InvoiceItem {
  id: string;
  type: "OPD_Visit" | "Lab_Test" | "Radiology_Test";
  description: string;
  referenceId: string;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  dues: number;
  status: "Paid" | "Partially_Paid" | "Unpaid";
  createdAt: string;
  cashier: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  username: string;
  role: UserRole;
  action: string;
  module: string;
  details: string;
}

export interface HardwareConfig {
  thermalPrinterEnabled: boolean;
  laserPrinterEnabled: boolean;
  barcodePrinterEnabled: boolean;
  barcodeScannerEnabled: boolean;
  receiptPrinterType: "A4_Laser" | "3Inch_Thermal" | "2Inch_Label";
}

export interface SystemConfig {
  hospitalName: string;
  hospitalUrduName: string;
  tagline: string;
  phone: string;
  address: string;
  hardware?: HardwareConfig;
  autoBackupIntervalHours?: number; 
}

export interface BackupRecord {
  id: string;
  timestamp: string;
  fileName: string;
  sizeBytes: number;
  target: string; // "Local Disk" | "External Drive" | "Network Folder"
  type: "Manual" | "Scheduled" | "Automatic";
  status: "Verified_OK" | "Failed";
}
