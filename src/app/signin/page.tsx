import { signIn } from "@/auth";

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  return <SignInForm searchParams={searchParams} />;
}

async function SignInForm({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl = "/me", error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Continue to 10kdjo
          </p>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            Sign-in failed: {error}
          </p>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackUrl });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            Continue with Google
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <span className="h-px flex-1 bg-neutral-200" />
          <span>or</span>
          <span className="h-px flex-1 bg-neutral-200" />
        </div>

        <form
          action={async (formData) => {
            "use server";
            await signIn("nodemailer", {
              email: formData.get("email"),
              redirectTo: callbackUrl,
            });
          }}
          className="space-y-3"
        >
          <input
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Email me a magic link
          </button>
        </form>
      </div>
    </main>
  );
}
