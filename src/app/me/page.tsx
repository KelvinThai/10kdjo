import { auth, signOut } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-semibold">My dashboard</h1>
      <p className="mt-2 text-neutral-600">
        Signed in as {session?.user?.email}
        {session?.user?.role === "admin" && (
          <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            admin
          </span>
        )}
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Enrolled courses</h2>
        <p className="mt-2 text-sm text-neutral-500">
          No courses yet — catalog coming in week 2.
        </p>
      </section>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
        className="mt-12"
      >
        <button
          type="submit"
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
