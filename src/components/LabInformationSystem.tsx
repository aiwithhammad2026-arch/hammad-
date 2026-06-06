/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { FlaskConical, Barcode, CheckSquare, Plus, Trash2, ArrowRight, Printer, AlertTriangle, UserCheck, CheckCircle, Search, Sparkles } from "lucide-react";
import { LabTemplate, LabOrder, Patient, LabParameter, LabOrderStatus, UserRole } from "../types";
import { Language, translations } from "../translations";
import { generateId } from "../dbMock";

interface LabInformationSystemProps {
  lang: Language;
  userRole: UserRole;
  templates: LabTemplate[];
  orders: LabOrder[];
  patients: Patient[];
  onSaveTemplate: (tmpl: LabTemplate) => void;
  onSaveOrder: (order: LabOrder) => void;
}

export default function LabInformationSystem({
  lang,
  userRole,
  templates,
  orders,
  patients,
  onSaveTemplate,
  onSaveOrder
}: LabInformationSystemProps) {
  const [activeTab, setActiveTab] = useState<"pipeline" | "templates">("pipeline");
  const [searchTerm, setSearchTerm] = useState("");

  // Create Template States
  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateUrduName, setTemplateUrduName] = useState("");
  const [department, setDepartment] = useState<"Hematology" | "Biochemistry" | "Immunology" | "Microbiology" | "Urine Analysis">("Hematology");
  const [price, setPrice] = useState<number | "">("");
  const [parameters, setParameters] = useState<LabParameter[]>([
    { id: "p_1", name: "Hemoglobin", unit: "g/dL", referenceRange: "12.0 - 16.0", minNormal: 12.0, maxNormal: 16.0 }
  ]);

  // Active result entry modal states
  const [editingOrder, setEditingOrder] = useState<LabOrder | null>(null);
  const [resultValues, setResultValues] = useState<Record<string, string>>({});
  const [labNotes, setLabNotes] = useState("");

  // Printable Report Viewer state
  const [printingOrder, setPrintingOrder] = useState<LabOrder | null>(null);

  const t = (key: keyof typeof translations["en"]) => {
    return translations[lang][key] || translations["en"][key];
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return orders;
    return orders.filter((o) => {
      const p = patients.find(pat => pat.id === o.patientId);
      const t = templates.find(temp => temp.id === o.templateId);
      return (
        o.barcode.toLowerCase().includes(term) ||
        (p && p.name.toLowerCase().includes(term)) ||
        (p?.mrn.toLowerCase().includes(term)) ||
        (t && t.name.toLowerCase().includes(term))
      );
    });
  }, [orders, templates, patients, searchTerm]);

  // Parameter Row Mutators
  const addParamRow = () => {
    const nextId = `p_${Date.now()}`;
    setParameters([...parameters, { id: nextId, name: "", unit: "", referenceRange: "" }]);
  };

  const removeParamRow = (id: string) => {
    setParameters(parameters.filter(p => p.id !== id));
  };

  const updateParamRow = (id: string, field: keyof LabParameter, value: any) => {
    setParameters(parameters.map((p) => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  // Submit new Lab Template Model
  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName || !price || parameters.some(p => !p.name.trim())) {
      alert("Please specify a valid template name, price and check parameters.");
      return;
    }

    const newTemplate: LabTemplate = {
      id: generateId("tmpl_"),
      name: templateName,
      department,
      price: Number(price),
      parameters
    };

    onSaveTemplate(newTemplate);
    alert(`Lab Test Catalog - ${templateName} integrated successfully.`);

    // Reset Form
    setIsTemplateFormOpen(false);
    setTemplateName("");
    setTemplateUrduName("");
    setPrice("");
    setParameters([{ id: "p_1", name: "Hemoglobin", unit: "g/dL", referenceRange: "12.0 - 16.0", minNormal: 12.0, maxNormal: 16.0 }]);
  };

  // Collect blood/fluid draw
  const handleCollectSample = (o: LabOrder) => {
    const updated: LabOrder = {
      ...o,
      status: "Sample_Collected",
      collectedAt: new Date().toISOString()
    };
    onSaveOrder(updated);
    alert(`Barcode L-2606-${o.barcode.substring(o.barcode.length - 4)} stored securely. Pipeline updated.`);
  };

  // Open Results Writer
  const startEnteringResults = (o: LabOrder) => {
    setEditingOrder(o);
    setResultValues(o.results || {});
    setLabNotes(o.notes || "");
  };

  // Submit Result Entry
  const handleResultsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    const updated: LabOrder = {
      ...editingOrder,
      results: resultValues,
      notes: labNotes,
      status: "Result_Entered",
      resultEnteredAt: new Date().toISOString()
    };

    onSaveOrder(updated);
    setEditingOrder(null);
    alert("Lab results saved! Order requires Pathology review/signoff before final release.");
  };

  // Pathologist certify / validate
  const handleVerifyOrder = (o: LabOrder) => {
    const updated: LabOrder = {
      ...o,
      status: "Validated",
      validatedAt: new Date().toISOString(),
      validatedBy: "Dr. Zainab Fatima (Pathology Consultant)"
    };
    onSaveOrder(updated);
    alert("Report signed off under registration seal. Eligible for printing checkouts.");
  };

  // Test abnormal evaluation logic
  const isValueAbnormal = (val: string, param: LabParameter) => {
    const numValue = parseFloat(val);
    if (isNaN(numValue)) return false;
    if (param.minNormal !== undefined && numValue < param.minNormal) return true;
    if (param.maxNormal !== undefined && numValue > param.maxNormal) return true;
    return false;
  };

  return (
    <div className="space-y-6" id="lis-main-viewport">
      
      {/* Tab bar header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3" id="lis-tabs">
        <button
          onClick={() => {
            setActiveTab("pipeline");
            setPrintingOrder(null);
          }}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "pipeline" && !printingOrder ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500"
          }`}
        >
          {t("labOrders")}
        </button>
        <button
          onClick={() => {
            setActiveTab("templates");
            setPrintingOrder(null);
          }}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "templates" && !printingOrder ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500"
          }`}
        >
          {t("labCatalog")}
        </button>
      </div>

      {/* PRINT DIALOG RENDER VIEW */}
      {printingOrder && (
        <div className="border border-slate-200 bg-white p-6 sm:p-10 rounded-2xl shadow-xl max-w-3xl mx-auto space-y-6" id="lis-print-layout">
          
          {/* Print controls header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4" id="print-controls">
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 rounded-full px-3 py-1 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              {t("validated")}
            </span>
            <div className="space-x-2 flex">
              <button
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                {t("print")}
              </button>
              <button
                onClick={() => setPrintingOrder(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-lg"
              >
                {lang === "en" ? "Back to Pipeline" : "پائپ لائن پر واپس"}
              </button>
            </div>
          </div>

          {/* Certificate Design */}
          <div className="border-4 border-slate-900 p-8 space-y-6 rounded-lg text-xs text-slate-700 font-sans" id="medical-report-certificate">
            
            {/* Logo Heading details */}
            <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
              <h2 className="text-xl font-black uppercase text-slate-900 font-sans">{lang === "en" ? "Madina Diagnostic Laboratory" : "مدینہ ڈائیگنوسٹک لیبارٹری"}</h2>
              <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest">{t("tagline")}</p>
              <p className="text-[10px] text-slate-500">Main G.T. Road, Near Shell Pump, Lahore | Ph: 042-35892110</p>
            </div>

            {/* Patient File specifications Grid */}
            {(() => {
              const patient = patients.find(p => p.id === printingOrder.patientId);
              const tmpl = templates.find(t => t.id === printingOrder.templateId);
              return (
                <div className="grid grid-cols-2 gap-4 text-[11px] border-b border-slate-200 pb-4">
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-slate-400 block tracking-wider font-semibold">PATIENT PROFILE:</span>
                      <strong className="text-slate-950 font-bold text-sm block">
                        {patient ? patient.name : "N/A"} 
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Age / Gender:</span> <strong className="text-slate-950">{patient ? patient.age : "0"} Yrs / {patient ? patient.gender : "Male"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">MRN Registry:</span> <strong className="text-slate-950 font-mono font-bold text-slate-800">{patient ? patient.mrn : "N/A"}</strong>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-right">
                    <div>
                      <span className="text-slate-400 block">INVESTIGATION:</span>
                      <strong className="text-slate-950 block font-bold text-sm text-indigo-700">{tmpl ? tmpl.name : "Laboratory Panel Analysis"}</strong>
                    </div>
                    <div className="h-6 flex justify-end">
                      {/* Barcode Graphic */}
                      <div className="border border-slate-400 p-0.5 rounded px-1.5 font-mono text-[9px] flex items-center gap-1">
                        <Barcode className="w-3.5 h-3.5" />
                        <span>{printingOrder.barcode}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">Ordered:</span> <span>{new Date(printingOrder.orderedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Parameter readings Matrix table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 border-b border-slate-300 pb-1 uppercase tracking-widest">{t("parameters")}</h4>
              <table className="w-full text-left font-semibold text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 border-b border-slate-200 text-[10px]">
                    <th className="p-2">{t("parameterName")}</th>
                    <th className="p-2 text-center">{lang === "en" ? "Observed Value" : "موجودہ ریڈنگ"}</th>
                    <th className="p-2 text-center">{t("unit")}</th>
                    <th className="p-2 text-right">{t("referenceRange")}</th>
                    <th className="p-2 text-right">{lang === "en" ? "Verdict" : "خلاصہ"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const tmpl = templates.find(t => t.id === printingOrder.templateId);
                    if (!tmpl) return null;
                    return tmpl.parameters.map((p) => {
                      const val = printingOrder.results[p.id] || "0";
                      const abnormal = isValueAbnormal(val, p);
                      return (
                        <tr key={p.id}>
                          <td className="p-2 font-bold text-slate-800">{p.name}</td>
                          <td className="p-2 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded font-black font-mono text-xs ${
                              abnormal ? "bg-red-100 text-red-600 animate-pulse" : "text-slate-900"
                            }`}>
                              {val}
                            </span>
                          </td>
                          <td className="p-2 text-center font-bold text-slate-500 font-mono">{p.unit || "-"}</td>
                          <td className="p-2 text-right font-bold text-slate-600 font-mono">{p.referenceRange}</td>
                          <td className="p-2 text-right">
                            {abnormal ? (
                              <span className="text-[10px] text-red-600 font-black tracking-widest bg-red-50 p-1 px-1.5 rounded">ABNORMAL</span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold">NORMAL</span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>

            {/* Specialist validation signature block */}
            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block">OBSERVATION & REMARKS:</span>
                <p className="italic text-slate-600 font-medium">"{printingOrder.notes || "Specimen examined. Clinical counts sit clean."}"</p>
              </div>
              <div className="text-right flex flex-col items-end space-y-1">
                <p className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">{t("reportSignee")}</p>
                <div className="border border-emerald-500 bg-emerald-50 text-emerald-800 rounded-lg p-2.5 px-4 font-bold text-[10px] leading-tight text-center">
                  <CheckCircle className="w-5 h-5 mx-auto text-emerald-600 mb-0.5" />
                  <span>{printingOrder.validatedBy || "Dr. Zainab Fatima"}</span>
                  <p className="text-[9px] font-medium text-slate-400 mt-0.5">Clinical Pathologist (PMC Reg # 4821)</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* RENDER LABORATORY PIPELINE */}
      {activeTab === "pipeline" && !printingOrder && (
        <div className="space-y-6" id="lis-pipeline-tab">
          
          {/* Action search header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4" id="lis-action-search">
            <div className="relative w-full sm:max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                className="w-full text-slate-700 bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-hidden focus:border-blue-500 shadow-xs transition-all font-medium"
                placeholder="Search orders, barcodes, MRNs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === "en" ? "LIS LAN Server is Online" : "لیبارٹری نیٹ ورک سرور فعال ہے"}</span>
            </div>
          </div>

          <div className="border border-slate-100 bg-white rounded-2xl shadow-sm overflow-hidden" id="orders-table">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">{lang === "en" ? "Active Clinical Samples Pipeline" : "زیر التوا اور تصدیق طلب ٹیسٹ آرڈرز"}</h3>
              <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2.5 py-0.5 rounded-full">
                {filteredOrders.length} {lang === "en" ? "Active Sessions" : "ٹیسٹ آرڈرز"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase border-b border-slate-100">
                    <th className="p-3.5 text-center">{t("barcode")}</th>
                    <th className="p-3.5">{t("patients")}</th>
                    <th className="p-3.5">{lang === "en" ? "Test Profiling" : "ٹیسٹ کی معلومات"}</th>
                    <th className="p-3.5 text-center">{t("status")}</th>
                    <th className="p-3.5 text-right">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredOrders.length > 0 ? (
                    [...filteredOrders].reverse().map((o) => {
                      const patient = patients.find(p => p.id === o.patientId);
                      const tmpl = templates.find(t => t.id === o.templateId);

                      return (
                        <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                          
                          {/* Graphical Barcode Representation */}
                          <td className="p-3.5 text-center">
                            <div className="flex flex-col items-center justify-center space-y-1 max-w-[124px]">
                              {/* Simulated Barcode Graphics Lines! */}
                              <div className="h-6 flex items-end gap-0.5" title="Barcode Graphic">
                                <span className="w-0.5 h-6 bg-slate-800" />
                                <span className="w-1.5 h-6 bg-slate-800" />
                                <span className="w-0.5 h-6 bg-slate-800" />
                                <span className="w-0.5 h-6 bg-slate-300" />
                                <span className="w-1 h-6 bg-slate-800" />
                                <span className="w-1.5 h-6 bg-slate-800" />
                                <span className="w-0.5 h-6 bg-slate-800" />
                                <span className="w-1 h-6 bg-slate-800" />
                              </div>
                              <span className="font-mono text-[9px] font-bold text-slate-500">{o.barcode}</span>
                            </div>
                          </td>

                          {/* Patient */}
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{patient ? patient.name : "N/A"}</div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">MRN: {patient ? patient.mrn : "-"}</div>
                          </td>

                          {/* Investigation */}
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{tmpl ? tmpl.name : "Laboratory Investigation"}</div>
                          </td>

                          {/* Status Badge */}
                          <td className="p-3.5 text-center">
                            <span className={`inline-block py-0.5 px-2.5 rounded-full text-[10px] font-bold ${
                              o.status === "Pending_Sample"
                                ? "bg-amber-100 text-amber-700 font-medium animate-pulse"
                                : o.status === "Sample_Collected"
                                ? "bg-blue-100 text-blue-700 font-semibold"
                                : o.status === "Result_Entered"
                                ? "bg-purple-100 text-purple-700 font-semibold"
                                : "bg-emerald-100 text-emerald-700 font-bold"
                            }`}>
                              {o.status === "Pending_Sample" && t("pendingSample")}
                              {o.status === "Sample_Collected" && t("collected")}
                              {o.status === "Result_Entered" && t("resultsEntered")}
                              {o.status === "Validated" && t("validated")}
                            </span>
                          </td>

                          {/* Action Items based on status and roles */}
                          <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                            
                            {/* 1. Pending Fluid Samples draw */}
                            {o.status === "Pending_Sample" && (
                              <button
                                onClick={() => handleCollectSample(o)}
                                className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-2 py-1.5 rounded-sm shadow-sm cursor-pointer"
                              >
                                <Barcode className="w-3.5 h-3.5" />
                                {t("collectSample")}
                              </button>
                            )}

                            {/* 2. Log Clinical readings in diagnostics */}
                            {o.status === "Sample_Collected" && (userRole === "LAB_TECH" || userRole === "ADMIN") && (
                              <button
                                onClick={() => startEnteringResults(o)}
                                className="inline-flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold px-2 py-1.5 rounded-sm shadow-sm cursor-pointer"
                              >
                                <FlaskConical className="w-3.5 h-3.5" />
                                {t("enterResults")}
                              </button>
                            )}

                            {/* 3. Reviewer Pathologist signoff */}
                            {o.status === "Result_Entered" && (userRole === "DOCTOR" || userRole === "ADMIN") && (
                              <button
                                onClick={() => handleVerifyOrder(o)}
                                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-sm shadow-sm cursor-pointer"
                              >
                                <UserCheck className="w-4 h-4" />
                                {t("validate")}
                              </button>
                            )}

                            {/* 4. Release / Print certifications */}
                            {o.status === "Validated" && (
                              <button
                                onClick={() => setPrintingOrder(o)}
                                className="inline-flex items-center gap-1 bg-slate-900 hover:bg-black text-white text-[11px] font-bold px-2.5 py-1.5 rounded-sm cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                {lang === "en" ? "Print Certificate" : "رپورٹ جاری کریں"}
                              </button>
                            )}

                          </td>

                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        {t("noData")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TEMPLATES FORMULATOR */}
      {activeTab === "templates" && !printingOrder && (
        <div className="space-y-6" id="lis-templates-tab">
          
          {/* Header Action bar */}
          <div className="flex items-center justify-between" id="templates-action-row">
            <div>
              <h4 className="font-bold text-slate-800 text-sm leading-tight">{t("labCatalog")}</h4>
              <p className="text-xs text-slate-400">{lang === "en" ? "Add or modify laboratory tests and parameter boundaries" : "لیبارٹری ٹیسٹس مینو اور ان کی نارمل ریڈنگ حدود کی لسٹ"}</p>
            </div>
            {!isTemplateFormOpen && (
              <button
                onClick={() => setIsTemplateFormOpen(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {t("createTemplate")}
              </button>
            )}
          </div>

          {/* Form Create Model */}
          {isTemplateFormOpen && (
            <div className="border border-slate-100 bg-white p-5 rounded-2xl shadow-sm space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{t("createTemplate")}</h4>
              
              <form onSubmit={handleCreateTemplate} className="space-y-4 text-xs">
                
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Test Name (English) <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                    placeholder="e.g. Lipid Profile"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Category Department */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Clinical Section Section</label>
                    <select
                      className="w-full text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 font-semibold"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value as any)}
                    >
                      <option value="Hematology">Hematology</option>
                      <option value="Biochemistry">Biochemistry</option>
                      <option value="Immunology">Immunology</option>
                      <option value="Microbiology">Microbiology</option>
                      <option value="Urine Analysis">Urine Analysis</option>
                    </select>
                  </div>

                  {/* Price */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t("price")} <span className="text-rose-500">*</span></label>
                    <input
                      type="number"
                      required
                      min={0}
                      className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 font-bold text-indigo-700"
                      placeholder="Pricing (Rs)"
                      value={price}
                      onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                  </div>

                </div>

                {/* Parameters configuration */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t("parameters")}</span>
                    <button
                      type="button"
                      onClick={addParamRow}
                      className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded text-[10px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Parameter Card
                    </button>
                  </div>

                  <div className="space-y-2">
                    {parameters.map((p, idx) => (
                      <div key={p.id} className="grid grid-cols-12 gap-2 items-center">
                        
                        {/* Name */}
                        <div className="col-span-4">
                          <input
                            type="text"
                            required
                            className="w-full text-[11px] text-slate-800 bg-slate-50 border border-slate-100 rounded p-2 focus:bg-white focus:ring-1 focus:ring-blue-500/30 font-semibold"
                            placeholder="Param description e.g. Hb"
                            value={p.name}
                            onChange={(e) => updateParamRow(p.id, "name", e.target.value)}
                          />
                        </div>

                        {/* Unit */}
                        <div className="col-span-2">
                          <input
                            type="text"
                            className="w-full text-[11px] text-slate-800 bg-slate-50 border border-slate-100 rounded p-2 focus:bg-white focus:ring-1 focus:ring-blue-500/30 font-mono"
                            placeholder="Unit e.g. g/dL"
                            value={p.unit}
                            onChange={(e) => updateParamRow(p.id, "unit", e.target.value)}
                          />
                        </div>

                        {/* Range */}
                        <div className="col-span-2">
                          <input
                            type="text"
                            className="w-full text-[11px] text-slate-800 bg-slate-50 border border-slate-100 rounded p-2 focus:bg-white focus:ring-1 focus:ring-blue-500/30 font-mono"
                            placeholder="Range e.g. 12.0 - 16.0"
                            value={p.referenceRange}
                            onChange={(e) => updateParamRow(p.id, "referenceRange", e.target.value)}
                          />
                        </div>

                        {/* Minimum Normal Trigger boundary */}
                        <div className="col-span-1.5 col-span-2">
                          <input
                            type="number"
                            step="any"
                            className="w-full text-[10px] text-slate-800 bg-slate-50 border border-slate-100 rounded p-2 font-mono text-center"
                            placeholder="Min thresh"
                            value={p.minNormal ?? ""}
                            onChange={(e) => updateParamRow(p.id, "minNormal", e.target.value === "" ? undefined : parseFloat(e.target.value))}
                          />
                        </div>

                        {/* Maximum Trigger boundary */}
                        <div className="col-span-1.5 col-span-2">
                          <input
                            type="number"
                            step="any"
                            className="w-full text-[10px] text-slate-800 bg-slate-50 border border-slate-100 rounded p-2 font-mono text-center"
                            placeholder="Max thresh"
                            value={p.maxNormal ?? ""}
                            onChange={(e) => updateParamRow(p.id, "maxNormal", e.target.value === "" ? undefined : parseFloat(e.target.value))}
                          />
                        </div>

                        {/* Remove */}
                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeParamRow(p.id)}
                            disabled={parameters.length <= 1}
                            className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

                {/* Buttons row */}
                <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsTemplateFormOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                  >
                    {t("save")}
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* List of active test items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="lab-catalog-items">
            {templates.map((tmpl) => (
              <div key={tmpl.id} className="border border-slate-100 bg-white p-5 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between border-b border-slate-50 pb-2">
                    <div>
                      <h4 className="font-bold text-slate-800 leading-tight">{tmpl.name}</h4>
                    </div>
                    <span className="text-indigo-600 font-extrabold text-xs">Rs. {tmpl.price}</span>
                  </div>

                  <div className="mt-3 space-y-1 text-[11px]">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">Analysis Matrix Parameters:</span>
                    <div className="flex flex-wrap gap-1">
                      {tmpl.parameters.map((p) => (
                        <span key={p.id} className="inline-block bg-slate-50 text-slate-500 font-semibold p-1 px-2 rounded font-mono">
                          {p.name} {p.unit ? `(${p.unit})` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-medium">
                  {lang === "en" ? "Section Department: " : "شعبہ جات: "} <strong className="text-slate-800">{tmpl.department}</strong>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* RESULTS INPUT DIALOG MODAL */}
      {editingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100">
            
            <div className="bg-slate-50 border-b border-slate-100 p-4">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                {t("enterResults")} - {templates.find(t => t.id === editingOrder.templateId)?.name}
              </h4>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mt-0.5">Barcode: {editingOrder.barcode}</p>
            </div>

            <form onSubmit={handleResultsSubmit} className="p-6 space-y-4 text-xs">
              
              <div className="space-y-3" id="input-fields-list">
                {templates.find(t => t.id === editingOrder.templateId)?.parameters.map((param) => {
                  const activeVal = resultValues[param.id] || "";
                  const abnormal = isValueAbnormal(activeVal, param);

                  return (
                    <div key={param.id} className="grid grid-cols-12 gap-3 items-center border-b border-slate-50 pb-2">
                      
                      {/* Parameter Name Label */}
                      <div className="col-span-5 font-bold text-slate-700">
                        {param.name} {param.unit ? <span className="text-[10px] text-slate-400 font-mono">({param.unit})</span> : ""}
                      </div>

                      {/* Numeric Result Input */}
                      <div className="col-span-4">
                        <input
                          type="text"
                          required
                          className={`w-full text-xs font-bold text-slate-800 bg-slate-50 border p-2 rounded-lg outline-hidden focus:bg-white text-center font-mono ${
                            abnormal ? "border-red-300 ring-2 ring-red-50" : "border-slate-150 focus:border-blue-500"
                          }`}
                          placeholder="reading"
                          value={activeVal}
                          onChange={(e) => setResultValues({ ...resultValues, [param.id]: e.target.value })}
                        />
                      </div>

                      {/* Reference range guidance */}
                      <div className="col-span-3 text-[10px] text-slate-400 text-right">
                        Ref: <strong className="text-slate-600 font-mono">{param.referenceRange}</strong>
                        {abnormal && (
                          <span className="block text-[8px] text-red-600 font-black uppercase mt-0.5 tracking-wider">ABNORMAL</span>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Pathologist Diagnostic Notes */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Analysis Remarks / Pathology Notes</label>
                <textarea
                  className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all font-medium"
                  rows={2}
                  placeholder="Specimen properties, microcytic counts verified..."
                  value={labNotes}
                  onChange={(e) => setLabNotes(e.target.value)}
                />
              </div>

              {/* Abnormal Flag warning */}
              <div className="p-3 bg-red-50 rounded-xl flex items-start gap-2.5 text-red-800 text-[11px] border border-red-100">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <span className="font-bold">Real-time Reference Validator</span>:{" "}
                  {lang === "en" 
                    ? "Readings exceeding normal boundaries display immediate warning highlights for tech safety checking."
                    : "نارمل لمٹ سے ہٹ کر ریڈنگ درج کرنے پر ریڈ باکس الرٹ ظاہر ہوگا۔ مہربانی فرما کر درستگی کی تسلی کریں۔"
                  }
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Confirm Results Lock
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
