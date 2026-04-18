import { z } from "zod";

export const UserRoleSchema = z.enum(["STUDENT", "FACULTY", "ADMIN"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const DoctorTypeSchema = z.enum(["GENERAL", "SPECIALIST"]);
export type DoctorType = z.infer<typeof DoctorTypeSchema>;

export const SlotStatusSchema = z.enum(["AVAILABLE", "LOCKED", "BOOKED", "CANCELLED"]);
export type SlotStatus = z.infer<typeof SlotStatusSchema>;

export const BookingStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
]);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

export const OrderStatusSchema = z.enum([
  "PENDING",
  "SAMPLE_COLLECTED",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const RecordTypeSchema = z.enum([
  "PRESCRIPTION",
  "REPORT",
  "DISCHARGE_SUMMARY",
  "VACCINATION",
]);
export type RecordType = z.infer<typeof RecordTypeSchema>;

export const ApiPaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const AuthVerifyTokenPayloadSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  avatar: z.string().url().optional().nullable(),
});

export const AuthProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: UserRoleSchema,
  avatar_url: z.string().nullable().optional(),
});
export type AuthProfile = z.infer<typeof AuthProfileSchema>;

export const DoctorSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  specialty: z.string(),
  type: DoctorTypeSchema,
  fees: z.number(),
  image_url: z.string().nullable().optional(),
  is_active: z.boolean(),
});
export type Doctor = z.infer<typeof DoctorSchema>;

export const LabTestSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.string().nullable().optional(),
  price: z.number(),
  is_profile: z.boolean(),
  turnaround_hrs: z.number(),
});
export type LabTest = z.infer<typeof LabTestSchema>;

export const ApiErrorSchema = z.object({
  detail: z.string(),
});
