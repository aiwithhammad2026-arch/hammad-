/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { ListPlus, Stethoscope, Clipboard, Plus, Trash2, Heart, HeartCrack, CheckCircle, Clock, LogOut, FileText, X, Printer } from "lucide-react";
import { Patient, Doctor, OPDVisit, OPDStatus, UserRole } from "../types";
import { Language, translations } from "../translations";
import { generateId } from "../dbMock";

interface OPDDeskProps {
  lang: Language;
  userRole: UserRole;
  patients: Patient[];
  doctors: Doctor[];
  visits: OPDVisit[];
  onSaveVisit: (visit: OPDVisit) => void;
  onGenerateInvoice?: (patientId: string, itemType: "OPD_Visit", refId: string, cost: number, description: string) => void;
}

export default function OPDDesk({
  lang,
  userRole,
  patients,
  doctors,
  visits,
  onSaveVisit,
  onGenerateInvoice
}: OPDDeskProps) {
  const [activeTab, setActiveTab] = useState<"issue" | "board">("board");
  
  // Registration form states
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [bp, setBp] = useState("");
  const [temp, setTemp] = useState("");
  const [pulse, setPulse] = useState("");
  const [weight, setWeight] = useState("");

  // Doctor portal states
  const [consultingVisit, setConsultingVisit] = useState<OPDVisit | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState<Array<{ name: string; dosage: string; duration: string }>>([
    { name: "", dosage: "", duration: "" }
  ]);
  const [prescriptionNotes, setPrescriptionNotes] = useState("");

  // Discharge summary states
  const [filterMode, setFilterMode] = useState<"active" | "archived">("active");
  const [dischargingVisit, setDischargingVisit] = useState<OPDVisit | null>(null);
  const [conditionAtDischarge, setConditionAtDischarge] = useState("Clinically Stable");
  const [dischargeAdvice, setDischargeAdvice] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [summaryNotes, setSummaryNotes] = useState("");
  const [previewDischargeVisit, setPreviewDischargeVisit] = useState<OPDVisit | null>(null);

  const handleInitiateDischarge = (v: OPDVisit) => {
    const patientName = patients.find(p => p.id === v.patientId)?.name || "Patient";
    const doctorName = doctors.find(d => d.id === v.doctorId)?.name || "Consultant";
    const diagnosisText = v.prescription?.diagnosis || "General medical assessment";
    const medList = v.prescription?.medicines && v.prescription.medicines.length > 0 
      ? v.prescription.medicines.map((m, i) => `${i + 1}. ${m.name} (${m.dosage}) for ${m.duration}`).join("\n")
      : "No continuous oral medications recommended.";

    const defaultAdvice = `1. Continuing medications:\n${medList}\n\n2. Light home diet, avoid physical stress.\n3. Take adequate fluids & rest.\n4. Follow up at clinic immediately if fever, dyspnea, or chest pain develops.`;

    const defaultNotes = `Patient ${patientName}, presenting with complaints of "${v.symptoms || "Normal Checkup"}", was evaluated by ${doctorName}.
Recorded vitals during triage: BP: ${v.vitals?.bp || "N/A"}, Temp: ${v.vitals?.temp || "N/A"}, Pulse: ${v.vitals?.pulse || "N/A"}.
Diagnostic interpretation: ${diagnosisText}.
Patient's overall clinical state was evaluated as stable. Patient has been successfully discharged with follow-up instructions and medications to be continued at home.`;

    const defaultFollowUp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    setDischargingVisit(v);
    setConditionAtDischarge("Recovered & Stable");
    setDischargeAdvice(defaultAdvice);
    setFollowUpDate(defaultFollowUp);
    setSummaryNotes(defaultNotes);
  };

  const handleConfirmDischarge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dischargingVisit) return;

    const updatedVisit: OPDVisit = {
      ...dischargingVisit,
      isArchived: true,
      dischargeSummary: {
        id: generateId("ds_"),
        dischargeDate: new Date().toISOString(),
        conditionAtDischarge,
        dischargeAdvice,
        followUpDate: followUpDate || undefined,
        summaryNotes: summaryNotes || undefined
      }
    };

    onSaveVisit(updatedVisit);
    setDischargingVisit(null);
    alert(`Patient ${patients.find(p => p.id === dischargingVisit.patientId)?.name || ""} has been successfully discharged.`);
  };

  const t = (key: keyof typeof translations["en"]) => {
    return translations[lang][key] || translations["en"][key];
  };

  // Auto-fill fee on doctor selection
  const selectedDoctorFee = useMemo(() => {
    const doc = doctors.find((d) => d.id === selectedDoctorId);
    return doc ? doc.fee : 0;
  }, [selectedDoctorId, doctors]);

  // Handle Token Issue
  const handleIssueTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedDoctorId) {
      alert("Please select both a Patient and a Doctor.");
      return;
    }

    const tokenIndex = visits.length + 101; // linear token numbering
    const tokenStr = `T-${tokenIndex}`;

    const newVisit: OPDVisit = {
      id: generateId("vis_"),
      tokenNumber: tokenStr,
      patientId: selectedPatientId,
      doctorId: selectedDoctorId,
      symptoms,
      vitals: {
        bp: bp || "N/A",
        temp: temp ? `${temp} °F` : "N/A",
        pulse: pulse ? `${pulse} bpm` : "N/A",
        weight: weight ? `${weight} kg` : "N/A"
      },
      fee: selectedDoctorFee,
      status: "Waiting",
      createdAt: new Date().toISOString()
    };

    onSaveVisit(newVisit);

    // Call dynamic invoice generator if receptionist / admin issues it
    if (onGenerateInvoice) {
      const p = patients.find(pat => pat.id === selectedPatientId);
      const d = doctors.find(doc => doc.id === selectedDoctorId);
      const desc = `${t("opd")} consultation - ${d ? d.name : "Consultant"}`;
      onGenerateInvoice(selectedPatientId, "OPD_Visit", newVisit.id, selectedDoctorFee, desc);
    }

    // Reset Form
    setSelectedPatientId("");
    setSelectedDoctorId("");
    setSymptoms("");
    setBp("");
    setTemp("");
    setPulse("");
    setWeight("");
    setActiveTab("board");

    // Show feedback popup
    alert(`Token ${tokenStr} issued successfully! Invoice generated under Billing panel.`);
  };

  // Medicine prescription helpers
  const handleAddMedRow = () => {
    setMedicines([...medicines, { name: "", dosage: "", duration: "" }]);
  };

  const handleMedRowChange = (index: number, field: string, value: string) => {
    const copy = [...medicines];
    copy[index] = { ...copy[index], [field]: value };
    setMedicines(copy);
  };

  const handleRemoveMedRow = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  // Doctor submits prescription diagnosis & marks as completed
  const handlePrescriptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultingVisit) return;
    if (!diagnosis.trim()) {
      alert("Please enter a clinical diagnosis or assessment.");
      return;
    }

    // Filter empty medicine rows
    const activeMeds = medicines.filter(m => m.name.trim() !== "");

    const updatedVisit: OPDVisit = {
      ...consultingVisit,
      status: "Completed",
      prescription: {
        diagnosis,
        medicines: activeMeds,
        notes: prescriptionNotes
      }
    };

    onSaveVisit(updatedVisit);
    setConsultingVisit(null);
    setDiagnosis("");
    setMedicines([{ name: "", dosage: "", duration: "" }]);
    setPrescriptionNotes("");
    alert("Clinical prescription logged. Patient checked off.");
  };

  const startConsultation = (vis: OPDVisit) => {
    setConsultingVisit(vis);
    setDiagnosis(vis.prescription?.diagnosis || "");
    setPrescriptionNotes(vis.prescription?.notes || "");
    if (vis.prescription?.medicines && vis.prescription.medicines.length > 0) {
      setMedicines(vis.prescription.medicines);
    } else {
      setMedicines([{ name: "", dosage: "", duration: "" }]);
    }
    
    // Update status to In Consultation automatically
    const updated = { ...vis, status: "In_Consultation" as OPDStatus };
    onSaveVisit(updated);
  };

  return (
    <div className="space-y-6" id="opd-workspace-main">
      
      {/* Tab select bar */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3" id="opd-tabs-row">
        <button
          onClick={() => {
            setActiveTab("board");
            setConsultingVisit(null);
          }}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "board" && !consultingVisit
              ? "bg-slate-900 text-white"
              : "bg-slate-50 text-slate-500 hover:bg-slate-100"
          }`}
        >
          {t("tokenList")}
        </button>
        <button
          onClick={() => {
            setActiveTab("issue");
            setConsultingVisit(null);
          }}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "issue" && !consultingVisit
              ? "bg-slate-900 text-white"
              : "bg-slate-50 text-slate-500 hover:bg-slate-100"
          }`}
        >
          {t("issueToken")}
        </button>
      </div>

      {/* RENDER CONSULTATION VIEW (If Doctor clicked on active patient) */}
      {consultingVisit && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="clinical-consultation-arena">
          
          {/* Patient Details & Vitals overview */}
          <div className="border border-slate-100 bg-white rounded-2xl p-5 shadow-sm space-y-4 h-fit">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-sm text-[9px] uppercase tracking-wider">{consultingVisit.tokenNumber}</span>
                <h4 className="font-bold text-slate-800 text-sm mt-1">
                  {patients.find(p => p.id === consultingVisit.patientId)?.name || "Patient Profile"}
                </h4>
              </div>
              <span className="text-xs text-rose-500 font-bold bg-rose-50 rounded-full px-2 py-0.5">
                {t("inConsultation")}
              </span>
            </div>

            {/* Vitals metrics display */}
            <div className="space-y-3" id="vitals-display-strip">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                {t("vitals")}
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">{t("bp")}</span>
                  <span className="font-bold font-mono">{consultingVisit.vitals.bp}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">{t("temp")}</span>
                  <span className="font-bold font-mono">{consultingVisit.vitals.temp}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">{t("pulse")}</span>
                  <span className="font-bold font-mono">{consultingVisit.vitals.pulse}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">{t("weight")}</span>
                  <span className="font-bold font-mono">{consultingVisit.vitals.weight}</span>
                </div>
              </div>
            </div>

            {/* Clinical Symptoms */}
            <div className="space-y-1 bg-amber-50/50 border border-amber-100 p-3 rounded-xl">
              <span className="text-[10px] text-amber-600 block uppercase tracking-wider font-bold">{t("symptoms")}</span>
              <p className="text-slate-700 italic font-medium">"{consultingVisit.symptoms || "No clinical symptoms specified."}"</p>
            </div>
          </div>

          {/* Form to issue clinical prescription */}
          <div className="lg:col-span-2 border border-slate-100 bg-white rounded-2xl p-5 shadow-sm space-y-4" id="clinical-prescription-area">
            <h4 className="text-sm font-bold text-slate-800 leading-tight flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-500" />
              {t("addPrescription")}
            </h4>

            <form onSubmit={handlePrescriptionSubmit} className="space-y-4">
              
              {/* Clinical Diagnosis input */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t("diagnosis")} <span className="text-rose-500">*</span></label>
                <textarea
                  required
                  rows={2}
                  className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-xl p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                  placeholder="Enter medical assessment, clinical diagnosis..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </div>

              {/* Medication dynamic listing rows */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-indigo-50 pb-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{lang === "en" ? "Prescribed Medicines" : "مجوزہ ادویات"}</span>
                  <button
                    type="button"
                    onClick={handleAddMedRow}
                    className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] px-2 py-1 rounded"
                  >
                    <Plus className="w-3 h-3" />
                    {lang === "en" ? "Add Formulation" : "دوا شامل کریں"}
                  </button>
                </div>

                <div className="space-y-2" id="medication-rows-box">
                  {medicines.map((med, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      
                      {/* Medicine Name */}
                      <div className="col-span-5">
                        <input
                          type="text"
                          required
                          className="w-full text-[11px] text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                          placeholder="e.g. Tab Cardarone 100mg"
                          value={med.name}
                          onChange={(e) => handleMedRowChange(idx, "name", e.target.value)}
                        />
                      </div>

                      {/* Dosage details */}
                      <div className="col-span-4">
                        <input
                          type="text"
                          className="w-full text-[11px] text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all font-medium"
                          placeholder="dosage e.g. 1+0+1 after meal"
                          value={med.dosage}
                          onChange={(e) => handleMedRowChange(idx, "dosage", e.target.value)}
                        />
                      </div>

                      {/* Treatment Duration */}
                      <div className="col-span-2">
                        <input
                          type="text"
                          className="w-full text-[11px] text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all font-medium"
                          placeholder="e.g. 5 days"
                          value={med.duration}
                          onChange={(e) => handleMedRowChange(idx, "duration", e.target.value)}
                        />
                      </div>

                      {/* Remove Row button */}
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveMedRow(idx)}
                          disabled={medicines.length <= 1}
                          className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Private Physician Advisory notes */}
              <div className="space-y-1 pt-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t("prescriptionNotes")}</label>
                <textarea
                  rows={2}
                  className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-xl p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all font-medium"
                  placeholder="Rest instructions, dietary limits..."
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    // Revert Consultation state back to waiting
                    const rev = { ...consultingVisit, status: "Waiting" as OPDStatus };
                    onSaveVisit(rev);
                    setConsultingVisit(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  {lang === "en" ? "Print & Sign Clinical Report" : "نسخہ پرنٹ اور سائن کریں"}
                </button>
              </div>

            </form>
          </div>

        </div>
      )}

      {/* RENDER FRONT DESK REGISTER PERMIT (Issue Token) */}
      {activeTab === "issue" && !consultingVisit && (
        <div className="border border-slate-100 bg-white rounded-2xl max-w-2xl mx-auto p-6 shadow-sm space-y-4" id="issue-opd-ticket-wrapper">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-md font-bold text-slate-800 leading-tight">{t("issueToken")}</h4>
            <p className="text-xs text-slate-400">{lang === "en" ? "Add consultation lines and record initial vitals metrics" : "او پی ڈی پرچی اور مریض کی دیسی علامات درج کریں"}</p>
          </div>

          <form onSubmit={handleIssueTokenSubmit} className="space-y-4 text-xs">
            
            <div className="grid grid-cols-2 gap-4">
              
              {/* Select Patient Profile */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t("patients")} <span className="text-rose-500">*</span></label>
                <select
                  required
                  className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                >
                  <option value="">-- Choose Patient File --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.mrn} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Doctor Profile */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assign Doctor <span className="text-rose-500">*</span></label>
                <select
                  required
                  className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold animate-pulse-once"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                >
                  <option value="">-- Assign Clinical Specialist --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialization}) - Rs. {d.fee}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Vitals inputs */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-widest">{t("vitals")} ({lang === "en" ? "Optional / Triage Room" : "مریض کے علامات اور نبض"})</span>
              
              <div className="grid grid-cols-4 gap-3">
                
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">{t("bp")}</label>
                  <input
                    type="text"
                    className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 font-mono font-bold"
                    placeholder="e.g. 120/80"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">{t("temp")} (°F)</label>
                  <input
                    type="text"
                    className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 font-mono"
                    placeholder="e.g. 98.6"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">{t("pulse")}</label>
                  <input
                    type="text"
                    className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 font-mono"
                    placeholder="bpm"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">{t("weight")} (kg)</label>
                  <input
                    type="text"
                    className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 font-mono"
                    placeholder="kg"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>

              </div>

            </div>

            {/* symptoms / Complaints */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t("symptoms")}</label>
              <textarea
                rows={2}
                className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all font-medium"
                placeholder="Brief symptoms or reason for consulting doctor..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              />
            </div>

            {/* Fee summary block */}
            <div className="p-3.5 bg-blue-50 rounded-xl flex items-center justify-between border border-blue-100">
              <span className="font-bold text-slate-700">{lang === "en" ? "Consultation Cash total" : "لوکل پرچی فیس فنڈ"}:</span>
              <strong className="text-lg text-blue-700 font-bold">Rs. {selectedDoctorFee.toLocaleString()}</strong>
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setActiveTab("board")}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition-colors cursor-pointer"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <ListPlus className="w-4 h-4" />
                {lang === "en" ? "Issue Token & Generate Bill" : "ٹوکن جاری کر کے بل درج کریں"}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* RENDER LIVE OPD PIPELINE (Token Board) */}
      {activeTab === "board" && !consultingVisit && (
        <div className="border border-slate-100 bg-white rounded-2xl shadow-sm overflow-hidden" id="opd-board-pipeline">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">{t("tokenList")}</h3>
              <span className="text-[10px] bg-indigo-50 text-indigo-600 font-extrabold px-2.5 py-0.5 rounded-full">
                {visits.filter(v => !v.isArchived && (v.status === "Waiting" || v.status === "In_Consultation")).length} {lang === "en" ? "Waiting Queues" : "انتظار گاہ مریضان"}
              </span>
            </div>

            <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setFilterMode("active")}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer font-bold text-[10px] leading-none ${
                  filterMode === "active"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Active Patients Info
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("archived")}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer font-bold text-[10px] leading-none ${
                  filterMode === "archived"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Archived Discharges ({visits.filter(v => v.isArchived).length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto" id="visits-table-viewport">
            <table className="w-full text-xs text-left border-collapse-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase">
                  <th className="p-3.5 text-center">{lang === "en" ? "Token No." : "ٹوکن نمبر"}</th>
                  <th className="p-3.5">{t("patients")}</th>
                  <th className="p-3.5">{lang === "en" ? "Consulting Specialist" : "طبی معالج"}</th>
                  <th className="p-3.5">{t("symptoms")}</th>
                  <th className="p-3.5 text-center">{t("status")}</th>
                  <th className="p-3.5 text-right">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {visits.filter((v) => (filterMode === "archived" ? v.isArchived === true : !v.isArchived)).length > 0 ? (
                  [...visits]
                    .reverse()
                    .filter((v) => (filterMode === "archived" ? v.isArchived === true : !v.isArchived))
                    .map((v) => {
                      const patient = patients.find(p => p.id === v.patientId);
                      const doctor = doctors.find(d => d.id === v.doctorId);
                      const isConsultationAllowed = userRole === "DOCTOR" || userRole === "ADMIN";

                      return (
                        <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                          
                          {/* Token Number */}
                          <td className="p-3.5 text-center">
                            <span className="inline-block bg-slate-900 text-white font-bold p-1 px-2.5 rounded-md text-[10px]">
                              {v.tokenNumber}
                            </span>
                          </td>

                          {/* Patient */}
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{patient ? patient.name : "N/A"}</div>
                            <div className="text-[10px] text-slate-400 font-medium">#{patient ? patient.mrn : "No file"}</div>
                          </td>

                          {/* Doctor */}
                          <td className="p-3.5 font-semibold text-slate-800">
                            {doctor ? doctor.name : "General duty"}
                            <div className="text-[10px] text-slate-400 font-medium font-mono">Rs. {v.fee}</div>
                          </td>

                          {/* Signs Symptoms */}
                          <td className="p-3.5 font-medium text-slate-500 italic max-w-[200px] truncate">
                            {v.symptoms || "Normal Checkup"}
                          </td>

                          {/* Status badge */}
                          <td className="p-3.5 text-center">
                            <span className={`inline-block p-1 px-2.5 rounded-full text-[10px] font-bold ${
                              v.isArchived
                                ? "bg-slate-100 text-slate-600 font-semibold border border-slate-200"
                                : v.status === "Waiting"
                                ? "bg-amber-100 text-amber-700 font-medium"
                                : v.status === "In_Consultation"
                                ? "bg-purple-100 text-purple-700 font-semibold"
                                : v.status === "Completed"
                                ? "bg-emerald-100 text-emerald-700 font-semibold"
                                : "bg-slate-100 text-slate-500 font-medium"
                            }`}>
                              {v.isArchived ? (lang === "en" ? "Discharged" : "فارغ کردہ") : (
                                <>
                                  {v.status === "Waiting" && t("waiting")}
                                  {v.status === "In_Consultation" && t("inConsultation")}
                                  {v.status === "Completed" && t("completed")}
                                  {v.status === "Cancelled" && t("cancelled")}
                                </>
                              )}
                            </span>
                          </td>

                          {/* Action details */}
                          <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                            {/* Cancel button if waiting */}
                            {!v.isArchived && (v.status === "Waiting" || v.status === "In_Consultation") && (
                              <button
                                onClick={() => {
                                  const cancelled = { ...v, status: "Cancelled" as OPDStatus };
                                  onSaveVisit(cancelled);
                                }}
                                className="inline-flex items-center justify-center p-1 px-2 border border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-100 rounded-sm font-medium cursor-pointer"
                                title="Cancel Ticket"
                              >
                                {lang === "en" ? "Cancel" : "منسوخ"}
                              </button>
                            )}

                            {/* Initiate consultation for Doctors */}
                            {!v.isArchived && (v.status === "Waiting" || v.status === "In_Consultation") && isConsultationAllowed && (
                              <button
                                onClick={() => startConsultation(v)}
                                className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-2 py-1 rounded-sm cursor-pointer"
                              >
                                <Stethoscope className="w-3" />
                                {lang === "en" ? "Consult" : "چیک اپ"}
                              </button>
                            )}

                            {/* Completed prescription review */}
                            {v.status === "Completed" && v.prescription && (
                              <button
                                onClick={() => {
                                  // Simulate printing / report generation modal
                                  alert(`Prescription printed for Token ${v.tokenNumber}!\nDiagnosis: ${v.prescription?.diagnosis}\nMedicines Count: ${v.prescription?.medicines.length}`);
                                }}
                                className="inline-flex items-center gap-1 bg-slate-900 hover:bg-black text-white text-[11px] font-bold px-2 py-1 rounded-sm cursor-pointer"
                              >
                                <Clock className="w-3" />
                                {t("print")}
                              </button>
                            )}

                            {/* Discharge Patient Action */}
                            {v.status === "Completed" && !v.isArchived && (
                              <button
                                onClick={() => handleInitiateDischarge(v)}
                                className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-sm cursor-pointer ml-1"
                                title="Discharge Patient & Generate Summary Record"
                              >
                                <LogOut className="w-3" />
                                {lang === "en" ? "Discharge" : "ڈسچارج"}
                              </button>
                            )}

                            {/* View discharge summary document */}
                            {v.isArchived && v.dischargeSummary && (
                              <button
                                onClick={() => setPreviewDischargeVisit(v)}
                                className="inline-flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-sm cursor-pointer inline-flex items-center gap-1.5"
                                title="View Discharge Certification"
                              >
                                <FileText className="w-3" />
                                {lang === "en" ? "Discharge Summary" : "ڈسچارج سمری"}
                              </button>
                            )}
                          </td>

                        </tr>
                      );
                    })
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
      )}

      {/* DISCHARGE PATIENT MODAL FORM */}
      {dischargingVisit && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs text-slate-800" id="discharge-form-modal">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-black text-slate-800 text-sm">Discharge Medical Records & Generate Summary</h3>
                  <p className="text-[10px] text-slate-400">Token Number: {dischargingVisit.tokenNumber}</p>
                </div>
              </div>
              <button 
                onClick={() => setDischargingVisit(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Form Scrollable */}
            <form onSubmit={handleConfirmDischarge} className="p-6 overflow-y-auto space-y-4 flex-1">
              
              {/* Patient and Doctor Fast Facts strip */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[9px]">Patient MRN & Name</span>
                  <strong className="text-slate-800 block">
                    {patients.find(p => p.id === dischargingVisit.patientId)?.name || 'N/A'} 
                  </strong>
                  <span className="text-slate-400 font-medium block">#{patients.find(p => p.id === dischargingVisit.patientId)?.mrn}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[9px]">Age & Gender</span>
                  <strong className="text-slate-800 block">
                    {patients.find(p => p.id === dischargingVisit.patientId)?.age} Yrs / {patients.find(p => p.id === dischargingVisit.patientId)?.gender}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[9px]">Consultant Specialist</span>
                  <strong className="text-slate-800 block">
                    {doctors.find(d => d.id === dischargingVisit.doctorId)?.name || 'N/A'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[9px]">Initial Symptoms</span>
                  <strong className="text-slate-800 block truncate">
                    {dischargingVisit.symptoms || 'Normal Checkup'}
                  </strong>
                </div>
              </div>

              {/* Input: Condition at Discharge & Follow up Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Condition At Discharge <span className="text-rose-500">*</span></label>
                  <select
                    required
                    className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-amber-500/30 transition-all font-semibold"
                    value={conditionAtDischarge}
                    onChange={(e) => setConditionAtDischarge(e.target.value)}
                  >
                    <option value="Recovered & Stable">Recovered & Stable</option>
                    <option value="Clinically Improved">Clinically Improved</option>
                    <option value="Stable (Under Treatment)">Stable (Under Treatment)</option>
                    <option value="Referred to Tertiary Hospital">Referred to Tertiary Hospital</option>
                    <option value="Discharged on Request (LAMA)">Discharged on Request (LAMA)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recommended Follow-up Date</label>
                  <input
                    type="date"
                    className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-amber-500/30 transition-all font-medium"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Input: Summary Notes (TextArea) */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clinical Progression & Assessment Template <span className="text-rose-500">*</span></label>
                <textarea
                  required
                  rows={4}
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-amber-500/30 transition-all font-mono text-[11px] leading-relaxed"
                  placeholder="Summarize diagnostics and clinical improvement notes..."
                  value={summaryNotes}
                  onChange={(e) => setSummaryNotes(e.target.value)}
                />
              </div>

              {/* Input: Discharge Advice & Instructions at Home */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Discharge Care Advice & Continuing Medications <span className="text-rose-500">*</span></label>
                <textarea
                  required
                  rows={4}
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-amber-500/30 transition-all font-medium leading-relaxed"
                  placeholder="Instructions for medicines times, dietary precautions..."
                  value={dischargeAdvice}
                  onChange={(e) => setDischargeAdvice(e.target.value)}
                />
              </div>

              {/* Alert note about automatic archiving */}
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-[11px] leading-relaxed">
                <strong>Important Note:</strong> Confirming discharge will automatically mark this patient queue as **Archived** (with completed clinical outputs), freeing up real-time token line slots. The summary template is fully persistent on their file records.
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDischargingVisit(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  Confirm Discharge & Archive
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* VIEW/PRINT DISCHARGE SUMMARY MODAL */}
      {previewDischargeVisit && previewDischargeVisit.dischargeSummary && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs text-slate-800" id="preview-summary-modal">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[95vh]">
            
            {/* Header controls */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-extrabold text-[10px] uppercase tracking-wide flex items-center gap-1">
                <FileText className="w-4 h-4 text-emerald-400" />
                Patient Discharge Record File
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const printContents = document.getElementById("clinical-discharge-certificate")?.innerHTML;
                    if (printContents) {
                      const printWindow = window.open("", "_blank");
                      if (printWindow) {
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>Discharge Summary - ${previewDischargeVisit.tokenNumber}</title>
                              <style>
                                body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; }
                                .border-box { border: 2px solid #cbd5e1; border-radius: 12px; padding: 24px; }
                                .header-title { text-align: center; margin-bottom: 24px; }
                                .h-title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
                                .subtitle { font-size: 11px; font-weight: bold; color: #64748b; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 4px; }
                                .details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 20px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; font-size: 13px; }
                                .detail-lbl { font-weight: bold; color: #64748b; text-transform: uppercase; font-size: 10px; }
                                .vitals-flex { display: flex; gap: 12px; margin-top: 10px; }
                                .vital-itm { background: #f1f5f9; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
                                .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 20px; }
                                .section-val { margin-top: 8px; line-height: 1.6; font-size: 13px; font-style: italic; white-space: pre-line; }
                                .sig-section { display: flex; justify-content: space-between; margin-top: 48px; border-top: 1px dashed #cbd5e1; pt: 16px; font-size: 11px; }
                              </style>
                            </head>
                            <body>
                              <div class="border-box">
                                ${printContents}
                              </div>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.focus();
                        printWindow.print();
                      }
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-1 px-3 rounded-lg text-[10px] inline-flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Official Document
                </button>
                <button 
                  onClick={() => setPreviewDischargeVisit(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Simulated Document Sheet Preview */}
            <div className="bg-slate-100 p-6 overflow-y-auto flex-1 flex justify-center">
              <div 
                id="clinical-discharge-certificate"
                className="bg-white border-2 border-slate-200 shadow-sm rounded-2xl p-8 max-w-xl w-full min-h-[600px] text-slate-800 space-y-6"
              >
                {/* Hospital Stamp Banner */}
                <div className="text-center border-b-2 border-slate-900 pb-4">
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-950 uppercase leading-none">
                    Madina General Hospital
                  </h2>
                  <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mt-1">
                    Quality Medical Care & Diagnostic Services
                  </p>
                  <p className="text-[8px] text-slate-500 mt-0.5">
                    Main G.T. Road, Near Shell Pump, Lahore | Phone: 042-35892110
                  </p>
                </div>

                {/* Main Certificate Title */}
                <div className="text-center">
                  <span className="bg-slate-100 text-slate-800 px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest uppercase border border-slate-200 inline-block">
                    Official Discharge Summary Report
                  </span>
                </div>

                {/* Patient / doctor specific grids */}
                <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4 text-xs font-semibold">
                  
                  <div className="space-y-1.5 text-left">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Patient File MRN</span>
                      <strong className="text-slate-955">#{patients.find(p => p.id === previewDischargeVisit.patientId)?.mrn}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Patient Full Name</span>
                      <strong className="text-slate-900">{patients.find(p => p.id === previewDischargeVisit.patientId)?.name}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Age / Gender / Contact</span>
                      <strong className="text-slate-900">
                        {patients.find(p => p.id === previewDischargeVisit.patientId)?.age} Yrs / {patients.find(p => p.id === previewDischargeVisit.patientId)?.gender} ({patients.find(p => p.id === previewDischargeVisit.patientId)?.phone || 'N/A'})
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-right sm:text-left pl-0 sm:pl-8">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Discharge Token ID</span>
                      <strong className="text-slate-955">{previewDischargeVisit.tokenNumber}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Caring Consultant Clinician</span>
                      <strong className="text-slate-900">{doctors.find(d => d.id === previewDischargeVisit.doctorId)?.name}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Discharge Event Date</span>
                      <strong className="text-slate-900">
                        {new Date(previewDischargeVisit.dischargeSummary.dischargeDate).toLocaleString()}
                      </strong>
                    </div>
                  </div>

                </div>

                {/* Clinical vitals during entry */}
                <div className="space-y-2">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Entry Point Triage Vitals:</span>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[8.5px] block text-slate-400">Blood Pressure</span>
                      <strong className="text-slate-800 text-xs font-mono">{previewDischargeVisit.vitals?.bp || "N/A"}</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[8.5px] block text-slate-400">Temperature</span>
                      <strong className="text-slate-800 text-xs font-mono">{previewDischargeVisit.vitals?.temp || "N/A"}</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[8.5px] block text-slate-400">Heart Pulse</span>
                      <strong className="text-slate-800 text-xs font-mono">{previewDischargeVisit.vitals?.pulse || "N/A"}</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[8.5px] block text-slate-400">Weight Mass</span>
                      <strong className="text-slate-800 text-xs font-mono">{previewDischargeVisit.vitals?.weight || "N/A"}</strong>
                    </div>
                  </div>
                </div>

                {/* Diagnosis, Clinical notes and Advices */}
                <div className="space-y-4 pt-3 border-t border-slate-100 text-left">
                  
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Primary Diagnosis Details</span>
                    <p className="text-xs font-bold text-slate-900 bg-amber-50/50 p-2 rounded-md border border-amber-100">
                      {previewDischargeVisit.prescription?.diagnosis || "General Clinical Health Evaluation Checkup"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Clinical Progression & Assessment Notes</span>
                    <p className="text-slate-700 bg-slate-50 border border-slate-100 p-3 rounded-lg text-xs font-mono leading-relaxed whitespace-pre-wrap">
                      {previewDischargeVisit.dischargeSummary.summaryNotes || "Patient was clinically monitored and evaluated by the duty consultant specialty services."}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Home Care Treatment Advice & Medications Plan</span>
                    <p className="text-slate-700 bg-slate-50 border border-slate-100 p-3 rounded-lg text-xs leading-relaxed whitespace-pre-wrap font-medium">
                      {previewDischargeVisit.dischargeSummary.dischargeAdvice}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Discharge Condition rating</span>
                      <span className="inline-block bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[9px] tracking-wider uppercase">
                        {previewDischargeVisit.dischargeSummary.conditionAtDischarge}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Recommended Follow-up appointment</span>
                      <strong className="text-slate-800 text-xs block mt-1">
                        {previewDischargeVisit.dischargeSummary.followUpDate 
                          ? new Date(previewDischargeVisit.dischargeSummary.followUpDate).toDateString()
                          : "As advised by the primary physician"
                        }
                      </strong>
                    </div>
                  </div>

                </div>

                {/* Legal Signatures Block */}
                <div className="flex items-center justify-between pt-12 border-t border-dashed border-slate-200 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  <div className="text-left">
                    <span>Authorized Signature</span>
                    <div className="w-32 border-b border-slate-900 mt-6" />
                    <span className="text-[8px] text-slate-400 mt-0.5 block">Madina General Hospital Authority</span>
                  </div>

                  <div className="text-right">
                    <span>Caring Duty Specialist Stamp</span>
                    <div className="w-32 border-b border-slate-900 mt-6 ml-auto" />
                    <span className="text-[8px] text-slate-400 mt-0.5 block">Signed by: {doctors.find(d => d.id === previewDischargeVisit.doctorId)?.name}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewDischargeVisit(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-lg cursor-pointer text-xs"
              >
                Close Document Viewer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
