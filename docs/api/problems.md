
# Problem Management API

## Overview

The Problem module manages underlying IT problems that may cause incidents or recurring service disruptions.

The module supports:

- Creating problems
- Viewing all organization problems
- Viewing a single problem
- Updating problems
- Assigning problems to employees
- Tracking impact, urgency, and priority
- Root cause documentation
- Workaround documentation
- Resolution tracking
- Controlled problem status transitions
- Closing resolved problems
- Deleting problems
- Organization-level data isolation
- Role-based access control

---

# Base URL


/api/v1/problems


All endpoints require JWT authentication.

## Authentication Header

```http
Authorization: Bearer <JWT_TOKEN>
```

---

# Problem Data Model

| Field            | Type     |  Required | Description                         |
| ---------------- | -------- | --------: | ----------------------------------- |
| `problemId`      | string   |       Yes | Human-readable problem identifier   |
| `title`          | string   |       Yes | Problem title                       |
| `description`    | string   |       Yes | Detailed problem description        |
| `priority`       | string   |        No | `Low`, `Medium`, `High`, `Critical` |
| `impact`         | string   |        No | `Low`, `Medium`, `High`             |
| `urgency`        | string   |        No | `Low`, `Medium`, `High`             |
| `status`         | string   |        No | Problem lifecycle status            |
| `reportedBy`     | ObjectId | Automatic | User who created the problem        |
| `assignedTo`     | ObjectId |        No | Employee assigned to the problem    |
| `organizationId` | ObjectId | Automatic | Organization/tenant                 |
| `rootCause`      | string   |        No | Identified root cause               |
| `workaround`     | string   |        No | Temporary workaround                |
| `resolution`     | string   |        No | Final resolution                    |
| `resolvedAt`     | Date     | Automatic | Set when problem is resolved        |
| `closedAt`       | Date     | Automatic | Set when problem is closed          |
| `createdAt`      | Date     | Automatic | Creation timestamp                  |
| `updatedAt`      | Date     | Automatic | Last update timestamp               |

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

## Impact

```text
Low
Medium
High
```

Default:

```text
Medium
```

## Urgency

```text
Low
Medium
High
```

Default:

```text
Medium
```

## Status

```text
Open
Under Investigation
Known Error
Resolved
Closed
```

Default:

```text
Open
```

---

# Role Permissions

| Operation                 | Admin | Employee |
| ------------------------- | :---: | :------: |
| Create problem            |  Yes  |    Yes   |
| View all problems         |  Yes  |    Yes   |
| View single problem       |  Yes  |    Yes   |
| Update problem            |  Yes  |  Limited |
| Assign problem            |  Yes  |    No    |
| Reassign problem          |  Yes  |    No    |
| Set `Open`                |  Yes  |    No    |
| Set `Under Investigation` |  Yes  |    No    |
| Set `Known Error`         |  Yes  |    No    |
| Set `Resolved`            |  Yes  |    No    |
| Set `Closed`              |  Yes  |    No    |
| Delete problem            |  Yes  |    No    |

### Important employee restriction

The current controller prevents non-admin users from:

* Assigning/reassigning a problem
* Setting status to `Under Investigation`
* Setting status to `Known Error`
* Setting status to `Resolved`
* Setting status to `Closed`

Employees can still update other allowed fields through the update endpoint, subject to the service/model validation.

---

# 1. Create Problem

## Endpoint

```http
POST /api/v1/problems
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
  "problemId": "PRB-001",
  "title": "Recurring VPN authentication failure",
  "description": "Multiple users are experiencing recurring VPN authentication failures.",
  "priority": "High",
  "impact": "High",
  "urgency": "Medium"
}
```

## Required Fields

```text
problemId
title
description
```

## Optional Fields

```text
priority
impact
urgency
```

## Do NOT send

```text
reportedBy
organizationId
status
resolvedAt
closedAt
```

These values are controlled by the backend.

`reportedBy` is taken from the authenticated user's ID.

`organizationId` is taken from the authenticated user's organization.

`status` is automatically set to:

```text
Open
```

---

# Successful Response

## Status

```text
201 Created
```

## Response

```json
{
  "success": true,
  "message": "Problem created successfully",
  "data": {
    "_id": "...",
    "problemId": "PRB-001",
    "title": "Recurring VPN authentication failure",
    "description": "Multiple users are experiencing recurring VPN authentication failures.",
    "priority": "High",
    "impact": "High",
    "urgency": "Medium",
    "status": "Open",
    "reportedBy": "...",
    "organizationId": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

# Validation

## Duplicate Problem ID

`problemId` must be unique within the organization.

Example:

```text
Organization A

PRB-001 → allowed

Organization A

PRB-001 → rejected

Organization B

PRB-001 → allowed
```

The same problem ID can therefore exist in different organizations.

## Reporter Validation

The authenticated reporter must:

* Exist
* Be active
* Belong to the same organization

Otherwise the API returns an error.

---

# 2. Get All Problems

## Endpoint

```http
GET /api/v1/problems
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
      "problemId": "PRB-001",
      "title": "Recurring VPN authentication failure",
      "description": "Multiple users are experiencing recurring VPN authentication failures.",
      "priority": "High",
      "impact": "High",
      "urgency": "Medium",
      "status": "Under Investigation",
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

## Important

Results are restricted to the authenticated user's organization.

Problems are sorted by:

```text
createdAt DESC
```

Newest problems appear first.

The backend populates `reportedBy` and `assignedTo` with:

```text
name
email
role
```

---

# 3. Get Problem By ID

## Endpoint

```http
GET /api/v1/problems/:id
```

Example:

```http
GET /api/v1/problems/65f123456789abcdef123456
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
  "data": {
    "_id": "...",
    "problemId": "PRB-001",
    "title": "Recurring VPN authentication failure",
    "description": "Multiple users are experiencing recurring VPN authentication failures.",
    "priority": "High",
    "impact": "High",
    "urgency": "Medium",
    "status": "Under Investigation",
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
}
```

## Not Found

```text
404 Not Found
```

```json
{
  "success": false,
  "message": "Problem not found"
}
```

Invalid MongoDB ObjectIds are also treated as not found by the service.

---

# 4. Update Problem

## Endpoint

```http
PUT /api/v1/problems/:id
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
impact
urgency
status
assignedTo
rootCause
workaround
resolution
```

Example:

```json
{
  "priority": "High",
  "impact": "High",
  "urgency": "High",
  "assignedTo": "EMPLOYEE_OBJECT_ID",
  "rootCause": "Incorrect VPN authentication configuration",
  "workaround": "Restart VPN authentication service",
  "status": "Under Investigation"
}
```

---

# Employee Update Permissions

The current controller restricts employees from:

```text
assignedTo
```

and from setting:

```text
Under Investigation
Known Error
Resolved
Closed
```

If an employee attempts one of these operations, the API returns:

```text
403 Forbidden
```

```json
{
  "success": false,
  "message": "You are not authorized to manage this problem"
}
```

---

# Assigning a Problem

Only admins should assign or reassign problems.

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
* Have a valid MongoDB ObjectId

Otherwise the request fails.

### Invalid assigned user ID

```text
400 Bad Request
```

```json
{
  "success": false,
  "message": "Invalid assigned user ID"
}
```

### User from another organization

```text
400 Bad Request
```

```json
{
  "success": false,
  "message": "Assigned user does not belong to this organization"
}
```

### Attempt to assign an admin

```text
400 Bad Request
```

```json
{
  "success": false,
  "message": "Problems can only be assigned to employees"
}
```

---

# Problem Status Workflow

Problem statuses follow a controlled lifecycle.

The normal workflow is:

```text
Open
  ↓
Under Investigation
  ↓
Known Error
  ↓
Resolved
  ↓
Closed
```

Some statuses can remain at the same state.

---

# Status Transition Rules

## Open

A problem starts as:

```text
Open
```

It cannot be moved back to `Open` from another status.

Allowed:

```text
Open → Open
```

Not allowed:

```text
Under Investigation → Open
Known Error → Open
Resolved → Open
Closed → Open
```

---

# Under Investigation

A problem can move to `Under Investigation` only from:

```text
Open
```

or:

```text
Under Investigation
```

Allowed:

```text
Open → Under Investigation

Under Investigation → Under Investigation
```

Not allowed:

```text
Known Error → Under Investigation
Resolved → Under Investigation
Closed → Under Investigation
```

---

# Known Error

A problem can become a `Known Error` only when it is:

```text
Under Investigation
```

Allowed:

```text
Under Investigation → Known Error

Known Error → Known Error
```

Not allowed:

```text
Open → Known Error
Resolved → Known Error
Closed → Known Error
```

---

# Resolved

A problem can be resolved only when its current status is:

```text
Under Investigation
```

or:

```text
Known Error
```

Allowed:

```text
Under Investigation → Resolved

Known Error → Resolved
```

The problem must have a resolution.

Correct:

```json
{
  "status": "Resolved",
  "resolution": "VPN authentication configuration was corrected."
}
```

Incorrect:

```json
{
  "status": "Resolved"
}
```

If no resolution exists, the API returns:

```text
400 Bad Request
```

```json
{
  "success": false,
  "message": "Resolution is required when resolving a problem"
}
```

When successfully resolved, the backend automatically sets:

```text
resolvedAt
```

to the current timestamp.

---

# Closed

A problem can only be closed after it has been resolved.

Allowed:

```text
Resolved → Closed
```

Not allowed:

```text
Open → Closed
Under Investigation → Closed
Known Error → Closed
```

Attempting to close a non-resolved problem returns:

```text
400 Bad Request
```

```json
{
  "success": false,
  "message": "Only resolved problems can be closed"
}
```

When successfully closed, the backend automatically sets:

```text
closedAt
```

to the current timestamp.

---

# Closed Problem Protection

Once a problem is:

```text
Closed
```

it cannot be reopened by changing its status.

For example:

```json
{
  "status": "Resolved"
}
```

will be rejected if the problem is already closed.

Expected error:

```text
400 Bad Request
```

```json
{
  "success": false,
  "message": "Closed problems cannot be reopened or modified to another status"
}
```

---

# Root Cause

The `rootCause` field stores the identified underlying cause of the problem.

Example:

```json
{
  "rootCause": "Incorrect VPN authentication configuration"
}
```

The backend does not automatically generate the root cause.

The frontend should provide the value when the user has identified the cause.

---

# Workaround

The `workaround` field stores a temporary solution that can be used while the underlying problem is being investigated or resolved.

Example:

```json
{
  "workaround": "Restart the VPN authentication service"
}
```

---

# Resolution

The `resolution` field stores the final solution.

Example:

```json
{
  "resolution": "VPN authentication configuration was corrected and tested successfully."
}
```

A resolution is required when changing the problem status to:

```text
Resolved
```

---

# Successful Update Response

## Status

```text
200 OK
```

## Response

```json
{
  "success": true,
  "message": "Problem updated successfully",
  "data": {
    "_id": "...",
    "problemId": "PRB-001",
    "title": "Recurring VPN authentication failure",
    "priority": "High",
    "impact": "High",
    "urgency": "Medium",
    "status": "Under Investigation",
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
    "updatedAt": "..."
  }
}
```

---

# 5. Delete Problem

## Endpoint

```http
DELETE /api/v1/problems/:id
```

## Authentication

Required.

## Role

Admin only.

The route is protected using:

```text
authenticate
authorize("admin")
```

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
  "message": "Problem deleted successfully",
  "data": {
    "_id": "...",
    "problemId": "PRB-001",
    "title": "Recurring VPN authentication failure"
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

# Multi-Tenant Security

All problem operations are scoped to the authenticated user's organization.

The backend uses:

```text
organizationId
```

when:

* Creating problems
* Reading problems
* Updating problems
* Deleting problems
* Validating assigned users
* Validating reporters
* Checking duplicate problem IDs

Users cannot access another organization's problem by simply providing its MongoDB ID.

---

# Frontend Integration Notes

## Axios Example

```ts
const response = await axios.post(
  "/api/v1/problems",
  {
    problemId: "PRB-001",
    title: "Recurring VPN authentication failure",
    description: "Multiple users are experiencing VPN authentication failures.",
    priority: "High",
    impact: "High",
    urgency: "Medium"
  },
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);
```

---

# Important Frontend Rules

Do not manually provide:

```text
reportedBy
organizationId
status
resolvedAt
closedAt
```

The backend manages these values.

Use the exact enum values.

## TypeScript Types

```ts
type ProblemPriority =
  | "Low"
  | "Medium"
  | "High"
  | "Critical";

type ProblemImpact =
  | "Low"
  | "Medium"
  | "High";

type ProblemUrgency =
  | "Low"
  | "Medium"
  | "High";

type ProblemStatus =
  | "Open"
  | "Under Investigation"
  | "Known Error"
  | "Resolved"
  | "Closed";
```

---

# Suggested Frontend Forms

## Create Problem Form

The frontend should collect:

```text
problemId
title
description
priority
impact
urgency
```

The backend automatically handles:

```text
reportedBy
organizationId
status
createdAt
updatedAt
```

---

## Admin Problem Management

Admins can access controls for:

```text
Assign / Reassign
Priority
Impact
Urgency
Status
Root Cause
Workaround
Resolution
Delete
```

---

## Employee Problem Management

The current backend restricts employees from:

```text
Assign / Reassign
Under Investigation
Known Error
Resolved
Closed
```

They can use the update endpoint for other permitted fields, subject to backend validation.

The frontend should therefore hide or disable controls that employees are not permitted to use.

---

# API Summary

| Method | Endpoint               | Admin | Employee |
| ------ | ---------------------- | :---: | :------: |
| POST   | `/api/v1/problems`     |   ✅   |     ✅    |
| GET    | `/api/v1/problems`     |   ✅   |     ✅    |
| GET    | `/api/v1/problems/:id` |   ✅   |     ✅    |
| PUT    | `/api/v1/problems/:id` |   ✅   |  Limited |
| DELETE | `/api/v1/problems/:id` |   ✅   |     ❌    |

---

# Common Error Responses

## Missing Organization

```text
403 Forbidden
```

```json
{
  "success": false,
  "message": "Organization access is required"
}
```

## Missing Authentication

```text
401 Unauthorized
```

```json
{
  "success": false,
  "message": "User authentication is required"
}
```

## Problem Not Found

```text
404 Not Found
```

```json
{
  "success": false,
  "message": "Problem not found"
}
```

## Unauthorized Employee Operation

```text
403 Forbidden
```

```json
{
  "success": false,
  "message": "You are not authorized to manage this problem"
}
```

---

# Testing Checklist

## Authentication

* [ ] Request without JWT
* [ ] Request with invalid JWT
* [ ] Request with valid admin JWT
* [ ] Request with valid employee JWT

## Create

* [ ] Create problem as admin
* [ ] Create problem as employee
* [ ] Create with default priority
* [ ] Create with default impact
* [ ] Create with default urgency
* [ ] Verify initial status is `Open`
* [ ] Duplicate problem ID within same organization
* [ ] Same problem ID in different organization
* [ ] Invalid reporter
* [ ] Inactive reporter
* [ ] Reporter from another organization

## Read

* [ ] Get all problems
* [ ] Get single problem
* [ ] Get non-existent problem
* [ ] Invalid problem ObjectId
* [ ] Verify organization isolation
* [ ] Verify newest problems appear first
* [ ] Verify `reportedBy` population
* [ ] Verify `assignedTo` population

## Assignment

* [ ] Admin assigns employee
* [ ] Admin reassigns employee
* [ ] Employee attempts assignment
* [ ] Invalid employee ID
* [ ] Assign inactive user
* [ ] Assign user from another organization
* [ ] Assign admin as employee

## Status Workflow

* [ ] `Open` → `Under Investigation`
* [ ] `Under Investigation` → `Known Error`
* [ ] `Under Investigation` → `Resolved`
* [ ] `Known Error` → `Resolved`
* [ ] `Resolved` → `Closed`
* [ ] Invalid status transition
* [ ] Attempt to reopen closed problem
* [ ] Resolve without resolution
* [ ] Resolve with resolution
* [ ] Verify `resolvedAt`
* [ ] Close unresolved problem
* [ ] Verify `closedAt`

## Employee Authorization

* [ ] Employee attempts assignment
* [ ] Employee attempts `Under Investigation`
* [ ] Employee attempts `Known Error`
* [ ] Employee attempts `Resolved`
* [ ] Employee attempts `Closed`
* [ ] Employee updates permitted fields

## Delete

* [ ] Admin deletes problem
* [ ] Employee attempts delete
* [ ] Delete non-existent problem

---

# Testing Evidence

The Problem API should be tested using Postman.

Recommended Postman test scenarios:

1. Create Problem
2. Get All Problems
3. Get Problem By ID
4. Update Problem
5. Assign Problem as Admin
6. Employee Authorization Tests
7. Status Transition Tests
8. Resolve Problem
9. Close Problem
10. Delete Problem
11. Invalid ObjectId
12. Organization Isolation
13. Duplicate Problem ID
14. Invalid Assignment

Postman screenshots and/or an exported Postman collection can be maintained separately as testing evidence.

---

# Frontend Integration Quick Reference

### Create

```http
POST /api/v1/problems
```

Body:

```json
{
  "problemId": "PRB-001",
  "title": "Problem title",
  "description": "Problem description",
  "priority": "Medium",
  "impact": "Medium",
  "urgency": "Medium"
}
```

### List

```http
GET /api/v1/problems
```

### Details

```http
GET /api/v1/problems/:id
```

### Update

```http
PUT /api/v1/problems/:id
```

### Delete

```http
DELETE /api/v1/problems/:id
```

Delete requires an admin JWT.

All endpoints require:

```http
Authorization: Bearer <JWT_TOKEN>
```

````


