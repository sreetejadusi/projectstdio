import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors/AppError";

export class OrganizationService {
  private readonly db = getSupabaseServerClient();

  async listForUser(userId: string) {
    const { data: memberships, error: membershipError } = await this.db
      .from("user_organizations")
      .select("organization_id")
      .eq("user_id", userId);

    if (membershipError) {
      throw new AppError("Failed to fetch organizations", 500, "ORGANIZATION_FETCH_FAILED", {
        postgresCode: membershipError.code,
      });
    }

    if (memberships.length === 0) {
      return [];
    }

    const organizationIds = memberships.map((row) => row.organization_id);

    const { data: organizations, error: organizationError } = await this.db
      .from("organizations")
      .select("id, name, created_at")
      .in("id", organizationIds);

    if (organizationError) {
      throw new AppError("Failed to fetch organizations", 500, "ORGANIZATION_FETCH_FAILED", {
        postgresCode: organizationError.code,
      });
    }

    return organizations;
  }
}

export const organizationService = new OrganizationService();
