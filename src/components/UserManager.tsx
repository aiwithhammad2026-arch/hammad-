/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { db, generateId } from "../dbMock";
import { User, UserGroup, PermissionMatrix, LoginHistoryEntry, UserRole } from "../types";
import { 
  ShieldCheck, 
  Users, 
  Lock, 
  Clock, 
  Activity, 
  Check, 
  AlertCircle,
  Save,
  Key
} from "lucide-react";

interface UserManagerProps {
  lang: string;
}

export default function UserManager({ lang }: UserManagerProps) {
  const [activeTab, setActiveTab] = useState<"groups" | "accounts" | "sessions">("groups");
  
  // Real Local Database States
  const [groups, setGroups] = useState<UserGroup[]>(db.getUserGroups());
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>(db.getLoginHistory());
  
  // Active Selected Access group for editing
  const [selectedGroupId, setSelectedGroupId] = useState<string>("g-admin");
  const [sessionTimeoutMins, setSessionTimeoutMins] = useState<number>(30);
  
  // Success toast feedback
  const [feedback, setFeedback] = useState("");

  const selectedGroup = groups.find(g => g.id === selectedGroupId) || groups[0];

  const permissionTypes: Array<{ key: keyof PermissionMatrix; label: string }> = [
    { key: "view", label: "View Screen data" },
    { key: "create", label: "Create / Append Record" },
    { key: "edit", label: "Modify / Edit Data" },
    { key: "delete", label: "Destructive Delete" },
    { key: "print", label: "Print Reports/Invoices" },
    { key: "export", label: "CSV/Excel Data Export" },
    { key: "approve", label: "Approve Clinical Cases" },
    { key: "validate", label: "Doctor Report Validation" }
  ];

  const moduleNames = [
    "Dashboard",
    "Patient Registry",
    "OPD Desk",
    "LIS Lab",
    "Radiology Portal",
    "Billing Desk",
    "Financial Accounting",
    "Partner Referrals",
    "Patient Feedback",
    "Security Audit",
    "Backup Desk",
    "System Config"
  ];

  const handleTogglePermission = (moduleName: string, permissionType: keyof PermissionMatrix) => {
    if (!selectedGroup) return;

    // Deep clone permission matrix mapping state
    const updatedGroups = groups.map(g => {
      if (g.id === selectedGroupId) {
        const matrix = { ...g.permissions[moduleName] };
        matrix[permissionType] = !matrix[permissionType];
        
        return {
          ...g,
          permissions: {
            ...g.permissions,
            [moduleName]: matrix
          }
        };
      }
      return g;
    });

    setGroups(updatedGroups);
    // Persist list
    const matched = updatedGroups.find(g => g.id === selectedGroupId);
    if (matched) {
      db.saveUserGroup(matched);
    }
  };

  const handleSyncTimeout = () => {
    setFeedback(`Session inactivity auto-timeout successfully optimized to: ${sessionTimeoutMins} minutes!`);
    db.log("admin", "ADMIN", "Adjust Security Policy", "SECURITY", `Global security session timeout updated to ${sessionTimeoutMins} minutes.`);
    setTimeout(() => setFeedback(""), 4000);
  };

  return (
    <div className="space-y-6" id="user-manager-workflow">
      
      {/* Top Banner Card */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-blue-600 p-1.5 bg-blue-50 rounded-xl" />
          <div>
            <h3 className="text-base font-black tracking-tight text-slate-900">Multiuser Access Security Controls</h3>
            <p className="text-xs text-slate-400">Manage user groups, configure screen/module level permissions matrix, enforce inactivity timers, and review real-time session paths.</p>
          </div>
        </div>

        {/* Tab Controls for RBAC */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("groups")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "groups" ? "bg-slate-905 bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Access Permissions Matrix
          </button>
          <button
            onClick={() => setActiveTab("accounts")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "accounts" ? "bg-slate-905 bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Terminal Staff Accounts
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "sessions" ? "bg-slate-905 bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Live Monitor & login History
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-55 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold">
          {feedback}
        </div>
      )}

      {/* VIEW: ROBUST ACCESS GROUPS PERMISSIONS GRID */}
      {activeTab === "groups" && selectedGroup && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Groups Selection Sidebar */}
          <div className="xl:col-span-1 bg-white border border-slate-100 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Hospital Security Roles</h4>
            
            <div className="space-y-1.5">
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroupId(g.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all text-xs font-bold border ${
                    selectedGroupId === g.id 
                      ? "bg-blue-50 border-blue-200 text-blue-700" 
                      : "bg-white border-slate-50 hover:bg-slate-50 text-slate-705 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 shrink-0 text-slate-400" />
                    <span className="truncate">{g.name}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block font-mono mt-1 uppercase tracking-wide">Base Class: {g.role}</span>
                </button>
              ))}
            </div>

            {/* Session Expiry Settings in same workspace */}
            <div className="border-t border-slate-100 pt-4 mt-2 space-y-3">
              <span className="text-[10px] text-slate-400 uppercase font-black block tracking-wider">Inactivity Security Policies</span>
              
              <div className="space-y-1 text-xs font-semibold">
                <label className="text-slate-500 font-bold">Simulated Session Timeout</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2 font-black"
                    value={sessionTimeoutMins}
                    onChange={(e) => setSessionTimeoutMins(Number(e.target.value))}
                  />
                  <span className="p-2 text-slate-400 font-bold self-center">Min</span>
                </div>
              </div>

              <button
                onClick={handleSyncTimeout}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2 text-[10px] font-bold shadow-xs transition-all flex items-center justify-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Enforce Timeout Settings</span>
              </button>
            </div>
          </div>

          {/* Matrix Boolean Grid and controls */}
          <div className="xl:col-span-3 bg-white border border-slate-100 rounded-2xl overflow-hidden p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
              <div>
                <h4 className="text-sm font-black text-slate-900">{selectedGroup.name} Rules Mapping</h4>
                <p className="text-[11px] text-slate-400 font-semibold text-slate-500">Edit screen-level access, data operations writes, validation permissions, and print rules.</p>
              </div>
              <span className="bg-blue-100 text-blue-700 font-black rounded-lg text-[10px] px-2.5 py-1 uppercase">{selectedGroup.role} ASSIGNMENTS</span>
            </div>

            <div className="overflow-x-auto border border-slate-50 rounded-xl">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-150">
                  <tr>
                    <th className="p-2.5">Workspace Screen Module</th>
                    {permissionTypes.map(pt => (
                      <th key={pt.key} className="p-2 text-center text-[10px] truncate max-w-[80px]" title={pt.label}>{pt.key.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {moduleNames.map((mod) => {
                    const matrix = selectedGroup.permissions[mod] || { view: false, create: false, edit: false, delete: false, print: false, export: false, approve: false, validate: false };
                    return (
                      <tr key={mod} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-850 text-slate-800">{mod}</td>
                        {permissionTypes.map(pt => {
                          const val = matrix[pt.key];
                          return (
                            <td key={pt.key} className="p-1.5 text-center">
                              <button
                                onClick={() => handleTogglePermission(mod, pt.key)}
                                className={`w-8 h-8 rounded-lg text-xs mx-auto border transition-all flex items-center justify-center cursor-pointer ${
                                  val 
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100" 
                                    : "bg-slate-50 border-slate-100 text-slate-350 hover:bg-slate-100"
                                }`}
                              >
                                {val ? <Check className="w-4.5 h-4.5 font-black" /> : <span className="text-[9px] font-bold">✕</span>}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl text-[11px] text-slate-400 border border-slate-100 flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
              <span>Permissions adjust local sandbox access immediately. Changes are saved back to persistent browser config rows and locked. Security policies monitor these grids under active user switches.</span>
            </div>
          </div>

        </div>
      )}

      {/* VIEW: STAFF ACCOUNTS INDEX */}
      {activeTab === "accounts" && (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h4 className="text-sm font-black text-slate-900">Hospital Terminal Accounts</h4>
              <p className="text-xs text-slate-400">Live directory of accounts active on local LAN terminals. Switch active profile from upper header controls.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((usr) => {
              const matchedGrp = groups.find(g => g.id === usr.groupId);
              return (
                <div key={usr.id} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col justify-between hover:bg-slate-50 transition-all space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <strong className="text-xs text-slate-900 font-extrabold block">{usr.name}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">Sim Username: @{usr.username}</span>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">{usr.role}</span>
                  </div>

                  <div className="space-y-1.5 text-xs font-medium text-slate-600 border-t border-dashed border-slate-200 pt-2.5">
                    <div>Authorized Group: <strong>{matchedGrp?.name || "Global Staff"}</strong></div>
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${usr.isLoggedIn ? "bg-emerald-500 animate-pulse" : "bg-slate-350"}`} />
                      <span>Session: {usr.isLoggedIn ? "Active Console Sync" : "No active session"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: LOGIN HISTORY MONITOR */}
      {activeTab === "sessions" && (
        <div className="bg-white border border-slate-105 border-slate-100 rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Live Security Terminal Connection History</h4>
          
          <div className="overflow-x-auto border border-slate-50 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="p-3">Login Timestamp</th>
                  <th className="p-3">Staff Username / Session Token</th>
                  <th className="p-3">Assigned Policy Group</th>
                  <th className="p-3">Local Interface IP</th>
                  <th className="p-3">Client Terminal specifications</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-mono">
                {loginHistory.map((lh) => (
                  <tr key={lh.id} className="hover:bg-slate-50/50">
                    <td className="p-2.5 text-slate-500">{new Date(lh.timestamp).toLocaleString()}</td>
                    <td className="p-2.5 font-bold text-slate-850">
                      <span className="font-sans block text-xs font-semibold">@{lh.username}</span>
                      <span className="text-[9px] text-slate-400">token: {lh.id}</span>
                    </td>
                    <td className="p-2.5 font-sans font-bold text-slate-600">{lh.role}</td>
                    <td className="p-2.5 text-slate-500 text-[11px]">{lh.ipAddress}</td>
                    <td className="p-2.5 font-sans text-slate-400 text-[10px] truncate max-w-[200px]" title={lh.deviceInfo}>{lh.deviceInfo}</td>
                    <td className="p-2.5 text-center">
                      <span className="bg-emerald-50 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Active Connect</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
