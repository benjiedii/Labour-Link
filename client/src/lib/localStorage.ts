import { type Employee, type RevenueCenter } from "@shared/schema";

const STORAGE_KEYS = {
  EMPLOYEES: 'labor-app-employees',
  REVENUE_CENTERS: 'labor-app-revenue-centers'
} as const;

export class LocalStorage {
  // Employee methods
  getEmployees(): Employee[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  getActiveEmployees(): Employee[] {
    return this.getEmployees().filter(emp => emp.isActive === "true");
  }

  getEmployeesByCenter(centerName: string): Employee[] {
    return this.getEmployees().filter(
      emp => emp.revenueCenter === centerName && emp.isActive === "true"
    );
  }

  getAllEmployeesByCenter(centerName: string): Employee[] {
    return this.getEmployees().filter(emp => emp.revenueCenter === centerName);
  }

  createEmployee(employee: Omit<Employee, 'id' | 'endTime' | 'unpaidBreakMinutes' | 'isActive'>): Employee {
    const employees = this.getEmployees();
    const newEmployee: Employee = {
      ...employee,
      id: crypto.randomUUID(),
      endTime: null,
      unpaidBreakMinutes: 0,
      isActive: "true"
    };
    
    employees.push(newEmployee);
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    return newEmployee;
  }

  updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    const employees = this.getEmployees();
    const index = employees.findIndex(emp => emp.id === id);
    
    if (index === -1) return null;
    
    employees[index] = { ...employees[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    return employees[index];
  }

  deleteEmployee(id: string): boolean {
    const employees = this.getEmployees();
    const filteredEmployees = employees.filter(emp => emp.id !== id);
    
    if (filteredEmployees.length === employees.length) return false;
    
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(filteredEmployees));
    return true;
  }

  // Revenue Center methods
  getRevenueCenters(): RevenueCenter[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REVENUE_CENTERS);
      const centers = data ? JSON.parse(data) : [];
      
      // Initialize default centers if none exist
      if (centers.length === 0) {
        return this.initializeDefaultRevenueCenters();
      }
      
      return centers;
    } catch {
      return this.initializeDefaultRevenueCenters();
    }
  }

  getRevenueCenter(name: string): RevenueCenter | null {
    return this.getRevenueCenters().find(center => center.name === name) || null;
  }

  createRevenueCenter(center: Omit<RevenueCenter, 'id'>): RevenueCenter {
    const centers = this.getRevenueCenters();
    const newCenter: RevenueCenter = {
      ...center,
      id: crypto.randomUUID()
    };
    
    centers.push(newCenter);
    localStorage.setItem(STORAGE_KEYS.REVENUE_CENTERS, JSON.stringify(centers));
    return newCenter;
  }

  updateRevenueCenter(name: string, updates: Partial<RevenueCenter>): RevenueCenter | null {
    const centers = this.getRevenueCenters();
    const index = centers.findIndex(center => center.name === name);
    
    if (index === -1) return null;
    
    centers[index] = { ...centers[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.REVENUE_CENTERS, JSON.stringify(centers));
    return centers[index];
  }

  private initializeDefaultRevenueCenters(): RevenueCenter[] {
    const defaultCenters: RevenueCenter[] = [
      { id: crypto.randomUUID(), name: "dining", sales: 0, divisor: 185 },
      { id: crypto.randomUUID(), name: "lounge", sales: 0, divisor: 230 },
      { id: crypto.randomUUID(), name: "patio", sales: 0, divisor: 208 }
    ];
    
    localStorage.setItem(STORAGE_KEYS.REVENUE_CENTERS, JSON.stringify(defaultCenters));
    return defaultCenters;
  }

  // Utility methods
  clearAllEmployees(): void {
    localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
  }

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
    localStorage.removeItem(STORAGE_KEYS.REVENUE_CENTERS);
  }

  exportData(): string {
    const data = {
      employees: this.getEmployees(),
      revenueCenters: this.getRevenueCenters()
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.employees) {
        localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(data.employees));
      }
      if (data.revenueCenters) {
        localStorage.setItem(STORAGE_KEYS.REVENUE_CENTERS, JSON.stringify(data.revenueCenters));
      }
      return true;
    } catch {
      return false;
    }
  }
}

export const storage = new LocalStorage();