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
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password"],
                  properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "User created" },
            400: { description: "Bad request" },
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
                    email: { type: "string" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Login successful" },
            400: { description: "Invalid input" },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get current user profile",
          responses: {
            200: { description: "User profile" },
          },
        },
      },
      "/departments/create-department": {
        post: {
          tags: ["Departments"],
          summary: "Create a new department",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "hospitalId"],
                  properties: {
                    name: { type: "string" },
                    hospitalId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Department created" },
            400: { description: "Bad request" },
          },
        },
      },
      "/departments/get-departments": {
        get: {
          tags: ["Departments"],
          security: [],
          summary: "Get all departments",
          parameters: [
            {
              in: "query",
              name: "hospitalId",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "List of departments" },
          },
        },
      },
      "/appointments/create-appointment": {
        post: {
          tags: ["Appointments"],
          summary: "Create a new appointment",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["departmentId", "hospitalId", "date", "time"],
                  properties: {
                    departmentId: { type: "string" },
                    hospitalId: { type: "string" },
                    date: { type: "string" },
                    time: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Appointment created" },
            400: { description: "Bad request" },
            401: { description: "Unauthorized" },
            403: { description: "Forbidden" },
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
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Appointment completed" },
            403: { description: "Staff only" },
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
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Appointment cancelled" },
          },
        },
      },
      "/appointments/my-appointments": {
        get: {
          tags: ["Appointments"],
          summary: "Get my appointments",
          parameters: [
            {
              in: "query",
              name: "type",
              schema: {
                type: "string",
                enum: ["past", "upcoming"],
              },
              description: "Filter by past or upcoming appointments",
            },
          ],
          responses: {
            200: { description: "List of appointments" },
          },
        },
      },
      "/queue/next": {
        post: {
          tags: ["Queue"],
          summary: "Call the next patient in queue",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["departmentId"],
                  properties: {
                    departmentId: { type: "string" },
                    date: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Next patient called" },
            400: { description: "Bad request" },
            500: { description: "Internal server error" },
          },
        },
      },
      "/queue/get-queue": {
        get: {
          tags: ["Queue"],
          summary: "Get queue for a department (Admin)",
          parameters: [
            {
              in: "query",
              name: "departmentId",
              required: true,
              schema: { type: "string" },
            },
            {
              in: "query",
              name: "date",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Queue list" },
            400: { description: "Bad request" },
            500: { description: "Internal server error" },
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
            },
          ],
          responses: {
            200: { description: "My queue status" },
            404: { description: "No queue found" },
            500: { description: "Internal server error" },
          },
        },
      },
      "/queue/{id}/move": {
        patch: {
          tags: ["Queue"],
          summary: "Move a queue item up or down",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
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
            200: { description: "Queue moved" },
            400: { description: "Bad request" },
            500: { description: "Internal server error" },
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
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Queue status" },
            404: { description: "Not in queue" },
          },
        },
      },
      "/queue/public": {
        get: {
          tags: ["Queue"],
          summary: "Get public queue for a department (Patients)",
          parameters: [
            {
              in: "query",
              name: "departmentId",
              required: true,
              schema: { type: "string" },
            },
            {
              in: "query",
              name: "date",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Public queue list (no sensitive patient data)" },
            400: { description: "Bad request" },
            500: { description: "Internal server error" },
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
