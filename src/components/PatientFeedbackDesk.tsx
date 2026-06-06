/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from "react";
import { db, generateId } from "../dbMock";
import { PatientFeedback, Patient } from "../types";
import { 
  Heart, 
  MessageSquarePlus, 
  MessageCircle, 
  Star, 
  AlertCircle, 
  RefreshCcw, 
  Check, 
  Sliders 
} from "lucide-react";

interface FeedbackProps {
  lang: string;
}

export default function PatientFeedbackDesk({ lang }: FeedbackProps) {
  const [feedbacks, setFeedbacks] = useState<PatientFeedback[]>(db.getFeedbacks());
  const [patients, setPatients] = useState<Patient[]>(db.getPatients());
  
  // Create feedback Form states
  const [feedbackPatientId, setFeedbackPatientId] = useState("");
  const [fbDept, setFbDept] = useState("OPD Waiting Hall");
  const [fbRating, setFbRating] = useState<number>(5);
  const [fbComplaintType, setFbComplaintType] = useState("");
  const [fbDetails, setFbDetails] = useState("");
  const [fbSuggestion, setFbSuggestion] = useState("");

  const [activeFbTab, setActiveFbTab] = useState<"index" | "submit">("index");
  
  // Resolution update state
  const [activeFeedbackInEditing, setActiveFeedbackInEditing] = useState<PatientFeedback | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const activeDepartments = [
    "OPD Waiting Hall",
    "Clinical Consulting Wing",
    "Laboratory Draw Desk",
    "Radiology Imaging Room",
    "Financial Cashier Gate"
  ];

  const handleRegisterFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackPatientId) {
      setFeedbackMsg("Please pick an active patient ledger ID first.");
      return;
    }
    const patObj = patients.find(p => p.id === feedbackPatientId);
    
    const newFeedback: PatientFeedback = {
      id: generateId("fb_"),
      patientId: feedbackPatientId,
      patientName: patObj?.name || "Visitor Account",
      department: fbDept,
      rating: fbRating,
      complaintType: fbComplaintType || undefined,
      details: fbDetails,
      suggestion: fbSuggestion,
      status: "Pending",
      createdAt: new Date().toISOString()
    };

    db.saveFeedback(newFeedback);
    setFeedbacks(db.getFeedbacks());
    setActiveFbTab("index");
    
    // clear states
    setFeedbackPatientId("");
    setFbDetails("");
    setFbSuggestion("");
    setFbComplaintType("");
    
    // Audit log
    db.log("receptionist", "RECEPTIONIST", "Register Patient Feedback", "FEEDBACK", `Logged satisfaction report (Rating: ${fbRating}/5 stars) for Patient ${newFeedback.patientName}`);
    
    setFeedbackMsg("Patient feedback successfully recorded. Hospital QA logs updated.");
    setTimeout(() => setFeedbackMsg(""), 4000);
  };

  const handleUpdateResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFeedbackInEditing) return;

    const copy = { ...activeFeedbackInEditing };
    copy.status = "Resolved";
    copy.resolutionNotes = resolutionNote;

    db.saveFeedback(copy);
    setFeedbacks(db.getFeedbacks());
    setActiveFeedbackInEditing(null);
    setResolutionNote("");

    db.log("admin", "ADMIN", "Resolve Feedback Complaint", "FEEDBACK", `Logged QA action and closed complaint #${copy.id}`);
    
    setFeedbackMsg("Feedback case resolved and closed out in auditing books.");
    setTimeout(() => setFeedbackMsg(""), 4000);
  };

  return (
    <div className="space-y-6" id="feedback-desk-panel">
      
      {/* Module Hub Card */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Heart className="w-8 h-8 text-rose-500 p-1.5 bg-rose-50 rounded-xl" />
          <div>
            <h3 className="text-base font-black tracking-tight text-slate-900">Patient Feedback & QA Monitor</h3>
            <p className="text-xs text-slate-400">Log patient suggestions, register clinical service level complaints, audit ratings stats per department, and trace corrective operations.</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setActiveFbTab("index"); setFeedbackMsg(""); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFbTab === "index" ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Resolution Logs
          </button>
          <button
            onClick={() => { setActiveFbTab("submit"); setFeedbackMsg(""); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFbTab === "submit" ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Register Complaint/Review
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs font-semibold animate-pulse-once">
          {feedbackMsg}
        </div>
      )}

      {/* VIEW: COMPLAINT RESOLUTION TRACKING */}
      {activeFbTab === "index" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* List of Reviews registered */}
          <div className="xl:col-span-2 bg-white border border-slate-100 p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Patient Reviews and Service ratings</h4>
            
            <div className="space-y-3.5">
              {feedbacks.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No QA feedbacks registered. Click 'Register Complaint/Review' tab to add.</div>
              ) : (
                feedbacks.map((fb) => (
                  <div key={fb.id} className="p-4 border rounded-2xl hover:bg-slate-50/40 transition-all space-y-2.5">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <strong className="text-slate-900 text-xs font-black">{fb.patientName}</strong>
                        <span className="text-[10px] text-slate-400 block font-semibold">{fb.department}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          fb.status === "Pending" ? "bg-rose-50 text-rose-700 animate-pulse" :
                          fb.status === "In_Review" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                        }`}>{fb.status}</span>
                        {/* Rating stars rendering */}
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < fb.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 leading-normal bg-white p-2.5 border rounded-xl font-medium">
                      {fb.complaintType && <span className="text-[10px] bg-rose-50 border text-rose-700 px-1.5 py-0.5 rounded-sm mr-1 font-bold">{fb.complaintType}</span>}
                      <span>{fb.details}</span>
                    </div>

                    {fb.suggestion && (
                      <div className="text-[11px] text-slate-500 italic flex items-start gap-1">
                        <span>💡 Suggestion:</span>
                        <span>"{fb.suggestion}"</span>
                      </div>
                    )}

                    {/* Resolution details */}
                    {fb.status === "Resolved" && fb.resolutionNotes && (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-800 space-y-1.5">
                        <strong className="font-extrabold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>QA Resolution notes</span>
                        </strong>
                        <p className="font-sans leading-normal">{fb.resolutionNotes}</p>
                      </div>
                    )}

                    {/* Action toggles inside card for Admins */}
                    {fb.status !== "Resolved" && (
                      <div className="border-t border-dashed pt-2 flex justify-end">
                        <button
                          onClick={() => {
                            setActiveFeedbackInEditing(fb);
                            setResolutionNote(fb.resolutionNotes || "");
                          }}
                          className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2.5 py-1 rounded-md cursor-pointer transition-all"
                        >
                          Corrective Resolution
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Corrective Action Sheet Modal / Block Column */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Clinical Resolution Workspace</h4>
            
            {activeFeedbackInEditing ? (
              <form onSubmit={handleUpdateResolution} className="space-y-4 text-xs font-semibold">
                <div className="bg-rose-50 border border-slate-100 p-4 rounded-xl space-y-1">
                  <span className="text-[9px] text-rose-700 font-bold uppercase tracking-wider block">Currently Auditing Case ID</span>
                  <strong className="text-slate-900 block">{activeFeedbackInEditing.patientName} - {activeFeedbackInEditing.department}</strong>
                  <p className="text-[11px] text-slate-500 italic font-medium">"{activeFeedbackInEditing.details}"</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Corrective Resolution Actions Taken</label>
                  <textarea
                    required
                    className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 focus:bg-white min-h-[90px] font-semibold"
                    placeholder="Details what hospital authorities did to resolve. Key in staff changes, seatings, water dispenser placement..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveFeedbackInEditing(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-3 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg py-1.5 px-3 font-bold shadow-xs"
                  >
                    Save QA Action
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl flex flex-col justify-center min-h-[180px]">
                <RefreshCcw className="w-8 h-8 text-slate-250 mx-auto animate-spin-slow mb-2" />
                <span>Select an active complaint ticket 'Corrective Resolution' to open resolution logs workspace.</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEW: REGISTER COMPLAINT AND FEEDBACK */}
      {activeFbTab === "submit" && (
        <div className="bg-white border max-w-lg mx-auto rounded-2xl p-6 shadow-sm space-y-4">
          <h4 className="text-sm font-black text-slate-900 border-b pb-2">Record Patient Service Assessment</h4>
          
          <form onSubmit={handleRegisterFeedback} className="space-y-4 text-xs font-semibold">
            
            {/* Select hospital patient */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Acknowledge Patient Ledger <span className="text-rose-500">*</span></label>
              <select
                required
                className="w-full text-slate-850 bg-slate-50 border rounded-lg p-2.5 font-bold focus:bg-white"
                value={feedbackPatientId}
                onChange={(e) => setFeedbackPatientId(e.target.value)}
              >
                <option value="">-- Click to pick Patient file --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.mrn} - {p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Select Department */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Target Clinical Unit</label>
                <select
                  required
                  className="w-full text-slate-800 bg-slate-50 border rounded-lg p-2.5 font-bold"
                  value={fbDept}
                  onChange={(e) => setFbDept(e.target.value)}
                >
                  {activeDepartments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Service Rating (1 to 5 Stars selection) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Service quality rating</label>
                <div className="flex items-center gap-1.5 h-[42px]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFbRating(i + 1)}
                      className="text-slate-300 hover:scale-115 transition"
                    >
                      <Star className={`w-6 h-6 ${i < fbRating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Complaint category tag label */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Complaint Classification (Leave blank if general suggestion)</label>
              <input
                type="text"
                placeholder="e.g. Long Queue wait, Delay in reports receipt, Rude cashier behaviour"
                className="w-full text-slate-800 bg-slate-50 border rounded-lg p-2.5 font-semibold focus:bg-white"
                value={fbComplaintType}
                onChange={(e) => setFbComplaintType(e.target.value)}
              />
            </div>

            {/* Assessment description details */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Patient Narrative Assessment Details <span className="text-rose-500">*</span></label>
              <textarea
                required
                className="w-full text-slate-800 bg-slate-50 border rounded-lg p-2.5 focus:bg-white font-semibold min-h-[80px]"
                placeholder="Let patient write precise complaints details..."
                value={fbDetails}
                onChange={(e) => setFbDetails(e.target.value)}
              />
            </div>

            {/* Suggestion box */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase">Corrective Suggestion Box</label>
              <input
                type="text"
                placeholder="e.g. Hospital should recruit more cashiers in peak morning slots"
                className="w-full text-slate-805 bg-slate-50 border rounded-lg p-2.5 font-semibold"
                value={fbSuggestion}
                onChange={(e) => setFbSuggestion(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-905 bg-slate-900 text-white rounded-xl py-3 font-bold shadow-sm hover:bg-slate-800 transition text-xs cursor-pointer"
            >
              Post Patient Feedback Form
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
