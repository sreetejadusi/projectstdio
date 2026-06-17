import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#E7F5EA] font-sans text-[#00240E] overflow-x-hidden relative flex flex-col">
      <header className="flex items-center justify-between py-6 px-8 md:px-16 lg:px-24 z-20 relative bg-[#CFEED6]">
        <div className="flex space-x-8 text-sm font-semibold">
          <a href="#" className="hover:text-black transition">
            Problems
          </a>
          <a href="#" className="hover:text-black transition">
            Courses
          </a>
        </div>
        <div className="flex items-center justify-center">
          <Image
            src="/logo.svg"
            alt="frogmatrix logo"
            width={150}
            height={30}
            className="w-auto h-7"
          />
        </div>
        <div className="flex space-x-6 items-center text-sm font-semibold">
          <a href="#" className="hover:text-black transition">
            Login
          </a>
          <a
            href="#"
            className="bg-[#00240E] text-white px-6 py-2 rounded-full hover:bg-black transition"
          >
            Sign Up
          </a>
        </div>
      </header>

      <main className="flex-1 z-10 flex flex-col">
        <section className="relative w-full h-full bg-[#CFEED6]">
          <Image
            src="/vector-home-one.svg"
            alt="background blob"
            width={400}
            height={388}
            className="w-96 h-auto absolute bottom-12 left-0"
          />

          <Image
            src="/vector-home-two.svg"
            alt="background blob"
            width={100}
            height={200}
            className=" w-64 h-auto absolute right-0 top-48 pointer-events-none"
          />

          {/* HERO SECTION */}
          <div className="px-8 md:px-16 lg:px-24 pt-24 pb-20 relative z-10 w-full max-w-11/12 mx-auto h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start relative z-10 w-full">
              <div className="flex flex-col w-full md:w-1/2">
                <h1 className="text-[4rem] lg:text-[5rem] font-medium tracking-tight relative leading-[1.1] text-[#00240E] flex flex-col gap-2">
                  <div className="absolute -top-8 -left-18 w-16 h-16">
                    <Image
                      src="/vector-home-four.svg"
                      alt="sparkles"
                      layout="fill"
                    />
                  </div>
                  Learn to code
                  <br />
                  <div className="mt-4 inline-block">
                    <span className="bg-[#00240E] text-white px-10 py-3 rounded-[3rem] pb-4 inline-block shadow-lg">
                      visually
                    </span>
                  </div>
                </h1>
              </div>
              <div className="w-full md:w-1/2 flex flex-col justify-start items-end text-right pt-6">
                <p className="max-w-sm text-sm leading-relaxed text-[#00240E]/80 font-medium text-justify">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. In a
                  bibendum ligula. Vestibulum lacus est, tincidunt a elementum
                  eu, hendrerit ut velit.
                </p>
                <button className="mt-8 border border-[#00240E]/50 text-[#00240E] rounded-full px-6 py-2.5 flex items-center space-x-2 text-sm font-semibold hover:bg-[#00240E] hover:text-white transition">
                  <span>Courses</span>
                  <span className="text-lg leading-none font-light">
                    &#8599;
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="px-8 md:px-16 lg:px-24 pb-24 pt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10 max-w-7xl mx-auto w-full">
          {[
            {
              title: "Visual Flowcharts",
              desc: "flowcharts that make your approach time tested",
            },
            {
              title: "Runtime Visualisation",
              desc: "step by step visualization of code",
            },
            {
              title: "Skill Enhancing Courses",
              desc: "visual courses that enhance your skill",
            },
            {
              title: "Runtime Visualisation",
              desc: "step by step visualization of code",
            },
          ].map((feat, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-24 h-24 bg-[#75C895] rounded-full mb-8 relative overflow-hidden flex items-center justify-center">
                <div className="w-16 h-16 bg-[#8DE2A6] rounded-full absolute -top-3 -left-3 opacity-60 blur-[3px]"></div>
                <div className="w-12 h-12 bg-[#8DE2A6] rounded-full absolute bottom-2 right-2 opacity-50 blur-[3px]"></div>
              </div>
              <h3 className="font-bold text-[#00240E] mb-2 text-[15px]">
                {feat.title}
              </h3>
              <p className="text-[11px] text-[#00240E]/70 max-w-37.5 leading-relaxed font-semibold">
                {feat.desc}
              </p>
            </div>
          ))}
        </section>

        {/* MIDDLE DARK SECTION */}
        <section className="bg-[#194C2B] w-full py-24 px-8 md:px-16 lg:px-24 flex flex-col md:flex-row items-center justify-center text-white relative z-10 overflow-hidden">
          <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
            <div className="w-full md:w-1/2 flex justify-center mb-16 md:mb-0 relative">
              <div className="relative w-full max-w-112.5">
                <Image
                  src="/vector-home-three.svg"
                  alt="Abstract Code Visualizer"
                  width={552}
                  height={579}
                  className="w-full h-auto drop-shadow-2xl"
                />
              </div>
            </div>
            <div className="w-full md:w-1/2 md:pl-16 lg:pl-24 flex flex-col items-start">
              <h2 className="text-4xl lg:text-5xl font-light text-[#E7F5EA]">
                lesser theory,
                <br />
                more of{" "}
                <span className="border border-white rounded-3xl px-5 py-4 inline-block text-white tracking-wide shadow-[-4px_4px_0px_0px_#ffffff] ml-2 mt-4">
                  knowledge
                </span>
              </h2>
              <p className="text-[13px] mt-10 text-white/70 max-w-112.5 leading-loose font-medium text-justify">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. In a
                bibendum ligula. Vestibulum lacus est, tincidunt a elementum eu,
                hendrerit ut velit. Lorem ipsum dolor sit amet, consectetur
                adipiscing elit. In a bibendum ligula.
              </p>
            </div>
          </div>
        </section>

        {/* POPULAR COURSES SECTION */}
        <section className="py-28 px-8 md:px-16 lg:px-24 flex flex-col items-center relative z-10 w-full max-w-7xl mx-auto">
          {/* Decorative side blobs matching design */}
          <div className="absolute top-[30%] left-[-5%] z-0 w-50 pointer-events-none">
            <Image
              src="/vector-home-two.svg"
              alt="background blob"
              width={221}
              height={265}
              className="w-full h-auto opacity-60 rotate-90"
            />
          </div>

          <h2 className="text-4xl lg:text-[2.5rem] font-medium relative mb-20 inline-block text-[#00240E]">
            <div className="absolute -top-12 -left-16 w-14 h-14">
              <Image src="/vector-home-four.svg" alt="sparkles" layout="fill" />
            </div>
            Popular
            <span className="relative ml-2">
              Courses
              <Image
                src="/vector-underline.svg"
                alt="underline"
                width={160}
                height={20}
                className="absolute -bottom-5 left-0 w-full h-auto"
              />
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl relative z-10">
            {[
              {
                img: "/oop_course.png",
                title: "Introduction to Object Oriented Programming",
              },
              {
                img: "/python_course.png",
                title: "Advanced Python Programming",
              },
              {
                img: "/java_course.png",
                title: "Introduction to Java Programming",
              },
            ].map((course, i) => (
              <div
                key={i}
                className="border-[1.5px] border-[#00240E] rounded-4xl overflow-hidden bg-[#F4FBF6] flex flex-col hover:shadow-xl transition duration-300 transform hover:-translate-y-2"
              >
                <div className="h-64 w-full relative border-b-[1.5px] border-[#00240E]">
                  <Image
                    src={course.img}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <div className="text-[9px] uppercase border border-[#00240E]/30 text-[#00240E] rounded-full px-3 py-1 inline-block self-start mb-5 font-bold tracking-widest bg-white">
                    Explore
                  </div>
                  <h3 className="font-bold text-[#00240E] mb-4 text-[17px] leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-[11px] text-[#00240E]/60 mb-8 leading-relaxed flex-1 font-semibold">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. In
                    a bibendum ligula. Vestibulum lacus est, tincidunt a
                    elementum eu, hendrerit ut velit.
                  </p>
                  <button className="bg-[#123C24] text-white w-full rounded-full py-4 text-xs font-semibold hover:bg-black transition shadow-md">
                    View Course
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER SECTION */}
        <section className="pt-24 flex flex-col items-center relative text-center z-10 w-full overflow-hidden">
          {/* Footer background blobs */}
          <div className="absolute left-[-5%] bottom-20 z-0 w-62.5 pointer-events-none">
            <Image
              src="/vector-home-one.svg"
              alt="background blob"
              width={400}
              height={388}
              className="w-full h-auto opacity-70"
            />
          </div>
          <div className="absolute right-[-10%] top-40 z-0 w-75 pointer-events-none">
            <Image
              src="/vector-home-two.svg"
              alt="background blob"
              width={221}
              height={265}
              className="w-full h-auto opacity-50 -rotate-12"
            />
          </div>

          <h2 className="text-4xl lg:text-5xl font-medium mb-32 relative z-10 text-[#00240E]">
            <div className="absolute -top-2 -left-8 w-8 h-8">
              <Image src="/vector-home-four.svg" alt="sparkles" layout="fill" />
            </div>
            start
            <span className="font-light relative ml-2">
              Coding
              <Image
                src="/vector-underline.svg"
                alt="underline"
                width={140}
                height={20}
                className="absolute -bottom-8 left-0 w-full h-auto"
              />
            </span>{" "}
            your future!
          </h2>

          <div className="w-full max-w-280 bg-[#CFEED6] rounded-t-[3rem] pt-16 px-12 md:px-24 pb-12 text-[#00240E] relative z-10">
            <div className="flex justify-between items-start mb-20">
              <div className="flex items-center space-x-2">
                <Image
                  src="/logo.svg"
                  alt="frogmatrix logo"
                  width={100}
                  height={24}
                  className="w-auto h-7"
                />
              </div>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="w-10 h-10 rounded-xl border border-[#00240E]/20 flex items-center justify-center hover:bg-[#00240E] hover:border-transparent group transition bg-[#E7F5EA]"
                >
                  <Image
                    src="/youtube-icon.svg"
                    alt="YouTube"
                    width={18}
                    height={18}
                    className="opacity-80 group-hover:opacity-100 group-hover:invert transition"
                  />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-xl border border-[#00240E]/20 flex items-center justify-center hover:bg-[#00240E] hover:border-transparent group transition bg-[#E7F5EA]"
                >
                  <Image
                    src="/youtube-instagram.svg"
                    alt="Instagram"
                    width={18}
                    height={18}
                    className="opacity-80 group-hover:opacity-100 group-hover:invert transition"
                  />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm text-left pb-16 border-b border-[#00240E]/10">
              <div>
                <h4 className="font-bold text-[#00240E] mb-6 text-[13px]">
                  Company
                </h4>
                <ul className="space-y-4 font-semibold text-[11px]">
                  <li>
                    <a href="#" className="hover:text-[#00240E]/60 transition">
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#00240E]/60 transition">
                      About Us
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#00240E]/60 transition">
                      Vision & Mission
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#00240E]/60 transition">
                      For Investors
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-[#00240E] mb-6 text-[13px]">
                  Product
                </h4>
                <ul className="space-y-4 font-semibold text-[11px]">
                  <li>
                    <a href="#" className="hover:text-[#00240E]/60 transition">
                      Courses
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#00240E]/60 transition">
                      Subscriptions
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#00240E]/60 transition">
                      For Students
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#00240E]/60 transition">
                      For Institutions
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#00240E]/60 transition">
                      For Enterprises
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-[#00240E] mb-6 text-[13px]">
                  Legal
                </h4>
                <ul className="space-y-4 font-semibold text-[11px]">
                  <li>
                    <a href="#" className="hover:text-[#00240E]/60 transition">
                      Terms & Conditions
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#00240E]/60 transition">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#00240E]/60 transition">
                      Data Policy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#00240E]/60 transition">
                      Cancellation Policy
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-[#00240E] mb-6 text-[13px]">
                  Resources
                </h4>
                <ul className="space-y-4 font-semibold text-[11px]">
                  <li>
                    <a href="#" className="hover:text-[#00240E]/60 transition">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#00240E]/60 transition">
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#00240E]/60 transition">
                      Careers
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 text-left text-[11px] font-semibold opacity-60">
              © frogmatrix Technologies. All rights reserved!
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
