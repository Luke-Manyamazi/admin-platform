import { type DocumentType, type FactoryStatus } from './enums';

// ─── Factory Document ──────────────────────────────────────────────────────────

export interface FactoryDocument {
  readonly id: string;
  readonly factoryId: string;
  readonly type: DocumentType;
  readonly fileUrl: string;
  readonly fileName: string;
  /** File size in bytes */
  readonly fileSize: number;
  readonly verified: boolean;
  readonly verifiedAt: Date | null;
  /** Optional expiry — e.g. ISO certificates expire annually */
  readonly expiresAt: Date | null;
  readonly uploadedAt: Date;
}

export interface FactoryDocumentResponse {
  readonly id: string;
  readonly factoryId: string;
  readonly type: DocumentType;
  readonly fileUrl: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly verified: boolean;
  readonly verifiedAt: string | null;
  readonly expiresAt: string | null;
  readonly uploadedAt: string;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Core factory domain entity.
 * minimumOrderValue is stored in CENTS (ZAR integers). Never use floats.
 * trustScore is 0–100, updated by the Cassava AI engine after each order.
 */
export interface Factory {
  readonly id: string;
  readonly name: string;
  readonly registrationNumber: string;
  readonly country: string;
  readonly region: string;
  readonly address: string;
  readonly phone: string;
  readonly email: string;
  readonly website: string | null;
  readonly description: string | null;
  readonly capabilities: readonly string[];
  readonly certifications: readonly string[];
  readonly capacityUnitsPerMonth: number;
  /** Minimum order value in ZAR cents (integer). Divide by 100 for display. */
  readonly minimumOrderValue: number;
  /** Trust score 0–100 calculated by Cassava AI. Higher = more reliable. */
  readonly trustScore: number;
  readonly status: FactoryStatus;
  readonly ownerId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Factory with related documents pre-loaded */
export interface FactoryWithDocuments extends Factory {
  readonly documents: readonly FactoryDocument[];
}

// ─── Response shapes ───────────────────────────────────────────────────────────

export interface FactoryResponse {
  readonly id: string;
  readonly name: string;
  readonly registrationNumber: string;
  readonly country: string;
  readonly region: string;
  readonly address: string;
  readonly phone: string;
  readonly email: string;
  readonly website: string | null;
  readonly description: string | null;
  readonly capabilities: readonly string[];
  readonly certifications: readonly string[];
  readonly capacityUnitsPerMonth: number;
  /** Raw value in ZAR cents for calculations */
  readonly minimumOrderValue: number;
  readonly trustScore: number;
  readonly status: FactoryStatus;
  readonly ownerId: string;
  readonly documents?: readonly FactoryDocumentResponse[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ─── Request DTOs ──────────────────────────────────────────────────────────────

/** POST /api/v1/factories */
export interface CreateFactoryDto {
  readonly name: string;
  readonly registrationNumber: string;
  readonly country: string;
  readonly region: string;
  readonly address: string;
  readonly phone: string;
  readonly email: string;
  readonly website?: string;
  readonly description?: string;
  readonly capabilities: readonly string[];
  readonly certifications?: readonly string[];
  readonly capacityUnitsPerMonth: number;
  /** Minimum order value in ZAR cents */
  readonly minimumOrderValue: number;
}

/** PATCH /api/v1/factories/:id */
export interface UpdateFactoryDto {
  readonly name?: string;
  readonly address?: string;
  readonly phone?: string;
  readonly email?: string;
  readonly website?: string | null;
  readonly description?: string | null;
  readonly capabilities?: readonly string[];
  readonly certifications?: readonly string[];
  readonly capacityUnitsPerMonth?: number;
  /** Minimum order value in ZAR cents */
  readonly minimumOrderValue?: number;
}

// ─── Verification ──────────────────────────────────────────────────────────────

/** POST /api/v1/admin/factories/:id/verify (Camluk ops only) */
export interface VerifyFactoryDto {
  readonly approved: boolean;
  readonly rejectionReason?: string;
}

// ─── List filters ──────────────────────────────────────────────────────────────

export interface FactoryListFilters {
  readonly country?: string;
  readonly region?: string;
  readonly status?: FactoryStatus;
  readonly capabilities?: readonly string[];
  /** Minimum trust score (0–100) */
  readonly minTrustScore?: number;
  readonly minCapacity?: number;
}
