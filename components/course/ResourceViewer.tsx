export function ResourceViewer({ url }: { url: string }) {
  const isEmbeddable = /^https?:\/\//.test(url);

  return (
    <section className="rounded-[22px] border border-[color:var(--border)] bg-[linear-gradient(180deg,#fffdfa,#fff7eb)] p-5 shadow-[0_12px_28px_rgba(105,83,55,0.05)]">
      <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--text-secondary)]">Resource</p>
      {isEmbeddable ? (
        <iframe
          className="mt-3 h-80 w-full rounded-[18px] border border-[color:var(--border)] bg-white"
          src={url}
          title="Course resource"
        />
      ) : (
        <a
          className="mt-3 inline-block text-sm text-[color:var(--primary-hover)]"
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          Open resource
        </a>
      )}
    </section>
  );
}
