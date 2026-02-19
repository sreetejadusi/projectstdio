import Image from "next/image";
import Link from "next/link";

export function TopNav() {
  return (
    <header className="border-b border-slate-400/20 bg-slate-950/75 px-6 py-4 backdrop-blur md:px-10">
      <Link href="/" className="flex w-fit items-center gap-3">
        <Image src="/logo-white.svg" alt="STDIO" width={128} height={32} className="h-8 w-auto" priority />
      </Link>
    </header>
  );
}
