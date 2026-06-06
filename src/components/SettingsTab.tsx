/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sliders, Save, AlertCircle, Building, ShieldCheck } from "lucide-react";
import { SystemConfig } from "../types";
import { Language, translations } from "../translations";

interface SettingsTabProps {
  lang: Language;
  config: SystemConfig;
  onSaveConfig: (config: SystemConfig) => void;
}

export default function SettingsTab({
  lang,
  config,
  onSaveConfig
}: SettingsTabProps) {
  const [hospitalName, setHospitalName] = useState(config.hospitalName);
  const [hospitalUrduName, setHospitalUrduName] = useState(config.hospitalUrduName);
  const [tagline, setTagline] = useState(config.tagline || "");
  const [phone, setPhone] = useState(config.phone || "");
  const [address, setAddress] = useState(config.address || "");

  const t = (key: keyof typeof translations["en"]) => {
    return translations[lang][key] || translations["en"][key];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      hospitalName,
      hospitalUrduName,
      tagline,
      phone,
      address
    });
    alert("Hospital Configuration persisted! Header has updated.");
  };

  return (
    <div className="max-w-2xl mx-auto border border-slate-100 bg-white p-6 sm:p-8 rounded-3xl shadow-sm space-y-6" id="settings-tab-panel">
      
      <div className="border-b border-slate-100 pb-3 flex items-center gap-2.5">
        <Building className="w-5 h-5 text-blue-600" />
        <div>
          <h4 className="text-sm font-bold text-slate-800 leading-tight">{t("settings")}</h4>
          <p className="text-xs text-slate-400">Manage clinical names, contact lines, and print headers</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Hospital Name</label>
          <input
            type="text"
            required
            className="w-full text-slate-850 bg-slate-50 border border-slate-150 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500 font-semibold"
            value={hospitalName}
            onChange={(e) => setHospitalName(e.target.value)}
          />
        </div>

        {/* Tagline */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hospital Tagline / Mission statement</label>
          <input
            type="text"
            className="w-full text-slate-800 bg-slate-50 border border-slate-150 rounded-lg p-2.5 focus:bg-white font-medium"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="e.g. Quality Medical Solutions"
          />
        </div>

        {/* Contact info phone and address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t("phone")}</label>
            <input
              type="text"
              className="w-full text-slate-800 bg-slate-50 border border-slate-150 rounded-lg p-2.5 focus:bg-white font-mono font-bold"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t("address")}</label>
            <input
              type="text"
              className="w-full text-slate-800 bg-slate-50 border border-slate-150 rounded-lg p-2.5 focus:bg-white font-semibold"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

        </div>

        {/* Offline notice block */}
        <div className="p-3.5 bg-blue-50/70 rounded-xl flex items-start gap-2.5 text-slate-700 border border-blue-50">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-[11px]">
            <span className="font-bold text-blue-800">LAN Host / Single Node Deployment</span>:{" "}
            {lang === "en" 
              ? "All configurations apply immediately across local ports. Data remains sandboxed securely offline."
              : "تبدیلیاں فوراً پرنٹ فارمیٹس اور ہیڈر پر نظر آئیں گی۔ ڈیٹا کلاؤڈ پر نہیں بھیجا جائے گا۔"
            }
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {t("save")}
          </button>
        </div>

      </form>
    </div>
  );
}
