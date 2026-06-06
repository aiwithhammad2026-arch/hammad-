# Hospital & Medical Laboratory Management System (HMLMS)

A high-performance, secure, offline-capable clinical portal designed to streamline Hospital Front Desks, Consultation queues, Lab Sample Collections, and Financial accounting in localized environments (such as Pakistan). It features dual-language translation (English + Urdu) to serve various demographics.

---

## 🚀 Key Architectural Features

1. **System Core & Identity**: 
   - Sidebars and UI headings auto-translate dynamically between English and calligraphic Urdu (Nastaliq support).
   24-Hour relative digital time clock tracking.

2. **Patient Registry & Medical Profiles**:
   - Advanced search capabilities matching on Name, MRN (Medical Record Number), or mobile contacts.
   - Preserves patient diagnosis backlogs, previous OPD consultations, and active LIS test bookings.

3. **Clinicians & Schedules Management**:
   - Manages consultant details, fees, and contractual revenue shares (**%**).
   - Generates real-time financial payout breakdowns for hospital shares and doctor splits.

4. **OPD Consultation Desk**:
   - Live Token tracker queue supporting transition states (`Waiting` -> `In Consultation` -> `Completed`).
   - Registers vitals (Blood Pressure, Temperature, Pulse Rate, Weight) and symptoms.
   - Includes a medical prescription compiler with brand naming rows, dose frequencies, and physician directives.

5. **Laboratory Information System (LIS)**:
   - Dynamic parameter catalog dictionary mapping reference normal intervals, metrics, and prices.
   - Built-in graphical barcode renderers with linear mock bar lines.
   - Multi-stage collection, validation, and pathologist sign-off workflows.
   - real-time warning indicators for abnormal/out-of-bounds metrics.
   - High-fidelity medical report template printed with signature fields, pathologist license numbers, and flag metrics.

6. **Financial ledgers & Cashier Portal**:
   - Integrates clinic consultations and lab testing elements on unified invoices.
   - Evaluates discretionary discount waivers, netted total balances, and outstanding partial arrear payoffs.

7. **Audit & Safety Trails**:
   - Auto-stamps every single transaction with chronological, searchable security logs outlining the User Role, operational action, and metadata payload.

---

## 🛠️ Offline Technology Stack

This system is built utilizing a modern, rapid, 100% offline-first open-source stack:
- **Frontend Framework**: React 19, TypeScript, Vite
- **Data Visualizer**: Recharts
- **Iconography Library**: Lucide-React
- **Styling Architecture**: TailwindCSS v4 with Inter + Noto Nastaliq Urdu typography pairings
- **Embedded Database**: Localized `localStorage` transaction sandbox

---

## 📋 Administrator & Deployment Manual

### 1. Installation Guide
As a 100% cloudless LAN utility, deployment does not require internet ports:
```bash
# Clone or export directory contents
cd hospital-lab-system

# Install pre-packaged npm elements
npm install

# Initialize development hot-sever locally
npm run dev
```

### 2. Desktop Distribution (Electron)
To package this applet as a native executable (`.exe`) for Windows PC kiosks:
1. Wrap root with standard Electron main entry points:
   ```json
   "main": "electron.js",
   "scripts": {
     "package": "electron-builder"
   }
   ```
2. Run `npm run package` to generate a self-contained offline installer.

### 3. Backup & Recovery Manual (JSON Dump)
Since all data persists directly on the client's local sandbox, backup is simple:
- **Backup**: Open clinical web console devtools -> Application -> LocalStorage -> Copy key values starting with `hmlms_`.
- **Restore**: Paste the serialized JSON dump back inside the matching `hmlms_` local keys on any new workstation or offline computer on the LAN.

---

## 🛡️ Security Audit Notes
- **Authentication**: Modeled role-based access control (RBAC). A simulation ribbon lets administrators switch context between *Administrator*, *Receptionist*, *Doctor*, and *Lab Technologist* instantly to evaluate system access limits.
- **Data Sovereignty**: Zero web calls or cloud databases are queried. All private patient files, diagnoses, and medical prescriptions remain sandboxed physically in local PC memory.
