import { Express, Request, Response } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Qure API",
      version: "1.0.0",
      description: "API documentation for the Qure Clinic Queue Management System",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Role: {
          type: "string",
          enum: ["PATIENT", "ADMIN", "SUPER_ADMIN"],
        },
        AppointmentStatus: {
          type: "string",
          enum: ["PENDING", "WAITING", "ACTIVE", "DONE", "CANCELLED"],
        },
        QueueStatus: {
          type: "string",
          enum: ["WAITING", "ACTIVE", "DONE"],
        },
        AssignmentStrategy: {
          type: "string",
          enum: ["AUTO_ASSIGN", "PATIENT_SELECTED"],
        },
        AssignmentReason: {
          type: "string",
          enum: ["PRIMARY_DOCTOR", "AUTO_ASSIGNED", "PATIENT_SELECTED", "TEMPORARY_REPLACEMENT"],
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { $ref: "#/components/schemas/Role" },
            createdAt: { type: "string", format: "date-time" },
            status: { type: "string", nullable: true },
            isAvailable: { type: "boolean" },
            maxDailyPatients: { type: "integer" },
            departmentId: { type: "string", format: "uuid", nullable: true },
          },
        },
        Hospital: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
          },
        },
        Department: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            hospitalId: { type: "string", format: "uuid" },
            assignmentStrategy: { $ref: "#/components/schemas/AssignmentStrategy" },
          },
        },
        Appointment: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            patientId: { type: "string", format: "uuid" },
            doctorId: { type: "string", format: "uuid", nullable: true },
            departmentId: { type: "string", format: "uuid" },
            scheduledAt: { type: "string", format: "date-time" },
            duration: { type: "integer" },
            description: { type: "string", nullable: true },
            doctorNotes: { type: "string", nullable: true },
            status: { $ref: "#/components/schemas/AppointmentStatus" },
            createdAt: { type: "string", format: "date-time" },
            assignmentReason: { $ref: "#/components/schemas/AssignmentReason", nullable: true },
            isTemporaryAssignment: { type: "boolean" },
            doctorAvailabilityId: { type: "string", format: "uuid", nullable: true },
          },
        },
        Queue: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            appointmentId: { type: "string", format: "uuid" },
            doctorId: { type: "string", format: "uuid" },
            departmentId: { type: "string", format: "uuid" },
            scheduledAt: { type: "string", format: "date-time" },
            position: { type: "integer" },
            status: { $ref: "#/components/schemas/QueueStatus" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        DoctorAvailability: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            doctorId: { type: "string", format: "uuid" },
            scheduledAt: { type: "string", format: "date-time" },
            duration: { type: "integer" },
            isBooked: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            error: { type: "string" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    servers: [
      {
        url: "https://qure-backend-chzb.onrender.com",
        description: "Production server (Render)",
      },
      {
        url: "http://localhost:5000",
        description: "Local server",
      },
    ],
    paths: {
      "/auth/register": {
        post: {
          tags: ["Auth"],
          security: [],
          summary: "Register a new patient",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password"],
                  properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    password: { type: "string", description: "Password requirements: min 7 chars, at least 1 letter, 1 number, 1 special char" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "User created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      token: { type: "string" },
                      user: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Bad request / validation failed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          security: [],
          summary: "Login a user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      token: { type: "string" },
                      user: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Invalid input / validation failed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            401: {
              description: "Invalid credentials",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get current user profile",
          responses: {
            200: {
              description: "User profile details",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      name: { type: "string" },
                      email: { type: "string", format: "email" },
                      role: { $ref: "#/components/schemas/Role" },
                      departmentId: { type: "string", format: "uuid", nullable: true },
                      department: {
                        type: "object",
                        nullable: true,
                        properties: {
                          name: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Unauthorized / Missing token",
            },
          },
        },
      },
      "/auth/create-doctor": {
        post: {
          tags: ["Auth"],
          summary: "Create a new doctor/admin (Super Admin only)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password", "departmentId"],
                  properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                    departmentId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Doctor user created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      token: { type: "string" },
                      user: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Bad request / validation failed",
            },
            403: {
              description: "Forbidden - Super Admin role required",
            },
          },
        },
      },
      "/auth/doctors": {
        get: {
          tags: ["Auth"],
          summary: "List all doctors",
          responses: {
            200: {
              description: "List of all doctors in the system",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        email: { type: "string", format: "email" },
                        role: { $ref: "#/components/schemas/Role" },
                        departmentId: { type: "string", format: "uuid", nullable: true },
                        department: {
                          type: "object",
                          nullable: true,
                          properties: {
                            name: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Unauthorized",
            },
          },
        },
      },
      "/departments/create-department": {
        post: {
          tags: ["Departments"],
          summary: "Create a new department (Super Admin only)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "hospitalId"],
                  properties: {
                    name: { type: "string" },
                    hospitalId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Department created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Department" },
                },
              },
            },
            400: {
              description: "Bad request / validation failed / hospital does not exist",
            },
            403: {
              description: "Forbidden - Super Admin required",
            },
          },
        },
      },
      "/departments/get-departments": {
        get: {
          tags: ["Departments"],
          summary: "Get all departments",
          parameters: [
            {
              in: "query",
              name: "hospitalId",
              schema: { type: "string", format: "uuid" },
              required: false,
              description: "Filter departments by Hospital ID",
            },
          ],
          responses: {
            200: {
              description: "List of departments",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Department" },
                  },
                },
              },
            },
            401: {
              description: "Unauthorized",
            },
          },
        },
      },
      "/departments/{id}/strategy": {
        put: {
          tags: ["Departments"],
          summary: "Update department assignment strategy (Super Admin only)",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Department ID",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["assignmentStrategy"],
                  properties: {
                    assignmentStrategy: { $ref: "#/components/schemas/AssignmentStrategy" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Assignment strategy updated successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Department" },
                },
              },
            },
            400: {
              description: "Invalid input strategy",
            },
            403: {
              description: "Forbidden - Super Admin required",
            },
          },
        },
      },
      "/appointments/create-appointment": {
        post: {
          tags: ["Appointments"],
          summary: "Create a new appointment (Patient only)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["doctorAvailabilityId"],
                  properties: {
                    doctorAvailabilityId: { type: "string", format: "uuid" },
                    preferredDoctorId: { type: "string", format: "uuid" },
                    description: { type: "string" },
                    lastDayOfAppointment: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Appointment created successfully and added to queue",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      appointmentId: { type: "string", format: "uuid" },
                      scheduledAt: { type: "string", format: "date-time" },
                      status: { $ref: "#/components/schemas/AppointmentStatus" },
                      queue: {
                        type: "object",
                        properties: {
                          position: { type: "integer" },
                          status: { $ref: "#/components/schemas/QueueStatus" },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: "Bad request / slot unavailable / validation error",
            },
            401: {
              description: "Unauthorized",
            },
            403: {
              description: "Forbidden - Patients only",
            },
          },
        },
      },
      "/appointments/{id}/complete": {
        patch: {
          tags: ["Appointments"],
          summary: "Mark an appointment as complete (Staff only)",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Appointment ID",
            },
          ],
          responses: {
            200: {
              description: "Appointment completed successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      appointmentId: { type: "string", format: "uuid" },
                      status: { $ref: "#/components/schemas/AppointmentStatus" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Bad request / Cannot complete appointment in current state",
            },
            403: {
              description: "Forbidden - Staff (Admins) only",
            },
          },
        },
      },
      "/appointments/{id}/cancel": {
        patch: {
          tags: ["Appointments"],
          summary: "Cancel an appointment",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Appointment ID",
            },
          ],
          responses: {
            200: {
              description: "Appointment cancelled successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      appointmentId: { type: "string", format: "uuid" },
                      status: { $ref: "#/components/schemas/AppointmentStatus" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Bad request / Cannot cancel appointment in current state",
            },
          },
        },
      },
      "/appointments/{id}/notes": {
        patch: {
          tags: ["Appointments"],
          summary: "Add doctor notes to an appointment (Doctors/Admins only)",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Appointment ID",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["notes"],
                  properties: {
                    notes: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Notes added successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      appointment: { $ref: "#/components/schemas/Appointment" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Bad request",
            },
            403: {
              description: "Forbidden - Doctors/Admins only",
            },
          },
        },
      },
      "/appointments/my-appointments": {
        get: {
          tags: ["Appointments"],
          summary: "Get logged-in patient's appointments",
          parameters: [
            {
              in: "query",
              name: "type",
              schema: {
                type: "string",
                enum: ["past", "upcoming"],
              },
              required: false,
              description: "Filter by past or upcoming appointments",
            },
          ],
          responses: {
            200: {
              description: "List of appointments",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      allOf: [
                        { $ref: "#/components/schemas/Appointment" },
                        {
                          type: "object",
                          properties: {
                            estimatedWaitTime: { type: "integer", description: "Estimated wait time in minutes" },
                            department: {
                              type: "object",
                              properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                hospital: {
                                  type: "object",
                                  properties: {
                                    name: { type: "string" },
                                  },
                                },
                              },
                            },
                            doctor: {
                              type: "object",
                              properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                email: { type: "string" },
                              },
                            },
                            queue: {
                              type: "object",
                              nullable: true,
                              properties: {
                                position: { type: "integer" },
                                status: { $ref: "#/components/schemas/QueueStatus" },
                                departmentId: { type: "string" },
                                scheduledAt: { type: "string", format: "date-time" },
                              },
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/appointments": {
        get: {
          tags: ["Appointments"],
          summary: "List all appointments (Doctor/Staff/Admin view)",
          responses: {
            200: {
              description: "List of appointments in the user's scope / department",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Appointment" },
                  },
                },
              },
            },
            401: {
              description: "Unauthorized",
            },
          },
        },
      },
      "/queue/next": {
        post: {
          tags: ["Queue"],
          summary: "Call the next patient in queue (Admin/Staff only)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    departmentId: { type: "string", format: "uuid", description: "Department ID (Required if logged-in user is SUPER_ADMIN)" },
                    date: { type: "string", format: "date", description: "Date in YYYY-MM-DD format (Defaults to today)" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Next patient called successfully",
            },
            400: {
              description: "Bad request / Validation error",
            },
            500: {
              description: "Internal server error",
            },
          },
        },
      },
      "/queue/get-queue": {
        get: {
          tags: ["Queue"],
          summary: "Get queue for a department or doctor (Admin/Staff only)",
          parameters: [
            {
              in: "query",
              name: "departmentId",
              schema: { type: "string", format: "uuid" },
              required: false,
              description: "Department ID (Required for Super Admins; Admins default to their department)",
            },
            {
              in: "query",
              name: "doctorId",
              schema: { type: "string", format: "uuid" },
              required: false,
              description: "Doctor ID (Optionally filter queue entries for a specific doctor)",
            },
            {
              in: "query",
              name: "date",
              schema: { type: "string" },
              required: false,
              description: "Filter by scheduled date (YYYY-MM-DD)",
            },
          ],
          responses: {
            200: {
              description: "List of queue entries",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Queue" },
                  },
                },
              },
            },
            400: {
              description: "Bad request",
            },
            500: {
              description: "Internal server error",
            },
          },
        },
      },
      "/queue/public": {
        get: {
          tags: ["Queue"],
          summary: "Get public queue for a department (Patients/Public view)",
          parameters: [
            {
              in: "query",
              name: "departmentId",
              schema: { type: "string", format: "uuid" },
              required: false,
              description: "Filter by Department ID (One of doctorId or departmentId must be specified)",
            },
            {
              in: "query",
              name: "doctorId",
              schema: { type: "string", format: "uuid" },
              required: false,
              description: "Filter by Doctor ID (One of doctorId or departmentId must be specified)",
            },
            {
              in: "query",
              name: "date",
              schema: { type: "string" },
              required: false,
              description: "Scheduled date (YYYY-MM-DD)",
            },
          ],
          responses: {
            200: {
              description: "Public queue list (no sensitive patient data)",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        position: { type: "integer" },
                        status: { $ref: "#/components/schemas/QueueStatus" },
                        scheduledAt: { type: "string", format: "date-time" },
                        appointmentId: { type: "string", format: "uuid" },
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: "Bad request - Missing filters",
            },
            500: {
              description: "Internal server error",
            },
          },
        },
      },
      "/queue/me": {
        get: {
          tags: ["Queue"],
          summary: "Get my queue status",
          parameters: [
            {
              in: "query",
              name: "date",
              schema: { type: "string" },
              required: false,
              description: "Filter by scheduled date (YYYY-MM-DD)",
            },
          ],
          responses: {
            200: {
              description: "My current queue status",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      position: { type: "integer" },
                      status: { $ref: "#/components/schemas/QueueStatus" },
                      scheduledAt: { type: "string", format: "date-time" },
                      department: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: "No active queue entry found",
            },
            500: {
              description: "Internal server error",
            },
          },
        },
      },
      "/queue/{id}/move": {
        patch: {
          tags: ["Queue"],
          summary: "Move a queue item position (Admin/Staff only)",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Queue ID",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["direction"],
                  properties: {
                    direction: {
                      type: "string",
                      enum: ["UP", "DOWN"],
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Queue item successfully moved",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      position: { type: "integer" },
                      status: { $ref: "#/components/schemas/QueueStatus" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Bad request / invalid movement",
            },
            500: {
              description: "Internal server error",
            },
          },
        },
      },
      "/queue/by-appointment/{appointmentId}": {
        get: {
          tags: ["Queue"],
          summary: "Get queue status by appointment ID",
          parameters: [
            {
              in: "path",
              name: "appointmentId",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Appointment ID",
            },
          ],
          responses: {
            200: {
              description: "Queue status associated with the appointment",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      position: { type: "integer" },
                      status: { $ref: "#/components/schemas/QueueStatus" },
                    },
                  },
                },
              },
            },
            404: {
              description: "Appointment is not currently in any queue",
            },
          },
        },
      },
      "/availability/": {
        post: {
          tags: ["Availability"],
          summary: "Create doctor availability slots (Doctor/Super Admin only)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["date", "times"],
                  properties: {
                    date: { type: "string", format: "date", description: "Date of availability (YYYY-MM-DD)" },
                    times: {
                      type: "array",
                      items: { type: "string", description: "Time slots in HH:MM format" },
                    },
                    doctorId: { type: "string", format: "uuid", description: "Doctor ID (Required only for Super Admins to set slots on behalf of others)" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Availability slots created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      slots: {
                        type: "array",
                        items: { $ref: "#/components/schemas/DoctorAvailability" },
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: "Bad request / Validation error",
            },
          },
        },
      },
      "/availability/me": {
        get: {
          tags: ["Availability"],
          summary: "List current doctor's availability slots (Doctor/Super Admin only)",
          parameters: [
            {
              in: "query",
              name: "date",
              schema: { type: "string" },
              required: false,
              description: "Filter slots by date (YYYY-MM-DD)",
            },
            {
              in: "query",
              name: "doctorId",
              schema: { type: "string", format: "uuid" },
              required: false,
              description: "Doctor ID (Required only for Super Admins)",
            },
          ],
          responses: {
            200: {
              description: "List of availability slots",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/DoctorAvailability" },
                  },
                },
              },
            },
            400: {
              description: "Bad request / Missing doctorId for Super Admin",
            },
          },
        },
      },
      "/availability/available": {
        get: {
          tags: ["Availability"],
          summary: "List all available slots for booking",
          parameters: [
            {
              in: "query",
              name: "doctorId",
              schema: { type: "string", format: "uuid" },
              required: false,
              description: "Filter by Doctor ID",
            },
            {
              in: "query",
              name: "departmentId",
              schema: { type: "string", format: "uuid" },
              required: false,
              description: "Filter by Department ID",
            },
            {
              in: "query",
              name: "date",
              schema: { type: "string" },
              required: false,
              description: "Filter by date (YYYY-MM-DD)",
            },
          ],
          responses: {
            200: {
              description: "List of unbooked availability slots",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/DoctorAvailability" },
                  },
                },
              },
            },
            400: {
              description: "Bad request",
            },
          },
        },
      },
      "/availability/{id}": {
        delete: {
          tags: ["Availability"],
          summary: "Delete an availability slot (Doctor/Super Admin only)",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Slot ID",
            },
          ],
          responses: {
            200: {
              description: "Slot deleted successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Bad request / Cannot delete booked/past slots",
            },
          },
        },
      },
      "/hospitals": {
        get: {
          tags: ["Hospitals"],
          summary: "List all hospitals",
          responses: {
            200: {
              description: "List of hospitals",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Hospital" },
                  },
                },
              },
            },
            500: {
              description: "Internal server error",
            },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

function swaggerDocs(app: Express, port: number | string) {
  // Swagger page
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Docs in JSON format
  app.get("/docs.json", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log(`Docs available at http://localhost:${port}/docs`);
}

export default swaggerDocs;