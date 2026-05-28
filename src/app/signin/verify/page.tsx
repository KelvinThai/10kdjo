export default function VerifyRequestPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-sm space-y-3 rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="text-sm text-neutral-600">
          We sent you a magic link. Click it to sign in.
        </p>
      </div>
    </main>
  );
}
