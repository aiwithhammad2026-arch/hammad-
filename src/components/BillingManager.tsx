/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Receipt, Plus, DollarSign, Wallet, ShieldCheck, Printer, FileText, CheckCircle, Search, Trash2 } from "lucide-react";
import { Invoice, InvoiceItem, Patient, LabTemplate, Doctor, OPDVisit, LabOrder, LabOrderStatus } from "../types";
import { Language, translations } from "../translations";
import { generateId } from "../dbMock";

interface BillingManagerProps {
  lang: Language;
  invoices: Invoice[];
  patients: Patient[];
  templates: LabTemplate[];
  doctors: Doctor[];
  visits: OPDVisit[];
  onSaveInvoice: (invoice: Invoice) => void;
  onSaveLabOrder: (order: LabOrder) => void;
}

export default function BillingManager({
  lang,
  invoices,
  patients,
  templates,
  doctors,
  visits,
  onSaveInvoice,
  onSaveLabOrder
}: BillingManagerProps) {
  const [activeTab, setActiveTab] = useState<"ledgers" | "calculator" | "shares">("ledgers");
  const [searchTerm, setSearchTerm] = useState("");

  // Invoice creator form states
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number | "">("");
  const [basketItems, setBasketItems] = useState<Array<{ type: "OPD_Visit" | "Lab_Test"; refId: string; description: string; amount: number }>>([]);

  // Sub-selector helper inputs
  const [selectedVisitId, setSelectedVisitId] = useState("");
  const [selectedTestId, setSelectedTestId] = useState("");

  // Arrears paydown state
  const [selectedArrearsInvoice, setSelectedArrearsInvoice] = useState<Invoice | null>(null);
  const [paydownAmount, setPaydownAmount] = useState<number>(0);

  const t = (key: keyof typeof translations["en"]) => {
    return translations[lang][key] || translations["en"][key];
  };

  // Filter Invoice ledger lists
  const filteredInvoices = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return invoices;
    return invoices.filter((inv) => {
      const p = patients.find(pat => pat.id === inv.patientId);
      return (
        inv.invoiceNumber.toLowerCase().includes(term) ||
        (p && p.name.toLowerCase().includes(term)) ||
        (p && p.mrn.toLowerCase().includes(term)) ||
        inv.status.toLowerCase().includes(term)
      );
    });
  }, [invoices, patients, searchTerm]);

  // Combined doctor payout details
  const doctorPayoutLedger = useMemo(() => {
    return doctors.map((doc) => {
      // Find all completed visits billed to this doctor
      const dVisits = visits.filter(v => v.doctorId === doc.id && v.status === "Completed");
      const grossVisitsRevenue = dVisits.reduce((acc, curr) => acc + curr.fee, 0);
      const doctorPayout = (grossVisitsRevenue * doc.sharePercentage) / 100;
      const hospitalProfit = grossVisitsRevenue - doctorPayout;

      return {
        id: doc.id,
        name: doc.name,
        specialty: doc.specialization,
        totalCases: dVisits.length,
        gross: grossVisitsRevenue,
        doctorPayout: Math.round(doctorPayout),
        hospitalProfit: Math.round(hospitalProfit)
      };
    });
  }, [doctors, visits]);

  // Basket item total calculations
  const totals = useMemo(() => {
    const subtotal = basketItems.reduce((acc, curr) => acc + curr.amount, 0);
    const net = Math.max(0, subtotal - discount);
    const actualPaid = amountPaid === "" ? 0 : Number(amountPaid);
    const dues = Math.max(0, net - actualPaid);

    let status: "Paid" | "Partially_Paid" | "Unpaid" = "Unpaid";
    if (actualPaid >= net && net > 0) status = "Paid";
    else if (actualPaid > 0 && actualPaid < net) status = "Partially_Paid";

    return {
      subtotal,
      net,
      dues,
      status
    };
  }, [basketItems, discount, amountPaid]);

  // Dynamic selector items lists
  const eligibleVisits = useMemo(() => {
    if (!selectedPatientId) return [];
    // Only visits for selected patient that haven't already been billed
    return visits.filter(v => 
      v.patientId === selectedPatientId && 
      !invoices.some(inv => inv.items.some(item => item.referenceId === v.id))
    );
  }, [selectedPatientId, visits, invoices]);

  // Add Item to basket
  const handleAddVisitToBasket = () => {
    if (!selectedVisitId) return;
    const v = visits.find(visit => visit.id === selectedVisitId);
    if (!v) return;

    const doc = doctors.find(d => d.id === v.doctorId);
    const desc = `OPD Consultation ticket - ${doc ? doc.name : "Clinician"}`;

    // Avoid duplicate insertions
    if (basketItems.some(i => i.refId === v.id)) return;

    setBasketItems([...basketItems, { type: "OPD_Visit", refId: v.id, description: desc, amount: v.fee }]);
    setSelectedVisitId("");
  };

  const handleAddTestToBasket = () => {
    if (!selectedTestId) return;
    const t = templates.find(temp => temp.id === selectedTestId);
    if (!t) return;

    // Avoid duplicate insertions
    if (basketItems.some(i => i.refId === t.id)) return;

    setBasketItems([...basketItems, { type: "Lab_Test", refId: t.id, description: t.name, amount: t.price }]);
    setSelectedTestId("");
  };

  // Submit dynamic invoice
  const handleSaveInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || basketItems.length === 0) {
      alert("Please select a patient and append at least one billing item.");
      return;
    }

    const serial = invoices.length + 1;
    const invNo = `INV-2606-${serial.toString().padStart(3, "0")}`;

    const itemsList: InvoiceItem[] = basketItems.map((item, idx) => ({
      id: `item_${Date.now()}_${idx}`,
      type: item.type,
      description: item.description,
      referenceId: item.refId,
      amount: item.amount
    }));

    const invoice: Invoice = {
      id: generateId("inv_"),
      invoiceNumber: invNo,
      patientId: selectedPatientId,
      items: itemsList,
      subtotal: totals.subtotal,
      discount,
      total: totals.net,
      paidAmount: amountPaid === "" ? 0 : Number(amountPaid),
      dues: totals.dues,
      status: totals.status,
      createdAt: new Date().toISOString(),
      cashier: "receptionist_ali"
    };

    onSaveInvoice(invoice);

    // If laboratory items exist, automatically generate a "Pending_Sample" lab order!
    itemsList.forEach((item) => {
      if (item.type === "Lab_Test") {
        const orderIndex = Math.floor(100000 + Math.random() * 900000);
        const nextOrder: LabOrder = {
          id: generateId("order_"),
          invoiceId: invoice.id,
          patientId: selectedPatientId,
          templateId: item.referenceId,
          barcode: `L-${orderIndex}`,
          status: "Pending_Sample",
          results: {},
          orderedAt: new Date().toISOString()
        };
        onSaveLabOrder(nextOrder);
      }
    });

    // Reset Form
    setSelectedPatientId("");
    setDiscount(0);
    setAmountPaid("");
    setBasketItems([]);
    setActiveTab("ledgers");

    alert(`Invoice ${invNo} authorized! Active laboratory files triggered instantly.`);
  };

  // Submit arrears payoff
  const handleArrearsPaydownSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArrearsInvoice) return;

    const nextPaid = selectedArrearsInvoice.paidAmount + paydownAmount;
    const nextDues = Math.max(0, selectedArrearsInvoice.dues - paydownAmount);
    const nextStatus = nextDues === 0 ? "Paid" : "Partially_Paid";

    const updated: Invoice = {
      ...selectedArrearsInvoice,
      paidAmount: nextPaid,
      dues: nextDues,
      status: nextStatus
    };

    onSaveInvoice(updated);
    setSelectedArrearsInvoice(null);
    setPaydownAmount(0);
    alert(`Arrears paydown verified. Balance updated.`);
  };

  return (
    <div className="space-y-6" id="billing-workspace">
      
      {/* Tab navigation headers */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3" id="billing-nav-strip">
        <button
          onClick={() => setActiveTab("ledgers")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "ledgers" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500"
          }`}
        >
          {lang === "en" ? "Revenue Lead Sheets" : "ادائیگی رجسٹر"}
        </button>
        <button
          onClick={() => setActiveTab("calculator")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "calculator" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500"
          }`}
        >
          {t("newBill")}
        </button>
        <button
          onClick={() => setActiveTab("shares")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "shares" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500"
          }`}
        >
          {t("doctorSharesTitle")}
        </button>
      </div>

      {/* RENDER BILLING CALCULATOR (Invoice Creator) */}
      {activeTab === "calculator" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="invoice-builder-layout">
          
          {/* Left panel inputs selectors */}
          <div className="lg:col-span-2 border border-slate-100 bg-white p-5 rounded-2xl shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">{lang === "en" ? "Assemble Invoice Items" : "انوائس آئٹمز شامل کریں"}</h4>
            
            <div className="space-y-4 text-xs">
              
              {/* Select Patient MRN */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t("patients")} <span className="text-rose-500">*</span></label>
                <select
                  required
                  className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 outline-hidden focus:bg-white font-semibold"
                  value={selectedPatientId}
                  onChange={(e) => {
                    setSelectedPatientId(e.target.value);
                    setBasketItems([]); // clear cart on changing patient
                  }}
                >
                  <option value="">-- Choose Patient Medical File --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.mrn} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPatientId ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  
                  {/* Append waiting clinical consultation visits */}
                  <div className="space-y-2 p-3 bg-blue-50/20 rounded-xl border border-blue-50">
                    <span className="text-[10px] font-bold text-blue-800 block uppercase tracking-wider">Clinical Consult queues</span>
                    <div className="space-y-1 bg-white p-2 rounded-lg border border-slate-100">
                      <select
                        className="w-full text-[11px] text-slate-700 outline-hidden bg-slate-50 border p-1.5 rounded font-medium"
                        value={selectedVisitId}
                        onChange={(e) => setSelectedVisitId(e.target.value)}
                      >
                        <option value="">-- Select Active Queue --</option>
                        {eligibleVisits.map((v) => {
                          const d = doctors.find(doc => doc.id === v.doctorId);
                          return (
                            <option key={v.id} value={v.id}>
                              {v.tokenNumber} - {d ? d.name : "Clinician"} (Rs.{v.fee})
                            </option>
                          );
                        })}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddVisitToBasket}
                        disabled={!selectedVisitId}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] p-1.5 rounded cursor-pointer disabled:opacity-40"
                      >
                        Add Clinic Fee
                      </button>
                    </div>
                  </div>

                  {/* Append scientific lab testing templates */}
                  <div className="space-y-2 p-3 bg-indigo-50/20 rounded-xl border border-indigo-50">
                    <span className="text-[10px] font-bold text-indigo-800 block uppercase tracking-wider">Lab Investigation Profiles</span>
                    <div className="space-y-1 bg-white p-2 rounded-lg border border-slate-100">
                      <select
                        className="w-full text-[11px] text-slate-700 outline-hidden bg-slate-50 border p-1.5 rounded font-medium"
                        value={selectedTestId}
                        onChange={(e) => setSelectedTestId(e.target.value)}
                      >
                        <option value="">-- Choose Diagnostic Panel --</option>
                        {templates.map((temp) => (
                          <option key={temp.id} value={temp.id}>
                            {temp.name} (Rs.{temp.price})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddTestToBasket}
                        disabled={!selectedTestId}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] p-1.5 rounded cursor-pointer disabled:opacity-40"
                      >
                        Add Test Cost
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-slate-150 rounded-xl text-slate-400 font-medium italic">
                  {lang === "en" ? "Select a Patient File above to retrieve and connect clinical consultations." : "بلنگ شروع کرنے کیلئے اوپر مریض کا ریکارڈ منتخب کریں۔"}
                </div>
              )}

              {/* Basket list rows */}
              {basketItems.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-100" id="basket-ledger">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-widest">{lang === "en" ? "Billed Statement" : "فردِ حساب"}</span>
                  <div className="divide-y divide-slate-100 border border-slate-150 rounded-xl bg-white overflow-hidden text-[11px]">
                    {basketItems.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50/50">
                        <div>
                          <strong className="text-slate-800 block font-bold">{item.description}</strong>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{item.type}</span>
                        </div>
                        <div className="flex items-center gap-3 font-bold">
                          <span className="text-slate-700">Rs. {item.amount}</span>
                          <button
                            type="button"
                            onClick={() => setBasketItems(basketItems.filter((_, i) => i !== idx))}
                            className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Right panel summary total ledger Form */}
          <div className="border border-slate-100 bg-white p-5 rounded-2xl shadow-sm h-fit">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">{lang === "en" ? "Receipt Computations" : "کیش میمو خلاصہ"}</h4>
            
            <form onSubmit={handleSaveInvoiceSubmit} className="space-y-4 pt-3 text-xs">
              
              {/* Calculations Stack */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between font-bold text-slate-600">
                  <span>{t("subtotal")}:</span>
                  <span>Rs. {totals.subtotal.toLocaleString()}</span>
                </div>

                {/* Waiver input */}
                <div className="flex items-center justify-between py-1 border-t border-b border-dashed border-slate-200">
                  <span className="font-bold text-slate-500">{t("discount")}:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 text-[10px]">Rs.</span>
                    <input
                      type="number"
                      min={0}
                      className="w-20 bg-white text-slate-800 border rounded p-1 text-center font-bold"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex justify-between font-bold text-slate-800 text-sm">
                  <span>{t("total")}:</span>
                  <span className="text-indigo-700">Rs. {totals.net.toLocaleString()}</span>
                </div>
              </div>

              {/* Amount Tendered cash */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t("paid")} <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold pointer-events-none">Rs.</span>
                  <input
                    type="number"
                    required
                    min={0}
                    className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg pl-8 pr-4 py-2.5 font-bold focus:bg-white text-lg focus:ring-1 focus:ring-blue-500"
                    placeholder="Received"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Arrears Remaining */}
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl text-[11px] font-bold text-red-800 border border-red-100">
                <span>{t("dues")}:</span>
                <span className="text-sm">Rs. {totals.dues.toLocaleString()}</span>
              </div>

              {/* Security info */}
              <div className="p-3 bg-teal-50 rounded-lg flex items-start gap-2 border border-teal-100">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-600 leading-tight">
                  {lang === "en" ? "Billed lab tests establish secure pipeline barcodes automatically." : "بلنگ مکمل ہوتے ہی لیبارٹری سسٹم میں سیمپل بارکوڈ خود بخود بن جائیں گے۔"}
                </p>
              </div>

              {/* Save checkout */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <Receipt className="w-4 h-4" />
                {lang === "en" ? "Authorize Ticket & Print Bill" : "کیش پرنٹنگ اور تصدیق"}
              </button>

            </form>
          </div>

        </div>
      )}

      {/* RENDER SYSTEM FINANCIAL LEDGERS */}
      {activeTab === "ledgers" && (
        <div className="space-y-6" id="ledgers-panel">
          
          {/* Filter Row search */}
          <div className="flex justify-between items-center" id="ledgers-filter-panel">
            <div className="relative w-full sm:max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                className="w-full text-slate-750 bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-hidden focus:border-blue-500 shadow-xs transition-all font-medium"
                placeholder="Search transactions by Invoice No, MRN, Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="border border-slate-100 bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">{lang === "en" ? "Revenue Transaction Logs" : "ادائیگی کیش ڈائری"}</h3>
              <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2.5 py-0.5 rounded-full">
                {filteredInvoices.length} {lang === "en" ? "Transactions" : "بلز"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase">
                    <th className="p-3.5">{t("invoiceNumber")}</th>
                    <th className="p-3.5">{t("patients")}</th>
                    <th className="p-3.5 text-center">{lang === "en" ? "Purchase Items" : "خلاصہ کام"}</th>
                    <th className="p-3.5 text-right">{t("total")}</th>
                    <th className="p-3.5 text-right">{lang === "en" ? "Unpaid (Rs)" : "بقیہ رقم"}</th>
                    <th className="p-3.5 text-center">{t("paymentStatus")}</th>
                    <th className="p-3.5 text-right">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredInvoices.length > 0 ? (
                    [...filteredInvoices].reverse().map((inv) => {
                      const p = patients.find(pat => pat.id === inv.patientId);
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3.5 font-bold text-slate-800 font-mono">{inv.invoiceNumber}</td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{p ? p.name : "Walk-in Patient"}</div>
                            <div className="text-[10px] text-slate-400 font-medium font-mono">{p ? p.mrn : "No MRN"}</div>
                          </td>
                          <td className="p-3.5 text-center font-bold text-slate-500">
                            {inv.items.length} {lang === "en" ? "Service rows" : "آئٹم"}
                          </td>
                          <td className="p-3.5 text-right font-extrabold text-indigo-700">Rs. {inv.total}</td>
                          <td className="p-3.5 text-right font-bold text-rose-500">
                            {inv.dues > 0 ? `Rs. ${inv.dues}` : "-"}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === "Paid"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700 animate-pulse"
                            }`}>
                              {inv.status === "Paid" && t("fullyPaid")}
                              {inv.status === "Partially_Paid" && t("partiallyPaid")}
                              {inv.status === "Unpaid" && t("unpaid")}
                            </span>
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            
                            {/* Paydown dues if partially paid */}
                            {inv.dues > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedArrearsInvoice(inv);
                                  setPaydownAmount(inv.dues);
                                }}
                                className="bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold px-2 py-1 rounded hover:bg-red-100 cursor-pointer mr-1.5"
                              >
                                {lang === "en" ? "Clear Balance" : "ادائیگی بقایا"}
                              </button>
                            )}

                            <button
                              onClick={() => alert(`Printing Invoice ${inv.invoiceNumber} details...\nSubtotal: Rs.${inv.subtotal}\nDiscount: Rs.${inv.discount}\nNet total: Rs.${inv.total}\nAmount Paid: Rs.${inv.paidAmount}`)}
                              className="bg-slate-900 hover:bg-black text-white text-[10px] font-bold px-2 py-1 rounded"
                            >
                              <Printer className="w-3" />
                            </button>

                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
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

      {/* RENDER DOCTOR COMMISSION CONTRACT LEDGER (Fin split reports) */}
      {activeTab === "shares" && (
        <div className="border border-slate-100 bg-white p-5 rounded-2xl shadow-sm space-y-4" id="commission-splits">
          <div className="space-y-1">
            <h4 className="text-md font-bold text-slate-800 uppercase tracking-wider">{t("doctorSharesTitle")}</h4>
            <p className="text-xs text-slate-400">{lang === "en" ? "Contract payout divisions computed from active consultations." : "ڈاکٹرز کی پرچیوں کے بقیہ بقایا جات اور ہسپتال فنڈز کا تفصیلی حساب"}</p>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden font-sans text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 border-b border-slate-100 text-[10px] uppercase font-bold">
                  <th className="p-3.5">{t("doctorName")}</th>
                  <th className="p-3.5 text-center">{lang === "en" ? "Consulted Queue Cases" : "کل چیک اپ فائلز"}</th>
                  <th className="p-3.5 text-right">{lang === "en" ? "Gross Collection (Rs)" : "مجموعی آمدنی کیش"}</th>
                  <th className="p-3.5 text-right">{lang === "en" ? "Doctor Commission (%)" : "ڈاکٹر معاہدہ فیصد"}</th>
                  <th className="p-3.5 text-right">{t("doctorShare")} (Rs)</th>
                  <th className="p-3.5 text-right">{t("collectedShare")} (Rs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctorPayoutLedger.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/40">
                    <td className="p-3.5 font-bold text-slate-800">{row.name}</td>
                    <td className="p-3.5 text-center font-bold text-slate-600">{row.totalCases}</td>
                    <td className="p-3.5 text-right font-bold text-slate-500">Rs. {row.gross}</td>
                    <td className="p-3.5 text-right font-semibold text-slate-400">
                      {doctors.find(d => d.id === row.id)?.sharePercentage || 70}%
                    </td>
                    <td className="p-3.5 text-right font-black text-emerald-600">Rs. {row.doctorPayout}</td>
                    <td className="p-3.5 text-right font-bold text-indigo-700">Rs. {row.hospitalProfit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ARREARS PAYDOWN MODAL */}
      {selectedArrearsInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100">
            
            <div className="bg-slate-50 border-b border-slate-100 p-4">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">{lang === "en" ? "Receive Outstanding Balance" : "بقایا رقم وصول کریں"}</h4>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Invoice: {selectedArrearsInvoice.invoiceNumber}</p>
            </div>

            <form onSubmit={handleArrearsPaydownSubmit} className="p-6 space-y-4 text-xs">
              
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Current Outstanding:</span>
                  <span className="font-bold text-rose-500 font-mono">Rs. {selectedArrearsInvoice.dues}</span>
                </div>
              </div>

              {/* Paydown cash */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Amount Paid now <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold pointer-events-none">Rs.</span>
                  <input
                    type="number"
                    required
                    min={1}
                    max={selectedArrearsInvoice.dues}
                    className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg pl-8 pr-4 py-2.5 font-bold focus:bg-white text-lg focus:ring-1 focus:ring-rose-500"
                    placeholder="Received cash"
                    value={paydownAmount}
                    onChange={(e) => setPaydownAmount(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedArrearsInvoice(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  Pay Outstanding
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
