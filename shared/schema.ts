import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  startTime: timestamp("start_time").notNull(),
  revenueCenter: text("revenue_center").notNull(),
  isActive: text("is_active").notNull().default("true"),
});

export const revenueCenters = pgTable("revenue_centers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  sales: real("sales").notNull().default(0),
  divisor: real("divisor").notNull().default(35),
});

export const insertEmployeeSchema = createInsertSchema(employees).pick({
  name: true,
  startTime: true,
  revenueCenter: true,
}).extend({
  startTime: z.string().or(z.date()).transform((val) => new Date(val)),
});

export const insertRevenueCenterSchema = createInsertSchema(revenueCenters).pick({
  name: true,
  sales: true,
  divisor: true,
});

export const updateRevenueCenterSchema = createInsertSchema(revenueCenters).pick({
  sales: true,
  divisor: true,
}).extend({
  sales: z.coerce.number().min(0, "Sales must be positive"),
  divisor: z.coerce.number().min(0.1, "Divisor must be greater than 0"),
});

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertRevenueCenter = z.infer<typeof insertRevenueCenterSchema>;
export type UpdateRevenueCenter = z.infer<typeof updateRevenueCenterSchema>;
export type RevenueCenter = typeof revenueCenters.$inferSelect;
