/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Shield, Trash2, Search, HelpCircle, History } from "lucide-react";
import { AuditLog } from "../types";
import { Language, translations } from "../translations";

interface AuditLogsTabProps {
  lang: Language;
  logs: AuditLog[];
  onClearLogs: () => void;
}

export default function AuditLogsTab({
  lang,
  logs,
  onClearLogs
}: AuditLogsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const t = (key: keyof typeof translations["en"]) => {
    return translations[lang][key] || translations["en"][key];
  };

  const filteredLogs = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return logs;
    return logs.filter((log) => {
      return (
        log.module.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.username.toLowerCase().includes(term) ||
        log.details.toLowerCase().includes(term)
      );
    });
  }, [logs, searchTerm]);

  return (
    <div className="space-y-6" id="audit-logs-tab-panel">
      
      {/* Action header bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4" id="audit-logs-action-bar">
        <div>
          <h3 className="text-md font-bold text-slate-800 leading-tight">{t("audit")}</h3>
          <p className="text-xs text-slate-400">{lang === "en" ? "Trace security transactions and system operational records" : "مریضوں کے اندراج اور فنانس تبدیلیاں دیکھنے کیلئے ہیڈ لاگز"}</p>
        </div>

        {/* Clear logs button */}
        <button
          onClick={() => {
            if (confirm("Are you sure you want to clear all audit logging records? This is irreversible.")) {
              onClearLogs();
            }
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-rose-100 cursor-pointer transition-colors"
          id="btn-clear-logs"
        >
          <Trash2 className="w-4 h-4" />
          {lang === "en" ? "Flush Logging Trails" : "لاگز صاف کریں"}
        </button>
      </div>

      {/* Search Input bar */}
      <div className="relative w-full sm:max-w-md" id="audit-search">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          className="w-full text-slate-700 bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 shadow-xs transition-all font-medium"
          placeholder="Filter logs by module, user, action details..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Main Logging rows Grid list */}
      <div className="border border-slate-100 bg-white rounded-2xl shadow-sm overflow-hidden" id="audit-logs-list">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
            <History className="w-4 h-4 text-slate-400" />
            {lang === "en" ? "System Event Logs Timeline" : "لاگز کی تفصیلی رپورٹ"}
          </span>
          <span className="text-[10px] bg-slate-200 text-slate-650 font-bold px-2 py-0.5 rounded-full">
            {filteredLogs.length} Entries
          </span>
        </div>

        <div className="overflow-x-auto" id="audit-logs-table-viewport">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase font-bold">
                <th className="p-3.5">{lang === "en" ? "Timestamp" : "وقت اور تاریخ"}</th>
                <th className="p-3.5">{lang === "en" ? "User / Role" : "صارف کی معلومات"}</th>
                <th className="p-3.5 text-center">{lang === "en" ? "Module Section" : "شعبہ"}</th>
                <th className="p-3.5">{lang === "en" ? "Operational Action" : "کام / کارروائی"}</th>
                <th className="p-3.5 text-right">{lang === "en" ? "Operation Metadata Output" : "سسٹم تبدیلی رپورٹ"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* Date Time */}
                    <td className="p-3.5 text-slate-500 font-mono text-[10px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    {/* User credentials */}
                    <td className="p-3.5">
                      <strong className="text-slate-800 block text-[11px] font-bold">@{log.username}</strong>
                      <span className="inline-block px-1 py-0.5 bg-slate-100 text-slate-600 font-bold text-[9px] rounded-sm mt-0.5 uppercase">
                        {log.role}
                      </span>
                    </td>

                    {/* Module name code */}
                    <td className="p-3.5 text-center">
                      <span className="inline-block font-bold text-[10px] text-indigo-700 tracking-wider">
                        {log.module}
                      </span>
                    </td>

                    {/* Action payload */}
                    <td className="p-3.5 font-bold text-slate-900">
                      {log.action}
                    </td>

                    {/* Event metadata details */}
                    <td className="p-3.5 text-slate-500 text-right font-medium max-w-[280px] break-words">
                      {log.details}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-450 italic">
                    No matching audit activity found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
