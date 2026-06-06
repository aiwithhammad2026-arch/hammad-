/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend, Cell, PieChart, Pie } from "recharts";
import { Users, UserSquare2, Sliders, DollarSign, AlertCircle, TrendingUp, FlaskConical, Clock, Activity } from "lucide-react";
import { Patient, Doctor, OPDVisit, LabOrder, Invoice } from "../types";
import { Language, translations } from "../translations";

interface DashboardHomeProps {
  lang: Language;
  patients: Patient[];
  doctors: Doctor[];
  visits: OPDVisit[];
  orders: LabOrder[];
  invoices: Invoice[];
  onSelectTab: (tab: string) => void;
}

export default function DashboardHome({
  lang,
  patients,
  doctors,
  visits,
  orders,
  invoices,
  onSelectTab
}: DashboardHomeProps) {
  const t = (key: keyof typeof translations["en"]) => {
    return translations[lang][key] || translations["en"][key];
  };

  // Financial Statistics
  const financialStats = useMemo(() => {
    let gross = 0;
    let dues = 0;
    invoices.forEach((inv) => {
      gross += inv.paidAmount;
      dues += inv.dues;
    });

    // Doctor share calculations
    let doctorPayoutsSum = 0;
    visits.forEach((v) => {
      if (v.status === "Completed") {
        const doc = doctors.find((d) => d.id === v.doctorId);
        if (doc) {
          doctorPayoutsSum += (v.fee * doc.sharePercentage) / 100;
        }
      }
    });

    return {
      gross,
      dues,
      doctorPayouts: Math.round(doctorPayoutsSum)
    };
  }, [invoices, visits, doctors]);

  // Chart Data: Visits over coordinates
  const registrationChartData = useMemo(() => {
    // Return sample localized dates
    return [
      { name: "Mon", visits: 12, labTests: 18, revenue: 14000 },
      { name: "Tue", visits: 18, labTests: 24, revenue: 22000 },
      { name: "Wed", visits: 15, labTests: 15, revenue: 16500 },
      { name: "Thu", visits: 22, labTests: 30, revenue: 29000 },
      { name: "Fri", visits: 30, labTests: 35, revenue: 34000 },
      { name: "Sat", visits: 25, labTests: 28, revenue: 26000 },
      { name: "Sun", visits: 5, labTests: 8, revenue: 5000 },
    ];
  }, []);

  // Lab Order Breakdown
  const labStatusData = useMemo(() => {
    const statuses = { Pending: 0, Collected: 0, Entered: 0, Validated: 0 };
    orders.forEach((o) => {
      if (o.status === "Pending_Sample") statuses.Pending++;
      else if (o.status === "Sample_Collected") statuses.Collected++;
      else if (o.status === "Result_Entered") statuses.Entered++;
      else if (o.status === "Validated") statuses.Validated++;
    });

    return [
      { name: lang === "en" ? "Awaiting Sample" : "سیمپل کا انتظار", value: statuses.Pending, color: "#eab308" },
      { name: lang === "en" ? "Collected" : "سیمپل وصول شدہ", value: statuses.Collected, color: "#3b82f6" },
      { name: lang === "en" ? "Result Entered" : "رزلٹ درج شدہ", value: statuses.Entered, color: "#a855f7" },
      { name: lang === "en" ? "Validated & Ready" : "مصدقہ رپورٹ", value: statuses.Validated, color: "#22c55e" },
    ].filter(item => item.value > 0);
  }, [orders, lang]);

  return (
    <div className="space-y-6" id="dashboard-main-panel">
      {/* Visual Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid-wrapper">
        
        {/* Total Patients */}
        <div 
          onClick={() => onSelectTab("patients")}
          className="border border-slate-100 bg-white p-5 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
          id="stat-box-patients"
        >
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">{t("totalPatients")}</p>
            <h3 className="text-3xl font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">
              {patients.length}
            </h3>
            <p className="text-[11px] text-blue-500 font-medium">#{lang === "en" ? "Offline Ledger" : "آف لائن ریکارڈ"}</p>
          </div>
          <div className="p-3.5 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Doctors */}
        <div 
          onClick={() => onSelectTab("doctors")}
          className="border border-slate-100 bg-white p-5 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
          id="stat-box-doctors"
        >
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">{t("totalDoctors")}</p>
            <h3 className="text-3xl font-bold text-slate-800 tracking-tight group-hover:text-teal-600 transition-colors">
              {doctors.length}
            </h3>
            <p className="text-[11px] text-teal-500 font-medium">#{lang === "en" ? "Active Shift" : "ڈیوٹی پر موجود"}</p>
          </div>
          <div className="p-3.5 bg-teal-50 rounded-2xl text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all">
            <UserSquare2 className="w-6 h-6" />
          </div>
        </div>

        {/* OPD Tokens */}
        <div 
          onClick={() => onSelectTab("opd")}
          className="border border-slate-100 bg-white p-5 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
          id="stat-box-visits"
        >
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">{t("totalVisits")}</p>
            <h3 className="text-3xl font-bold text-slate-800 tracking-tight group-hover:text-amber-600 transition-colors">
              {visits.length}
            </h3>
            <p className="text-[11px] text-amber-500 font-medium">
              {visits.filter(v => v.status === "Waiting").length} {lang === "en" ? "In Queue" : "انتظار گاہ میں"}
            </p>
          </div>
          <div className="p-3.5 bg-amber-50 rounded-2xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Gross Collection */}
        <div 
          onClick={() => onSelectTab("billing")}
          className="border border-slate-100 bg-white p-5 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
          id="stat-box-revenue"
        >
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">{t("totalRevenue")}</p>
            <h3 className="text-2xl font-bold text-emerald-600 tracking-tight">
              Rs. {financialStats.gross.toLocaleString()}
            </h3>
            <p className="text-[11px] text-rose-500 font-medium">
              Dues / ادھار: Rs. {financialStats.dues.toLocaleString()}
            </p>
          </div>
          <div className="p-3.5 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="charts-and-visualizations-area">
        
        {/* Weekly Traffic curve */}
        <div className="lg:col-span-2 border border-slate-100 bg-white p-5 rounded-2xl shadow-sm space-y-4" id="visitation-curve-card">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-md font-semibold text-slate-800">{t("monthlyTrend")}</h4>
              <p className="text-xs text-slate-400">{lang === "en" ? "Weekly clinical activity snapshot" : "ہفتہ وار ہسپتال اور مریضوں کی حاضری"}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 text-[11px] font-semibold rounded-full uppercase tracking-wider">
              <TrendingUp className="w-3 h-3" />
              {lang === "en" ? "Offline LAN" : "آف لائن لوکل"}
            </span>
          </div>

          <div className="h-64" id="recharts-container-visitation">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={registrationChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                <YAxis fontSize={11} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #f1f5f9", fontSize: "12px" }}
                />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Area type="monotone" dataKey="visits" name={lang === "en" ? "OPD Visits" : "او پی ڈی مریض"} stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVisits)" />
                <Area type="monotone" dataKey="labTests" name={lang === "en" ? "Lab Tests" : "لیبارٹری ٹیسٹ"} stroke="#a855f7" strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lab Stats Circle */}
        <div className="border border-slate-100 bg-white p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4" id="lab-pie-charts-wrapper">
          <div className="space-y-0.5">
            <h4 className="text-md font-semibold text-slate-800">{t("labOrdersOverview")}</h4>
            <p className="text-xs text-slate-400">{lang === "en" ? "Distribution of samples & signatures" : "ٹیسٹ سیمپل فائلز کی مجموعی صورتحال"}</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-2">
            {labStatusData.length > 0 ? (
              <div className="relative w-full h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={labStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {labStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-700">{orders.length}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-medium">{lang === "en" ? "Active" : "ٹیسٹ فائلز"}</span>
                </div>
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-slate-300 space-y-1">
                <FlaskConical className="w-8 h-8 stroke-1" />
                <p className="text-xs">{lang === "en" ? "No laboratory orders yet" : "کوئی لیبارٹری ٹیسٹ زیر التوا نہیں"}</p>
              </div>
            )}

            {/* Custom Pie Legend */}
            <div className="grid grid-cols-2 gap-2 mt-2 w-full text-left" id="pie-legend">
              {labStatusData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}: <strong className="text-slate-800">{item.value}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* OPD Wait Line & Hospital Info Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-lower-queues">
        
        {/* Waiting Patients List */}
        <div className="border border-slate-100 bg-white p-5 rounded-2xl shadow-sm space-y-3" id="waiting-patients-board">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500 animate-pulse" />
              {t("recentVisits")}
            </h4>
            <button 
              onClick={() => onSelectTab("opd")} 
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              {lang === "en" ? "View All" : "مزید دیکھیں"}
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-56" id="dashboard-waitlist-box">
            {visits.filter(v => v.status === "Waiting" || v.status === "In_Consultation").length > 0 ? (
              visits
                .filter(v => v.status === "Waiting" || v.status === "In_Consultation")
                .map((v) => {
                  const p = patients.find(pat => pat.id === v.patientId);
                  const d = doctors.find(doc => doc.id === v.doctorId);
                  return (
                    <div key={v.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 rounded-lg px-2 transition-colors">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">{v.tokenNumber}</span>
                          <span className="font-semibold text-slate-900">{p ? p.name : "Unknown"}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] truncate max-w-[240px]">
                          Symptoms: {v.symptoms || "Regular Checkup"}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <span className="text-[11px] text-slate-500 font-medium">{d ? d.name : "General"}</span>
                        <div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            v.status === "In_Consultation" 
                              ? "bg-purple-100 text-purple-700" 
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {v.status === "In_Consultation" ? t("inConsultation") : t("waiting")}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="py-8 text-center text-slate-300 text-xs">
                {lang === "en" ? "All active OPD consultations are processed!" : "تمام او پی ڈی مریضوں کا معائنہ مکمل ہو چکا ہے!"}
              </div>
            )}
          </div>
        </div>

        {/* Doctor Shares Ledger Card */}
        <div className="border border-slate-100 bg-white p-5 rounded-2xl shadow-sm space-y-4" id="ledger-share-payout-box">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">{lang === "en" ? "Doctor Share Allocation Ledger" : "ڈاکٹرز کا منافع اور فیس اکاؤنٹ"}</h4>
            <p className="text-xs text-slate-400">{lang === "en" ? "Real-time diagnostic percentage payouts" : "ڈاکٹرز کی پرچیوں کے تناسب سے پے آؤٹ فنڈز"}</p>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase font-bold">
                  <th className="p-3">{t("doctorName")}</th>
                  <th className="p-3 text-center">{lang === "en" ? "OPD Cases" : "او پی ڈی فائلز"}</th>
                  <th className="p-3 text-right">{lang === "en" ? "Gross (Rs)" : "مجموعی آمدن"}</th>
                  <th className="p-3 text-right">{lang === "en" ? "Doctor payout" : "ڈاکٹر فنڈ"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map((d) => {
                  const docVisits = visits.filter(v => v.doctorId === d.id && v.status === "Completed");
                  const grossFee = docVisits.reduce((acc, current) => acc + current.fee, 0);
                  const docEarnings = (grossFee * d.sharePercentage) / 100;
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-medium text-slate-700">{d.name}</td>
                      <td className="p-3 text-center text-slate-600 font-bold">{docVisits.length}</td>
                      <td className="p-3 text-right text-slate-500">Rs. {grossFee}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">Rs. {Math.round(docEarnings)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-teal-50/50 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600">
              <span className="font-bold text-teal-800">{lang === "en" ? "Local Device Synchronization" : "مکمل آف لائن تحفظ"}</span>:{" "}
              {lang === "en" 
                ? "All actions write automatically to localized sandbox storage. No cloud integration is required, safeguarding privacy completely."
                : "تمام مالی اور طبی تبدیلیاں لوکل براؤزر میموری میں محفوظ ہو رہی ہیں۔ انٹرنیٹ منقطع ہونے پر بھی یہ پورٹل کام کرتا رہے گا۔"
              }
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
