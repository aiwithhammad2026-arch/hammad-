/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from "react";
import { db, generateId } from "../dbMock";
import { ReferralContract } from "../types";
import { 
  Network, 
  Plus, 
  HelpCircle, 
  UserPlus, 
  DollarSign, 
  FileCheck, 
  Printer, 
  TrendingUp 
} from "lucide-react";

interface ReferralsProps {
  lang: string;
}

export default function ReferralsManager({ lang }: ReferralsProps) {
  const [partnerContracts, setPartnerContracts] = useState<ReferralContract[]>(db.getReferrals());
  
  // Create Partner Modal States
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [pName, setPName] = useState("");
  const [pSpec, setPSpec] = useState("");
  const [pComm, setPComm] = useState(10);
  const [pPhone, setPPhone] = useState("");

  // Record referral patient event state
  const [showLogReferral, setShowLogReferral] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [refPatientName, setRefPatientName] = useState("");
  const [refBillAmount, setRefBillAmount] = useState(2500);
  const [refNotes, setRefNotes] = useState("");

  const [feedback, setFeedback] = useState("");

  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    const newPartner: ReferralContract = {
      id: generateId("ref_pt_"),
      partnerName: pName,
      partnerSpecialty: pSpec,
      commissionPercentage: pComm,
      phone: pPhone || "0300-0000000",
      casesDirected: 0,
      totalCommissionsEarned: 0
    };
    db.saveReferral(newPartner);
    setPartnerContracts(db.getReferrals());
    setShowAddPartner(false);
    
    // clear states
    setPName("");
    setPSpec("");
    setPPhone("");
    setPComm(10);
    
    setFeedback(`Successfully locked referral profile contract for Specialist: ${newPartner.partnerName}`);
    setTimeout(() => setFeedback(""), 4000);
  };

  const handlePostReferralCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId) return;

    const list = db.getReferrals();
    const partner = list.find(r => r.id === selectedPartnerId);
    if (partner) {
      const commEarned = Math.round((refBillAmount * partner.commissionPercentage) / 100);
      partner.casesDirected += 1;
      partner.totalCommissionsEarned += commEarned;
      db.saveReferral(partner);
      
      // Post to accounting double entry ERP
      const serial = Date.now().toString().substring(8);
      db.saveVoucher({
        id: generateId("fvc_"),
        voucherNo: `JV-REF-${serial}`,
        voucherType: "Journal",
        date: new Date().toISOString(),
        narration: `Referral referral fee booked to partner ${partner.partnerName} on relative bill Rs.${refBillAmount}`,
        status: "Posted",
        recordedBy: "admin",
        entries: [
          // Debit: Referral commission splits expense
          { accountId: "coa-exp-salaries", debit: commEarned, credit: 0 },
          // Credit: Doctors share payable liability block
          { accountId: "coa-share-pay", debit: 0, credit: commEarned }
        ]
      });

      db.log("receptionist", "RECEPTIONIST", "Log Referral Direction", "REFERRALS", `Patient ${refPatientName} directed from Outside specialist ${partner.partnerName}. Calculated payout: Rs. ${commEarned}`);
      
      setPartnerContracts(db.getReferrals());
      setShowLogReferral(false);
      setRefPatientName("");
      setSelectedPartnerId("");
      
      setFeedback(`Referral matching successfully recorded! Calculated partner split share logged to accounting books.`);
      setTimeout(() => setFeedback(""), 4000);
    }
  };

  return (
    <div className="space-y-6" id="referrals-manager">
      
      {/* Module Heading block */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Network className="w-8 h-8 text-indigo-600 p-1.5 bg-indigo-50 rounded-xl" />
          <div>
            <h3 className="text-base font-black tracking-tight text-slate-900">Partner Referral & Splits ledger</h3>
            <p className="text-xs text-slate-400">Track patients directed from external specialists, calculate customized revenue share percentages (commissions), and reconcile payouts.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowLogReferral(true)}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2 px-3.5 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <FileCheck className="w-4 h-4" />
            <span>Record Referral Case</span>
          </button>
          <button
            onClick={() => setShowAddPartner(true)}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 px-3.5 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Contract Partner</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl font-bold text-indigo-800 text-xs">
          {feedback}
        </div>
      )}

      {/* Partners Cards list */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl space-y-4">
        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Active Referral Channels</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {partnerContracts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-semibold col-span-full">No outside partners pre-seeded. Feel free to register.</div>
          ) : (
            partnerContracts.map((partner) => (
              <div key={partner.id} className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 flex flex-col justify-between hover:bg-slate-50 transition-all space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="text-slate-950 font-black text-xs block">{partner.partnerName}</strong>
                    <span className="text-[10px] text-slate-400 font-mono italic block">{partner.partnerSpecialty}</span>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 font-extrabold rounded-lg text-[10px] px-2 py-0.5 font-mono">{partner.commissionPercentage}% share</span>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-dashed border-slate-200 pt-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Directed cases</span>
                    <strong className="text-slate-800">{partner.casesDirected} Patients</strong>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Split margins due</span>
                    <strong className="text-indigo-600 font-mono">Rs. {partner.totalCommissionsEarned.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-semibold">Phone: {partner.phone}</span>
                  <button onClick={() => window.print()} className="text-slate-500 hover:text-indigo-600 font-bold flex items-center gap-1">
                    <Printer className="w-3 h-3" />
                    <span>Print Ledger Sheet</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CREATE REFERRALS CONTRACT MODAL */}
      {showAddPartner && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="contract-modal">
          <div className="bg-white border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl text-xs font-semibold">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-sm font-black text-slate-9c0">Register Outside Referral Partner</h4>
              <button onClick={() => setShowAddPartner(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreatePartner} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Partner Specialist Name</label>
                <input
                  type="text"
                  required
                  className="w-full text-slate-800 bg-slate-50 border rounded-lg p-2.5 font-semibold"
                  placeholder="e.g. Dr. Naseem Chaudhry"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Specialty / Clinic Location</label>
                <input
                  type="text"
                  required
                  className="w-full text-slate-800 bg-slate-50 border rounded-lg p-2.5 font-semibold"
                  placeholder="e.g. Cardiovascular Surgery, General Hospital"
                  value={pSpec}
                  onChange={(e) => setPSpec(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">Phone Number</label>
                  <input
                    type="text"
                    className="w-full text-slate-800 bg-slate-50 border rounded-lg p-2.5 font-semibold"
                    placeholder="e.g. 0300-1122334"
                    value={pPhone}
                    onChange={(e) => setPPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">Commission Split (%)</label>
                  <input
                    type="number"
                    max={50}
                    min={0}
                    className="w-full text-slate-800 bg-slate-50 border rounded-lg p-2.5 font-black"
                    value={pComm}
                    onChange={(e) => setPComm(Number(e.target.value))}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white rounded-xl py-2.5 font-bold shadow-xs hover:bg-indigo-700 transition"
              >
                Draft Legal Contract File
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LOG REFERRAL TRANSACTION EVENT MODAL */}
      {showLogReferral && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="referral-case-modal">
          <div className="bg-white border rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-xs font-semibold">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-sm font-black text-slate-900">Post Outpatient Referral Match</h4>
              <button onClick={() => setShowLogReferral(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handlePostReferralCase} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Select Partner Contract</label>
                <select
                  required
                  className="w-full text-slate-800 bg-slate-50 border rounded-lg p-2.5 font-extrabold focus:bg-white"
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                >
                  <option value="">-- Choose Referring MD --</option>
                  {partnerContracts.map(p => (
                    <option key={p.id} value={p.id}>{p.partnerName} ({p.commissionPercentage}% Commission)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Directed Patient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sadiya Bibi"
                  className="w-full text-slate-800 bg-slate-50 border rounded-lg p-2.5 font-semibold focus:bg-white"
                  value={refPatientName}
                  onChange={(e) => setRefPatientName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Relative Bill Gross Amount (Rs)</label>
                <input
                  type="number"
                  required
                  className="w-full text-slate-850 bg-slate-50 border rounded-lg p-2.5 font-black focus:bg-white text-slate-800"
                  value={refBillAmount}
                  onChange={(e) => setRefBillAmount(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Referral Diagnosis Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. For biochemical lipid index"
                  className="w-full text-[11px] text-slate-805 bg-slate-50 border rounded-lg p-2 font-medium"
                  value={refNotes}
                  onChange={(e) => setRefNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 text-white rounded-xl py-2.5 font-bold hover:bg-slate-800 transition shadow-xs"
              >
                Bind Patient Case & Post Split Shares
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
