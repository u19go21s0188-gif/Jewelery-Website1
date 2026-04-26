import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type AdminAuthInput = { email: string; password: string; code: string };

/**
 * Admin authentication function that verifies the admin code
 * and creates/authenticates the admin user.
 * Admin Code: DYqzWhvC7WAVQvU
 */
export const adminAuth = createServerFn({ method: "POST" })
  .inputValidator((input: AdminAuthInput) => {
    if (!input || typeof input !== "object") throw new Error("Invalid input");
    const email = String(input.email ?? "").trim();
    const password = String(input.password ?? "");
    const code = String(input.code ?? "");
    if (!email.includes("@")) throw new Error("Invalid email");
    if (password.length < 6) throw new Error("Password must be at least 6 characters");
    if (!code) throw new Error("Admin code is required");
    return { email, password, code };
  })
  .handler(async ({ data }) => {
    // Get environment variables
    const expected = process.env.ADMIN_SIGNUP_CODE;
    
    if (!expected) {
      return { error: "Admin authentication is not configured. Contact the site owner." };
    }
    if (data.code !== expected) {
      return { error: "Invalid admin code." };
    }

    try {
      // Create the user (auto-confirmed so they can sign in immediately).
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
      });

      if (createErr || !created.user) {
        return { error: createErr?.message ?? "Could not create account." };
      }
      // Grant the admin role - use upsert for faster operation
      const { error: roleErr } = await supabaseAdmin
        .from("user_roles")
        .upsert(
          { user_id: created.user.id, role: "admin" },
          { onConflict: "user_id,role" }
        );

      if (roleErr) {
        // Roll back the user so we don't leave an orphan account.
        await supabaseAdmin.auth.admin.deleteUser(created.user.id).catch(() => {});
        return { error: "Could not assign admin role. Please try again." };
      }

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "An unexpected error occurred." };
    }
  });
