# Sahayak: Plain English Project Guide

> **A complete guide to understanding the Sahayak Civic Platform, written for everyday citizens, public officials, and non-technical stakeholders.**

---

## 1. What is Sahayak?

**Sahayak** (meaning *"Helper"* in Sanskrit and Hindi) is an open, sovereign digital platform designed to connect Indian citizens directly with government welfare schemes.

In India today, the Central and State governments run hundreds of welfare programs offering financial aid, healthcare coverage, agricultural subsidies, and educational scholarships. However, millions of eligible families never receive these benefits because:
* They do not know which schemes they qualify for.
* The rules and criteria are complicated and scattered across dozens of department websites.
* Citizens are forced to submit the same paper documents repeatedly.
* Unofficial middlemen and touts charge bribes to help file applications.

**Sahayak solves this by acting as a single, paperless window.** A citizen enters their household details once, and the system automatically calculates every single scheme they are entitled to receive.

---

## 2. The Core Problem & How Sahayak Solves It

| Traditional Government Welfare System | The Sahayak Solution |
|---|---|
| Citizens must visit multiple offices and fill out separate paper forms for each scheme. | Enter your details **once** in a secure digital wallet. All applications are auto-filled. |
| Citizens have no idea how much total aid their household qualifies to receive. | The **Benefit Calculator** calculates your family's exact statutory entitlement in rupees per year. |
| In remote villages with poor internet, verifying eligibility records takes weeks. | The **Sovereign QR Card** can be scanned and verified by an officer **completely offline** in 2 seconds. |
| Touts and middlemen take cuts of welfare money. | Applications are processed paperlessly and money is transferred directly to bank accounts (DBT). |

---

## 3. How It Works (Step by Step)

### Step 1: Create a Civic Profile
A citizen signs up using their email or phone number. They fill out a quick, 5-step socioeconomic profile:
* Basic identity (Name, State, District, Village).
* Social category (General, OBC, SC, ST, EWS).
* Occupation (Farmer, Student, Small Artisan, Daily Wage, Senior Citizen).
* Annual household income and land ownership.
* Family dependents (spouse, children, elderly parents).

### Step 2: Instant Scheme Matching
The moment the profile is saved, Sahayak's rule engine evaluates the citizen's data against government rules:
* **Fully Eligible Schemes:** Programs where the citizen meets 100% of statutory requirements (e.g. PM-KISAN, Ayushman Bharat, PM Awas Yojana).
* **Near Miss Schemes:** Programs where the citizen is missing only one requirement (with clear advice on how to qualify, such as updating an income certificate).
* **Total Annual Benefit:** Shows the estimated annual cash value (e.g. ₹56,000 / year).

### Step 3: The Sovereign Offline QR Card
The system issues an official **Civic Identity QR Card** that the citizen can download as a PDF, save to their phone gallery, or print as a physical card.
* The QR code does not just contain a link. It contains a **cryptographically signed digital credential**.
* Think of it like a government passport stamped with an unbreakable digital wax seal (called **RS256 cryptography**).

### Step 4: Verification at Seva Kendras (Even Without Internet)
When a citizen visits a local Taluka office or Gram Panchayat Seva Kendra:
1. The field officer scans the citizen's QR card using a mobile phone camera or handheld barcode reader.
2. The officer's device checks the digital signature locally on the spot.
3. The citizen's identity is verified in under 2 seconds, even if the mobile network is completely down.

---

## 4. The Three Portals

Sahayak provides dedicated interfaces for all participants in the civic ecosystem:

### 1. Citizen Portal
* **Dashboard:** Overview of annual entitlement, matched programs, and active application statuses.
* **Scheme Directory:** Browse central and state schemes with clear benefits, eligibility criteria, and required documents.
* **Benefit Calculator:** Interactive simulation tool to test how life changes (like income changes or land purchases) affect welfare eligibility.
* **Family Wallet:** Link household members to pool family entitlements (such as the ₹5,00,000 family health cover under PM-JAY).
* **Digital QR Card:** View, print, or download the tamper-proof offline credential.

### 2. Field Officer Desk
* **Camera Scanner & Barcode Viewfinder:** Point camera at citizen cards to verify credentials instantly.
* **Sahayak ID Search:** Direct fallback lookup if a printed card is stained, damaged, or torn.
* **Physical Document Checklist:** One-click approval or rejection of submitted documents with mandatory audit notes.

### 3. Administration Console
* **Scheme Builder:** Government administrators can create new welfare schemes, set benefit amounts, and configure automated eligibility rules.
* **Officer Provisioning:** Manage local verification officers across National, State, and District tiers.
* **Audit Logs:** Full transparency records of every application review and approval.

---

## 5. Security & Privacy Explained Simply

* **No Data Selling:** Citizen records are stored in encrypted databases compliant with India's Digital Personal Data Protection (DPDP) guidelines.
* **Unbreakable Digital Wax Seal (RS256):** Every issued QR code is signed using a 2048-bit mathematical keypair. If anyone attempts to tamper with the text inside the QR code, the verification scanner immediately rejects it as invalid.
* **Zero Middlemen Guarantee:** By standardizing paperless submission, applicants interact directly with designated statutory officers.

---

## 6. How to Run and Test the Project

The entire system runs on any computer with a single command using Docker.

### On Windows
* Double-click **`docker-run.bat`** in Windows File Explorer, OR
* Run **`.\docker-run.ps1`** in Windows PowerShell.

### On Mac or Linux
* Run **`./docker-run.sh`** in your terminal.

### Accessing the Portals in Your Browser
* **Citizen Portal:** `http://localhost:3000`
* **Officer Desk:** `http://localhost:3000/officer/auth/login`
* **Admin Console:** `http://localhost:3000/admin/auth/login`
* **Backend API Docs:** `http://localhost:8000/docs`

### Pre-Configured Demo Accounts
Each login screen includes a one-click **"Use"** button to automatically fill in demo credentials:
* **Citizen:** `test@citizen.in` / `Citizen@123`
* **Officer:** `officer@sahayak.gov.in` / `Officer@123`
* **Admin:** `admin@sahayak.gov.in` / `Admin@123`
