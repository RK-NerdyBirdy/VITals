type SharePageProps = {
  params: { token: string };
};

export default function SharePage({ params }: SharePageProps) {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-3xl items-center px-4">
      <section className="frosted w-full rounded-3xl p-8">
        <h1 className="font-display text-4xl">Shared Medical Record</h1>
        <p className="mt-2 text-sm text-vitals-charcoal/75">
          This link is access-limited. Open the secure stream below.
        </p>
        <a
          href={`${process.env.API_URL ?? "http://localhost:8000"}/api/records/shared/${params.token}`}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex rounded-lg bg-vitals-crimson px-4 py-2 text-sm font-medium text-white"
        >
          Open Shared Record
        </a>
      </section>
    </main>
  );
}
