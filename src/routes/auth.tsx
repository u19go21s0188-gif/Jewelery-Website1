import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { user, signIn, signUpAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } =
        mode === "signin"
          ? await signIn(email, password)
          : await signUpAdmin(email, password, code);
      setSubmitting(false);
      if (error) {
        console.error("Auth error:", error);
        toast.error(error);
      } else if (mode === "signup") {
        toast.success("Admin account created. You're signed in.");
      } else {
        toast.success("Welcome back.");
      }
    } catch (err) {
      setSubmitting(false);
      const message = err instanceof Error ? err.message : "An error occurred";
      console.error("Auth exception:", err);
      toast.error(message);
    }
  };

  return (
    <div className="storefront flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center font-serif text-2xl">
          <span className="text-ivory">Maison </span>
          <span className="gold-text">Émeraude</span>
        </Link>

        <div className="mt-10 rounded-sm border border-ivory/10 bg-ivory/5 p-8 backdrop-blur">
          <h1 className="font-serif text-2xl text-ivory">
            {mode === "signin" ? "Admin sign in" : "Create admin account"}
          </h1>
          <p className="mt-1 text-sm text-ivory/60">
            {mode === "signin"
              ? "Access the admin dashboard."
              : "Requires the admin invitation code."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-ivory/70">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-sm border border-ivory/20 bg-transparent px-3 py-2 text-ivory outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-ivory/70">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-sm border border-ivory/20 bg-transparent px-3 py-2 text-ivory outline-none focus:border-gold"
              />
            </div>

            {mode === "signup" && (
              <div>
                <label className="text-xs uppercase tracking-widest text-ivory/70">
                  Admin code
                </label>
                <input
                  type="password"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Provided by the site owner"
                  className="mt-2 w-full rounded-sm border border-ivory/20 bg-transparent px-3 py-2 text-ivory outline-none focus:border-gold"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-sm bg-gold py-3 text-xs uppercase tracking-widest text-charcoal transition hover:bg-gold-soft disabled:opacity-50"
            >
              {submitting
                ? "Please wait..."
                : mode === "signin"
                  ? "Sign in"
                  : "Create admin account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-6 w-full text-center text-xs uppercase tracking-widest text-ivory/60 hover:text-gold"
          >
            {mode === "signin"
              ? "Have an admin code? Create account"
              : "Already have an account? Sign in"}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-ivory/40">
          This area is restricted to administrators. Customers do not need an account
          to order — orders are placed directly via WhatsApp.
        </p>
      </div>
    </div>
  );
}
