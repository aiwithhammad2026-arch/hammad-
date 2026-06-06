/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { initDatabase, db, generateId } from "./dbMock";
import { 
  Patient, 
  Doctor, 
  OPDVisit, 
  LabTemplate, 
  LabOrder, 
  Invoice, 
  AuditLog, 
  User, 
  SystemConfig, 
  UserRole,
  RadiologyOrder,
  FinancialVoucher,
  ReferralContract,
  PatientFeedback,
  BackupRecord
} from "./types";
import { Language, translations } from "./translations";

// Components
import DashboardHome from "./components/DashboardHome";
import PatientsManager from "./components/PatientsManager";
import DoctorsManager from "./components/DoctorsManager";
import OPDDesk from "./components/OPDDesk";
import LabInformationSystem from "./components/LabInformationSystem";
import BillingManager from "./components/BillingManager";
import SettingsTab from "./components/SettingsTab";
import AuditLogsTab from "./components/AuditLogsTab";

// New Core Modules
import FinanceAccounting from "./components/FinanceAccounting";
import RadiologyManager from "./components/RadiologyManager";
import UserManager from "./components/UserManager";
import ReferralsManager from "./components/ReferralsManager";
import PatientFeedbackDesk from "./components/PatientFeedbackDesk";
import BackupRestoreWizard from "./components/BackupRestoreWizard";

// Iconography
import { 
  Building, 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  Activity, 
  FlaskConical, 
  Receipt, 
  ShieldAlert, 
  Settings, 
  Clock, 
  Fingerprint,
  UserCheck,
  FileSpreadsheet,
  Scan,
  UserCog,
  Network,
  Heart,
  Database
} from "lucide-react";

export default function App() {
  // Localization: English Only supported to avoid layout complexity
  const [lang, setLang] = useState<Language>("en");
  
  // Real Local state for multi-role profiles with additional Accountant and Radiologist values
  const [activeRole, setActiveRole] = useState<UserRole>("ADMIN");

  // Selection Tab controlling our 15 Monolith modules
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Dynamic ERP States
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [visits, setVisits] = useState<OPDVisit[]>([]);
  const [templates, setTemplates] = useState<LabTemplate[]>([]);
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [radiologyOrders, setRadiologyOrders] = useState<RadiologyOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    hospitalName: "",
    hospitalUrduName: "",
    tagline: "",
    phone: "",
    address: "",
    hardware: {
      thermalPrinterEnabled: true,
      laserPrinterEnabled: true,
      barcodePrinterEnabled: true,
      barcodeScannerEnabled: true,
      receiptPrinterType: "3Inch_Thermal"
    },
    autoBackupIntervalHours: 12
  });

  // Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Init Data and Setup Clock Thread
  useEffect(() => {
    initDatabase();
    refreshAllData();

    // Setup active current simulated session profile
    const activeUsr = db.getUsers().find(u => u.role === activeRole);
    if (activeUsr) {
      db.setCurrentUser({ ...activeUsr, isLoggedIn: true });
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [activeRole]);

  const refreshAllData = () => {
    setPatients(db.getPatients());
    setDoctors(db.getDoctors());
    setVisits(db.getOPDVisits());
    setTemplates(db.getTemplates());
    setOrders(db.getLabOrders());
    setRadiologyOrders(db.getRadiologyOrders());
    setInvoices(db.getInvoices());
    setLogs(db.getAuditLogs());
    setSystemConfig(db.getConfig());
  };

  const t = (key: keyof typeof translations["en"]) => {
    return translations[lang][key] || translations["en"][key];
  };

  // State operations bound to ERP persistence helper
  const handleSavePatient = (p: Patient) => {
    db.savePatient(p);
    refreshAllData();
  };

  const handleSaveDoctor = (d: Doctor) => {
    db.saveDoctor(d);
    refreshAllData();
  };

  const handleSaveVisit = (v: OPDVisit) => {
    db.saveOPDVisit(v);
    
    // Auto post consultation details to Journal entries when doctors write prescriptions!
    if (v.status === "Completed" && v.prescription) {
      // Find Doctor object to check splits share
      const doc = doctors.find(d => d.id === v.doctorId);
      if (doc) {
        const docSplitShare = Math.round((v.fee * doc.sharePercentage) / 100);
        const uniqueVNo = `JV-OPD-${Date.now().toString().substring(8)}`;
        
        db.saveVoucher({
          id: generateId("fvc_"),
          voucherNo: uniqueVNo,
          voucherType: "Journal",
          date: new Date().toISOString(),
          narration: `Consultation fee split posted for ${doc.name} (Patient visit ${v.tokenNumber})`,
          status: "Posted",
          recordedBy: "admin",
          entries: [
            // Debit: OPD tickets Consultation fee revenues
            { accountId: "coa-rev-opd", debit: docSplitShare, credit: 0 },
            // Credit: Doctors share payable split balance
            { accountId: "coa-share-pay", debit: 0, credit: docSplitShare }
          ]
        });
      }
    }

    refreshAllData();
  };

  const handleSaveTemplate = (tmpl: LabTemplate) => {
    db.saveTemplate(tmpl);
    refreshAllData();
  };

  const handleSaveOrder = (o: LabOrder) => {
    db.saveLabOrder(o);
    refreshAllData();
  };

  const handleSaveInvoice = (inv: Invoice) => {
    db.saveInvoice(inv);
    
    // Auto log Double entry bookkeeping transaction vouchers upon receipt collection!
    const serial = Date.now().toString().substring(8);
    const voucherNo = `RV-BILL-${serial}`;
    
    const entries = [
      { accountId: "coa-cash", debit: inv.paidAmount, credit: 0 }
    ];

    if (inv.dues > 0) {
      entries.push({ accountId: "coa-recv", debit: inv.dues, credit: 0 });
    }

    inv.items.forEach(itm => {
      if (itm.type === "OPD_Visit") {
        entries.push({ accountId: "coa-rev-opd", debit: 0, credit: itm.amount });
      } else if (itm.type === "Lab_Test") {
        entries.push({ accountId: "coa-rev-lab", debit: 0, credit: itm.amount });
      } else {
        entries.push({ accountId: "coa-rev-rad", debit: 0, credit: itm.amount });
      }
    });

    db.saveVoucher({
      id: generateId("fvc_"),
      voucherNo,
      voucherType: "Receipt",
      date: new Date().toISOString(),
      narration: `Simulated Cash Collection for invoice reference ${inv.invoiceNumber}`,
      status: "Posted",
      recordedBy: db.getCurrentUser()?.name || "receptionist_ali",
      entries
    });

    refreshAllData();
  };

  const handleClearLogs = () => {
    db.clearAuditLogs();
    refreshAllData();
  };

  const handleSaveConfig = (config: SystemConfig) => {
    db.saveConfig(config);
    refreshAllData();
  };

  const autoGenerateOPDInvoice = (patientId: string, itemType: "OPD_Visit", refId: string, cost: number, description: string) => {
    const serial = invoices.length + 1;
    const invNo = `INV-2606-${serial.toString().padStart(3, "0")}`;

    const newInvoice: Invoice = {
      id: generateId("inv_"),
      invoiceNumber: invNo,
      patientId,
      items: [
        {
          id: `item_${Date.now()}`,
          type: itemType,
          description,
          referenceId: refId,
          amount: cost
        }
      ],
      subtotal: cost,
      discount: 0,
      total: cost,
      paidAmount: cost,
      dues: 0,
      status: "Paid",
      createdAt: new Date().toISOString(),
      cashier: db.getCurrentUser().name || "receptionist_ali"
    };

    handleSaveInvoice(newInvoice);
  };

  // Badges calculations
  const badges = useMemo(() => {
    return {
      waitingVisits: visits.filter(v => v.status === "Waiting").length,
      pendingSamples: orders.filter(o => o.status === "Pending_Sample").length,
      pendingImaging: radiologyOrders.filter(r => r.status === "Scheduled" || r.status === "Image_Uploaded").length,
      outstandingInvoices: invoices.filter(i => i.status === "Partially_Paid" || i.status === "Unpaid").length
    };
  }, [visits, orders, radiologyOrders, invoices]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-850 flex flex-col font-sans" id="applet-viewport-frame">
      
      {/* 1. ROLE AND SIMULATION RUNNER RIBBON */}
      <div 
        className="bg-slate-900 text-white text-xs px-4 py-2 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0"
        id="multi-role-control-ribbon"
      >
        <div className="flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span className="font-extrabold tracking-wide text-[10px] text-slate-350">
            LAN PROFILE EMULATOR CONSOLE
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5" id="roles-selectors-strip">
          <span className="text-[9px] text-slate-400 uppercase font-black mr-1">{t("role")}:</span>
          
          {(["ADMIN", "RECEPTIONIST", "DOCTOR", "LAB_TECH", "RADIOLOGIST", "ACCOUNTANT"] as UserRole[]).map((role) => (
            <button
              key={role}
              onClick={() => {
                setActiveRole(role);
                db.log("emulator", "SYSTEM", "Switch Role", "AUTH", `Switched emulation viewport role to ${role}`);
                refreshAllData();
              }}
              className={`px-3 py-1 rounded-full text-[9px] font-black transition-all cursor-pointer ${
                activeRole === role 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* 2. PRIMARY CLINICAL HEADER */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 shadow-xs" id="app-navigation-header">
        
        {/* Brand identity labels (English Only) */}
        <div className="flex items-center gap-3.5" id="hospital-brand-badge">
          <div className="p-3 bg-red-500 text-white rounded-2xl shadow-sm">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-md sm:text-lg font-black tracking-tight text-slate-900 leading-tight">
              {systemConfig.hospitalName || "Madina General Hospital & Laboratory"}
            </h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">
              {systemConfig.tagline || t("tagline")}
            </p>
          </div>
        </div>

        {/* Right tools side: Digital local clock */}
        <div className="flex items-center gap-4 text-xs font-semibold" id="header-telemetry">
          
          {/* LAN Sync Status */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100 text-emerald-700 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>LAN MULTI-USER INSTANCE</span>
          </div>

          <div className="flex items-center gap-1 text-slate-500 font-mono text-[11px]" id="utc-clock">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>

        </div>
      </header>

      {/* 3. WORKING CONTENT CORE PANELS SIDEBAR */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden" id="working-wrapper">
        
        {/* SIDEBAR NAVIGATION WORKSPACE MENU */}
        <nav className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 p-4 space-y-4" id="sidebar-navigator">
          <div className="space-y-1.5 overflow-y-auto max-h-[80vh] scrollbar-thin">
            <span className="text-[9px] text-slate-500 block uppercase font-black tracking-widest px-3 mb-2">Workspace Navigation</span>
            
            {/* Dashboard */}
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "dashboard" ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-400 hover:text-slate-250"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-slate-400" />
                <span>{t("dashboard")}</span>
              </span>
            </button>

            {/* Patients Registry */}
            <button
              onClick={() => setActiveTab("patients")}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "patients" ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-400 hover:text-slate-250"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-slate-400" />
                <span>Patient Registry</span>
              </span>
            </button>

            {/* Doctors Directory */}
            {activeRole === "ADMIN" && (
              <button
                onClick={() => setActiveTab("doctors")}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "doctors" ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-400 hover:text-slate-250"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <UserSquare2 className="w-4 h-4 text-slate-400" />
                  <span>Doctors Directory</span>
                </span>
              </button>
            )}

            {/* OPD Consultation queue */}
            {(activeRole === "RECEPTIONIST" || activeRole === "DOCTOR" || activeRole === "ADMIN") && (
              <button
                onClick={() => setActiveTab("opd")}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "opd" ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-400 hover:text-slate-250"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span>OPD Desk</span>
                </span>
                {badges.waitingVisits > 0 && (
                  <span className="bg-amber-500 text-white rounded-full text-[9px] font-black p-1 px-2 leading-none">
                    {badges.waitingVisits}
                  </span>
                )}
              </button>
            )}

            {/* LIS Lab Information system */}
            {(activeRole === "LAB_TECH" || activeRole === "DOCTOR" || activeRole === "ADMIN") && (
              <button
                onClick={() => setActiveTab("lab")}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "lab" ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-400 hover:text-slate-250"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <FlaskConical className="w-4 h-4 text-slate-400" />
                  <span>Laboratory Dept</span>
                </span>
                {badges.pendingSamples > 0 && (
                  <span className="bg-blue-500 text-white rounded-full text-[9px] font-black p-1 px-2 leading-none">
                    {badges.pendingSamples}
                  </span>
                )}
              </button>
            )}

            {/* Radiology Module */}
            {(activeRole === "RADIOLOGIST" || activeRole === "ADMIN" || activeRole === "RECEPTIONIST") && (
              <button
                onClick={() => setActiveTab("radiology")}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "radiology" ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-400 hover:text-slate-250"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Scan className="w-4 h-4 text-slate-400" />
                  <span>Radiology Module</span>
                </span>
                {badges.pendingImaging > 0 && (
                  <span className="bg-indigo-500 text-white rounded-full text-[9px] font-black p-1 px-2 leading-none">
                    {badges.pendingImaging}
                  </span>
                )}
              </button>
            )}

            {/* Billing cashier ledger */}
            {(activeRole === "RECEPTIONIST" || activeRole === "ADMIN" || activeRole === "ACCOUNTANT") && (
              <button
                onClick={() => setActiveTab("billing")}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "billing" ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-400 hover:text-slate-250"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 text-slate-400" />
                  <span>Billing Cashier</span>
                </span>
                {badges.outstandingInvoices > 0 && (
                  <span className="bg-rose-500 text-white rounded-full text-[9px] font-black p-1 px-2 leading-none">
                    {badges.outstandingInvoices}
                  </span>
                )}
              </button>
            )}

            {/* ERP Financial Accounting */}
            {(activeRole === "ACCOUNTANT" || activeRole === "ADMIN") && (
              <button
                onClick={() => setActiveTab("finance")}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "finance" ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-400 hover:text-slate-250"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                  <span>Financial Ledger</span>
                </span>
              </button>
            )}

            {/* Partner Referrals */}
            {(activeRole === "ADMIN" || activeRole === "ACCOUNTANT" || activeRole === "RECEPTIONIST") && (
              <button
                onClick={() => setActiveTab("referrals")}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "referrals" ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-400 hover:text-slate-250"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Network className="w-4 h-4 text-slate-400" />
                  <span>Partner Referrals</span>
                </span>
              </button>
            )}

            {/* Patient QA Feedbacks */}
            {(activeRole === "RECEPTIONIST" || activeRole === "ADMIN") && (
              <button
                onClick={() => setActiveTab("feedback")}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "feedback" ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-400 hover:text-slate-250"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Heart className="w-4 h-4 text-slate-400" />
                  <span>Patient Feedback</span>
                </span>
              </button>
            )}

            {/* User Security Management */}
            {activeRole === "ADMIN" && (
              <button
                onClick={() => setActiveTab("usermanager")}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "usermanager" ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-400 hover:text-slate-250"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <UserCog className="w-4 h-4 text-slate-400" />
                  <span>Security & Roles</span>
                </span>
              </button>
            )}

            {/* Audit event logging panel */}
            {activeRole === "ADMIN" && (
              <button
                onClick={() => setActiveTab("audit")}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "audit" ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-400 hover:text-slate-250"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-slate-400" />
                  <span>System Audit Logs</span>
                </span>
              </button>
            )}

            {/* Backup & recovery wizard */}
            {(activeRole === "ADMIN" || activeRole === "ACCOUNTANT") && (
              <button
                onClick={() => setActiveTab("backups")}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "backups" ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-400 hover:text-slate-250"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-slate-400" />
                  <span>Backup & Restore</span>
                </span>
              </button>
            )}

            {/* Hospital settings */}
            {activeRole === "ADMIN" && (
              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "settings" ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-400 hover:text-slate-250"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>System Config</span>
                </span>
              </button>
            )}

          </div>

          {/* User profile indicators in footer bottom */}
          <div className="border-t border-slate-800 pt-4 flex flex-col space-y-1 text-slate-500 text-[10px] leading-snug">
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-slate-400" />
              <span>Active Emulated Account</span>
            </div>
            <strong className="text-slate-300 font-extrabold block">
              {activeRole === "ADMIN" && "Dr. Sultan Pasha (Director)"}
              {activeRole === "RECEPTIONIST" && "Irfan Sadiq (Main Cashier)"}
              {activeRole === "DOCTOR" && "Dr. Muhammad Ali (Consultant)"}
              {activeRole === "LAB_TECH" && "Zahid Mahmood (Pathologist)"}
              {activeRole === "RADIOLOGIST" && "Dr. Yasir Iqbal (Radiologist)"}
              {activeRole === "ACCOUNTANT" && "Zubair Hashmi (ERP Accountant)"}
            </strong>
          </div>
        </nav>

        {/* ACTIVE MODULE VIEW CONTAINER */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" id="active-panel-view">
          
          {activeTab === "dashboard" && (
            <DashboardHome
              lang={lang}
              patients={patients}
              doctors={doctors}
              visits={visits}
              orders={orders}
              invoices={invoices}
              onSelectTab={(tab) => {
                setActiveTab(tab);
              }}
            />
          )}

          {activeTab === "patients" && (
            <PatientsManager
              lang={lang}
              patients={patients}
              visits={visits}
              orders={orders}
              onSavePatient={handleSavePatient}
            />
          )}

          {activeTab === "doctors" && activeRole === "ADMIN" && (
            <DoctorsManager
              lang={lang}
              doctors={doctors}
              onSaveDoctor={handleSaveDoctor}
            />
          )}

          {activeTab === "opd" && (activeRole === "RECEPTIONIST" || activeRole === "DOCTOR" || activeRole === "ADMIN") && (
            <OPDDesk
              lang={lang}
              userRole={activeRole}
              patients={patients}
              doctors={doctors}
              visits={visits}
              onSaveVisit={handleSaveVisit}
              onGenerateInvoice={autoGenerateOPDInvoice}
            />
          )}

          {activeTab === "lab" && (activeRole === "LAB_TECH" || activeRole === "DOCTOR" || activeRole === "ADMIN") && (
            <LabInformationSystem
              lang={lang}
              userRole={activeRole}
              templates={templates}
              orders={orders}
              patients={patients}
              onSaveTemplate={handleSaveTemplate}
              onSaveOrder={handleSaveOrder}
            />
          )}

          {activeTab === "radiology" && (activeRole === "RADIOLOGIST" || activeRole === "ADMIN" || activeRole === "RECEPTIONIST") && (
            <RadiologyManager
              lang={lang}
              userRole={activeRole}
              />
          )}

          {activeTab === "billing" && (activeRole === "RECEPTIONIST" || activeRole === "ADMIN" || activeRole === "ACCOUNTANT") && (
            <BillingManager
              lang={lang}
              invoices={invoices}
              patients={patients}
              templates={templates}
              doctors={doctors}
              visits={visits}
              onSaveInvoice={handleSaveInvoice}
              onSaveLabOrder={handleSaveOrder}
            />
          )}

          {activeTab === "finance" && (activeRole === "ACCOUNTANT" || activeRole === "ADMIN") && (
            <FinanceAccounting
              lang={lang}
            />
          )}

          {activeTab === "referrals" && (activeRole === "ADMIN" || activeRole === "ACCOUNTANT" || activeRole === "RECEPTIONIST") && (
            <ReferralsManager
              lang={lang}
            />
          )}

          {activeTab === "feedback" && (activeRole === "RECEPTIONIST" || activeRole === "ADMIN") && (
            <PatientFeedbackDesk
              lang={lang}
            />
          )}

          {activeTab === "usermanager" && activeRole === "ADMIN" && (
            <UserManager
              lang={lang}
            />
          )}

          {activeTab === "audit" && activeRole === "ADMIN" && (
            <AuditLogsTab
              lang={lang}
              logs={logs}
              onClearLogs={handleClearLogs}
            />
          )}

          {activeTab === "backups" && (activeRole === "ADMIN" || activeRole === "ACCOUNTANT") && (
            <BackupRestoreWizard
              lang={lang}
            />
          )}

          {activeTab === "settings" && activeRole === "ADMIN" && (
            <SettingsTab
              lang={lang}
              config={systemConfig}
              onSaveConfig={handleSaveConfig}
            />
          )}

        </main>

      </div>
    </div>
  );
}
