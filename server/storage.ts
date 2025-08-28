import { 
  type Employee, 
  type InsertEmployee,
  type UpdateEmployee,
  type RevenueCenter, 
  type InsertRevenueCenter,
  type UpdateRevenueCenter,
  employees,
  revenueCenters
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Employee methods
  getEmployees(): Promise<Employee[]>;
  getActiveEmployees(): Promise<Employee[]>;
  getEmployeesByCenter(centerName: string): Promise<Employee[]>;
  getAllEmployeesByCenter(centerName: string): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, updates: UpdateEmployee): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;
  
  // Revenue center methods
  getRevenueCenters(): Promise<RevenueCenter[]>;
  getRevenueCenter(name: string): Promise<RevenueCenter | undefined>;
  createRevenueCenter(center: InsertRevenueCenter): Promise<RevenueCenter>;
  updateRevenueCenter(name: string, updates: UpdateRevenueCenter): Promise<RevenueCenter | undefined>;
}


export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize default revenue centers
    this.initializeRevenueCenters();
  }

  private async initializeRevenueCenters() {
    try {
      // Check if revenue centers already exist
      const existingCenters = await this.getRevenueCenters();
      if (existingCenters.length > 0) {
        return; // Already initialized
      }

      const defaultCenters = [
        { name: "dining", sales: 0, divisor: 35.5 },
        { name: "lounge", sales: 0, divisor: 42.0 },
        { name: "patio", sales: 0, divisor: 38.5 }
      ];

      for (const center of defaultCenters) {
        await this.createRevenueCenter(center);
      }
    } catch (error) {
      console.error("Failed to initialize revenue centers:", error);
    }
  }

  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  async getActiveEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.isActive, "true"));
  }

  async getEmployeesByCenter(centerName: string): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.revenueCenter, centerName));
  }

  async getAllEmployeesByCenter(centerName: string): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.revenueCenter, centerName));
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db
      .insert(employees)
      .values({
        ...insertEmployee,
        endTime: null,
        unpaidBreakMinutes: 0,
        isActive: "true"
      })
      .returning();
    return employee;
  }

  async updateEmployee(id: string, updates: UpdateEmployee): Promise<Employee | undefined> {
    const [employee] = await db
      .update(employees)
      .set(updates)
      .where(eq(employees.id, id))
      .returning();
    return employee || undefined;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    const result = await db
      .delete(employees)
      .where(eq(employees.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getRevenueCenters(): Promise<RevenueCenter[]> {
    return await db.select().from(revenueCenters);
  }

  async getRevenueCenter(name: string): Promise<RevenueCenter | undefined> {
    const [center] = await db.select().from(revenueCenters).where(eq(revenueCenters.name, name));
    return center || undefined;
  }

  async createRevenueCenter(insertCenter: InsertRevenueCenter): Promise<RevenueCenter> {
    const [center] = await db
      .insert(revenueCenters)
      .values({
        name: insertCenter.name,
        sales: insertCenter.sales ?? 0,
        divisor: insertCenter.divisor ?? 35
      })
      .returning();
    return center;
  }

  async updateRevenueCenter(name: string, updates: UpdateRevenueCenter): Promise<RevenueCenter | undefined> {
    const [center] = await db
      .update(revenueCenters)
      .set(updates)
      .where(eq(revenueCenters.name, name))
      .returning();
    return center || undefined;
  }
}

export const storage = new DatabaseStorage();
