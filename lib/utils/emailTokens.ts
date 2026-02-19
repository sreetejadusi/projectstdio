import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors/AppError";

type EmailTokenType = "email_verification" | "password_reset";

type EmailTokenPayload = {
  sub: string;
  email: string;
  type: EmailTokenType;
  iat: number;
  exp: number;
};

const emailSecret = new TextEncoder().encode(env.JWT_EMAIL_SECRET || env.JWT_SECRET);

async function signEmailToken(payload: {
  userId: string;
  email: string;
  type: EmailTokenType;
  expiresInSeconds: number;
}) {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    email: payload.email,
    type: payload.type,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt(now)
    .setExpirationTime(now + payload.expiresInSeconds)
    .sign(emailSecret);
}

export async function createEmailVerificationToken(userId: string, email: string) {
  return signEmailToken({
    userId,
    email,
    type: "email_verification",
    expiresInSeconds: 60 * 60 * 24,
  });
}

export async function createPasswordResetToken(userId: string, email: string) {
  return signEmailToken({
    userId,
    email,
    type: "password_reset",
    expiresInSeconds: 60 * 60 * 2,
  });
}

export async function verifyEmailToken(token: string, expectedType: EmailTokenType): Promise<EmailTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, emailSecret);
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      (payload.type !== "email_verification" && payload.type !== "password_reset")
    ) {
      throw new AppError("Invalid token", 400, "INVALID_TOKEN");
    }

    if (payload.type !== expectedType) {
      throw new AppError("Invalid token type", 400, "INVALID_TOKEN");
    }

    return {
      sub: payload.sub,
      email: payload.email,
      type: payload.type,
      iat: typeof payload.iat === "number" ? payload.iat : 0,
      exp: typeof payload.exp === "number" ? payload.exp : 0,
    };
  } catch {
    throw new AppError("Invalid or expired token", 400, "INVALID_TOKEN");
  }
}
