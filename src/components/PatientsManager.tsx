/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { UserPlus, Search, Edit2, History, AlertCircle, FileSpreadsheet, ChevronRight, X } from "lucide-react";
import { Patient, OPDVisit, LabOrder } from "../types";
import { Language, translations } from "../translations";
import { generateId } from "../dbMock";

interface PatientsManagerProps {
  lang: Language;
  patients: Patient[];
  visits: OPDVisit[];
  orders: LabOrder[];
  onSavePatient: (patient: Patient) => void;
}

export default function PatientsManager({
  lang,
  patients,
  visits,
  orders,
  onSavePatient
}: PatientsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState<Patient | null>(null);
  
  // Form States
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");

  const t = (key: keyof typeof translations["en"]) => {
    return translations[lang][key] || translations["en"][key];
  };

  // Filter patients based on search
  const filteredPatients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return patients;
    return patients.filter((p) => {
      return (
        p.mrn.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term) ||
        p.phone.includes(term) ||
        p.address.toLowerCase().includes(term)
      );
    });
  }, [patients, searchTerm]);

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age || !phone) {
      alert("Please fill all required fields (Name, Age, Phone)");
      return;
    }

    let nextMRN = "";
    if (editingPatient) {
      nextMRN = editingPatient.mrn;
    } else {
      // Generate linear MRN
      const count = patients.length + 1;
      nextMRN = `MRN-${count.toString().padStart(4, "0")}`;
    }

    const patientRecord: Patient = {
      id: editingPatient ? editingPatient.id : generateId("pat_"),
      mrn: nextMRN,
      name,
      age: Number(age),
      gender,
      phone,
      address,
      bloodGroup: bloodGroup || undefined,
      createdAt: editingPatient ? editingPatient.createdAt : new Date().toISOString()
    };

    onSavePatient(patientRecord);
    
    // Reset Form
    setIsFormOpen(false);
    setEditingPatient(null);
    setName("");
    setAge("");
    setGender("Male");
    setPhone("");
    setAddress("");
    setBloodGroup("");
  };

  const startEdit = (p: Patient) => {
    setEditingPatient(p);
    setName(p.name);
    setAge(p.age);
    setGender(p.gender);
    setPhone(p.phone);
    setAddress(p.address);
    setBloodGroup(p.bloodGroup || "");
    setIsFormOpen(true);
  };

  // Compute patient history logs
  const patientHistory = useMemo(() => {
    if (!selectedPatientForHistory) return { visits: [], orders: [] };
    const pVisits = visits.filter(v => v.patientId === selectedPatientForHistory.id).reverse();
    const pOrders = orders.filter(o => o.patientId === selectedPatientForHistory.id).reverse();
    return { visits: pVisits, orders: pOrders };
  }, [selectedPatientForHistory, visits, orders]);

  return (
    <div className="space-y-6" id="patient-manager-wrapper">
      
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4" id="patient-search-action-bar">
        
        {/* Search Input bar */}
        <div className="relative w-full sm:max-w-md" id="search-input-field">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            className="w-full text-slate-700 bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-hidden focus:border-blue-500 shadow-xs focus:ring-1 focus:ring-blue-500/30 transition-all font-medium"
            placeholder={t("searchPatientPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Add Patient Button */}
        <button
          onClick={() => {
            setEditingPatient(null);
            setIsFormOpen(true);
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          id="btn-register-patient"
        >
          <UserPlus className="w-4 h-4" />
          {t("registerPatient")}
        </button>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="patient-workspace">
        
        {/* Patient Listing Table */}
        <div className="lg:col-span-2 border border-slate-100 bg-white rounded-2xl shadow-sm overflow-hidden" id="patients-list-table-box">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest">{t("patients")}</h3>
            <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full">
              {filteredPatients.length} {lang === "en" ? "Profiles" : "فائلیں"}
            </span>
          </div>

          <div className="overflow-x-auto" id="patients-list-table-scroll">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] text-slate-400 font-bold uppercase border-b border-slate-100">
                  <th className="p-3.5">{t("mrn")}</th>
                  <th className="p-3.5">{t("patientName")}</th>
                  <th className="p-3.5 text-center">{t("age")} / {t("gender")}</th>
                  <th className="p-3.5">{t("phone")}</th>
                  <th className="p-3.5 text-center">{t("bloodGroup")}</th>
                  <th className="p-3.5 text-right">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((p) => (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-slate-50/50 transition-colors pointer-events-auto ${
                        selectedPatientForHistory?.id === p.id ? "bg-blue-50/20" : ""
                      }`}
                    >
                      <td className="p-3.5 font-bold text-slate-800">{p.mrn}</td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="font-bold">{p.age}</span>
                        <span className="text-slate-400 font-medium"> Yrs / </span>
                        <span className="font-medium text-slate-500">{p.gender === "Male" ? "M" : p.gender === "Female" ? "F" : "O"}</span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-600 font-mono">{p.phone}</td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-sm font-bold text-[10px] ${
                          p.bloodGroup ? "bg-red-50 text-red-600 border border-red-100" : "text-slate-300"
                        }`}>
                          {p.bloodGroup || "N/A"}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => startEdit(p)}
                          className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-2 py-1 rounded-sm"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setSelectedPatientForHistory(p)}
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-800 font-bold bg-emerald-50 px-2 py-1 rounded-sm cursor-pointer"
                          title="Patient History"
                        >
                          <History className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      {t("noData")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* History Panel or Instructions Panel */}
        <div className="border border-slate-100 bg-white rounded-2xl p-5 shadow-sm space-y-4" id="patient-history-side-panel">
          {selectedPatientForHistory ? (
            <div className="space-y-4" id="active-history-view">
              
              {/* Header with Close */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3" id="history-panel-header">
                <div>
                  <h4 className="font-bold text-slate-800 leading-tight">{selectedPatientForHistory.name}</h4>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">{selectedPatientForHistory.mrn}</p>
                </div>
                <button 
                  onClick={() => setSelectedPatientForHistory(null)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Patient Basic Detail Capsule */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block">{t("phone")}</span>
                  <span className="font-bold text-slate-700 font-mono">{selectedPatientForHistory.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t("address")}</span>
                  <span className="font-bold text-slate-700 break-words">{selectedPatientForHistory.address}</span>
                </div>
              </div>

              {/* Dynamic Tabs list: OPD History & Lab Tests */}
              <div className="space-y-4">
                
                {/* Visits List */}
                <div className="space-y-2">
                  <h5 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3 h-3 text-blue-500" />
                    {lang === "en" ? "OPD Consultation Logs" : "او پی ڈی پرچیاں تاریخ"}
                  </h5>
                  <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto pr-1">
                    {patientHistory.visits.length > 0 ? (
                      patientHistory.visits.map((vis) => (
                        <div key={vis.id} className="py-2 text-[11px] space-y-1">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-slate-800">{vis.tokenNumber}</span>
                            <span className="text-blue-600">Rs. {vis.fee}</span>
                          </div>
                          <p className="text-slate-500 font-medium">{vis.symptoms || "Normal consultation"}</p>
                          <div className="text-[10px] text-slate-400 flex justify-between">
                            <span>Vitals: BP {vis.vitals.bp || "-"}, Temp {vis.vitals.temp || "-"}</span>
                            <span className="bg-emerald-50 text-emerald-600 px-1.5 rounded">{vis.status}</span>
                          </div>
                          {vis.prescription && (
                            <div className="mt-1 bg-slate-50/50 p-1.5 rounded border border-slate-100 text-[10px] space-y-0.5">
                              <p className="font-bold text-teal-800">Diag: {vis.prescription.diagnosis}</p>
                              <p className="text-slate-600">Meds: {vis.prescription.medicines.map(m => m.name).join(", ")}</p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-300 text-center py-4">{lang === "en" ? "No OPD visits registered." : "کوئی ٹوکن ریکارڈ نہیں ملا"}</p>
                    )}
                  </div>
                </div>

                {/* Lab Orders List */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h5 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <History className="w-3 h-3 text-purple-500" />
                    {lang === "en" ? "Laboratory Investigations" : "لیبارٹری ٹیسٹس تاریخ"}
                  </h5>
                  <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto pr-1">
                    {patientHistory.orders.length > 0 ? (
                      patientHistory.orders.map((ord) => (
                        <div key={ord.id} className="py-2 text-[11px] space-y-1">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-slate-800 font-mono">{ord.barcode}</span>
                            <span className="text-purple-600">{ord.status}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex justify-between">
                            <span>Ordered: {new Date(ord.orderedAt).toLocaleDateString()}</span>
                            {ord.validatedAt && <span className="text-green-600 font-bold">Meticulously Signed</span>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-300 text-center py-4">{lang === "en" ? "No laboratory orders yet." : "کوئی ٹیسٹ آرڈر درج نہیں"}</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-300 space-y-2" id="empty-history-helper">
              <History className="w-10 h-10 stroke-1 text-slate-200" />
              <div>
                <h5 className="font-bold text-xs text-slate-400">{lang === "en" ? "Clinician Viewport Panel" : "مریض کی تفصیلات"}</h5>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                  {lang === "en" 
                    ? "Click the clock icon next to any patient to explore their diagnostic logs, past prescriptions, BP metrics, and outstanding payments."
                    : "کسی بھی مریض کی سابقہ رپورٹس، پریسکرپشن، اور او پی ڈی پرچیوں کی تفصیل دیکھنے کیلئے ہسٹری آئیکن پر کلک کریں"
                  }
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Patient Register Modal / Form Overlap */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="patient-registration-modal">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100">
            
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                {editingPatient ? t("editPatient") : t("registerPatient")}
              </h4>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                
                {/* English Name (Required) */}
                <div className="col-span-2 space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t("patientName")} <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                    placeholder="e.g. Tariq Mehmood"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

              </div>

              <div className="grid grid-cols-3 gap-4">
                
                {/* Age */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t("age")} <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={150}
                    className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                    placeholder="Years"
                    value={age}
                    onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t("gender")}</label>
                  <select
                    className="w-full text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                  >
                    <option value="Male">{t("male")}</option>
                    <option value="Female">{t("female")}</option>
                    <option value="Other">{t("other")}</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t("bloodGroup")}</label>
                  <select
                    className="w-full text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all font-bold"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                  >
                    <option value="">Unknown</option>
                    <option value="A+">A +ve</option>
                    <option value="A-">A -ve</option>
                    <option value="B+">B +ve</option>
                    <option value="B-">B -ve</option>
                    <option value="O+">O +ve</option>
                    <option value="O-">O -ve</option>
                    <option value="AB+">AB +ve</option>
                    <option value="AB-">AB -ve</option>
                  </select>
                </div>

              </div>

              {/* Mobile Phone (Required) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t("phone")} <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all font-mono font-bold"
                  placeholder="e.g. 0300-1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* residential address */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t("address")}</label>
                <textarea
                  className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all font-medium"
                  rows={2}
                  placeholder="e.g. Street # 3, Green Avenue, Lahore"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="p-3 bg-blue-50/40 rounded-xl flex items-start gap-2 border border-blue-50">
                <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-600">
                  {lang === "en" 
                    ? "Patient details are written only to local device sandbox files. MRN registers line-by-line automatically."
                    : "مریض کا فائل نمبر سسٹم خود بخود باری سے مہیّا کرے گا۔ ریکارڈ مکمل طور پر آف لائن محفوظ ہوتا ہے۔"
                  }
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100" id="form-buttons-row">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingPatient(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  {t("save")}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
