/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { db, generateId } from "../dbMock";
import { Patient, RadiologyOrder, RadiologyType } from "../types";
import { 
  Heart, 
  Layers, 
  Calendar, 
  Upload, 
  FileText, 
  Check, 
  AlertCircle, 
  Printer, 
  ShieldAlert, 
  Maximize2 
} from "lucide-react";

interface RadiologyManagerProps {
  lang: string;
  userRole: string;
}

export default function RadiologyManager({ lang, userRole }: RadiologyManagerProps) {
  const [orders, setOrders] = useState<RadiologyOrder[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  // Tab view: "queue" | "schedule"
  const [radTab, setRadTab] = useState<"queue" | "schedule">("queue");
  
  // Schedule Form states
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [radService, setRadService] = useState<RadiologyType>("X-Ray");
  const [radTitle, setRadTitle] = useState("");
  const [radScheduleDate, setRadScheduleDate] = useState(new Date().toISOString().substring(0, 16));
  const [radTechnicianId, setRadTechnicianId] = useState("u-usr-rad");
  const [radFee, setRadFee] = useState(1000);

  // Active record acting on for writes or image feeds
  const [selectedOrder, setSelectedOrder] = useState<RadiologyOrder | null>(null);
  const [reportNotes, setReportNotes] = useState("");
  const [simulatedImage, setSimulatedImage] = useState("");
  
  // Error / Success indicators
  const [statusMessage, setStatusMessage] = useState("");

  const scanServices: Array<{ type: RadiologyType; defaultFee: number; label: string }> = [
    { type: "X-Ray", defaultFee: 1000, label: "X-Ray Digital Chest/Bone P/A View" },
    { type: "Ultrasound", defaultFee: 1500, label: "Abdominal & Pelvis Ultrasound scan" },
    { type: "CT Scan", defaultFee: 6500, label: "CT Scan Brain/Spine high resonance study" },
    { type: "MRI", defaultFee: 12000, label: "MRI Contrast joint/cardiac diagnostic" },
    { type: "Doppler", defaultFee: 2500, label: "Doppler vascular scan blood flow index" },
    { type: "ECG", defaultFee: 500, label: "ECG Standard 12-Lead rhythm graph map" }
  ];

  useEffect(() => {
    refreshRadData();
  }, [radTab]);

  const refreshRadData = () => {
    setOrders(db.getRadiologyOrders());
    setPatients(db.getPatients());
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setStatusMessage("Missing patient selection registry.");
      return;
    }
    
    const patientObj = patients.find(p => p.id === selectedPatientId);
    const cost = radFee || scanServices.find(s => s.type === radService)?.defaultFee || 1000;
    
    const orderNo = `RAD-${Date.now().toString().substring(7)}`;
    
    const newOrder: RadiologyOrder = {
      id: generateId("rad_"),
      invoiceId: generateId("inv_"), // virtual billing link
      patientId: selectedPatientId,
      technicianId: radTechnicianId,
      radiologyType: radService,
      title: radTitle || scanServices.find(s => s.type === radService)?.label || radService,
      scheduledAt: new Date(radScheduleDate).toISOString(),
      fee: cost,
      status: "Scheduled"
    };

    db.saveRadiologyOrder(newOrder);
    
    // Automatically log billing event
    const invoiceNo = `INV-RAD-${Date.now().toString().substring(8)}`;
    db.saveInvoice({
      id: newOrder.invoiceId,
      invoiceNumber: invoiceNo,
      patientId: selectedPatientId,
      items: [
        { id: `rad_itm_${Date.now()}`, type: "Radiology_Test", description: `Radiology: ${newOrder.title}`, referenceId: newOrder.id, amount: cost }
      ],
      subtotal: cost,
      discount: 0,
      total: cost,
      paidAmount: cost,
      dues: 0,
      status: "Paid",
      createdAt: new Date().toISOString(),
      cashier: "receptionist_ali"
    });

    db.log("receptionist", "RECEPTIONIST", "Create Radiology Appointment", "RADIOLOGY", `Scheduled scan token: ${newOrder.title} for patient ${patientObj?.name}`);
    setStatusMessage("Successfully booked radiology scan resource room as active!");
    
    // reset form
    setSelectedPatientId("");
    setRadTitle("");
    setRadScheduleDate(new Date().toISOString().substring(0, 16));
    setRadTab("queue");
    refreshRadData();
  };

  const handleUploadImageMock = (orderId: string, imageCode: string) => {
    const list = db.getRadiologyOrders();
    const orderObj = list.find(o => o.id === orderId);
    if (orderObj) {
      orderObj.status = "Image_Uploaded";
      orderObj.imageUrl = imageCode;
      db.saveRadiologyOrder(orderObj);
      db.log("radiology_tech", "RADIOLOGIST", "Upload Scan Image Mock", "RADIOLOGY", `Uploaded film radiography block for scan title: ${orderObj.title}`);
      
      // refresh active selected
      setSelectedOrder({ ...orderObj });
      refreshRadData();
    }
  };

  const handleUpdateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    selectedOrder.status = "Report_Written";
    selectedOrder.reportNotes = reportNotes;
    selectedOrder.reportedBy = db.getCurrentUser().name || "Dr. Yasir Iqbal (Radiology Clinician)";
    
    db.saveRadiologyOrder(selectedOrder);
    db.log(db.getCurrentUser().username, db.getCurrentUser().role, "Save Radiologist Study Notes", "RADIOLOGY", `Logged critical clinical imaging diagnostic summaries for order study ${selectedOrder.title}`);
    
    setSelectedOrder(null);
    setReportNotes("");
    refreshRadData();
  };

  const handleValidateOrderByMD = (orderId: string) => {
    const list = db.getRadiologyOrders();
    const o = list.find(ord => ord.id === orderId);
    if (o) {
      o.status = "Validated";
      o.validatedAt = new Date().toISOString();
      db.saveRadiologyOrder(o);
      db.log(db.getCurrentUser().username, db.getCurrentUser().role, "Certify Imaging Diagnostic Report", "RADIOLOGY", `Doctor validated clinical reports files of ${o.title}`);
      
      setSelectedOrder(null);
      refreshRadData();
    }
  };

  return (
    <div className="space-y-6" id="radiology-manager-module">
      
      {/* Module Title Section */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Layers className="w-8 h-8 text-indigo-600 p-1.5 bg-indigo-50 rounded-xl" />
          <div>
            <h3 className="text-base font-black tracking-tight text-slate-900">Radiology Diagnostic Management</h3>
            <p className="text-xs text-slate-400">Manage radiology scans queues (MRI, Ultrasound, X-Ray, etc.), link DICOM blocks, write medical diagnostics sheets, and approve reports.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setRadTab("queue"); setStatusMessage(""); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              radTab === "queue" ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-705 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Imaging Scan Queue
          </button>
          <button
            onClick={() => { setRadTab("schedule"); setStatusMessage(""); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              radTab === "schedule" ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-705 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Book Scan Appointment
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-800 text-xs font-bold animate-pulse-once">
          {statusMessage}
        </div>
      )}

      {/* VIEW: SCAN QUEUE */}
      {radTab === "queue" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Main Scans Lists Table */}
          <div className="xl:col-span-2 bg-white border border-slate-100 rounded-2xl overflow-hidden p-5 space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Active Patient Scan Line</h4>
            
            <div className="overflow-x-auto border border-slate-50 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="p-3">Patient MRN / Name</th>
                    <th className="p-3">Scan Type</th>
                    <th className="p-3">Schedule Date</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Fee (Rs)</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">No patient scan tokens created in clinic database.</td>
                    </tr>
                  ) : (
                    orders.map((o) => {
                      const pObj = patients.find(p => p.id === o.patientId);
                      return (
                        <tr key={o.id} className={`hover:bg-slate-50/50 ${selectedOrder?.id === o.id ? "bg-indigo-50/20" : ""}`}>
                          <td className="p-3">
                            <strong className="text-slate-900 block font-semibold">{pObj?.name || "Unidentified Patient"}</strong>
                            <span className="text-[10px] text-slate-400 font-mono">Medical Record Code: {pObj?.mrn}</span>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-850 text-slate-800">{o.title}</div>
                            <span className="bg-slate-100 text-slate-600 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm">{o.radiologyType}</span>
                          </td>
                          <td className="p-3 font-mono text-slate-500">{new Date(o.scheduledAt).toLocaleString()}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              o.status === "Scheduled" ? "bg-blue-50 text-blue-700" :
                              o.status === "Image_Uploaded" ? "bg-amber-50 text-amber-700 font-extrabold" :
                              o.status === "Report_Written" ? "bg-purple-50 text-purple-700" : "bg-emerald-50 text-emerald-700"
                            }`}>{o.status.replace(/_/g," ")}</span>
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900">Rs. {o.fee.toLocaleString()}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedOrder(o);
                                setReportNotes(o.reportNotes || "");
                              }}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-lg py-1 px-3.5 transition-all text-[10px]"
                            >
                              Open Worksheet
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ACTIVE SELECTED SCA SHEET - REPORT WRITING / VALIDATION WORKSPACE */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-sm">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Imaging and Diagnostics Desk</h4>
            
            {selectedOrder ? (
              <div className="space-y-4">
                
                {/* Details Banner */}
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-1.5 text-xs font-semibold">
                  <div className="text-[10px] text-slate-400 block font-bold uppercase">Worksheet Diagnostic Token</div>
                  <strong className="text-slate-900 block text-xs">{selectedOrder.title}</strong>
                  <div className="text-[11px] text-slate-600 font-medium">Patient: {patients.find(p=>p.id === selectedOrder.patientId)?.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">Staff Technician ID: {selectedOrder.technicianId || "Unassigned"}</div>
                </div>

                {/* DICOM/FILM IMAGE SECTOR IN WORKPLACE */}
                <div className="border border-slate-150 rounded-2xl p-4 bg-slate-900 text-white min-h-[160px] flex flex-col justify-between" id="dicom-viewer">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>DIGITAL X-RAY VIEWER / PACS</span>
                    <span className="text-amber-500">DICOM STACK CONTRAST</span>
                  </div>

                  {selectedOrder.imageUrl ? (
                    <div className="relative rounded-lg overflow-hidden border border-slate-800 my-2">
                      <img src={selectedOrder.imageUrl} alt="radiology-film" className="w-full h-32 object-cover filter brightness-75 contrast-125" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex items-end p-2">
                        <span className="text-[9px] font-mono font-bold text-slate-300">Film slice identification matrix locked.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 text-slate-500 space-y-2">
                      <Heart className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
                      <p className="text-[10px] font-mono leading-normal">No scanning cassette recorded on Pacs network interface.</p>
                      
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => handleUploadImageMock(selectedOrder.id, "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=500&q=80")}
                          className="bg-indigo-600 text-white rounded-md p-1 px-2.5 text-[9px] font-bold"
                        >
                          Simulate Chest X-Ray
                        </button>
                        <button
                          onClick={() => handleUploadImageMock(selectedOrder.id, "https://images.unsplash.com/photo-1579684389782-64d84b5e9053?w=500&q=80")}
                          className="bg-slate-700 text-slate-200 rounded-md p-1 px-2.5 text-[9px] font-bold"
                        >
                          Simulate Cardiac Scan
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-2 border-t border-slate-850">
                    <span>Matrix: 512x512 Lossless</span>
                    <span>HMLMS RADIOLOGY DEPT</span>
                  </div>
                </div>

                {/* WRITING REPORT NOTES */}
                {(userRole === "RADIOLOGIST" || userRole === "ADMIN") && (
                  <form onSubmit={handleUpdateReport} className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Clinical Study Findings</label>
                      <textarea
                        required
                        className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 font-semibold min-h-[90px]"
                        placeholder="Write dynamic findings. Note active shadows, bone margins, tissue calcification..."
                        value={reportNotes}
                        onChange={(e) => setReportNotes(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(null)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-1.5 px-3 font-bold"
                      >
                        Ignore
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-1.5 px-3 font-bold shadow-xs flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Log Diagnoses</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* VALIDATION ACTION (ADMIN or CHIEF RADIOLOGIST) */}
                {selectedOrder.status === "Report_Written" && (userRole === "ADMIN" || userRole === "RADIOLOGIST") && (
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-xs space-y-1.5">
                    <h5 className="font-bold text-purple-900 text-xs flex items-center gap-1">
                      <ShieldAlert className="w-4 h-4 text-purple-600" />
                      <span>MD Pathologist Signoff Checklist</span>
                    </h5>
                    <p className="text-[11px] text-purple-700 leading-normal">The radiology findings are written by the technologist: <strong>{selectedOrder.reportedBy}</strong>. Confirm validation to finalize.</p>
                    <button
                      onClick={() => handleValidateOrderByMD(selectedOrder.id)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-2 rounded-xl text-[11px] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Validate & Publish Report</span>
                    </button>
                  </div>
                )}

                {/* COMPLETED / PRINT WORKFLOW SIGNED OFF REPORT VIEW */}
                {selectedOrder.status === "Validated" && (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-150 text-xs space-y-2">
                    <strong className="text-emerald-900 font-extrabold flex items-center gap-1 text-xs">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Report Officially Certified</span>
                    </strong>
                    <div className="text-[10px] text-emerald-700 font-mono">VALIDATION STAMP: {selectedOrder.validatedAt}</div>
                    <div className="text-slate-750 font-bold max-h-[80px] overflow-y-auto text-[11px] leading-normal">{selectedOrder.reportNotes}</div>
                    <button
                      onClick={() => window.print()}
                      className="w-full bg-slate-100 hover:bg-slate-250 text-slate-800 py-1.5 rounded-lg border font-bold text-[11px] flex items-center justify-center gap-1 transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Lab Report Card</span>
                    </button>
                  </div>
                )}

              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs border border-dashed rounded-2xl">
                <Heart className="w-8 h-8 text-slate-300 mx-auto" />
                <span>Select a patient scan queue row to accessPacs workstation and draft professional report files.</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEW: SCHEDULE APPOINTMENT FORM */}
      {radTab === "schedule" && (
        <div className="bg-white border border-slate-100 max-w-xl mx-auto rounded-2xl p-6 shadow-sm space-y-4">
          <h4 className="text-sm font-black text-slate-900 border-b pb-2">Simulate Radiology Booking Room Scheduler</h4>
          
          <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs font-semibold">
            
            {/* Patient File binding dropdown */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Select Hospital Patient File <span className="text-rose-500">*</span></label>
              <select
                required
                className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 font-bold focus:bg-white"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                <option value="">-- Click to bind Patient file --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.mrn} - {p.name} (Age: {p.age})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Scan technology Choice */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Scanning technology service</label>
                <select
                  required
                  className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 font-bold focus:bg-white"
                  value={radService}
                  onChange={(e) => {
                    const sel = e.target.value as RadiologyType;
                    setRadService(sel);
                    const feeMatched = scanServices.find(s => s.type === sel)?.defaultFee || 1000;
                    setRadFee(feeMatched);
                  }}
                >
                  {scanServices.map(ser => (
                    <option key={ser.type} value={ser.type}>{ser.type}</option>
                  ))}
                </select>
              </div>

              {/* Scans Schedule Date/Time */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Room Allocation and Schedule Time</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2 font-bold focus:bg-white"
                  value={radScheduleDate}
                  onChange={(e) => setRadScheduleDate(e.target.value)}
                />
              </div>
            </div>

            {/* Title / Description */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Clinical Scan Specification Note</label>
              <input
                type="text"
                className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 font-semibold focus:bg-white"
                placeholder="e.g. Chest P/A View with Rib Detail Focus"
                value={radTitle}
                onChange={(e) => setRadTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Charge of treatment scan */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estimated Scan Charge Fee (Rs)</label>
                <input
                  type="number"
                  required
                  className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 font-bold"
                  value={radFee}
                  onChange={(e) => setRadFee(Number(e.target.value))}
                />
              </div>

              {/* staff diagnostic assignment */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Designated Scan Technician Staff</label>
                <select
                  required
                  className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 font-bold"
                  value={radTechnicianId}
                  onChange={(e) => setRadTechnicianId(e.target.value)}
                >
                  <option value="u-usr-rad">Dr. Yasir Iqbal (Chief Radiologist)</option>
                  <option value="lead-tech">Anwar Sadiq (Senior Sonologist Assistant)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl tracking-wide transition-all shadow-xs text-xs cursor-pointer"
            >
              Post Scan Appointment & Trigger Cashier Invoice Receipting
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
