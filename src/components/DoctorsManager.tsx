/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { UserPlus, Star, Edit2, ShieldAlert, Phone, Calendar, Coins } from "lucide-react";
import { Doctor } from "../types";
import { Language, translations } from "../translations";
import { generateId } from "../dbMock";

interface DoctorsManagerProps {
  lang: Language;
  doctors: Doctor[];
  onSaveDoctor: (doctor: Doctor) => void;
}

export default function DoctorsManager({
  lang,
  doctors,
  onSaveDoctor
}: DoctorsManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [fee, setFee] = useState<number | " text">("");
  const [sharePercentage, setSharePercentage] = useState<number>(70);
  const [phone, setPhone] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const t = (key: keyof typeof translations["en"]) => {
    return translations[lang][key] || translations["en"][key];
  };

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handleDayToggle = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !specialization || !fee) {
      alert("Please fill all required fields.");
      return;
    }

    const docRecord: Doctor = {
      id: editingDoctor ? editingDoctor.id : generateId("doc_"),
      name,
      specialization,
      fee: Number(fee),
      sharePercentage: Number(sharePercentage),
      phone,
      availableDays: selectedDays.length > 0 ? selectedDays : ["Mon", "Tue", "Wed", "Thu", "Fri"]
    };

    onSaveDoctor(docRecord);
    
    // Reset States
    setIsFormOpen(false);
    setEditingDoctor(null);
    setName("");
    setSpecialization("");
    setFee("");
    setSharePercentage(70);
    setPhone("");
    setSelectedDays([]);
  };

  const startEdit = (d: Doctor) => {
    setEditingDoctor(d);
    setName(d.name);
    setSpecialization(d.specialization);
    setFee(d.fee);
    setSharePercentage(d.sharePercentage);
    setPhone(d.phone);
    setSelectedDays(d.availableDays);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6" id="doctors-manager-panel">
      
      {/* Upper action row */}
      <div className="flex items-center justify-between" id="doctors-action-bar">
        <div>
          <h3 className="text-md font-bold text-slate-800 leading-tight">{t("doctors")}</h3>
          <p className="text-xs text-slate-400">{lang === "en" ? "Consultant scheduling and clinical contract rates" : "کنسلٹنٹ ڈاکٹروں کا شیڈول اور فیصد منافع معاہدہ"}</p>
        </div>
        <button
          onClick={() => {
            setEditingDoctor(null);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          id="btn-add-doctor"
        >
          <UserPlus className="w-4 h-4" />
          {lang === "en" ? "Register New Consultant" : "نیا ڈاکٹر شامل کریں"}
        </button>
      </div>

      {/* Grid of registered Doctors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="doctors-cards-grid">
        {doctors.map((d) => (
          <div key={d.id} className="border border-slate-100 bg-white rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            
            {/* Top row with name, specialization */}
            <div className="space-y-1.5">
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-800 text-sm leading-tight">{d.name}</h4>
                  <p className="text-xs text-blue-600 font-semibold">{d.specialization}</p>
                </div>
                <button
                  onClick={() => startEdit(d)}
                  className="p-1 px-2 border border-slate-100 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-blue-600 transition-all font-bold text-[10px]"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Contact phone detail Row */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{d.phone || "No Mobile registered"}</span>
              </div>
            </div>

            {/* Middle panel detailing Split Fee contract */}
            <div className="bg-slate-50/70 rounded-xl p-3 grid grid-cols-2 gap-2 text-[11px] border border-slate-50">
              <div className="space-y-0.5">
                <span className="text-slate-400 block uppercase tracking-wider text-[9px] font-bold">{t("fee")}</span>
                <span className="font-bold text-slate-800">Rs. {d.fee.toLocaleString()}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 block uppercase tracking-wider text-[9px] font-bold">{lang === "en" ? "Share Deal" : "منافع حصہ"}</span>
                <span className="font-bold text-emerald-600">{d.sharePercentage}% / {100 - d.sharePercentage}%</span>
              </div>
            </div>

            {/* Lower panel with availability schedule */}
            <div className="space-y-1.5" id="days-avail-strip">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {lang === "en" ? "Schedules Calendar" : "او پی ڈی ڈیوٹی دن"}
              </span>
              <div className="flex flex-wrap gap-1">
                {DAYS.map((day) => {
                  const isActive = d.availableDays.includes(day);
                  return (
                    <span
                      key={day}
                      className={`inline-block px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                        isActive 
                          ? "bg-teal-50 text-teal-700 border border-teal-100" 
                          : "bg-slate-50 text-slate-300"
                      }`}
                    >
                      {day}
                    </span>
                  );
                })}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Register Clinician Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="doctor-modal">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100">
            
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                {editingDoctor ? (lang === "en" ? "Modify Doctor Registry" : "ڈاکٹر کے کوائف تبدیل کریں") : (lang === "en" ? "Add Consultant Doctor" : "نیا کونسلٹنٹ شامل کریں")}
              </h4>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              
              {/* Doctor Name */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t("doctorName")} <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                  placeholder="e.g. Dr. Muhammad Ali"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Specialization & Mobile phone */}
              <div className="grid grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t("specialization")} <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                    placeholder="e.g. Cardiologist"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t("phone")}</label>
                  <input
                    type="text"
                    className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all font-mono font-medium"
                    placeholder="e.g. 0300-8484110"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

              </div>

              {/* Fee & Contract Share percentages */}
              <div className="grid grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t("fee")} <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="w-full text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all font-bold text-blue-600"
                    placeholder="Consultation Cost (Rs)"
                    value={fee}
                    onChange={(e) => setFee(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t("sharePercentage")} <span className="text-rose-500">*</span></label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      className="w-24 text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500/30 transition-all font-bold text-emerald-600 text-center"
                      value={sharePercentage}
                      onChange={(e) => setSharePercentage(Number(e.target.value))}
                    />
                    <span className="text-[10px] text-slate-400 leading-tight">
                      {lang === "en" ? `Doctor gets ${sharePercentage}% of fee, Hospital retains ${100 - sharePercentage}%` : `ڈاکٹر کو ٹھیکہ کے حساب سے ${sharePercentage} فیصد فیس ملیں گے اور ہسپتال کا حصہ ${100 - sharePercentage} فیصد ہوگا`}
                    </span>
                  </div>
                </div>

              </div>

              {/* Days Available Selecting */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">{lang === "en" ? "Weekly Duty Days" : "او پی ڈی ڈیوٹی دن منتخب کریں"}</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map((day) => {
                    const active = selectedDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => handleDayToggle(day)}
                        className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                          active 
                            ? "bg-slate-900 border-slate-900 text-white" 
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Informative Security Alert */}
              <div className="p-3 bg-teal-50 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-600 border border-teal-100">
                <ShieldAlert className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <p>
                  {lang === "en" 
                    ? "Financial divisions execute instantly during billing logs. Adjusting contract values only impacts subsequent consultations."
                    : "ڈاکٹرز کی فیس سے منافع پے آؤٹ فنڈز کا حساب پرچی کٹنے کے وقت ہوتا ہے۔ پرانی پرچیوں پر اثر نہیں پڑے گا۔"
                  }
                </p>
              </div>

              {/* Actions row */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-150 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  {t("save")}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
