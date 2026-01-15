# 🏥 Hospital Queue Management System

A backend API for managing hospital appointments and patient queues in a structured, time-aware, and scalable way.
The system eliminates physical overcrowding by digitizing appointment booking, queue positioning, and patient flow across departments.

Built with **Node.js**, **Express**, **TypeScript**, **PostgreSQL**, and **Prisma ORM**.

## Overview

Hospitals often struggle with long queues, unclear patient order, and inefficient patient flow.
This system solves that by:

- Allowing patients to book appointments for a specific date and time
- Automatically assigning a queue position
- Letting hospital staff call patients one-by-one
- Providing real-time queue status to patients and administrators

The system is date-aware, meaning queues are managed per department per day.

## Core Concepts

### Appointment

An appointment represents a patient’s booking for:

- a department
- a specific date and time

Appointment statuses:

- `WAITING`
- `ACTIVE`
- `DONE`
- `CANCELLED`

### Queue

A queue entry is automatically created when an appointment is booked.

Each queue entry contains:

- position (1, 2, 3, …)
- status (`WAITING`, `ACTIVE`, `DONE`)
- scheduledAt (normalized to the appointment day)

Queue positions are calculated per department per day.

## Key Features

### 🏥 For Hospital Administration

- **Call Next Patient**: Automatically completes the current `ACTIVE` queue and activates the next `WAITING` one.
- **Manual Queue Control**: Move patients up or down in the queue for emergencies.
- **Department-Level Visibility**: View daily queues per department.
- **Automatic Cleanup**: Past-day queues and appointments are normalized and marked as `DONE` or `CANCELLED`.

### 👤 For Patients

- **Smart Appointment Booking**: Prevents booking appointments in the past.
- **Live Queue Status**: Check queue position and status (`WAITING`, `ACTIVE`, `DONE`) in real time.
- **Appointment History**: View past and upcoming appointments separately.

## System Architecture

The application follows a layered architecture:

- **Controllers**
  - Handle HTTP requests
  - Validate inputs
  - Shape and sanitize API responses
- **Services**
  - Contain business logic
  - Handle queue position calculation
  - Manage appointment and queue state transitions
- **Data Access Layer**
  - Prisma ORM for PostgreSQL
  - Transactions ensure queue consistency

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL (v13+)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/hospital-queue-backend.git
   cd hospital-queue-backend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

### Database Setup

Ensure PostgreSQL is running and create a database.

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/hospital_db?schema=public"
JWT_SECRET="your_secure_jwt_secret"
```

3. Run database migrations
   ```bash
   npx prisma migrate dev --name init
   ```

4. Start the server
   ```bash
   npm run dev
   ```

## API Documentation

### 📅 Appointments

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/appointments/create-appointment` | Create a new appointment |
| GET | `/appointments/my-appointments` | Get user appointments (past or upcoming) |
| PATCH | `/appointments/:id/complete` | Mark appointment as completed (Admin) |
| PATCH | `/appointments/:id/cancel` | Cancel an appointment |

**Create Appointment Body**

```json
{
  "departmentId": "uuid",
  "hospitalId": "uuid",
  "date": "YYYY-MM-DD",
  "time": "HH:mm"
}
```

### 🔢 Queue Management

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/queue/next` | Call the next patient in the queue |
| GET | `/queue/get-queue` | View daily queue |
| GET | `/queue/me` | Get my live queue status |
| PATCH | `/queue/:id/move` | Move a patient up or down |
| GET | `/queue/by-appointment/:id` | Get queue status by appointment |

**Call Next Patient Body**

```json
{
  "departmentId": "uuid",
  "date": "YYYY-MM-DD"
}
```

### 🏥 Departments

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/departments` | List all departments (optional hospital filter) |

## Queue Lifecycle

1. **Patient books an appointment**
   - Queue entry is created with status `WAITING`
2. **Admin calls next patient**:
   - Current `ACTIVE` → `DONE`
   - Next `WAITING` → `ACTIVE`
3. **At end of day**:
   - Past queues are cleaned up
   - Appointments are marked `DONE` or `CANCELLED`
   - New day starts with a fresh queue order

## Project Structure

```
src/
├── controllers/      # HTTP request handlers
├── services/         # Business logic and transactions
├── lib/              # Prisma client and config
├── utils/            # Helpers (date normalization, validation)
├── routes/           # Route definitions
└── app.ts            # Application entry point
```

## ✍️ Author

DevFaruq.
