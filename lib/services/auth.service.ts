import bcrypt from "bcryptjs";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors/AppError";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendConfirmationInput,
  ResetPasswordInput,
} from "@/lib/validators/auth.validator";

export type AuthenticatedUser = {
  userId: string;
  role: "student" | "instructor" | "admin";
  organizationId?: string;
  sessionId: string;
  email: string;
};

export class AuthService {
  private readonly db = getSupabaseServerClient();

  async register(input: RegisterInput) {
    const passwordHash = await bcrypt.hash(input.password, 12);
    let createdUserId: string | null = null;

    try {
      const { data: createdUser, error: createUserError } = await this.db
        .from("users")
        .insert({
          email: input.email,
          password_hash: passwordHash,
          full_name: input.fullName,
          role: input.role,
          email_verified: true,
        })
        .select("id, role, email")
        .single();

      if (createUserError || !createdUser) {
        if (createUserError?.code === "23505") {
          throw new AppError("Email already exists", 409, "EMAIL_ALREADY_EXISTS");
        }
        throw new AppError("Registration failed", 500, "REGISTRATION_FAILED", {
          postgresCode: createUserError?.code,
        });
      }

      createdUserId = createdUser.id;
      const domain = input.email.split("@")[1]?.toLowerCase();

      let organizationId: string | undefined;
      if (domain) {
        const { data: orgDomain, error: orgDomainError } = await this.db
          .from("organization_domains")
          .select("organization_id")
          .eq("domain", domain)
          .maybeSingle();

        if (orgDomainError) {
          throw new AppError("Registration failed", 500, "REGISTRATION_FAILED", {
            postgresCode: orgDomainError.code,
          });
        }

        if (orgDomain?.organization_id) {
          organizationId = orgDomain.organization_id;
          const { error: mapError } = await this.db.from("user_organizations").insert({
            user_id: createdUser.id,
            organization_id: organizationId,
          });

          if (mapError && mapError.code !== "23505") {
            throw new AppError("Registration failed", 500, "REGISTRATION_FAILED", {
              postgresCode: mapError.code,
            });
          }
        }
      }

      return {
        userId: createdUser.id,
        role: createdUser.role,
        organizationId,
        email: createdUser.email,
      };
    } catch (error) {
      if (createdUserId) {
        await this.db.from("user_organizations").delete().eq("user_id", createdUserId);
        await this.db.from("users").delete().eq("id", createdUserId);
      }
      throw error;
    }
  }

  async login(input: LoginInput, metadata: { ipAddress?: string; userAgent?: string }) {
    const { data: user, error } = await this.db
      .from("users")
      .select("id, role, password_hash, email, email_verified")
      .eq("email", input.email)
      .maybeSingle();

    if (error) {
      throw new AppError("Login failed", 500, "LOGIN_FAILED", {
        postgresCode: error.code,
      });
    }

    if (!user) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const valid = await bcrypt.compare(input.password, user.password_hash);
    if (!valid) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    return this.createSessionForUser(user.id, user.role, user.email, metadata);
  }

  async resendConfirmation(input: ResendConfirmationInput) {
    const { data: user, error } = await this.db
      .from("users")
      .select("id, email_verified, email")
      .eq("email", input.email)
      .maybeSingle();

    if (error) {
      throw new AppError("Failed to process request", 500, "RESEND_CONFIRMATION_FAILED", {
        postgresCode: error.code,
      });
    }

    if (!user || user.email_verified) {
      return { sent: false, email: input.email };
    }

    return { sent: true, email: user.email, userId: user.id };
  }

  async markEmailVerified(userId: string) {
    const { data: user, error } = await this.db
      .from("users")
      .update({ email_verified: true })
      .eq("id", userId)
      .select("id, role, email")
      .single();

    if (error || !user) {
      throw new AppError("Failed to verify email", 500, "EMAIL_VERIFICATION_FAILED", {
        postgresCode: error?.code,
      });
    }

    return user;
  }

  async forgotPassword(input: ForgotPasswordInput) {
    const { data: user, error } = await this.db
      .from("users")
      .select("id, email")
      .eq("email", input.email)
      .maybeSingle();

    if (error) {
      throw new AppError("Failed to process request", 500, "FORGOT_PASSWORD_FAILED", {
        postgresCode: error.code,
      });
    }

    if (!user) {
      return { sent: false, email: input.email };
    }

    return { sent: true, email: user.email, userId: user.id };
  }

  async resetPassword(input: ResetPasswordInput, userId: string) {
    const passwordHash = await bcrypt.hash(input.password, 12);

    const { error } = await this.db
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("id", userId);

    if (error) {
      throw new AppError("Failed to reset password", 500, "RESET_PASSWORD_FAILED", {
        postgresCode: error.code,
      });
    }

    return { updated: true };
  }

  async createSessionForUser(
    userId: string,
    role: "student" | "instructor" | "admin",
    email: string,
    metadata: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthenticatedUser> {
    const { data: membership, error: membershipError } = await this.db
      .from("user_organizations")
      .select("organization_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      throw new AppError("Session creation failed", 500, "SESSION_CREATE_FAILED", {
        postgresCode: membershipError.code,
      });
    }

    const { data: session, error: sessionError } = await this.db
      .from("user_sessions")
      .insert({
        user_id: userId,
        ip_address: metadata.ipAddress ?? null,
        user_agent: metadata.userAgent ?? null,
      })
      .select("id")
      .single();

    if (sessionError || !session) {
      throw new AppError("Failed to create session", 500, "SESSION_CREATE_FAILED", {
        postgresCode: sessionError?.code,
      });
    }

    return {
      userId,
      role,
      email,
      organizationId: membership?.organization_id ?? undefined,
      sessionId: session.id,
    };
  }

  async invalidateSession(sessionId: string) {
    const { error } = await this.db
      .from("user_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", sessionId)
      .is("ended_at", null);

    if (error) {
      throw new AppError("Failed to end session", 500, "SESSION_END_FAILED", {
        postgresCode: error.code,
      });
    }
  }
}

export const authService = new AuthService();
