\# Enterprise IT Service Management (ITSM) Platform



A production-oriented, multi-tenant Enterprise IT Service Management platform built with the MERN ecosystem and designed around enterprise software engineering principles.



The platform provides centralized management of incidents, problems, changes, service requests, assets, SLAs, knowledge, root-cause analysis, notifications, analytics, and support teams.



\---



\## 🚀 Project Overview



This project is based on the Ezitech Engineering Framework (EEF) MERN-014 case study for an Enterprise IT Service Management \& Incident Response Platform.



The system is designed to support organizations in managing:



\- IT incidents

\- Service requests

\- Problems and root-cause analysis

\- Change management

\- IT assets

\- Service-level agreements

\- Knowledge base articles

\- Service catalog

\- Support teams

\- Notifications

\- Analytics

\- Multi-tenant organizations



\---



\## ✨ Features



\### Authentication \& Authorization



\- JWT-based authentication

\- User registration and login

\- Protected routes

\- Role-based access control

\- Admin and employee roles

\- User management

\- Organization-based access control



\### Organization Management



\- Multi-tenant organization architecture

\- Organization CRUD

\- Organization-level data isolation

\- Organization middleware



\### Incident Management



\- Create and manage incidents

\- Incident status tracking

\- Priority and impact handling

\- Assignment and ownership

\- Organization-aware incident management



\### Problem Management



\- Problem records

\- Problem lifecycle management

\- Root-cause analysis integration

\- Problem status and priority tracking



\### Root Cause Analysis (RCA)



\- RCA records

\- Root cause identification

\- Investigation information

\- Corrective and preventive actions

\- RCA lifecycle management



\### Change Management



\- Change requests

\- Change lifecycle

\- Change status tracking

\- Change planning and management



\### Service Requests



\- Service request management

\- Request lifecycle

\- Request assignment

\- Organization-aware requests



\### Service Catalog



\- Service catalog management

\- Service definitions

\- Service availability information



\### SLA Management



\- SLA definitions

\- SLA targets

\- SLA management

\- Service-level tracking



\### Asset Management



\- IT asset management

\- Asset records

\- Asset assignment

\- Asset lifecycle information



\### Knowledge Base



\- Knowledge articles

\- Article management

\- Searchable support knowledge



\### Support Teams



\- Support team management

\- Team organization

\- Team assignment



\### Notifications



\- Notification management

\- User-specific notifications

\- Read/unread notification state



\### Analytics



\- ITSM analytics

\- Incident statistics

\- Problem statistics

\- Service request statistics

\- SLA-related analytics



\---



\## 🏗️ Architecture



The backend follows a modular architecture inspired by Clean Architecture and enterprise backend design principles.



```text

Client

&#x20; │

&#x20; ▼

Express API

&#x20; │

&#x20; ├── Authentication Middleware

&#x20; ├── Authorization / RBAC

&#x20; ├── Organization Middleware

&#x20; │

&#x20; ▼

Controllers

&#x20; │

&#x20; ▼

Services

&#x20; │

&#x20; ▼

Models / Data Layer

&#x20; │

&#x20; ▼

MongoDB



&#x09;			ADDITIONAL INFRASTRUCTURE





&#x20;                   ┌──────────────┐

&#x20;                   │    Client    │

&#x20;                   └──────┬───────┘

&#x20;                          │

&#x20;                          ▼

&#x20;                   ┌──────────────┐

&#x20;                   │ Express API  │

&#x20;                   └──────┬───────┘

&#x20;                          │

&#x20;         ┌────────────────┼────────────────┐

&#x20;         │                │                │

&#x20;         ▼                ▼                ▼

&#x20;     MongoDB           Redis          Socket.IO

&#x20;         │                │                │

&#x20;         │                ▼                │

&#x20;         │             BullMQ             │

&#x20;         │                │                │

&#x20;         └────────────────┼────────────────┘

&#x20;                          ▼

&#x20;                   Background Jobs



**🛠️ Tech Stack**

**Backend**

Node.js

Express.js

TypeScript

MongoDB

Mongoose

JWT

bcrypt

**Infrastructure**

Redis

BullMQ

Socket.IO

Docker

**Testing**

Jest

Supertest

**Development**

Nodemon

ts-node

TypeScript

**🔐 Security**



The application includes:



JWT authentication

Password hashing with bcrypt

Protected API routes

Role-based authorization

Organization-level authorization

Environment-based configuration

Sensitive environment variables excluded from Git

**📡 API**



Base API path:

The API will run on:



http://localhost:5000



/api/v1



Health check:



GET /api/v1/health

Major API areas include:

/api/v1/auth

/api/v1/organizations

/api/v1/assets

/api/v1/incidents

/api/v1/problems

/api/v1/rca

/api/v1/changes

/api/v1/service-requests

/api/v1/service-catalog

/api/v1/sla

/api/v1/knowledge-base

/api/v1/support-teams

/api/v1/notifications

/api/v1/analytics

🌐 Multi-Tenant SaaS



The platform is designed with multi-tenancy in mind.



Each user belongs to an organization:



User

&#x20; │

&#x20; ▼

Organization

&#x20; │

&#x20; ├── Incidents

&#x20; ├── Problems

&#x20; ├── Assets

&#x20; ├── Changes

&#x20; ├── Service Requests

&#x20; ├── SLAs

&#x20; └── Other ITSM resources



Organization-aware middleware helps prevent users from accessing data belonging to other organizations. 

Engineering Principles



The project is being developed around the following principles:



Clean Architecture

Modular Architecture

Separation of Concerns

Repository Pattern

Event-Driven Architecture

Rule Engine

Workflow Engine

Background Job Processing

Multi-Tenant SaaS

RESTful API design

Role-Based Access Control

Automated Testing 

👩‍💻 Author



Aliya Saman Ali



Software Engineering Student

UET Taxila



GitHub:



https://github.com/aliyasamanali2005

