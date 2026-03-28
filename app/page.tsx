"use client";

import Image from "next/image";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-text-primary">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_38%,rgba(255,255,255,0.55),transparent_24%),radial-gradient(circle_at_78%_68%,rgba(255,255,255,0.4),transparent_26%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-430 flex-col px-6 pb-8 pt-8 sm:px-10 sm:pb-10 lg:px-16 lg:pb-12 lg:pt-10">
        <section className="grid flex-1 items-center gap-12 lg:grid-cols-[minmax(0,0.96fr)_minmax(520px,1.04fr)] lg:gap-4 xl:grid-cols-[minmax(0,0.94fr)_minmax(560px,1.06fr)] xl:gap-6">
          <div className="relative z-10 flex w-full max-w-190 flex-col items-start justify-center gap-8 pt-4 sm:gap-10 lg:gap-12 lg:pt-0">
            <div className="w-full max-w-105 xl:max-w-115">
              <img
                src="/logo.svg"
                alt="Frogmatrix"
                className="h-auto w-1/2 no-drag"
                draggable={false}
              />
            </div>

            <div className="w-full space-y-1 sm:space-y-3 lg:space-y-2">
              <p className="text-4xl font-medium text-text-primary">
                world&apos;s #1
              </p>
              <h1 className="w-full text-6xl font-medium leading-18">
                Visual Programming <br /> Platform
              </h1>
            </div>

            <div className="pt-2 sm:pt-4">
              <button type="button" id="home-button">
                COMING SOON!
              </button>
            </div>
          </div>

          <div className="relative mx-auto flex w-fit max-w-280 items-center justify-center lg:-ml-20 lg:max-w-none xl:-ml-12">
            <div className="absolute inset-x-[12%] top-[12%] h-[56%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.65),transparent_70%)] blur-3xl" />
            <Image
              src="/home-image.svg"
              alt="Frogmatrix visual programming interface preview"
              width={1598}
              height={1392}
              draggable={false}
              priority
              className="relative h-auto w-full max-w-245 min-w-0 lg:max-w-225 xl:max-w-none"
            />
          </div>
        </section>

        <footer className="pt-6 text-base text-text-muted sm:text-base lg:pt-2">
          &copy; Frog Matrix 2026.
        </footer>
      </div>
    </main>
  );
}
