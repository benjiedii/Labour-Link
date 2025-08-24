import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, updateEmployeeSchema, updateRevenueCenterSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Employee routes
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/active", async (req, res) => {
    try {
      const employees = await storage.getActiveEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active employees" });
    }
  });

  app.get("/api/employees/center/:centerName", async (req, res) => {
    try {
      const { centerName } = req.params;
      const employees = await storage.getEmployeesByCenter(centerName);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees by center" });
    }
  });

  app.get("/api/employees/center/:centerName/all", async (req, res) => {
    try {
      const { centerName } = req.params;
      const employees = await storage.getAllEmployeesByCenter(centerName);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all employees by center" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid employee data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create employee" });
      }
    }
  });

  app.patch("/api/employees/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateEmployeeSchema.parse(req.body);
      const employee = await storage.updateEmployee(id, validatedData);
      if (!employee) {
        res.status(404).json({ message: "Employee not found" });
        return;
      }
      res.json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid employee data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update employee" });
      }
    }
  });

  app.patch("/api/employees/:id/checkout", async (req, res) => {
    try {
      const { id } = req.params;
      const employee = await storage.updateEmployee(id, { 
        isActive: "false",
        endTime: new Date()
      });
      if (!employee) {
        res.status(404).json({ message: "Employee not found" });
        return;
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to checkout employee" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteEmployee(id);
      if (!deleted) {
        res.status(404).json({ message: "Employee not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Revenue center routes
  app.get("/api/revenue-centers", async (req, res) => {
    try {
      const centers = await storage.getRevenueCenters();
      res.json(centers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch revenue centers" });
    }
  });

  app.get("/api/revenue-centers/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const center = await storage.getRevenueCenter(name);
      if (!center) {
        res.status(404).json({ message: "Revenue center not found" });
        return;
      }
      res.json(center);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch revenue center" });
    }
  });

  app.patch("/api/revenue-centers/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const validatedData = updateRevenueCenterSchema.parse(req.body);
      const center = await storage.updateRevenueCenter(name, validatedData);
      if (!center) {
        res.status(404).json({ message: "Revenue center not found" });
        return;
      }
      res.json(center);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid revenue center data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update revenue center" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
