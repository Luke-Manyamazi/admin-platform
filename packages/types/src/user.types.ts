import { type Role } from './enums';

// ─── Domain entity ─────────────────────────────────────────────────────────────

/**
 * Core user domain entity.
 * passwordHash is intentionally excluded — use UserWithPassword internally
 * within the auth service only. Never serialise a UserWithPassword to a response.
 */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly role: Role;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string | null;
  readonly country: string | null;
  readonly isVerified: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Internal auth-service type only.
 * Contains the password hash — NEVER expose this to API consumers.
 * This type should never appear in api-gateway or frontend code.
 */
export interface UserWithPassword extends User {
  readonly passwordHash: string;
}

// ─── Response shapes ───────────────────────────────────────────────────────────

/**
 * User as returned to authenticated API clients.
 * Dates are ISO8601 strings for JSON serialisation.
 * fullName is a computed field (firstName + ' ' + lastName).
 */
export interface UserResponse {
  readonly id: string;
  readonly email: string;
  readonly role: Role;
  readonly firstName: string;
  readonly lastName: string;
  readonly fullName: string;
  readonly phone: string | null;
  readonly country: string | null;
  readonly isVerified: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ─── Request DTOs ──────────────────────────────────────────────────────────────

/** POST /api/v1/auth/register */
export interface RegisterDto {
  readonly email: string;
  readonly password: string;
  readonly role: Role;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone?: string;
  readonly country?: string;
}

/** POST /api/v1/auth/login */
export interface LoginDto {
  readonly email: string;
  readonly password: string;
}

/** PATCH /api/v1/users/:id */
export interface UpdateUserDto {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly phone?: string | null;
  readonly country?: string | null;
}

/** PATCH /api/v1/users/:id/change-password */
export interface ChangePasswordDto {
  readonly currentPassword: string;
  readonly newPassword: string;
}

// ─── Auth responses ────────────────────────────────────────────────────────────

/** Response for POST /api/v1/auth/login and /api/v1/auth/register */
export interface AuthResponse {
  readonly user: UserResponse;
  readonly accessToken: string;
  /** Seconds until the access token expires */
  readonly expiresIn: number;
}

// ─── JWT payload ───────────────────────────────────────────────────────────────

/**
 * Shape of the decoded JWT payload.
 * Kept minimal — only what's needed for auth guards without a DB lookup.
 */
export interface JwtPayload {
  readonly sub: string; // userId
  readonly email: string;
  readonly role: Role;
  readonly iat: number;
  readonly exp: number;
}
