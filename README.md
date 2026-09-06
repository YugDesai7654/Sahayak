# Sahayak: Sovereign Civic Welfare & Scheme Discovery Platform

> **Automated Scheme Eligibility Matching, Paperless Application Tracking, and Cryptographic Offline Civic Identity Wallet for India.**

*Looking for a non-technical introduction? Read the [Plain English Project Guide (EXPLANATION.md)](./EXPLANATION.md).*

---

## 🏛️ Project Overview

**Sahayak** is an offline-first civic welfare platform inspired by IndiaStack, DIGIT, and the Digital Personal Data Protection (DPDP) framework. It bridges the critical last-mile gap between citizens and statutory welfare entitlements by:

1. **Eliminating Administrative Asymmetry**: Evaluating citizen socioeconomic profiles (income, land holding, caste category, occupation) against active Central and State welfare rules to identify 100% of entitled benefits without touts or middlemen.
2. **Sovereign Offline Identity (RS256 QR Wallet)**: Issuing tamper-proof, cryptographically signed credentials that field verification officers can inspect at remote Taluka Seva Kendras without continuous internet connectivity.
3. **Paperless Application Dossiers**: Streamlining document submission with built-in OCR parsing, digital audit trails, and multi-tier administrative governance (National, State, and District levels).

---

## 🚀 Key Modules & Capabilities

### 1. Citizen Portal
* **Personal Civic Wallet**: Encrypted household profile repository capturing identity, jurisdiction, land holding, and family dependents.
* **Automated Scheme Matching Engine**: Rule evaluation engine categorizing schemes into *Fully Eligible* and *Near Miss* opportunities with actionable qualification tips.
* **Benefit Calculator**: Real-time entitlement simulator calculating estimated annual financial aid in rupees per family.
* **Cryptographic QR Credential**: Printable physical-grade smart card embedding a 2048-bit RS256 asymmetric signature verifiable offline.
* **Application Dossier**: Real-time lifecycle tracking across draft, submitted, pending offline verification, under review, and approved states.

### 2. Field Officer Inspection Terminal
* **Dual Viewfinder Scanner**: Optical camera QR reader with automated reticle and manual hardware 2D barcode scanner input support.
* **Offline RS256 Verification**: Verifies digital signatures in under two seconds using public keys without connecting to a central database.
* **Direct Sahayak ID Fallback**: Manual identifier lookup for damaged or torn physical identity cards.
* **Physical Clause Inspection**: One-click verification and rejection workflows with mandatory statutory audit logs.

### 3. Administrative Governance Console
* **Multi-Tier Role Hierarchy**: Distinct scopes for National Super Admins, State Admins, District Collectors, and Taluka Officers.
* **Scheme Rule Builder**: Configure eligibility logic, required documentary evidence, and benefit frequencies.
* **Officer Provisioning & Audit Trails**: Comprehensive system logs tracking all credential inspections and approval decisions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16 (React 19), Tailwind CSS v4, Zustand, Dexie.js (IndexedDB), QRCode.react, Html5-QRCode |
| **Design System** | IndiaStack/DIGIT inspired Soft Structuralism, Double-Bezel nested architecture, Plus Jakarta Sans |
| **Backend API** | FastAPI (Python 3.11), Pydantic v2, Motor (Async MongoDB), Beanie ODM |
| **Security** | Asymmetric RS256 JWT keypairs (cryptography/hazmat, RSA 2048-bit), Passlib (bcrypt) |
| **Document & OCR** | Tesseract OCR (English and Hindi models: `tesseract-ocr`, `tesseract-ocr-hin`, `tesseract-ocr-eng`), ReportLab (PDF Generation) |
| **Infrastructure** | Docker, Docker Compose, MongoDB 7, Multi-stage alpine/slim images |

---

## ⚡ Quick Start: Single-Command Docker Setup

Sahayak runs on any machine with Docker and Docker Compose installed.

### 1. Clone the Repository
```bash
git clone https://github.com/YugDesai7654/Sahayak.git
cd Sahayak
```

### 2. Start the Platform

#### On Windows (PowerShell)
```powershell
.\docker-run.ps1
```

#### On Windows (Command Prompt or Double-Click)
```cmd
docker-run.bat
```

#### On macOS / Linux / Git Bash / WSL
```bash
./docker-run.sh
```

#### Universal Docker Command (Any Operating System)
```bash
docker compose up --build
```

---

## 🌐 Application Port Allocations

| Service | Port | Description |
|---|---|---|
| **Frontend Portal** | `http://localhost:3000` | Citizen desk, Officer scanner, and Admin portals |
| **Backend API** | `http://localhost:8000` | FastAPI service with automatic RS256 key generation |
| **API Documentation** | `http://localhost:8000/docs` | Interactive OpenAPI / Swagger UI |
| **Database** | `localhost:27017` | MongoDB 7 with persistent volume storage (`mongo_data`) |

---

## 🔑 Pre-Seeded Test Credentials

Each login page features a one-click **"Use"** button to automatically populate credentials:

| Portal | Email | Password | Role Description |
|---|---|---|---|
| **Citizen** (`/citizen/auth/login`) | `test@citizen.in` | `Citizen@123` | Registered citizen (Ramesh Solanki, Gujarat) |
| **Field Officer** (`/officer/auth/login`) | `officer@sahayak.gov.in` | `Officer@123` | Verification officer (Daskroi Taluka Office) |
| **District Admin** (`/admin/auth/login`) | `admin@sahayak.gov.in` | `Admin@123` | System administrator (National scope) |

*(Note: Password aliases such as `Password123`, `Officer123`, and `Admin123` are also accepted for test accounts).*

---

## 📂 Project Structure

```
Sahayak/
├── docker-compose.yml          # Container orchestration (MongoDB, Backend, Frontend)
├── docker-run.sh               # Unix/macOS launcher (auto-cleans ports and starts compose)
├── docker-run.bat              # Windows batch launcher (Command Prompt / double-click)
├── docker-run.ps1              # Windows PowerShell launcher (native port clearing)
├── .gitattributes              # Guarantees LF line endings for Docker scripts on Windows
├── EXPLANATION.md              # Non-technical guide for citizens and public stakeholders
├── backend/
│   ├── Dockerfile              # Python 3.11-slim with Tesseract OCR (eng + hin)
│   ├── entrypoint.sh           # Auto-seeds default schemes and test accounts
│   ├── seed.py                 # Seeds 15+ statutory schemes, admins, officers, citizens
│   └── app/
│       ├── api/routes/         # Auth, Citizen, Officer, Admin, Schemes, Applications
│       ├── core/               # RS256 crypto, security dependencies, database config
│       ├── models/             # Beanie ODM documents (User, Officer, Admin, Scheme, App)
│       └── services/           # Auth, NLP matching, OCR extraction, PDF generation
└── frontend/
    ├── Dockerfile              # Node 20-alpine multi-stage build (Turbopack optimized)
    └── src/
        ├── app/                # Next.js App Router (Citizen, Officer, Admin workflows)
        ├── lib/                # API client with FastAPI 422 parser, rule matching engine
        ├── store/              # Zustand auth and offline state management
        └── types/              # TypeScript interfaces for schemes, applications, and users
```

---

## 🔒 Security Architecture

* **Asymmetric RS256 Keypair**: The backend generates a 2048-bit RSA keypair on first run (`backend/keys/private.pem` and `public.pem`). Private keys never leave the backend container; public keys are distributed for local verification.
* **Zero-Knowledge Offline QR Verification**: The Citizen QR code embeds an asymmetric JWT payload containing verified identity claims. Field officers verify signatures offline without central server dependencies.
* **Dual Authentication Support**: Endpoints support both HTTP-only session cookies and `Authorization: Bearer <token>` headers for third-party client interoperability.
* **Audit Transparency**: Statutory decisions record officer identifiers, physical verification timestamps, and clause rejection notes.

---

## 📄 Documentation & Guides

* **[Plain English Guide (EXPLANATION.md)](./EXPLANATION.md)**: Conceptual guide for citizens, officials, and non-programmers.
* **[Backend OpenAPI Documentation](http://localhost:8000/docs)**: Complete schema contracts and interactive API endpoints.
