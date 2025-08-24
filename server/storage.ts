import { 
  type Employee, 
  type InsertEmployee,
  type UpdateEmployee,
  type RevenueCenter, 
  type InsertRevenueCenter,
  type UpdateRevenueCenter 
} from "@shared/schema";
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

export class MemStorage implements IStorage {
  private employees: Map<string, Employee>;
  private revenueCenters: Map<string, RevenueCenter>;

  constructor() {
    this.employees = new Map();
    this.revenueCenters = new Map();
    
    // Initialize default revenue centers
    this.initializeRevenueCenters();
  }

  private async initializeRevenueCenters() {
    const defaultCenters = [
      { name: "dining", sales: 0, divisor: 35.5 },
      { name: "lounge", sales: 0, divisor: 42.0 },
      { name: "patio", sales: 0, divisor: 38.5 }
    ];

    for (const center of defaultCenters) {
      await this.createRevenueCenter(center);
    }
  }

  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async getActiveEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values()).filter(emp => emp.isActive === "true");
  }

  async getEmployeesByCenter(centerName: string): Promise<Employee[]> {
    return Array.from(this.employees.values()).filter(
      emp => emp.revenueCenter === centerName && emp.isActive === "true"
    );
  }

  async getAllEmployeesByCenter(centerName: string): Promise<Employee[]> {
    return Array.from(this.employees.values()).filter(
      emp => emp.revenueCenter === centerName
    );
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = randomUUID();
    const employee: Employee = { 
      ...insertEmployee, 
      id,
      endTime: null,
      unpaidBreakMinutes: 0,
      isActive: "true"
    };
    this.employees.set(id, employee);
    return employee;
  }

  async updateEmployee(id: string, updates: UpdateEmployee): Promise<Employee | undefined> {
    const employee = this.employees.get(id);
    if (!employee) return undefined;
    
    const updatedEmployee = { ...employee, ...updates };
    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    return this.employees.delete(id);
  }

  async getRevenueCenters(): Promise<RevenueCenter[]> {
    return Array.from(this.revenueCenters.values());
  }

  async getRevenueCenter(name: string): Promise<RevenueCenter | undefined> {
    return Array.from(this.revenueCenters.values()).find(center => center.name === name);
  }

  async createRevenueCenter(insertCenter: InsertRevenueCenter): Promise<RevenueCenter> {
    const id = randomUUID();
    const center: RevenueCenter = { 
      id,
      name: insertCenter.name,
      sales: insertCenter.sales ?? 0,
      divisor: insertCenter.divisor ?? 35
    };
    this.revenueCenters.set(center.name, center);
    return center;
  }

  async updateRevenueCenter(name: string, updates: UpdateRevenueCenter): Promise<RevenueCenter | undefined> {
    const center = this.revenueCenters.get(name);
    if (!center) return undefined;
    
    const updatedCenter = { ...center, ...updates };
    this.revenueCenters.set(name, updatedCenter);
    return updatedCenter;
  }
}

export const storage = new MemStorage();
