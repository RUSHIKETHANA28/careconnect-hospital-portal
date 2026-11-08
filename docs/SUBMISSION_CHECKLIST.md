# CareConnect – University Submission & Verification Checklist

**Project:** CareConnect – Hospital Bed Availability and Admission Management Portal  
**Student Roll Number:** 2303A51919  
**Course:** DevOps & Full Stack Development  
**Academic Year:** 2026–2027  
**Submission Category:** Final University Course Evaluation  

---

## 1. Project Overview & Deliverables
- **Frontend:** React 19 + Vite 8 SPA (`frontend/`)
- **Backend:** Node.js + Express.js 5 REST API (`backend/`)
- **Database:** MongoDB 7 + Mongoose 9 ODM
- **DevOps:**
  - Multi-stage Docker builds (`backend/Dockerfile`, `frontend/Dockerfile`)
  - Nginx reverse proxy configuration (`frontend/nginx.conf`)
  - Docker Compose service orchestration (`docker-compose.yml`)
  - Complete Kubernetes manifests (`k8s/`: ConfigMap, Secret, Deployments, Services)
- **Automated Verification:**
  - 15-step integration test suite (`backend/scripts/verify_workflow.js`)
  - Granular RBAC test suite (`backend/scripts/verify_roles.js`)

---

## 2. Required Submission Screenshots

Capture the following 8 screenshots directly from your running portal to include in your final project report or submission presentation:

| # | Screenshot Title | Recommended Page & Action | Key Visual Elements to Include |
|---|---|---|---|
| **1** | **User Login & RBAC Interface** | `http://localhost:5173/` | CareConnect branding, 4 demo role credential buttons (`Admin`, `Hospital Admin`, `Receptionist`, `Nurse`), show/hide password toggle. |
| **2** | **Live Hospital Dashboard** | `Dashboard` tab | Key KPI metric cards (Total Beds, Available, Occupied, Cleaning, Maintenance, Admissions), interactive Recharts occupancy chart, and recent activity tabs. |
| **3** | **Ward & Room Hierarchy** | `Wards` & `Rooms` tabs | Ward cards showing floor level, total capacity, occupancy progress bars, and Add/Edit Ward modal dialogs. |
| **4** | **Interactive Bed Grid & Status Lifecycles** | `Bed Management` tab | Visual grid of beds with distinct color-coded badges (`Available` green, `Occupied` red, `Cleaning` orange, `Maintenance` gray), and one-click Nurse cleaning buttons. |
| **5** | **Patient Intake & Smart Admission Modal** | `Admissions` tab ➔ `New Admission` | Cascading dynamic dropdowns (selecting Ward filters Rooms, selecting Room filters Available Beds only), active admission conflict validation. |
| **6** | **Bed Transfer & Safe Discharge Workflow** | `Transfers & Discharge` tab | Inter-bed transfer interface, automatic source bed transition to `Cleaning`, clinical discharge notes with release timestamp. |
| **7** | **Dynamic Reports & CSV Export** | `Reports` tab | Bed Occupancy and Patient Admission tables, ward filters, date range filters, and the `Export CSV` / `Print Report` buttons. |
| **8** | **Automated Testing & Build Verification** | Terminal / Command Prompt | Execution of `npm test` showing all 15 integration steps and RBAC role verification passing with 100% success, plus `npm run build` output. |

---

## 3. Technology Stack Reference Table

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend Framework | React | 19.x | Component-based dynamic user interface |
| Build Tool | Vite | 8.x | High-performance bundling and asset optimization |
| Styling | Custom CSS3 | - | Responsive hospital design system with modern badges and modals |
| Icons | Lucide React | 1.x | Clean medical iconography |
| Data Visualization | Recharts | 2.x | Real-time occupancy donut and bar charts |
| Backend Runtime | Node.js | 20+ | Asynchronous event-driven server runtime |
| Web Framework | Express.js | 5.x | RESTful API routes and middleware |
| Database | MongoDB | 7.x | NoSQL document database for hospital collections |
| ODM | Mongoose | 9.x | Schema validation and relational indexing |
| Security & Auth | JWT & bcryptjs | 2.x | Token-based stateless authentication and cryptographic hashing |
| Containerization | Docker & Docker Compose | 29.x / 5.x | Multi-container microservice packaging |
| Web Server & Proxy | Nginx | Alpine | Static asset hosting and SPA reverse proxy |
| Orchestration | Kubernetes | 1.34+ | Pod replication, service discovery, self-healing |

---

## 4. Default Seed Credentials (RBAC)

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **System Admin** | `admin@careconnect.com` | `admin123` | Unrestricted access across all operational modules, system settings, and user accounts. |
| **Hospital Administrator** | `admin.hosp@careconnect.com` | `admin123` | Ward, room, bed setup, patient intake, transfers, discharges, and institutional analytics. |
| **Receptionist** | `receptionist@careconnect.com` | `admin123` | Patient registration, admission creation, bed availability queries, and discharges. |
| **Nurse** | `nurse@careconnect.com` | `admin123` | Inpatient status monitoring, sanitization workflow updates (marking Cleaning complete), and bed maintenance flags. |

---

## 5. Verification Commands Summary

### Automated Tests
```powershell
# From project root
npm test
npm run build
```

### Docker Compose
```powershell
# Start all containers
docker compose up -d

# Verify container status
docker compose ps

# View container logs
docker compose logs -f

# Stop containers
docker compose down
```

### Kubernetes
```powershell
# Apply all manifests
kubectl apply -f k8s/

# Verify cluster resources
kubectl get deployments
kubectl get pods
kubectl get services
```

---

## 6. Viva Voce & Presentation Talking Points

1. **State Machine for Beds:**
   - Beds move strictly through: `Available` ➔ `Occupied` (via Admission) ➔ `Cleaning` (upon Transfer or Discharge) ➔ `Available` (when Nurse completes sanitization).
   - This prevents clinical errors where a discharged bed is assigned to a new patient before sanitization.
2. **Preventing Race Conditions & Overbooking:**
   - Admissions perform atomic checks ensuring a bed is truly `Available` before committing.
   - Deletions of wards or rooms enforce strict referential integrity (cannot delete a ward that contains rooms or occupied beds).
3. **Stateless JWT Security & Password Hashing:**
   - Passwords are encrypted using bcrypt (10 salt rounds).
   - JWT tokens include user ID, role, and expiration timestamp.
   - Protected API routes evaluate Bearer tokens and verify role permissions through express middleware.
4. **DevOps & Container Architecture:**
   - Frontend Docker image uses a 2-stage build: Node 20 compiles the Vite assets, and Alpine Nginx serves them with an optimized reverse proxy configuration.
   - Docker Compose orchestrates MongoDB with healthcheck pings, Express backend, and Nginx frontend on an isolated bridge network (`careconnect-network`).
   - Kubernetes manifests provide 2 replicas for backend and frontend, rolling updates, CPU/memory limits, ClusterIP internal routing, and NodePort external access.
