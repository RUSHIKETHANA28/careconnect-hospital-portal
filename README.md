# CareConnect – Hospital Bed Availability and Admission Management Portal

**Student Roll Number:** 2303A51919  
**Course:** DevOps & Full Stack Development  
**Academic Year:** 2026–2027  
**University Project:** Hospital Bed Availability and Admission Management Portal  

---

## 1. Project Overview

**CareConnect** is a full-stack, enterprise-grade hospital bed availability and patient admission management system designed to streamline patient intake, ward allocation, inter-bed transfers, discharge processing, and bed sanitization cycles. Built with React, Vite, Node.js, Express, MongoDB, Docker, and Kubernetes, CareConnect ensures real-time operational transparency across hospital wards.

---

## 2. Technology Stack

- **Frontend:** React 19, Vite 8, Lucide React icons, Recharts, Custom responsive CSS
- **Backend:** Node.js, Express.js 5, Mongoose 9, JSON Web Tokens (JWT), bcryptjs, CORS
- **Database:** MongoDB (with Mongoose ODM)
- **Containerization & DevOps:** Docker, Docker Compose, Kubernetes (K8s manifests), Nginx SPA Proxy
- **Testing:** Custom automated integration test suite (`backend/scripts/verify_workflow.js`, `backend/scripts/verify_roles.js`)

---

## 3. Role-Based Access Control (RBAC)

The portal provides 4 distinct operational roles:

| Role | Default Email | Password | Authorized Permissions |
|---|---|---|---|
| **Admin** | `admin@careconnect.com` | `admin123` | Full administrative control, all modules, all reports, user and password management |
| **Hospital Administrator** | `admin.hosp@careconnect.com` | `admin123` | Ward, room, and bed configuration, patient intake, transfers, discharges, reports |
| **Receptionist** | `receptionist@careconnect.com` | `admin123` | Patient registration, bed availability lookup, admission registration, transfers, discharge |
| **Nurse** | `nurse@careconnect.com` | `admin123` | Patient access, bed occupancy info, bed cleaning & maintenance status updates, transfers |

*Note: You can also use the quick one-click demo login buttons on the login screen.*

---

## 4. System Architecture & Workflows

### 4.1 Admission Lifecycle
```
[Unadmitted Patient] 
         │
         ▼
[Select Ward & Room] ──► [Select Available Bed] 
                                    │
                                    ▼
                         [Create Admission Record]
                                    │
                                    ▼
                         [Bed Status -> Occupied]
```

### 4.2 Transfer Lifecycle
```
[Active Admission] ──► [Select Destination Bed] ──► [Update Admission Reference]
                                │
                                ├─► [Previous Bed -> Cleaning]
                                └─► [Destination Bed -> Occupied]
```

### 4.3 Discharge & Cleaning Lifecycle
```
[Active Admission] ──► [Confirm Discharge & Notes]
                                │
                                ├─► [Admission Status -> Discharged]
                                └─► [Bed Status -> Cleaning]
                                           │
                                           ▼
                                [Nurse Completes Cleaning]
                                           │
                                           ▼
                                [Bed Status -> Available]
```

---

## 5. Local Setup & Execution

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on port 27017

### 5.1 Backend Setup
```bash
cd backend
npm install
node scripts/seedUsers.js    # Seeds demo role accounts
npm run dev                  # Starts server on http://localhost:5000
```

### 5.2 Frontend Setup
```bash
cd frontend
npm install
npm run dev                  # Starts Vite dev server on http://localhost:5173
```

---

## 6. Docker Containerization

To run the complete application stack (MongoDB, Backend REST API, Frontend Nginx):

```bash
# Build all container images
docker compose build

# Start all containers in detached mode
docker compose up -d

# Verify container status
docker compose ps

# View real-time container logs
docker compose logs -f

# Stop and remove containers
docker compose down
```

- **Frontend Portal:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **MongoDB Database:** localhost:27017

---

## 7. Kubernetes Deployment

Production-grade Kubernetes manifests are located in the `k8s/` directory.

### Deploying to Kubernetes:
```bash
# Apply ConfigMap and Secret
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Deploy MongoDB
kubectl apply -f k8s/mongodb-deployment.yaml

# Deploy Backend API
kubectl apply -f k8s/backend-deployment.yaml

# Deploy Frontend Web Portal
kubectl apply -f k8s/frontend-deployment.yaml

# Check deployment and pod status
kubectl get deployments
kubectl get pods
kubectl get services
```

---

## 8. REST API Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT token |
| `POST` | `/api/auth/register` | Public | Register new user account |
| `GET` | `/api/auth/me` | Protected | Fetch current logged in user profile |
| `PUT` | `/api/auth/change-password` | Protected | Cryptographically update user password |
| `GET` | `/api/dashboard/stats` | Protected | Real-time aggregated database statistics |
| `GET` | `/api/wards` | Protected | List all wards with floor and capacity |
| `POST` | `/api/wards` | Admin/Hosp Admin | Create new ward |
| `PUT` | `/api/wards/:id` | Admin/Hosp Admin | Update ward details |
| `DELETE` | `/api/wards/:id` | Admin/Hosp Admin | Safe delete ward (checks dependent rooms/beds) |
| `GET` | `/api/rooms` | Protected | List rooms with capacity and occupancy |
| `POST` | `/api/rooms` | Admin/Hosp Admin | Create room in ward |
| `PUT` | `/api/rooms/:id` | Admin/Hosp Admin | Update room details |
| `DELETE` | `/api/rooms/:id` | Admin/Hosp Admin | Safe delete room (checks dependent beds) |
| `GET` | `/api/beds` | Protected | List beds with room and ward population |
| `POST` | `/api/beds` | Admin/Hosp Admin | Create bed with capacity validation |
| `PUT` | `/api/beds/:id` | All Roles (RBAC) | Update bed details or bed cleaning status |
| `DELETE` | `/api/beds/:id` | Admin/Hosp Admin | Safe delete bed (checks active admissions) |
| `GET` | `/api/patients` | Protected | List all registered patients |
| `POST` | `/api/patients` | Protected | Register new patient |
| `GET` | `/api/patients/:id` | Protected | Get patient profile with full admission history |
| `PUT` | `/api/patients/:id` | Protected | Update patient demographic info |
| `DELETE` | `/api/patients/:id` | Protected | Safe delete patient (checks active admissions) |
| `GET` | `/api/admissions` | Protected | List all hospital admissions |
| `POST` | `/api/admissions` | Admin/Admin/Recep | Create admission & allocate bed to Occupied |
| `POST` | `/api/transfers` | Admin/Admin/Recep/Nurse | Transfer patient bed & set previous to Cleaning |
| `PUT` | `/api/discharges/:id` | Admin/Admin/Recep/Nurse | Discharge patient & set bed to Cleaning |

---

## 9. Automated Test Verification

Execute the end-to-end integration test suite:
```bash
node backend/scripts/verify_workflow.js
node backend/scripts/verify_roles.js
```

All 15 lifecycle steps and role-based access checks pass with 100% verification.
