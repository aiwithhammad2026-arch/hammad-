/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Patient, 
  Doctor, 
  OPDVisit, 
  LabTemplate, 
  LabOrder, 
  Invoice, 
  AuditLog, 
  UserRole, 
  User, 
  SystemConfig,
  UserGroup,
  LoginHistoryEntry,
  RadiologyOrder,
  Account,
  FinancialVoucher,
  ReferralContract,
  PatientFeedback,
  BackupRecord,
  HardwareConfig,
  VoucherType,
  VoucherEntry
} from "./types";

// State helper
export function generateId(prefix: string = ""): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

// 1. Initial System Configuration
const defaultHardwareConfig: HardwareConfig = {
  thermalPrinterEnabled: true,
  laserPrinterEnabled: true,
  barcodePrinterEnabled: true,
  barcodeScannerEnabled: true,
  receiptPrinterType: "3Inch_Thermal"
};

const defaultSystemConfig: SystemConfig = {
  hospitalName: "Madina General Hospital & Laboratory",
  hospitalUrduName: "Madina General Hospital & Laboratory",
  tagline: "Quality Medical Services at Affordable Rates",
  phone: "042-35892110, 0300-1234567",
  address: "Main G.T. Road, Near Shell Pump, Lahore",
  hardware: defaultHardwareConfig,
  autoBackupIntervalHours: 12
};

// 2. Multi-user Seeding: Custom Groups & Screen-level Permission maps
const defaultUserGroups: UserGroup[] = [
  {
    id: "g-admin",
    name: "System Administration Desk",
    role: "ADMIN",
    permissions: {
      "Dashboard": { view: true, create: true, edit: true, delete: true, print: true, export: true, approve: true, validate: true },
      "Patient Registry": { view: true, create: true, edit: true, delete: true, print: true, export: true, approve: true, validate: true },
      "OPD Desk": { view: true, create: true, edit: true, delete: true, print: true, export: true, approve: true, validate: true },
      "LIS Lab": { view: true, create: true, edit: true, delete: true, print: true, export: true, approve: true, validate: true },
      "Radiology Portal": { view: true, create: true, edit: true, delete: true, print: true, export: true, approve: true, validate: true },
      "Billing Desk": { view: true, create: true, edit: true, delete: true, print: true, export: true, approve: true, validate: true },
      "Financial Accounting": { view: true, create: true, edit: true, delete: true, print: true, export: true, approve: true, validate: true },
      "Partner Referrals": { view: true, create: true, edit: true, delete: true, print: true, export: true, approve: true, validate: true },
      "Patient Feedback": { view: true, create: true, edit: true, delete: true, print: true, export: true, approve: true, validate: true },
      "Security Audit": { view: true, create: true, edit: true, delete: true, print: true, export: true, approve: true, validate: true },
      "Backup Desk": { view: true, create: true, edit: true, delete: true, print: true, export: true, approve: true, validate: true },
      "System Config": { view: true, create: true, edit: true, delete: true, print: true, export: true, approve: true, validate: true }
    }
  },
  {
    id: "g-recept",
    name: "Front Desk Cashiers",
    role: "RECEPTIONIST",
    permissions: {
      "Dashboard": { view: true, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Patient Registry": { view: true, create: true, edit: true, delete: false, print: true, export: true, approve: false, validate: false },
      "OPD Desk": { view: true, create: true, edit: false, delete: false, print: true, export: false, approve: false, validate: false },
      "LIS Lab": { view: true, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Radiology Portal": { view: true, create: true, edit: false, delete: false, print: true, export: false, approve: false, validate: false },
      "Billing Desk": { view: true, create: true, edit: true, delete: false, print: true, export: true, approve: false, validate: false },
      "Financial Accounting": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Partner Referrals": { view: true, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Patient Feedback": { view: true, create: true, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Security Audit": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Backup Desk": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "System Config": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false }
    }
  },
  {
    id: "g-doctor",
    name: "Consultant Doctors",
    role: "DOCTOR",
    permissions: {
      "Dashboard": { view: true, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Patient Registry": { view: true, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "OPD Desk": { view: true, create: true, edit: true, delete: false, print: true, export: true, approve: true, validate: false },
      "LIS Lab": { view: true, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Radiology Portal": { view: true, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Billing Desk": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Financial Accounting": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Partner Referrals": { view: true, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Patient Feedback": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Security Audit": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Backup Desk": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "System Config": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false }
    }
  },
  {
    id: "g-pathology",
    name: "Clinical Pathologists",
    role: "LAB_TECH",
    permissions: {
      "Dashboard": { view: true, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Patient Registry": { view: true, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "OPD Desk": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "LIS Lab": { view: true, create: true, edit: true, delete: false, print: true, export: true, approve: true, validate: true },
      "Radiology Portal": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Billing Desk": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Financial Accounting": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Partner Referrals": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Patient Feedback": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Security Audit": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Backup Desk": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "System Config": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false }
    }
  },
  {
    id: "g-radiology",
    name: "Radiographers & Sonologists",
    role: "RADIOLOGIST",
    permissions: {
      "Dashboard": { view: true, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Patient Registry": { view: true, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "OPD Desk": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "LIS Lab": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Radiology Portal": { view: true, create: true, edit: true, delete: false, print: true, export: true, approve: true, validate: true },
      "Billing Desk": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Financial Accounting": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Partner Referrals": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Patient Feedback": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Security Audit": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Backup Desk": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "System Config": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false }
    }
  },
  {
    id: "g-finance",
    name: "General Accounting Department",
    role: "ACCOUNTANT",
    permissions: {
      "Dashboard": { view: true, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Patient Registry": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "OPD Desk": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "LIS Lab": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Radiology Portal": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Billing Desk": { view: true, create: true, edit: true, delete: false, print: true, export: true, approve: true, validate: false },
      "Financial Accounting": { view: true, create: true, edit: true, delete: true, print: true, export: true, approve: true, validate: true },
      "Partner Referrals": { view: true, create: true, edit: true, delete: false, print: true, export: true, approve: false, validate: false },
      "Patient Feedback": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "Security Audit": { view: true, create: false, edit: false, delete: false, print: true, export: true, approve: false, validate: false },
      "Backup Desk": { view: true, create: true, edit: false, delete: false, print: false, export: false, approve: false, validate: false },
      "System Config": { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false }
    }
  }
];

// Active Unlimited Simulated Users List
const defaultUsers: User[] = [
  { id: "u-adm", name: "Dr. Sultan Pasha", username: "admin", role: "ADMIN", groupId: "g-admin", isLoggedIn: true },
  { id: "u-usr-recept", name: "Irfan Sadiq (Front Desk)", username: "receptionist_ali", role: "RECEPTIONIST", groupId: "g-recept", isLoggedIn: false },
  { id: "u-usr-doc", name: "Dr. Muhammad Ali", username: "doctor_ali", role: "DOCTOR", groupId: "g-doctor", isLoggedIn: false },
  { id: "u-usr-lab", name: "Zahid Mahmood (Pathologist)", username: "lab_zahid", role: "LAB_TECH", groupId: "g-pathology", isLoggedIn: false },
  { id: "u-usr-rad", name: "Dr. Yasir Iqbal (Radiologist)", username: "radiology_yasir", role: "RADIOLOGIST", groupId: "g-radiology", isLoggedIn: false },
  { id: "u-usr-acc", name: "Zubair Hashmi (Accountant)", username: "accountant_zubair", role: "ACCOUNTANT", groupId: "g-finance", isLoggedIn: false },
];

// Active user session monitoring records
const defaultLoginHistory: LoginHistoryEntry[] = [
  { id: "lh-1", userId: "u-adm", username: "admin", role: "ADMIN", timestamp: "2026-06-06T08:15:00Z", ipAddress: "192.168.1.15", deviceInfo: "Windows 11 PC / Chrome 124", status: "Success" },
  { id: "lh-2", userId: "u-usr-recept", username: "receptionist_ali", role: "RECEPTIONIST", timestamp: "2026-06-06T08:30:00Z", ipAddress: "192.168.1.32", deviceInfo: "Windows 10 PC / Chrome 124", status: "Success" }
];

// 3. Lab Templates
const defaultTemplates: LabTemplate[] = [
  {
    id: "cbc-001",
    name: "Complete Blood Count (CBC)",
    department: "Hematology",
    price: 800,
    parameters: [
      { id: "p-hb", name: "Hemoglobin (Hb)", unit: "g/dL", referenceRange: "12.0 - 16.0", minNormal: 12.0, maxNormal: 16.0 },
      { id: "p-wbc", name: "Total Leucocyte Count (TLC)", unit: "/cu.mm", referenceRange: "4000 - 11000", minNormal: 4000, maxNormal: 11000 },
      { id: "p-plt", name: "Platelet Count", unit: "/cu.mm", referenceRange: "150000 - 400000", minNormal: 150000, maxNormal: 400000 },
      { id: "p-rbc", name: "Red Blood Cell Count (RBC)", unit: "mill/cu.mm", referenceRange: "4.5 - 5.5", minNormal: 4.5, maxNormal: 5.5 },
    ]
  },
  {
    id: "lipid-001",
    name: "Lipid Profile",
    department: "Biochemistry",
    price: 1500,
    parameters: [
      { id: "p-chol", name: "Total Cholesterol", unit: "mg/dL", referenceRange: "100 - 200", minNormal: 100, maxNormal: 200 },
      { id: "p-tg", name: "Triglycerides", unit: "mg/dL", referenceRange: "50 - 150", minNormal: 50, maxNormal: 150 },
      { id: "p-hdl", name: "HDL Cholesterol", unit: "mg/dL", referenceRange: "40 - 60", minNormal: 40, maxNormal: 60 },
      { id: "p-ldl", name: "LDL Cholesterol", unit: "mg/dL", referenceRange: "0 - 100", minNormal: 0, maxNormal: 100 },
    ]
  },
  {
    id: "sugar-001",
    name: "Blood Glucose (Random)",
    department: "Biochemistry",
    price: 200,
    parameters: [
      { id: "p-sugar", name: "Glucose Random", unit: "mg/dL", referenceRange: "70 - 140", minNormal: 70, maxNormal: 140 }
    ]
  },
  {
    id: "urine-001",
    name: "Urine Routine Examination (Urine R/E)",
    department: "Urine Analysis",
    price: 400,
    parameters: [
      { id: "p-col", name: "Color", unit: "", referenceRange: "Pale Yellow" },
      { id: "p-ph", name: "pH", unit: "Units", referenceRange: "5.0 - 8.0", minNormal: 5.0, maxNormal: 8.0 },
      { id: "p-alb", name: "Albumin", unit: "", referenceRange: "Nil" },
      { id: "p-sug", name: "Sugar", unit: "", referenceRange: "Nil" },
      { id: "p-pus", name: "Pus Cells", unit: "/HPF", referenceRange: "0 - 5", minNormal: 0, maxNormal: 5 },
    ]
  },
  {
    id: "typh-001",
    name: "Typhidium Serology Panel",
    department: "Serology",
    price: 1100,
    parameters: [
      { id: "p-typh-h", name: "Salmonella Typhi Hb", unit: "Index", referenceRange: "Less than 0.9", maxNormal: 0.9 },
      { id: "p-typh-o", name: "Salmonella Typhi Ob", unit: "Index", referenceRange: "Less than 0.9", maxNormal: 0.9 }
    ]
  },
  {
    id: "eeg-001",
    name: "Routine EEG mapping report",
    department: "Neurology",
    price: 4500,
    parameters: [
      { id: "p-eeg-alpha", name: "Alpha Rhythm Frequency", unit: "Hz", referenceRange: "8.0 - 12.0", minNormal: 8.0, maxNormal: 12.0 },
      { id: "p-eeg-spike", name: "Espileptic Spike Bursts", unit: "Count", referenceRange: "0", maxNormal: 0 }
    ]
  }
];

// 4. Initial Clinical Doctors
const defaultDoctors: Doctor[] = [
  { id: "doc-ali", name: "Dr. Muhammad Ali", specialization: "General Physician & Cardiologist", fee: 1500, sharePercentage: 70, phone: "0300-8484110", availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  { id: "doc-sara", name: "Dr. Sara Khan", specialization: "Pediatrician (Children Specialist)", fee: 1200, sharePercentage: 65, phone: "0312-9876543", availableDays: ["Mon", "Wed", "Fri"] },
  { id: "doc-zainab", name: "Dr. Zainab Fatima", specialization: "Gynecologist & Pathology Consultant", fee: 1000, sharePercentage: 60, phone: "0333-4567890", availableDays: ["Tue", "Thu", "Sat"] }
];

// 5. Patient Registry
const defaultPatients: Patient[] = [
  { id: "pat-1", mrn: "MRN-260601", name: "Tariq Mehmood", age: 45, gender: "Male", phone: "0321-4321098", address: "Gulshan-e-Ravi, Lahore", bloodGroup: "O+", createdAt: "2026-06-01T09:12:00Z" },
  { id: "pat-2", mrn: "MRN-260602", name: "Sadiya Bibi", age: 32, gender: "Female", phone: "0301-7654321", address: "Samanabad, Lahore", bloodGroup: "B+", createdAt: "2026-06-02T10:30:00Z" },
  { id: "pat-3", mrn: "MRN-260603", name: "Muhammad Nawaz", age: 60, gender: "Male", phone: "0345-1234567", address: "Chung, Lahore", bloodGroup: "A-", createdAt: "2026-06-03T11:45:00Z" }
];

// 6. Seeded Invoices
const defaultInvoices: Invoice[] = [
  {
    id: "inv-1",
    invoiceNumber: "INV-2606-001",
    patientId: "pat-1",
    items: [
      { id: "item-1-1", type: "OPD_Visit", description: "OPD Consultation - Dr. Muhammad Ali", referenceId: "visit-1", amount: 1500 },
      { id: "item-1-2", type: "Lab_Test", description: "Complete Blood Count (CBC)", referenceId: "cbc-001", amount: 800 }
    ],
    subtotal: 2300,
    discount: 200,
    total: 2100,
    paidAmount: 2100,
    dues: 0,
    status: "Paid",
    createdAt: "2026-06-05T09:30:00Z",
    cashier: "receptionist_ali"
  },
  {
    id: "inv-2",
    invoiceNumber: "INV-2606-002",
    patientId: "pat-2",
    items: [
      { id: "item-2-1", type: "Lab_Test", description: "Lipid Profile", referenceId: "lipid-001", amount: 1500 }
    ],
    subtotal: 1500,
    discount: 0,
    total: 1500,
    paidAmount: 1000,
    dues: 500,
    status: "Partially_Paid",
    createdAt: "2026-06-05T14:15:00Z",
    cashier: "receptionist_ali"
  }
];

// 7. Seeded OPD Visits
const defaultOPDVisits: OPDVisit[] = [
  {
    id: "visit-1",
    tokenNumber: "T-101",
    patientId: "pat-1",
    doctorId: "doc-ali",
    symptoms: "Mild Chest Tightness & High Heart Rate",
    vitals: { bp: "135/85", temp: "98.4 F", pulse: "88", weight: "78" },
    fee: 1500,
    status: "Completed",
    createdAt: "2026-06-05T09:32:00Z",
    prescription: {
      diagnosis: "Post-exertion tachycardia, mild hypertension suspected",
      medicines: [
        { name: "Tab Cardarone 200mg", dosage: "Once daily", duration: "10 days" },
        { name: "Tab Capoten 25mg", dosage: "As needed if BP > 140/90", duration: "1 Month" }
      ],
      notes: "Avoid high salt, follow up with blood lipid test results."
    }
  },
  {
    id: "visit-2",
    tokenNumber: "T-102",
    patientId: "pat-3",
    doctorId: "doc-ali",
    symptoms: "Routine cardiac evaluation",
    vitals: { bp: "120/78", temp: "98.2 F", pulse: "74", weight: "82" },
    fee: 1500,
    status: "Waiting",
    createdAt: "2026-06-06T10:00:00Z"
  }
];

// 8. Seeded Lab Orders
const defaultLabOrders: LabOrder[] = [
  {
    id: "order-1",
    invoiceId: "inv-1",
    patientId: "pat-1",
    doctorId: "doc-ali",
    templateId: "cbc-001",
    barcode: "L-1002601",
    status: "Validated",
    results: {
      "p-hb": "11.2",  // low relative to reference 12-16
      "p-wbc": "8500",
      "p-plt": "240000",
      "p-rbc": "4.1"   // low
    },
    notes: "Mild anemia suspected.",
    orderedAt: "2026-06-05T09:30:00Z",
    collectedAt: "2026-06-05T09:40:00Z",
    resultEnteredAt: "2026-06-05T10:15:00Z",
    validatedAt: "2026-06-05T10:30:00Z",
    validatedBy: "Dr. Zainab Fatima (Lab Pathologist)"
  },
  {
    id: "order-2",
    invoiceId: "inv-2",
    patientId: "pat-2",
    templateId: "lipid-001",
    barcode: "L-1002602",
    status: "Sample_Collected",
    results: {},
    orderedAt: "2026-06-05T14:15:00Z",
    collectedAt: "2026-06-05T14:30:00Z"
  }
];

// 9. Radiology Orders Seeding
const defaultRadiologyOrders: RadiologyOrder[] = [
  {
    id: "rad-ord-1",
    invoiceId: "inv-1",
    patientId: "pat-1",
    doctorId: "doc-ali",
    radiologyType: "X-Ray",
    title: "Chest X-Ray P/A View",
    scheduledAt: "2026-06-06T11:00:00Z",
    status: "Validated",
    technicianId: "u-usr-rad",
    reportedBy: "Dr. Yasir Iqbal (Radiologist)",
    reportNotes: "Lungs are transparent. Trachea midline. Heart borders are clean, within normal parameters. No active pleural effusion.",
    validatedAt: "2026-06-06T12:00:00Z",
    fee: 1000,
    imageUrl: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&q=80"
  },
  {
    id: "rad-ord-2",
    invoiceId: "inv-2",
    patientId: "pat-2",
    radiologyType: "Ultrasound",
    title: "Abdomen & Pelvis Ultrasound",
    scheduledAt: "2026-06-06T14:30:00Z",
    status: "Scheduled",
    fee: 1200
  }
];

// 10. Financial Chart of Accounts (COA) Seeding
const defaultAccounts: Account[] = [
  // Assets
  { id: "coa-cash", code: "1001", name: "Cash in Hand Account", category: "Asset", isSubLedger: false, balance: 3100 },
  { id: "coa-bank", code: "1002", name: "Habib Bank Limited (HBL)", category: "Asset", isSubLedger: false, balance: 25000 },
  { id: "coa-recv", code: "1100", name: "Patient Outstandings Receivable", category: "Asset", isSubLedger: false, balance: 500 },
  // Liabilities
  { id: "coa-share-pay", code: "2001", name: "Doctors Revenue Split Share Payable", category: "Liability", isSubLedger: false, balance: 1050 },
  // Revenues
  { id: "coa-rev-opd", code: "4001", name: "OPD Tickets Consultation Revenues", category: "Revenue", isSubLedger: false, balance: 3000 },
  { id: "coa-rev-lab", code: "4002", name: "Laboratory Clinical Revenues", category: "Revenue", isSubLedger: false, balance: 2300 },
  { id: "coa-rev-rad", code: "4003", name: "Radiology Screening Revenues", category: "Revenue", isSubLedger: false, balance: 2200 },
  // Expenses
  { id: "coa-exp-salaries", code: "5001", name: "Medical Staff Salaries Expense", category: "Expense", isSubLedger: false, balance: 15000 },
  { id: "coa-exp-utility", code: "5002", name: "Electricity & Thermal Bills Expense", category: "Expense", isSubLedger: false, balance: 4000 },
  { id: "coa-exp-supplies", code: "5003", name: "Lab Diagnostic Kits & Fluids Expense", category: "Expense", isSubLedger: false, balance: 2500 }
];

// 11. Initial Financial Vouchers
const defaultVouchers: FinancialVoucher[] = [
  {
    id: "fvc-1",
    voucherNo: "JV-20260601",
    voucherType: "Journal",
    date: "2026-06-01T10:00:00Z",
    narration: "Being hospital opening balance inputs",
    status: "Posted",
    recordedBy: "Zubair Hashmi (Accountant)",
    entries: [
      { accountId: "coa-bank", debit: 25000, credit: 0 },
      { accountId: "coa-exp-salaries", debit: 15000, credit: 0 },
      { accountId: "coa-exp-utility", debit: 4000, credit: 0 },
      { accountId: "coa-exp-supplies", debit: 2500, credit: 0 },
      { accountId: "coa-cash", debit: 0, credit: 46500 } // balancing credit (Equity capital simulated)
    ]
  },
  {
    id: "fvc-2",
    voucherNo: "RV-20260605",
    voucherType: "Receipt",
    date: "2026-06-05T09:30:00Z",
    narration: "Recv Cash for Bill INV-2606-001 (OPD visit-1 + Lab hematology test-1)",
    status: "Posted",
    recordedBy: "receptionist_ali",
    entries: [
      { accountId: "coa-cash", debit: 2100, credit: 0 },
      { accountId: "coa-rev-opd", debit: 0, credit: 1500 },
      { accountId: "coa-rev-lab", debit: 0, credit: 800 },
      { accountId: "coa-share-pay", debit: 0, credit: 1050 } // Dr Ali split share 70% of Rs 1500
    ]
  },
  {
    id: "fvc-3",
    voucherNo: "RV-20260605-2",
    voucherType: "Receipt",
    date: "2026-06-05T14:15:00Z",
    narration: "Recv Partial Cash for Bill INV-2606-002, remaining booked to accounts receivables",
    status: "Posted",
    recordedBy: "receptionist_ali",
    entries: [
      { accountId: "coa-cash", debit: 1000, credit: 0 },
      { accountId: "coa-recv", debit: 500, credit: 0 },
      { accountId: "coa-rev-lab", debit: 0, credit: 1500 }
    ]
  }
];

// 12. Referral Directories
const defaultReferrals: ReferralContract[] = [
  { id: "ref-1", partnerName: "Dr. Naseem Chaudhry", partnerSpecialty: "Cardiovascular Surgery Lahore", commissionPercentage: 10, phone: "0300-9876543", casesDirected: 14, totalCommissionsEarned: 2400 },
  { id: "ref-2", partnerName: "Dr. Amna Malik", partnerSpecialty: "Fatima Jinnah Hospital Gynecologist", commissionPercentage: 15, phone: "0321-4567890", casesDirected: 8, totalCommissionsEarned: 1800 },
  { id: "ref-3", partnerName: "Decent Clinical Lab Kasur", partnerSpecialty: "District Clinic Referrals", commissionPercentage: 12, phone: "0322-8765431", casesDirected: 5, totalCommissionsEarned: 950 }
];

// 13. Patient feedback complaints registering system
const defaultFeedbacks: PatientFeedback[] = [
  {
    id: "fb-1",
    patientId: "pat-1",
    patientName: "Tariq Mehmood",
    department: "OPD Waiting Hall",
    rating: 4,
    details: "The queue system works nicely but waiting seats can be increased near doctor pasha's room.",
    suggestion: "Provide drinking water dispenser near the lobby.",
    status: "Resolved",
    resolutionNotes: "Water dispenser installed and added 4 extra sofa chairs on June 5th.",
    createdAt: "2026-06-05T11:00:00Z"
  },
  {
    id: "fb-2",
    patientId: "pat-2",
    patientName: "Sadiya Bibi",
    department: "Laboratory Draw Desk",
    rating: 2,
    complaintType: "Delay in Sample collection",
    details: "Took 20 minutes before staff attended blood draw.",
    suggestion: "Keep two techs active in heavy morning hours from 9 AM to 11 AM.",
    status: "In_Review",
    createdAt: "2026-06-06T09:30:00Z"
  }
];

// 14. Backup Trail Records
const defaultBackups: BackupRecord[] = [
  { id: "b-1", timestamp: "2026-06-05T23:59:00Z", fileName: "HMLMS_AUTO_BACKUP_20260605.json", sizeBytes: 154200, target: "Local Disk", type: "Automatic", status: "Verified_OK" },
  { id: "b-2", timestamp: "2026-06-06T08:00:00Z", fileName: "HMLMS_MANUAL_BACKUP_LOBBY.json", sizeBytes: 158400, target: "External Drive", type: "Manual", status: "Verified_OK" },
];

const defaultAuditLogs: AuditLog[] = [
  {
    id: "log-1",
    timestamp: "2026-06-05T09:00:00Z",
    username: "admin",
    role: "ADMIN",
    action: "Database Initial Seeding",
    module: "SYSTEM",
    details: "Universal database schemas pre-seeded. Relational ledgers initialized with double entries."
  }
];

// Core Storage Engine Key Names
const KEYS = {
  SYSTEM_CONFIG: "hmlms_system_config",
  TEMPLATES: "hmlms_templates",
  DOCTORS: "hmlms_doctors",
  PATIENTS: "hmlms_patients",
  OPD_VISITS: "hmlms_opd_visits",
  LAB_ORDERS: "hmlms_lab_orders",
  RADIOLOGY_ORDERS: "hmlms_radiology_orders",
  INVOICES: "hmlms_invoices",
  AUDIT_LOGS: "hmlms_audit_logs",
  CURRENT_USER: "hmlms_current_user",
  USER_GROUPS: "hmlms_user_groups",
  USERS: "hmlms_users",
  LOGIN_HISTORIES: "hmlms_login_histories",
  ACCOUNTS: "hmlms_coa_accounts",
  VOUCHERS: "hmlms_vouchers",
  REFERRALS: "hmlms_referrals",
  FEEDBACKS: "hmlms_feedbacks",
  BACKUPS: "hmlms_backups"
};

function get<T>(key: string, defaultValue: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return defaultValue;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function set<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Initial Setup Sync trigger
export function initDatabase() {
  if (!localStorage.getItem(KEYS.SYSTEM_CONFIG)) {
    set(KEYS.SYSTEM_CONFIG, defaultSystemConfig);
    set(KEYS.TEMPLATES, defaultTemplates);
    set(KEYS.DOCTORS, defaultDoctors);
    set(KEYS.PATIENTS, defaultPatients);
    set(KEYS.INVOICES, defaultInvoices);
    set(KEYS.OPD_VISITS, defaultOPDVisits);
    set(KEYS.LAB_ORDERS, defaultLabOrders);
    set(KEYS.RADIOLOGY_ORDERS, defaultRadiologyOrders);
    set(KEYS.ACCOUNTS, defaultAccounts);
    set(KEYS.VOUCHERS, defaultVouchers);
    set(KEYS.REFERRALS, defaultReferrals);
    set(KEYS.FEEDBACKS, defaultFeedbacks);
    set(KEYS.BACKUPS, defaultBackups);
    set(KEYS.USER_GROUPS, defaultUserGroups);
    set(KEYS.USERS, defaultUsers);
    set(KEYS.LOGIN_HISTORIES, defaultLoginHistory);
    set(KEYS.AUDIT_LOGS, defaultAuditLogs);
    set(KEYS.CURRENT_USER, defaultUsers[0]); // Default logged in is Dr Sultan (ADMIN)
  }
}

// Database Engine interface for dynamic React components
export const db = {
  // Config Manager
  getConfig: () => get<SystemConfig>(KEYS.SYSTEM_CONFIG, defaultSystemConfig),
  saveConfig: (config: SystemConfig) => {
    set(KEYS.SYSTEM_CONFIG, config);
    db.log("admin", "ADMIN", "Update Hospital Config", "SETTINGS", `Changed settings parameters and printer bindings.`);
  },

  // Multiuser Auth & Security
  getCurrentUser: () => get<User>(KEYS.CURRENT_USER, defaultUsers[0]),
  setCurrentUser: (user: User) => {
    set(KEYS.CURRENT_USER, user);
    if (user.isLoggedIn) {
      db.log(user.username, user.role, "User Login", "SECURITY", `User session generated for ${user.name}`);
      db.addLoginHistory(user.id, user.username, user.role, "Success");
    } else {
      db.log(user.username, user.role, "User Logout", "SECURITY", `Terminated user session for ${user.name}`);
    }
  },
  getUserGroups: () => get<UserGroup[]>(KEYS.USER_GROUPS, defaultUserGroups),
  saveUserGroup: (group: UserGroup) => {
    const list = db.getUserGroups();
    const idx = list.findIndex(g => g.id === group.id);
    if (idx >= 0) list[idx] = group;
    else list.push(group);
    set(KEYS.USER_GROUPS, list);
    db.log("admin", "ADMIN", "Save Access Group", "SECURITY", `Modified permission matrix for ${group.name}`);
  },
  getUsers: () => get<User[]>(KEYS.USERS, defaultUsers),
  saveUser: (u: User) => {
    const list = db.getUsers();
    const idx = list.findIndex(user => user.id === u.id);
    if (idx >= 0) list[idx] = u;
    else list.push(u);
    set(KEYS.USERS, list);
    db.log("admin", "ADMIN", "Modify Staff User", "SECURITY", `Updated registry details for operational staff name: ${u.name}`);
  },
  getLoginHistory: () => get<LoginHistoryEntry[]>(KEYS.LOGIN_HISTORIES, defaultLoginHistory).reverse(),
  addLoginHistory: (userId: string, username: string, role: UserRole, status: "Success" | "Failed") => {
    const list = get<LoginHistoryEntry[]>(KEYS.LOGIN_HISTORIES, defaultLoginHistory);
    list.push({
      id: generateId("lh_"),
      userId,
      username,
      role,
      timestamp: new Date().toISOString(),
      ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
      deviceInfo: "Windows Server Console / Electron 30Client",
      status
    });
    set(KEYS.LOGIN_HISTORIES, list);
  },

  // Patient Registration Desk
  getPatients: () => get<Patient[]>(KEYS.PATIENTS, defaultPatients),
  savePatient: (patient: Patient) => {
    const list = db.getPatients();
    const idx = list.findIndex(p => p.id === patient.id);
    if (idx >= 0) {
      list[idx] = patient;
      db.log("receptionist", "RECEPTIONIST", "Patient Medical Modification", "RECEPTION", `Modified files for ${patient.name} (MRN: ${patient.mrn})`);
    } else {
      list.push(patient);
      db.log("receptionist", "RECEPTIONIST", "Patient Medical File Registration", "RECEPTION", `Created clean medical history charts for ${patient.name} with unique identification token ${patient.mrn}`);
    }
    set(KEYS.PATIENTS, list);
    return patient;
  },

  // Clinical Consultation Directory
  getDoctors: () => get<Doctor[]>(KEYS.DOCTORS, defaultDoctors),
  saveDoctor: (doctor: Doctor) => {
    const list = db.getDoctors();
    const idx = list.findIndex(d => d.id === doctor.id);
    if (idx >= 0) list[idx] = doctor;
    else list.push(doctor);
    set(KEYS.DOCTORS, list);
    db.log("admin", "ADMIN", "Modify Doctor Registry", "CLINIC", `Modified consultant specifications of ${doctor.name}`);
    return doctor;
  },

  // OPD Line Visits
  getOPDVisits: () => get<OPDVisit[]>(KEYS.OPD_VISITS, defaultOPDVisits),
  saveOPDVisit: (visit: OPDVisit) => {
    const list = db.getOPDVisits();
    const idx = list.findIndex(v => v.id === visit.id);
    if (idx >= 0) {
      list[idx] = visit;
      db.log("doctor", "DOCTOR", "Save Patient Assessment", "CLINIC", `Completed assessment files for token line queue ${visit.tokenNumber}`);
    } else {
      list.push(visit);
      db.log("receptionist", "RECEPTIONIST", "Create OPD Token", "RECEPTION", `Issued consultation queue token ${visit.tokenNumber}`);
    }
    set(KEYS.OPD_VISITS, list);
    return visit;
  },

  // Laboratory Templates
  getTemplates: () => get<LabTemplate[]>(KEYS.TEMPLATES, defaultTemplates),
  saveTemplate: (tmpl: LabTemplate) => {
    const list = db.getTemplates();
    const idx = list.findIndex(t => t.id === tmpl.id);
    if (idx >= 0) list[idx] = tmpl;
    else list.push(tmpl);
    set(KEYS.TEMPLATES, list);
    db.log("lab_tech", "LAB_TECH", "Save Lab Test Specification", "LAB", `Modified parameters specification sheet of ${tmpl.name}`);
    return tmpl;
  },

  // Lab Sample Orders
  getLabOrders: () => get<LabOrder[]>(KEYS.LAB_ORDERS, defaultLabOrders),
  saveLabOrder: (order: LabOrder) => {
    const list = db.getLabOrders();
    const idx = list.findIndex(o => o.id === order.id);
    if (idx >= 0) list[idx] = order;
    else list.push(order);
    set(KEYS.LAB_ORDERS, list);
    db.log("lab_tech", "LAB_TECH", "Save Lab Result & State", "LAB", `Log lab study results under barcode ${order.barcode} with status ${order.status}`);
    return order;
  },

  // Radiology Workflow Management
  getRadiologyOrders: () => get<RadiologyOrder[]>(KEYS.RADIOLOGY_ORDERS, defaultRadiologyOrders),
  saveRadiologyOrder: (order: RadiologyOrder) => {
    const list = db.getRadiologyOrders();
    const idx = list.findIndex(o => o.id === order.id);
    if (idx >= 0) list[idx] = order;
    else list.push(order);
    set(KEYS.RADIOLOGY_ORDERS, list);
    db.log("radiologist", "RADIOLOGIST", "Update Screening Status", "RADIOLOGY", `Radiology order status shifted to ${order.status} for screen code: ${order.radiologyType}`);
    return order;
  },

  // Invoicing & Receipting desks
  getInvoices: () => get<Invoice[]>(KEYS.INVOICES, defaultInvoices),
  saveInvoice: (invoice: Invoice) => {
    const list = db.getInvoices();
    const idx = list.findIndex(i => i.id === invoice.id);
    if (idx >= 0) {
      list[idx] = invoice;
      db.log("cashier", "RECEPTIONIST", "Billing Receipt Modified", "FINANCE", `Adjusted ledger balance invoice ${invoice.invoiceNumber}. Dues remaining: Rs. ${invoice.dues}`);
    } else {
      list.push(invoice);
      db.log("cashier", "RECEPTIONIST", "Invoice Generated", "FINANCE", `Created net billing statement code ${invoice.invoiceNumber}`);
    }
    set(KEYS.INVOICES, list);
    return invoice;
  },

  // 15. Financial General Ledger & Accounting Core
  getAccounts: () => get<Account[]>(KEYS.ACCOUNTS, defaultAccounts),
  getVouchers: () => get<FinancialVoucher[]>(KEYS.VOUCHERS, defaultVouchers),
  saveVoucher: (voucher: FinancialVoucher) => {
    const list = db.getVouchers();
    const idx = list.findIndex(v => v.id === voucher.id);
    if (idx >= 0) {
      list[idx] = voucher;
    } else {
      list.push(voucher);
    }
    set(KEYS.VOUCHERS, list);
    db.log("accountant", "ACCOUNTANT", "Voucher Entry Logged", "FINANCE", `Posted transaction voucher ${voucher.voucherNo}`);

    // Recalculate and update the Chart of Account balances in real time
    if (voucher.status === "Posted") {
      const coaList = db.getAccounts();
      voucher.entries.forEach(entry => {
        const coaItem = coaList.find(c => c.id === entry.accountId);
        if (coaItem) {
          if (coaItem.category === "Asset" || coaItem.category === "Expense") {
            coaItem.balance += (entry.debit - entry.credit);
          } else {
            // Liabilities, Equity, Revenues increase with Credit
            coaItem.balance += (entry.credit - entry.debit);
          }
        }
      });
      set(KEYS.ACCOUNTS, coaList);
    }
  },

  // Helper to construct real dynamic Day Book items
  getDayBook: () => {
    const list: Array<{ date: string; reference: string; details: string; totalDebit: number; totalCredit: number; type: string }> = [];
    db.getVouchers().forEach(v => {
      let dSum = 0;
      let cSum = 0;
      v.entries.forEach(e => {
        dSum += e.debit;
        cSum += e.credit;
      });
      list.push({
        date: v.date,
        reference: v.voucherNo,
        details: v.narration,
        totalDebit: dSum,
        totalCredit: cSum,
        type: v.voucherType
      });
    });
    return list.reverse();
  },

  // Dynamic ledger reports
  getLedgerForAccount: (accountId: string) => {
    const journals = db.getVouchers().filter(v => v.status === "Posted");
    const account = db.getAccounts().find(a => a.id === accountId);
    let runningBalance = 0;
    const entries: Array<{ date: string; voucherNo: string; narration: string; debit: number; credit: number; balance: number }> = [];

    journals.forEach(v => {
      v.entries.forEach(e => {
        if (e.accountId === accountId) {
          if (account?.category === "Asset" || account?.category === "Expense") {
            runningBalance += (e.debit - e.credit);
          } else {
            runningBalance += (e.credit - e.debit);
          }
          entries.push({
            date: v.date,
            voucherNo: v.voucherNo,
            narration: e.narration || v.narration,
            debit: e.debit,
            credit: e.credit,
            balance: runningBalance
          });
        }
      });
    });
    return { account, entries };
  },

  // Referrals
  getReferrals: () => get<ReferralContract[]>(KEYS.REFERRALS, defaultReferrals),
  saveReferral: (partner: ReferralContract) => {
    const list = db.getReferrals();
    const idx = list.findIndex(r => r.id === partner.id);
    if (idx >= 0) list[idx] = partner;
    else list.push(partner);
    set(KEYS.REFERRALS, list);
    db.log("admin", "ADMIN", "Update Referral Contract", "CLINIC", `Adjusted referral statistics for partner ${partner.partnerName}`);
    return partner;
  },

  // Feedback Reports
  getFeedbacks: () => get<PatientFeedback[]>(KEYS.FEEDBACKS, defaultFeedbacks),
  saveFeedback: (fb: PatientFeedback) => {
    const list = db.getFeedbacks();
    const idx = list.findIndex(f => f.id === fb.id);
    if (idx >= 0) list[idx] = fb;
    else list.push(fb);
    set(KEYS.FEEDBACKS, list);
    db.log("receptionist", "RECEPTIONIST", "Patient Feedback Logged", "RECEPTION", `Registered satisfaction rating (${fb.rating} stars) for ${fb.patientName}`);
    return fb;
  },

  // Backup Engine
  getBackupRecords: () => get<BackupRecord[]>(KEYS.BACKUPS, defaultBackups).reverse(),
  addBackupRecord: (rec: BackupRecord) => {
    const list = get<BackupRecord[]>(KEYS.BACKUPS, defaultBackups);
    list.push(rec);
    set(KEYS.BACKUPS, list);
  },
  triggerBackup: (target: string, type: "Manual" | "Scheduled" | "Automatic") => {
    const timestamp = new Date().toISOString();
    const formatted = timestamp.substring(0,10).replace(/-/g,"");
    const fileName = `HMLMS_SAFE_${type.toUpperCase()}_EXPORT_${formatted}_${Math.floor(Math.random() * 900 + 100)}.json`;
    
    // Simulate compressing state size
    const stateObj = {
      config: db.getConfig(),
      patients: db.getPatients(),
      vouchers: db.getVouchers(),
      lab_orders: db.getLabOrders(),
      radiology_orders: db.getRadiologyOrders(),
      logs: get<AuditLog[]>(KEYS.AUDIT_LOGS, [])
    };
    const sizeBytes = JSON.stringify(stateObj).length;

    const record: BackupRecord = {
      id: generateId("b_"),
      timestamp,
      fileName,
      sizeBytes,
      target,
      type,
      status: "Verified_OK"
    };

    db.addBackupRecord(record);
    db.log("admin", "ADMIN", "Trigger Recovery Backup", "SYSTEM", `Constructed complete clinical point database state to target store: [${target}] as file: ${fileName}`);
    return record;
  },
  restoreBackup: (fileContent: string) => {
    try {
      const parsed = JSON.parse(fileContent);
      if (parsed.patients && parsed.config) {
        db.log("admin", "ADMIN", "Database Integrity Restored", "SYSTEM", "Imported general backup schema catalog. Restored patient registers.");
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  // Clinical Audit Logs
  getAuditLogs: () => get<AuditLog[]>(KEYS.AUDIT_LOGS, defaultAuditLogs).slice().reverse(),
  log: (username: string, role: string, action: string, module: string, details: string) => {
    const list = get<AuditLog[]>(KEYS.AUDIT_LOGS, defaultAuditLogs);
    const newLog: AuditLog = {
      id: generateId("log_"),
      timestamp: new Date().toISOString(),
      username: username || "anonymous",
      role: (role as UserRole) || "RECEPTIONIST",
      action,
      module,
      details
    };
    list.push(newLog);
    set(KEYS.AUDIT_LOGS, list);
  },
  clearAuditLogs: () => {
    set(KEYS.AUDIT_LOGS, []);
    db.log("admin", "ADMIN", "Manual Logs Pruning", "SYSTEM", "Audit logging logs manually clear wiped.");
  }
};
