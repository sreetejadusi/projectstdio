import { markdownToHtml } from "@/lib/utils/markdown";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <article
      className="rounded-[22px] border border-[color:var(--border)] bg-white/80 p-5 text-sm shadow-[0_10px_24px_rgba(105,83,55,0.04)]
        [&_h1]:mb-2 [&_h1]:text-2xl [&_h2]:mb-2 [&_h2]:text-xl [&_h3]:mb-2 [&_h3]:text-lg
        [&_p]:mb-2 [&_pre]:mb-3 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-[#fff7eb] [&_pre]:p-3
        [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_code]:font-mono [&_a]:text-[color:var(--primary-hover)]"
      dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
    />
  );
}
