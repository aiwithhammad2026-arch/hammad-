/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from "react";
import { db, generateId } from "../dbMock";
import { BackupRecord } from "../types";
import { 
  Database, 
  RefreshCcw, 
  Download, 
  Upload, 
  Check, 
  AlertTriangle, 
  Settings, 
  Server, 
  ShieldAlert 
} from "lucide-react";

interface BackupRestoreProps {
  lang: string;
}

export default function BackupRestoreWizard({ lang }: BackupRestoreProps) {
  const [backups, setBackups] = useState<BackupRecord[]>(db.getBackupRecords());
  const [storageTarget, setStorageTarget] = useState("Local Disk");
  const [autoHours, setAutoHours] = useState<number>(12);
  const [isScheduled, setIsScheduled] = useState(true);

  // Restore validation wizard states
  const [restoreText, setRestoreText] = useState("");
  const [restoreStatus, setRestoreStatus] = useState<"idle" | "verifying" | "success" | "failed">("idle");
  const [restoreErrorMsg, setRestoreErrorMsg] = useState("");
  
  const [successMsg, setSuccessMsg] = useState("");

  const handleManualBackupTrigger = () => {
    const record = db.triggerBackup(storageTarget, "Manual");
    setBackups(db.getBackupRecords());
    setSuccessMsg(`Manual Database State Backup complete! Exported: ${record.fileName} (${(record.sizeBytes/1024).toFixed(2)} KB) to target [${storageTarget}]`);
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  const handleSavePolicy = () => {
    setSuccessMsg(`Scheduled Auto-Backup frequency locked at every: ${autoHours} hours.`);
    db.log("admin", "ADMIN", "Update Backup Policy", "BACKUPS", `Automated scheduled cron frequency adjusted to ${autoHours} hours.`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleSimulateRestoreRun = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreText) {
      setRestoreErrorMsg("JSON content box is empty. Paste data state to run checks.");
      setRestoreStatus("failed");
      return;
    }

    setRestoreStatus("verifying");
    setRestoreErrorMsg("");

    setTimeout(() => {
      const ok = db.restoreBackup(restoreText);
      if (ok) {
        setRestoreStatus("success");
        setSuccessMsg("System successfully restored back to target backup index! Patient registers aligned.");
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        setRestoreStatus("failed");
        setRestoreErrorMsg("Integrity verification test failed. Missing patient directories, hospital metadata structures, or corrupted parsing array.");
      }
    }, 1500);
  };

  const handleLoadDemoJSONMock = () => {
    const fakeState = {
      config: db.getConfig(),
      patients: db.getPatients(),
      vouchers: db.getVouchers()
    };
    setRestoreText(JSON.stringify(fakeState, null, 2));
    setRestoreErrorMsg("");
    setRestoreStatus("idle");
  };

  return (
    <div className="space-y-6" id="backup-restore-wizard">
      
      {/* Module Hub Panel */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-indigo-650 text-indigo-600 p-1.5 bg-indigo-50 rounded-xl" />
          <div>
            <h3 className="text-base font-black tracking-tight text-slate-900">Clinical Backup & Recovery Hub</h3>
            <p className="text-xs text-slate-400">Trigger manual localized backups, configure cron automatic scheduled timings, select storage targets, or leverage the backup restore integrity checks wizard.</p>
          </div>
        </div>

        <button
          onClick={handleManualBackupTrigger}
          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 px-4 shadow-sm text-xs font-bold transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Generate Recovery Backup</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold animate-pulse-once">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Policy Schedulers & Targets Configurations */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl space-y-4 shadow-sm text-xs font-semibold">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Device & Target configurations</h4>
          
          <div className="space-y-4">
            
            {/* Storage Target Option */}
            <div className="space-y-1.5">
              <label className="block text-slate-500 font-bold uppercase tracking-wide text-[10px]">Select Storage Target Medium</label>
              <div className="grid grid-cols-3 gap-1.5 font-bold text-center">
                {[
                  { id: "Local Disk", label: "Local C:/ Disk" },
                  { id: "External Drive", label: "External F:/ HDD" },
                  { id: "Network Folder", label: "LAN Net Share" }
                ].map(op => (
                  <button
                    key={op.id}
                    onClick={() => setStorageTarget(op.id)}
                    className={`p-2.5 rounded-lg border text-[10px] uppercase font-black transition ${
                      storageTarget === op.id 
                        ? "bg-slate-900 border-slate-900 text-white" 
                        : "bg-white border-slate-150 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scheduled Cron Parameters */}
            <div className="border-t border-dashed pt-4 space-y-3">
              <span className="block text-slate-500 uppercase tracking-wide text-[10px] font-black">Cron Automated Interval</span>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-bold">Activate Scheduled Logs Backups</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded-smaccent-blue-600 cursor-pointer"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                />
              </div>

              {isScheduled && (
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold">Auto-Backup Frequency Interval</label>
                  <select
                    className="w-full text-slate-800 bg-slate-50 border rounded-lg p-2 font-black cursor-pointer focus:bg-white"
                    value={autoHours}
                    onChange={(e) => setAutoHours(Number(e.target.value))}
                  >
                    <option value={4}>Every 4 Hours (High-Frequency Diagnostic)</option>
                    <option value={12}>Every 12 Hours (Standard Twice Daily)</option>
                    <option value={24}>Every 24 Hours (Daily Midnight Schedule)</option>
                    <option value={72}>Every 72 Hours (Biweekly Offline Backup)</option>
                  </select>
                </div>
              )}

              <button
                onClick={handleSavePolicy}
                className="w-full bg-slate-100 hover:bg-slate-205 py-2 hover:bg-slate-200 border rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-slate-850"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Lock Automated Policy</span>
              </button>
            </div>

          </div>
        </div>

        {/* RESTORE DATABASE INTEGRITY TEST WIZARD */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl space-y-4 shadow-sm text-xs font-semibold">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Target Recovery Restore Wizard</h4>
            <button
              onClick={handleLoadDemoJSONMock}
              className="text-[10px] text-blue-600 hover:underline font-black"
            >
              Load Simulated State JSON
            </button>
          </div>

          <form onSubmit={handleSimulateRestoreRun} className="space-y-4">
            
            <div className="space-y-1">
              <label className="block text-slate-500 font-bold">Paste Backup State String</label>
              <textarea
                required
                className="w-full text-[10px] font-mono text-slate-800 bg-slate-50 border rounded-lg p-2 focus:bg-white min-h-[110px]"
                placeholder='Past JSON output containing "{ patients: [...], config: {...} }"'
                value={restoreText}
                onChange={(e) => setRestoreText(e.target.value)}
              />
            </div>

            {/* Verification diagnostics */}
            {restoreStatus === "verifying" && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 font-bold flex items-center gap-2">
                <RefreshCcw className="w-4 h-4 animate-spin shrink-0 text-blue-600" />
                <span>Running database verification, checksum checks, and structural testing...</span>
              </div>
            )}

            {restoreStatus === "success" && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 font-bold flex items-center gap-2 leading-normal">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Integrity Match Confirmed. Restored config parameters and ledger lines.</span>
              </div>
            )}

            {restoreStatus === "failed" && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 font-bold flex items-start gap-2 leading-normal">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{restoreErrorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={restoreStatus === "verifying"}
              className="w-full bg-slate-905 bg-slate-900 border font-bold text-white py-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition hover:bg-slate-805"
            >
              <Upload className="w-4 h-4" />
              <span>Validate & Restore Backups</span>
            </button>
          </form>
        </div>

        {/* LOG OF HISTORIC BACKUPS CREATED */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl space-y-4 shadow-sm text-xs font-semibold">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">historic recovery state trail</h4>
          
          <div className="space-y-2.5 max-h-[290px] overflow-y-auto">
            {backups.map((b) => (
              <div key={b.id} className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex flex-col justify-between hover:bg-slate-50 transition-all space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="text-slate-800 block text-[11px] truncate max-w-[170px]" title={b.fileName}>{b.fileName}</strong>
                    <span className="text-[10px] text-slate-405 text-slate-400 font-mono">{new Date(b.timestamp).toLocaleString()}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                    b.status === "Verified_OK" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
                  }`}>{b.status.replace(/_/g," ")}</span>
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                  <span>Method: <strong>{b.type} ({b.target})</strong></span>
                  <span className="font-mono">Size: <strong>{(b.sizeBytes/1024).toFixed(2)} KB</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
