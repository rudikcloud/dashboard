"use client";

import Link from "next/link";

export default function FlagsPage() {
  return (
    <main className="page">
      <h1>Feature Flags</h1>
      <p>Flags management UI is being initialized.</p>
      <p>
        <Link href="/orders">Go to Orders</Link>
      </p>
      <p>
        <Link href="/">Back to Home</Link>
      </p>
    </main>
  );
}
