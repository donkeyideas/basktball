import Link from "next/link";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export default async function AccountAddressesPage() {
  const session = await getServerSession(authOptions as any);

  if (!session || !session.user) {
    return (
      <main className="min-h-screen bg-black text-white">
        <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Your addresses
          </h1>
          <p className="mt-3 text-sm text-neutral-400">
            Please sign in to manage your saved addresses.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-white px-5 py-2 text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-black hover:bg-neutral-200"
          >
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  const userId = (session.user as any).id as string | undefined;

  if (!userId) {
    return (
      <main className="min-h-screen bg-black text-white">
        <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Your addresses
          </h1>
          <p className="mt-3 text-sm text-neutral-400">
            We could not determine your account. Please sign out and sign back
            in.
          </p>
        </section>
      </main>
    );
  }

  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-neutral-900 bg-black/90 px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            Your addresses
          </h1>
          <Link
            href="/account/orders"
            className="text-xs uppercase tracking-[0.18em] text-neutral-400 hover:text-white"
          >
            Back to orders
          </Link>
        </div>
      </div>

      <section className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
        {/* Existing addresses */}
        <div className="space-y-3">
          {addresses.length === 0 && (
            <p className="text-sm text-neutral-400">
              You do not have any saved addresses yet.
            </p>
          )}
          {addresses.map((address) => (
            <div
              key={address.id}
              className="space-y-1 rounded-md border border-neutral-900 bg-neutral-950 p-4 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-white">
                  {address.label || "Address"}
                  {address.isDefault && (
                    <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                      Default
                    </span>
                  )}
                </p>
              </div>
              <p className="text-neutral-200">{address.name}</p>
              <p className="text-neutral-300">{address.street}</p>
              <p className="text-neutral-300">
                {address.city}, {address.state} {address.zipCode}
              </p>
              <p className="text-neutral-300">{address.country}</p>
              <p className="mt-1 text-neutral-400">{address.phone}</p>
            </div>
          ))}
        </div>

        {/* Simple add form (posts to /api/account/addresses) */}
        <div className="space-y-4 rounded-md border border-neutral-900 bg-neutral-950 p-4 text-xs">
          <h2 className="text-sm font-semibold tracking-tight">
            Add new address
          </h2>
          <form
            method="post"
            action="/api/account/addresses"
            className="space-y-3"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Label
                </label>
                <input
                  type="text"
                  name="label"
                  className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
                  placeholder="Home, Work, etc."
                />
              </div>
              <div>
                <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Full name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Street
              </label>
              <input
                type="text"
                name="street"
                required
                className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  required
                  className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  ZIP
                </label>
                <input
                  type="text"
                  name="zipCode"
                  required
                  className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  required
                  className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  required
                  className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                name="isDefault"
                className="h-3.5 w-3.5 rounded border-neutral-700 bg-black text-emerald-500"
              />
              <label
                htmlFor="isDefault"
                className="text-[0.75rem] text-neutral-300"
              >
                Set as default shipping address
              </label>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-black hover:bg-neutral-200"
              >
                Save address
              </button>
            </div>
          </form>
          <p className="text-[0.7rem] text-neutral-500">
            This form submits to the address API. Validation and advanced
            features like address verification will be added alongside
            SmartyStreets.
          </p>
        </div>
      </section>
    </main>
  );
}


