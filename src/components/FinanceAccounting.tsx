/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { db, generateId } from "../dbMock";
import { Account, FinancialVoucher, VoucherType, VoucherEntry } from "../types";
import { 
  DollarSign, 
  BookOpen, 
  FileSpreadsheet, 
  Plus, 
  Check, 
  Trash2, 
  Printer, 
  Sliders, 
  Info,
  Building,
  TrendingUp,
  CreditCard,
  Briefcase
} from "lucide-react";

interface FinanceAccountingProps {
  lang: string;
}

export default function FinanceAccounting({ lang }: FinanceAccountingProps) {
  const [financeTab, setFinanceTab] = useState<"daybook" | "vouchers" | "coa" | "ledger" | "statements">("daybook");
  
  // COA and Voucher States
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [vouchers, setVouchers] = useState<FinancialVoucher[]>([]);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState<string>("");
  
  // Voucher creation form states
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [vType, setVType] = useState<VoucherType>("Receipt");
  const [vNarration, setVNarration] = useState("");
  const [vDate, setVDate] = useState(new Date().toISOString().substring(0, 10));
  const [vEntries, setVEntries] = useState<VoucherEntry[]>([]);
  const [currentEntryAccount, setCurrentEntryAccount] = useState("");
  const [currentEntryDebit, setCurrentEntryDebit] = useState(0);
  const [currentEntryCredit, setCurrentEntryCredit] = useState(0);
  const [currentEntryNarrative, setCurrentEntryNarrative] = useState("");
  
  // Error state for voucher double entry matching
  const [voucherError, setVoucherError] = useState("");

  useEffect(() => {
    refreshFinanceData();
  }, [financeTab]);

  const refreshFinanceData = () => {
    setAccounts(db.getAccounts());
    setVouchers(db.getVouchers());
    if (db.getAccounts().length > 0 && !selectedLedgerAccount) {
      setSelectedLedgerAccount(db.getAccounts()[0].id);
    }
  };

  const handleCreateVoucherEntry = () => {
    if (!currentEntryAccount) {
      setVoucherError("Please select a target account name first.");
      return;
    }
    if (currentEntryDebit <= 0 && currentEntryCredit <= 0) {
      setVoucherError("Specify non-zero value for Credit or Debit amount.");
      return;
    }
    const newEntry: VoucherEntry = {
      accountId: currentEntryAccount,
      debit: Number(currentEntryDebit) || 0,
      credit: Number(currentEntryCredit) || 0,
      narration: currentEntryNarrative || undefined
    };
    setVEntries([...vEntries, newEntry]);
    
    // Clear temp states
    setCurrentEntryAccount("");
    setCurrentEntryDebit(0);
    setCurrentEntryCredit(0);
    setCurrentEntryNarrative("");
    setVoucherError("");
  };

  const handleRemoveVoucherEntry = (index: number) => {
    setVEntries(vEntries.filter((_, i) => i !== index));
  };

  const handleSubmitVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const totalDebit = vEntries.reduce((sum, ent) => sum + ent.debit, 0);
    const totalCredit = vEntries.reduce((sum, ent) => sum + ent.credit, 0);
    
    if (totalDebit !== totalCredit) {
      setVoucherError(`Double entry mismatch. Debits (Rs. ${totalDebit}) must equal Credits (Rs. ${totalCredit}). Difference is Rs. ${Math.abs(totalDebit - totalCredit)}.`);
      return;
    }
    if (vEntries.length < 2) {
      setVoucherError("A financial voucher requires at least two distinct accounts in double entry format.");
      return;
    }

    const serialNum = vouchers.filter(v => v.voucherType === vType).length + 1;
    const prefix = vType === "Receipt" ? "RV" : vType === "Payment" ? "PV" : vType === "Contra" ? "CV" : "JV";
    const voucherNo = `${prefix}-${vDate.replace(/-/g,"").substring(2)}-${serialNum.toString().padStart(3, "0")}`;

    const newVoucher: FinancialVoucher = {
      id: generateId("fvc_"),
      voucherNo,
      voucherType: vType,
      date: new Date(vDate).toISOString(),
      narration: vNarration,
      entries: vEntries,
      recordedBy: db.getCurrentUser()?.name || "System Accountant",
      status: "Posted"
    };

    db.saveVoucher(newVoucher);
    setShowVoucherModal(false);
    setVEntries([]);
    setVNarration("");
    setVoucherError("");
    refreshFinanceData();
  };

  // Computes Cash Book balance dynamically
  const cashBookBalance = accounts.find(a => a.id === "coa-cash")?.balance || 0;
  const bankBookBalance = accounts.find(a => a.id === "coa-bank")?.balance || 0;
  
  // Profit and Loss calculations
  const revenueTotal = accounts.filter(a => a.category === "Revenue").reduce((sum, a) => sum + a.balance, 0);
  const expenseTotal = accounts.filter(a => a.category === "Expense").reduce((sum, a) => sum + a.balance, 0);
  const netProfit = revenueTotal - expenseTotal;

  // Day Book List
  const dayBookRows = db.getDayBook();

  // Selected Ledger Report
  const ledgerReport = selectedLedgerAccount 
    ? db.getLedgerForAccount(selectedLedgerAccount) 
    : { account: null, entries: [] };

  return (
    <div className="space-y-6" id="financial-accounting-module">
      
      {/* Upper Module Briefing Card */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-blue-600 p-1.5 bg-blue-50 rounded-xl" />
          <div>
            <h3 className="text-base font-black tracking-tight text-slate-900">Hospital General Ledger & ERP</h3>
            <p className="text-xs text-slate-400">Manage real double-entry books, cash accounts, Day Book listings, and generate certified financial balance sheets.</p>
          </div>
        </div>
        
        {/* Dynamic Cash Flow Badges */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 px-4 text-xs font-bold text-emerald-800">
            <span className="text-[9px] text-emerald-600 block uppercase font-bold tracking-wider">Dynamic Cash Book</span>
            <span>Rs. {cashBookBalance.toLocaleString()}</span>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 px-4 text-xs font-bold text-blue-800">
            <span className="text-[9px] text-blue-600 block uppercase font-bold tracking-wider">Bank Ledger Balance</span>
            <span>Rs. {bankBookBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs for Accounting */}
      <div className="flex flex-wrap items-center border-b border-slate-200 gap-1.5" id="finance-navbar">
        {[
          { tabId: "daybook", label: "Day Book Register", icon: BookOpen },
          { tabId: "vouchers", label: "Financial Vouchers (G/V)", icon: CreditCard },
          { tabId: "coa", label: "Chart of Accounts (COA)", icon: Sliders },
          { tabId: "ledger", label: "Account General Ledgers", icon: FileSpreadsheet },
          { tabId: "statements", label: "Financial Statements Desk", icon: TrendingUp }
        ].map((item) => {
          const IconComp = item.icon;
          return (
            <button
              key={item.tabId}
              onClick={() => {
                setFinanceTab(item.tabId as any);
                setVoucherError("");
              }}
              className={`px-4 py-2 border-b-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                financeTab === item.tabId 
                  ? "border-blue-600 text-blue-600 bg-blue-50/20" 
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <IconComp className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* View: DAY BOOK REGISTER */}
      {financeTab === "daybook" && (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-slate-900">Day Book Ledger</h4>
              <p className="text-[11px] text-slate-400">Consolidated history of physical financial operations logged for double-entry matching.</p>
            </div>
            <button className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-3 rounded-lg text-xs font-bold" onClick={() => window.print()}>
              <Printer className="w-3.5 h-3.5" />
              <span>Print Day Book</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-50 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="p-3">Posting Date</th>
                  <th className="p-3">Voucher Details</th>
                  <th className="p-3">Voucher Code</th>
                  <th className="p-3 text-center">Class</th>
                  <th className="p-3 text-right">Debit Total (Rs)</th>
                  <th className="p-3 text-right">Credit Total (Rs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {dayBookRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">No day book listings found.</td>
                  </tr>
                ) : (
                  dayBookRows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-slate-500">{new Date(row.date).toLocaleDateString()} {new Date(row.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{row.details}</div>
                      </td>
                      <td className="p-3 font-bold text-blue-600 font-mono">{row.reference}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          row.type === "Receipt" ? "bg-emerald-50 text-emerald-700" :
                          row.type === "Payment" ? "bg-rose-50 text-rose-700" : "bg-purple-50 text-purple-700"
                        }`}>{row.type}</span>
                      </td>
                      <td className="p-3 text-right font-bold text-slate-800">Rs. {row.totalDebit.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-slate-800">Rs. {row.totalCredit.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View: FINANCIAL VOUCHERS LIST */}
      {financeTab === "vouchers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-slate-900">Voucher Postings (RV / PV / CV / JV)</h4>
              <p className="text-[11px] text-slate-400">Post balanced entries directly to accounts to track transactions such as buying medical materials or utility payments.</p>
            </div>
            <button
              onClick={() => setShowVoucherModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 px-4 shadow-sm text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record New Voucher</span>
            </button>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="p-3 text-left">Voucher Code</th>
                    <th className="p-3">Narrative Description</th>
                    <th className="p-3 text-center">Type</th>
                    <th className="p-3">Posting Officer</th>
                    <th className="p-3 text-right">Debit Summary</th>
                    <th className="p-3 text-center">Receipt Print</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {vouchers.map((v) => {
                    const totalDebitSum = v.entries.reduce((s, ent) => s + ent.debit, 0);
                    return (
                      <tr key={v.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-900 font-mono text-left">{v.voucherNo}</td>
                        <td className="p-3">
                          <div className="text-slate-800 font-semibold">{v.narration}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-1">
                            {v.entries.map((ent, idx) => {
                              const coaObj = accounts.find(a => a.id === ent.accountId);
                              return (
                                <span key={idx} className="inline-block bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-xs mr-1 text-[9px]">
                                  {coaObj?.name || ent.accountId}: {ent.debit > 0 ? `Dr Rs.${ent.debit}` : `Cr Rs.${ent.credit}`}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            v.voucherType === "Receipt" ? "bg-emerald-50 text-emerald-700" :
                            v.voucherType === "Payment" ? "bg-rose-50 text-rose-700" :
                            v.voucherType === "Contra" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                          }`}>{v.voucherType}</span>
                        </td>
                        <td className="p-3 text-slate-500 font-semibold">{v.recordedBy}</td>
                        <td className="p-3 text-right font-black text-slate-900">Rs. {totalDebitSum.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <button className="text-slate-400 hover:text-indigo-600 transition-all" onClick={() => window.print()}>
                            <Printer className="w-4 h-4 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* RECORD VOUCHER TRANSACTION MODAL */}
          {showVoucherModal && (
            <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="voucher-form-modal">
              <div className="bg-white border border-slate-150 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-black text-slate-900">Simulate ERP Voucher Double Entry</h4>
                  <button onClick={() => { setShowVoucherModal(false); setVEntries([]); setVNarration(""); }} className="text-slate-400 hover:text-slate-600 font-black text-sm">✕</button>
                </div>

                <form onSubmit={handleSubmitVoucher} className="space-y-4 text-xs">
                  {voucherError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 leading-normal flex items-start gap-2">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{voucherError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Voucher Type</label>
                      <select
                        className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2 font-bold focus:bg-white"
                        value={vType}
                        onChange={(e) => setVType(e.target.value as VoucherType)}
                      >
                        <option value="Receipt">Receipt Voucher (Income Recv)</option>
                        <option value="Payment">Payment Voucher (Expense/Payout)</option>
                        <option value="Contra">Contra Voucher (Cash to Bank or Bank to Cash)</option>
                        <option value="Journal">Journal Voucher (General Posting Adjustments)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Posting Date</label>
                      <input
                        type="date"
                        className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2 font-bold focus:bg-white"
                        value={vDate}
                        onChange={(e) => setVDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overall Narration</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Paid electricity thermal bills for main block"
                      className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 font-semibold focus:bg-white"
                      value={vNarration}
                      onChange={(e) => setVNarration(e.target.value)}
                    />
                  </div>

                  {/* DOUBLE ENTRY BUILD PANEL */}
                  <div className="p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-100">
                    <h5 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">Add Transaction Rows</h5>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[10px] text-slate-400 font-bold">Select Account</label>
                        <select
                          className="w-full text-[11px] text-slate-900 bg-white border border-slate-150 rounded-lg p-1.5 focus:ring-1"
                          value={currentEntryAccount}
                          onChange={(e) => setCurrentEntryAccount(e.target.value)}
                        >
                          <option value="">-- Select COA --</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name} ({acc.category})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] text-slate-400 font-bold">Debit Amount (Rs)</label>
                        <input
                          type="number"
                          placeholder="Debit"
                          className="w-full text-[11px] text-slate-900 bg-white border border-slate-150 rounded-lg p-1.5"
                          value={currentEntryDebit || ""}
                          onChange={(e) => {
                            setCurrentEntryDebit(Number(e.target.value));
                            if (Number(e.target.value) > 0) setCurrentEntryCredit(0);
                          }}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] text-slate-400 font-bold">Credit Amount (Rs)</label>
                        <input
                          type="number"
                          placeholder="Credit"
                          className="w-full text-[11px] text-slate-900 bg-white border border-slate-150 rounded-lg p-1.5"
                          value={currentEntryCredit || ""}
                          onChange={(e) => {
                            setCurrentEntryCredit(Number(e.target.value));
                            if (Number(e.target.value) > 0) setCurrentEntryDebit(0);
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Specific entry line note description (Optional)..."
                        className="flex-1 text-[11px] text-slate-900 bg-white border border-slate-150 rounded-lg p-1.5"
                        value={currentEntryNarrative}
                        onChange={(e) => setCurrentEntryNarrative(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={handleCreateVoucherEntry}
                        className="bg-slate-900 text-white rounded-lg p-1.5 px-3 font-bold hover:bg-slate-800 cursor-pointer"
                      >
                        Append Entry
                      </button>
                    </div>
                  </div>

                  {/* CURRENT ENTRY POSTINGS LIST */}
                  {vEntries.length > 0 && (
                    <div className="border border-slate-100 rounded-xl overflow-hidden text-[11px]">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 font-bold text-slate-400 p-2">
                          <tr>
                            <th className="p-2">Account Name</th>
                            <th className="p-2 text-right">Debit (Rs)</th>
                            <th className="p-2 text-right">Credit (Rs)</th>
                            <th className="p-2 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {vEntries.map((ent, i) => {
                            const matchedCOAObj = accounts.find(a => a.id === ent.accountId);
                            return (
                              <tr key={i} className="font-semibold">
                                <td className="p-2">{matchedCOAObj?.name || ent.accountId}</td>
                                <td className="p-2 text-right text-emerald-600">{ent.debit > 0 ? `Rs. ${ent.debit.toLocaleString()}` : "-"}</td>
                                <td className="p-2 text-right text-purple-600">{ent.credit > 0 ? `Rs. ${ent.credit.toLocaleString()}` : "-"}</td>
                                <td className="p-2 text-center">
                                  <button type="button" onClick={() => handleRemoveVoucherEntry(i)} className="text-rose-500 hover:text-rose-700">✕</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-slate-100 font-black text-slate-800">
                          <tr>
                            <td className="p-2">Journal Totals:</td>
                            <td className="p-2 text-right">Rs. {vEntries.reduce((s,e)=>s+e.debit,0).toLocaleString()}</td>
                            <td className="p-2 text-right">Rs. {vEntries.reduce((s,e)=>s+e.credit,0).toLocaleString()}</td>
                            <td className="p-2 text-center">-</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                    <button type="button" onClick={() => { setShowVoucherModal(false); setVEntries([]); }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-4 rounded-xl font-bold">Discard</button>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 px-4 font-bold shadow-xs">Post Ledger Entries</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View: CHART OF ACCOUNTS */}
      {financeTab === "coa" && (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-slate-900">Chart of Accounts (COA) Map</h4>
              <p className="text-[11px] text-slate-400">Classified list of general ledger heads tracking financial resources, claims, assets, liabilities, and revenues.</p>
            </div>
            <button className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-3 rounded-lg text-xs font-bold" onClick={() => window.print()}>
              <Printer className="w-3.5 h-3.5" />
              <span>Print Catalog COA</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {["Asset", "Liability", "Revenue", "Expense"].map((category) => {
              const items = accounts.filter(a => a.category === category);
              return (
                <div key={category} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-black uppercase text-slate-500 tracking-wider font-mono">{category}S Ledger</span>
                    <span className="text-[10px] font-bold text-slate-400">({items.length} Heads)</span>
                  </div>
                  <div className="space-y-2">
                    {items.map(acc => (
                      <div key={acc.id} className="flex items-center justify-between p-2 bg-white border border-slate-50 rounded-lg text-xs">
                        <div>
                          <strong className="text-slate-800 block text-[11px]">{acc.name}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">Code Account: {acc.code}</span>
                        </div>
                        <span className="font-bold text-slate-900 font-mono">Rs. {acc.balance.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View: RUNNING GENERAL LEDGER FOR SELECTED COA HEAD */}
      {financeTab === "ledger" && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
            <div>
              <h4 className="text-sm font-black text-slate-900">Run Account Ledger</h4>
              <p className="text-[11px] text-slate-400">Review sequential credit/debit logs posted for any account category to keep track of financial trials.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">Select Ledger Target:</span>
              <select
                className="text-xs text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2 font-semibold focus:bg-white"
                value={selectedLedgerAccount}
                onChange={(e) => setSelectedLedgerAccount(e.target.value)}
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                ))}
              </select>
            </div>
          </div>

          {ledgerReport.account ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50/50 p-4 border border-slate-50 rounded-2xl">
                <div>
                  <h5 className="font-extrabold text-slate-800 text-xs">{ledgerReport.account.name}</h5>
                  <span className="text-[10px] text-slate-400 font-mono">Category Ledger Index: {ledgerReport.account.category} ({ledgerReport.account.code})</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-mono block">RUNNING BOOK BALANCE</span>
                  <span className="font-black text-indigo-700 text-sm">Rs. {ledgerReport.account.balance.toLocaleString()}</span>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-50 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                    <tr>
                      <th className="p-3">Posting Date</th>
                      <th className="p-3">Reference Voucher</th>
                      <th className="p-3">Transaction Narrative</th>
                      <th className="p-3 text-right">Debit (Rs)</th>
                      <th className="p-3 text-right">Credit (Rs)</th>
                      <th className="p-3 text-right">Balance (Rs)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-mono">
                    {ledgerReport.entries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold font-sans">No journal ledger postings found.</td>
                      </tr>
                    ) : (
                      ledgerReport.entries.map((ent, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 text-slate-500">{new Date(ent.date).toLocaleDateString()}</td>
                          <td className="p-3 font-bold text-blue-600">{ent.voucherNo}</td>
                          <td className="p-3 font-sans text-slate-700 font-medium">{ent.narration}</td>
                          <td className="p-3 text-right font-semibold text-emerald-600">{ent.debit > 0 ? `Rs. ${ent.debit.toLocaleString()}` : "-"}</td>
                          <td className="p-3 text-right font-semibold text-rose-600">{ent.credit > 0 ? `Rs. ${ent.credit.toLocaleString()}` : "-"}</td>
                          <td className="p-3 text-right font-bold text-slate-900">Rs. {ent.balance.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">Select a ledger target.</div>
          )}
        </div>
      )}

      {/* View: FINANCIAL STATEMENTS SCREEN */}
      {financeTab === "statements" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="statements-desk">
          
          {/* Trial Balance Document */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
            <div className="border-b border-slate-50 pb-2">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Unadjusted Trial Balance Sheet</h4>
              <p className="text-[10px] text-slate-400">Aggrated ledger sums grouped into debits vs credits checking double-posting compliance.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-2">Account Title / Classification</th>
                    <th className="p-2 text-right">Debit Summary (Rs)</th>
                    <th className="p-2 text-right">Credit Summary (Rs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {accounts.map(acc => {
                    const isDebitBal = acc.category === "Asset" || acc.category === "Expense";
                    return (
                      <tr key={acc.id} className="hover:bg-slate-50/50 text-slate-800">
                        <td className="p-2">{acc.name} <span className="text-[9px] text-slate-400 font-mono">({acc.code})</span></td>
                        <td className="p-2 text-right font-mono font-bold text-slate-700">{isDebitBal ? `Rs. ${acc.balance.toLocaleString()}` : "-"}</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-700">{!isDebitBal ? `Rs. ${acc.balance.toLocaleString()}` : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-black text-slate-950 border-t border-slate-350">
                  <tr>
                    <td className="p-2">Trial Balance Totals</td>
                    <td className="p-2 text-right font-mono">Rs. {accounts.filter(a => a.category === "Asset" || a.category === "Expense").reduce((s,a)=>s+a.balance,0).toLocaleString()}</td>
                    <td className="p-2 text-right font-mono">Rs. {accounts.filter(a => a.category === "Liability" || a.category === "Equity" || a.category === "Revenue").reduce((s,a)=>s+a.balance,0).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Income Profit & Loss statement */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
            <div className="border-b border-slate-50 pb-2">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Dynamic profit & loss statement</h4>
              <p className="text-[10px] text-slate-400">Dynamic tracking statement of medical services margins, running fees, and operations splits.</p>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Revenue Stream postings</span>
                <div className="divide-y divide-slate-50 border border-slate-100 rounded-xl p-3 bg-slate-50/20">
                  {accounts.filter(a => a.category === "Revenue").map(item => (
                    <div key={item.id} className="flex justify-between py-1.5 font-medium">
                      <span>{item.name}</span>
                      <span className="font-mono font-bold text-slate-700">Rs. {item.balance.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 border-t font-black text-slate-900">
                    <span>Gross Medical Income:</span>
                    <span className="font-mono text-indigo-700">Rs. {revenueTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Operational Expense indices</span>
                <div className="divide-y divide-slate-50 border border-slate-100 rounded-xl p-3 bg-slate-50/20">
                  {accounts.filter(a => a.category === "Expense").map(item => (
                    <div key={item.id} className="flex justify-between py-1.5 font-medium">
                      <span>{item.name}</span>
                      <span className="font-mono font-bold text-slate-700">Rs. {item.balance.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 border-t font-black text-slate-900">
                    <span>Total ERP Expenses:</span>
                    <span className="font-mono text-rose-600">Rs. {expenseTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-xl flex items-center justify-between shadow-xs border ${
                netProfit >= 0 ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-rose-50 border-rose-100 text-rose-800"
              }`}>
                <div>
                  <strong className="text-xs block font-black uppercase">Net Operational Profit</strong>
                  <span className="text-[9px] text-slate-400">Total hospital operational margin after staff splits and bill discounts.</span>
                </div>
                <strong className="text-sm font-mono font-black">Rs. {netProfit.toLocaleString()}</strong>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
