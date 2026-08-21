Yes — now I have the **complete Incident module**. We can turn this into the exact documentation your frontend teammate is asking for.

And one important correction: your Postman screenshots are useful, but **this documentation is the actual thing that fulfils the integration requirement**.

I would put this in your GitHub repository as something like:

```text
docs/
└── api/
    └── incidents.md
```

Then later we can create:

```text
docs/
├── api/
│   ├── incidents.md
│   ├── problems.md
│   ├── rca.md
│   ├── sla.md
│   ├── service-requests.md
│   ├── changes.md
│   ├── assets.md
│   └── ...
└── testing/
    └── postman/
```

## `docs/api/incidents.md`

Copy this:

````md
# Incident Management API

## Overview

The Incident module manages IT incidents within an organization.

The module supports:

- Creating incidents
- Viewing all organization incidents
- Viewing a single incident
- Updating incidents
- Assigning incidents to employees
- Resolving and closing incidents
- Deleting incidents
- SLA automation
- Organization-level data isolation
- Role-based access control

---

## Base URL

```text
/api/v1/incidents
````

All endpoints require JWT authentication unless otherwise stated.

### Authentication Header

```http
Authorization: Bearer <JWT_TOKEN>
```

---

# Incident Data Model

| Field            | Type     |  Required | Description                                            |
| ---------------- | -------- | --------: | ------------------------------------------------------ |
| `incidentId`     | string   |       Yes | Human-readable incident identifier                     |
| `title`          | string   |       Yes | Incident title                                         |
| `description`    | string   |       Yes | Detailed incident description                          |
| `priority`       | string   |        No | `Low`, `Medium`, `High`, `Critical`                    |
| `severity`       | string   |        No | `Minor`, `Major`, `Critical`                           |
| `status`         | string   |        No | `Open`, `In Progress`, `Pending`, `Resolved`, `Closed` |
| `reportedBy`     | ObjectId | Automatic | User who created/reported the incident                 |
| `assignedTo`     | ObjectId |        No | Employee assigned to the incident                      |
| `organizationId` | ObjectId | Automatic | Organization/tenant                                    |
| `resolution`     | string   |        No | Resolution details                                     |
| `resolvedAt`     | Date     | Automatic | Set when incident is resolved                          |
| `closedAt`       | Date     | Automatic | Set when incident is closed                            |
| `createdAt`      | Date     | Automatic | Creation timestamp                                     |
| `updatedAt`      | Date     | Automatic | Last update timestamp                                  |

---

# Allowed Values

## Priority

```text
Low
Medium
High
Critical
```

Default:

```text
Medium
```

## Severity

```text
Minor
Major
Critical
```

Default:

```text
Minor
```

## Status

```text
Open
In Progress
Pending
Resolved
Closed
```

Default:

```text
Open
```

---

# Role Permissions

| Operation            | Admin |           Employee           |
| -------------------- | :---: | :--------------------------: |
| Create incident      |  Yes  |              Yes             |
| View all incidents   |  Yes  |              Yes             |
| View single incident |  Yes  |              Yes             |
| Update incident      |  Yes  |    Assigned incidents only   |
| Assign incident      |  Yes  |              No              |
| Reassign incident    |  Yes  |              No              |
| Set `In Progress`    |  Yes  | Yes, assigned incidents only |
| Set `Resolved`       |  Yes  | Yes, assigned incidents only |
| Set `Pending`        |  Yes  |              No              |
| Set `Open`           |  Yes  |              No              |
| Set `Closed`         |  Yes  |              No              |
| Delete incident      |  Yes  |              No              |

---

# 1. Create Incident

## Endpoint

```http
POST /api/v1/incidents
```

## Authentication

Required.

## Roles

* Admin
* Employee

## Request Headers

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

## Request Body

```json
{
  "incidentId": "INC-001",
  "title": "VPN connection failure",
  "description": "Employee is unable to connect to the company VPN",
  "priority": "High",
  "severity": "Major"
}
```

### Required Fields

```text
incidentId
title
description
```

### Optional Fields

```text
priority
severity
```

### Do NOT send

```text
reportedBy
organizationId
status
```

These are handled by the backend.

`reportedBy` is automatically taken from the authenticated user.

`organizationId` is automatically taken from the authenticated user's organization.

`status` is automatically set to `Open`.

---

## Successful Response

### Status

```text
201 Created
```

### Response

```json
{
  "success": true,
  "message": "Incident created successfully",
  "data": {
    "_id": "...",
    "incidentId": "INC-001",
    "title": "VPN connection failure",
    "description": "Employee is unable to connect to the company VPN",
    "priority": "High",
    "severity": "Major",
    "status": "Open",
    "reportedBy": "...",
    "organizationId": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## Validation

`incidentId` must be unique within the organization.

Example:

```text
Organization A
INC-001 → allowed

Organization A
INC-001 → rejected

Organization B
INC-001 → allowed
```

The reporter must:

* Exist
* Be active
* Belong to the authenticated user's organization

---

# 2. Get All Incidents

## Endpoint

```http
GET /api/v1/incidents
```

## Authentication

Required.

## Roles

* Admin
* Employee

## Headers

```http
Authorization: Bearer <JWT_TOKEN>
```

## Successful Response

### Status

```text
200 OK
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "incidentId": "INC-001",
      "title": "VPN connection failure",
      "description": "Employee is unable to connect to the company VPN",
      "priority": "High",
      "severity": "Major",
      "status": "Open",
      "reportedBy": {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "employee"
      },
      "assignedTo": {
        "_id": "...",
        "name": "Support Employee",
        "email": "support@example.com",
        "role": "employee"
      },
      "organizationId": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### Important

Results are restricted to the authenticated user's organization.

Incidents are sorted by:

```text
createdAt DESC
```

Newest incidents appear first.

`reportedBy` and `assignedTo` are populated with:

```text
name
email
role
```

---

# 3. Get Incident By ID

## Endpoint

```http
GET /api/v1/incidents/:id
```

Example:

```http
GET /api/v1/incidents/65f123456789abcdef123456
```

## Authentication

Required.

## Roles

* Admin
* Employee

## Headers

```http
Authorization: Bearer <JWT_TOKEN>
```

## Successful Response

### Status

```text
200 OK
```

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "incidentId": "INC-001",
    "title": "VPN connection failure",
    "description": "Employee is unable to connect to the company VPN",
    "priority": "High",
    "severity": "Major",
    "status": "Open",
    "reportedBy": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "employee"
    },
    "assignedTo": {
      "_id": "...",
      "name": "Support Employee",
      "email": "support@example.com",
      "role": "employee"
    }
  }
}
```

## Not Found

```text
404 Not Found
```

```json
{
  "success": false,
  "message": "Incident not found"
}
```

---

# 4. Update Incident

## Endpoint

```http
PUT /api/v1/incidents/:id
```

## Authentication

Required.

## Roles

* Admin
* Employee

However, employees have restricted permissions.

---

# Admin Update Permissions

Admins can update:

```text
title
description
priority
severity
status
assignedTo
resolution
```

Example:

```json
{
  "priority": "Critical",
  "severity": "Critical",
  "assignedTo": "EMPLOYEE_OBJECT_ID",
  "status": "In Progress"
}
```

---

# Employee Update Permissions

Employees can only update an incident if they are currently assigned to it.

Employees cannot:

```text
assign incidents
reassign incidents
```

Employees can only set status to:

```text
In Progress
Resolved
```

Therefore:

```json
{
  "status": "In Progress"
}
```

is allowed for the assigned employee.

But:

```json
{
  "status": "Pending"
}
```

is rejected for employees.

---

# Assigning an Incident

Only admins can assign or reassign incidents.

Example:

```json
{
  "assignedTo": "EMPLOYEE_OBJECT_ID"
}
```

The assigned user must:

* Exist
* Be active
* Belong to the same organization
* Have role `employee`

Otherwise the request fails.

---

# Resolving an Incident

When changing an incident to:

```text
Resolved
```

a resolution is required.

Correct:

```json
{
  "status": "Resolved",
  "resolution": "VPN credentials were reset and connection restored."
}
```

Incorrect:

```json
{
  "status": "Resolved"
}
```

The second request will fail because a resolution is required.

When successfully resolved, the backend automatically sets:

```text
resolvedAt
```

to the current timestamp.

---

# Closing an Incident

Admin can close an incident:

```json
{
  "status": "Closed"
}
```

The backend automatically sets:

```text
closedAt
```

to the current timestamp.

---

# Successful Update Response

### Status

```text
200 OK
```

```json
{
  "success": true,
  "message": "Incident updated successfully",
  "data": {
    "_id": "...",
    "incidentId": "INC-001",
    "status": "In Progress",
    "updatedAt": "..."
  }
}
```

---

# Employee Authorization Errors

If an employee tries to assign/reassign:

```json
{
  "assignedTo": "..."
}
```

the API returns:

```text
403 Forbidden
```

```json
{
  "success": false,
  "message": "Employees cannot assign or reassign incidents"
}
```

If an employee is not assigned to the incident:

```text
403 Forbidden
```

```json
{
  "success": false,
  "message": "You are not authorized to manage this incident"
}
```

If an employee attempts an unauthorized status:

```text
403 Forbidden
```

```json
{
  "success": false,
  "message": "Employees cannot set this incident status"
}
```

---

# 5. Delete Incident

## Endpoint

```http
DELETE /api/v1/incidents/:id
```

## Authentication

Required.

## Role

Admin only.

## Headers

```http
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

## Successful Response

### Status

```text
200 OK
```

```json
{
  "success": true,
  "message": "Incident deleted successfully",
  "data": {
    "_id": "...",
    "incidentId": "INC-001"
  }
}
```

## Employee Attempt

Employees are rejected by the authorization middleware.

Expected:

```text
403 Forbidden
```

---

# SLA Automation

The Incident module automatically integrates with the SLA module.

When an incident changes to:

```text
In Progress
```

the SLA's `respondedAt` is automatically set if it has not already been set.

When an incident changes to:

```text
Resolved
```

the SLA is automatically updated:

```text
resolvedAt = current timestamp
status = Completed
```

When an incident changes to:

```text
Closed
```

the SLA can also be completed if it has not already been resolved.

The frontend does not need to manually update these SLA timestamps.

---

# Multi-Tenant Security

All incident operations are scoped to the authenticated user's organization.

The backend uses:

```text
organizationId
```

when:

* Creating incidents
* Reading incidents
* Updating incidents
* Deleting incidents

Users cannot access incidents belonging to another organization by simply providing another incident ID.

---

# Frontend Integration Notes

## Axios Example

```ts
const response = await axios.post(
  "/api/v1/incidents",
  {
    incidentId: "INC-001",
    title: "VPN connection failure",
    description: "Unable to connect to VPN",
    priority: "High",
    severity: "Major"
  },
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);
```

## Important Frontend Rules

Do not manually provide:

```text
reportedBy
organizationId
status
resolvedAt
closedAt
```

The backend manages these values.

Use the exact enum values:

```ts
type IncidentPriority =
  | "Low"
  | "Medium"
  | "High"
  | "Critical";

type IncidentSeverity =
  | "Minor"
  | "Major"
  | "Critical";

type IncidentStatus =
  | "Open"
  | "In Progress"
  | "Pending"
  | "Resolved"
  | "Closed";
```

---

# API Summary

| Method | Endpoint                | Admin |    Employee   |
| ------ | ----------------------- | :---: | :-----------: |
| POST   | `/api/v1/incidents`     |   ✅   |       ✅       |
| GET    | `/api/v1/incidents`     |   ✅   |       ✅       |
| GET    | `/api/v1/incidents/:id` |   ✅   |       ✅       |
| PUT    | `/api/v1/incidents/:id` |   ✅   | Assigned only |
| DELETE | `/api/v1/incidents/:id` |   ✅   |       ❌       |

---

# Testing Checklist

The Incident API should be tested for:

### Authentication

* [ ] Request without JWT
* [ ] Request with invalid JWT
* [ ] Request with valid JWT

### Create

* [ ] Create incident
* [ ] Create with default priority
* [ ] Create with default severity
* [ ] Duplicate incident ID within same organization
* [ ] Same incident ID in different organization
* [ ] Invalid reporter

### Read

* [ ] Get all incidents
* [ ] Get single incident
* [ ] Non-existent incident
* [ ] Verify organization isolation

### Assignment

* [ ] Admin assigns employee
* [ ] Admin reassigns employee
* [ ] Employee attempts assignment
* [ ] Assign inactive user
* [ ] Assign user from another organization
* [ ] Assign admin as employee

### Status

* [ ] Admin changes status
* [ ] Assigned employee → `In Progress`
* [ ] Assigned employee → `Resolved`
* [ ] Unassigned employee attempts update
* [ ] Employee attempts `Pending`
* [ ] Employee attempts `Closed`
* [ ] Resolve without resolution
* [ ] Resolve with resolution
* [ ] Verify `resolvedAt`
* [ ] Verify `closedAt`

### Delete

* [ ] Admin deletes incident
* [ ] Employee attempts delete
* [ ] Delete non-existent incident

### SLA

* [ ] `In Progress` updates `respondedAt`
* [ ] `Resolved` updates SLA to `Completed`
* [ ] `Closed` completes SLA when applicable

````

## This is what your teammate actually needs

Now imagine the frontend developer has to build the Incident page.

They can look at this document and immediately know:

**Create form:**

```text
incidentId
title
description
priority
severity
````

**Edit form:**

```text
title
description
priority
severity
status
assignedTo
resolution
```

**Admin UI:**

```text
Assign
Reassign
Change status
Resolve
Close
Delete
```

**Employee UI:**

```text
Only assigned incidents
Update
In Progress
Resolve
```

And they know exactly what the backend will accept.
# Testing Evidence

The Incident API was tested using Postman.

Tested scenarios include:

- Create incident
- Get all incidents
- Get incident by ID
- Update incident
- Assign incident as admin
- Employee authorization restrictions
- Resolve incident
- Close incident
- Delete incident
- Invalid/non-existent incident
- SLA automation

Postman screenshots/test evidence are maintained separately.