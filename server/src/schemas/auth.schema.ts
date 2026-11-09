import { z } from 'zod';
import { District, Month, SellerType, BuyerType, OperationalStatus, DeliveryOption, EnvClearanceStatus } from '@prisma/client';

const INDIAN_MOBILE = /^[6-9]\d{9}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const registerStep1Schema = z.object({
  role: z.enum(['SELLER', 'BUYER']),
});

export const baseUserSchema = z.object({
  role: z.enum(['SELLER', 'BUYER']),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  mobile: z.string().regex(INDIAN_MOBILE, 'Enter a valid 10-digit Indian mobile number'),
  password: z
    .string()
    .regex(PASSWORD_REGEX, 'Password must be 8+ chars with uppercase, lowercase, number and special char'),
  confirmPassword: z.string(),
  district: z.nativeEnum(District),
  termsAccepted: z.literal(true, { message: 'You must accept the terms' }),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const sellerExtraSchema = z.object({
  sellerType: z.nativeEnum(SellerType),
  organisationName: z.string().optional(),
  designation: z.string().optional(),
  locationArea: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  operationalStatus: z.nativeEnum(OperationalStatus).default('OPERATIONAL'),
  operatingMonths: z.array(z.nativeEnum(Month)).optional(),
});

export const buyerExtraSchema = z.object({
  buyerType: z.nativeEnum(BuyerType),
  companyName: z.string().min(2, 'Company name required'),
  ownerOrOperator: z.string().optional(),
  locationArea: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  installedCapacityTPD: z.number().positive().optional(),
  feedstockTypesAccepted: z.array(z.string()).optional(),
  maxMoisturePct: z.number().min(0).max(100).optional(),
  maxAshPct: z.number().min(0).max(100).optional(),
  gridConnectivity: z.boolean().default(false),
  envClearanceStatus: z.nativeEnum(EnvClearanceStatus).default('PENDING'),
  deliveryRequired: z.boolean().default(false),
});

export const registerSellerSchema = baseUserSchema.and(sellerExtraSchema);
export const registerBuyerSchema = baseUserSchema.and(buyerExtraSchema);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .regex(PASSWORD_REGEX, 'Password must be 8+ chars with uppercase, lowercase, number and special char'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
