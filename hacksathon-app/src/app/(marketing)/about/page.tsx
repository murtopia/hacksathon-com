import { Metadata } from "next";
import Link from "next/link";

/**
 * About - locked copy from site-copy-final-for-cursor.md (2026-07-07),
 * PAGE 7. The copy is final and implemented verbatim; do not reword or
 * add sections. Layout only here.
 */

export const metadata: Metadata = {
  title: "About",
  description:
    "Nick Murto, founder of Hacksathon.com, on twenty years of ideas, discovering vibe coding, and why the experience, not the tools, changes teams.",
};

const sectionHeading =
  "font-serif text-3xl font-normal tracking-tight sm:text-4xl";
const bodyStack =
  "mt-8 space-y-5 font-serif text-lg leading-relaxed text-[var(--text-secondary)]";

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b py-20 md:py-28">
        <div className="mx-auto w-full max-w-[var(--container-default)] px-4">
          <p className="mono-label mb-5">About</p>
          <h1 className="max-w-4xl font-serif text-5xl font-normal leading-[1.05] tracking-tight sm:text-6xl">
            More ideas than time.
          </h1>
          <p className="mt-8 max-w-[640px] font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
            Hi, I&apos;m Nick Murto, founder of Hacksathon.com, and
            that&apos;s been my whole life, honestly. I&apos;m a designer and
            an idea guy. I was never a programmer. Even back when I built web
            pages, it was copy and paste, never writing code of my own. But
            ideas come naturally to me. I see a problem and my brain floods
            with solutions whether I asked it to or not. I get that from my
            dad, who built his own house with his own hands. The only thing he
            hired out was the carpet.
          </p>
        </div>
      </section>

      {/* Twenty years of ideas, one bottleneck */}
      <section className="border-b py-20 bg-muted/30">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h2 className={sectionHeading}>
            Twenty years of ideas, one bottleneck
          </h2>
          <div className={bodyStack}>
            <p>
              In 2004, Tyler Lafferty and I launched Seven2, a creative
              agency. Later came a second agency, 14Four, and then Strategy
              Labs with Ramsey Pruchnik. For two decades I got to work with
              insanely talented creative people, and I never stopped bringing
              them ideas.
            </p>
            <p>
              Here&apos;s one. You know that moment at every dinner when
              someone says &ldquo;I need a new show, what have you been
              watching?&rdquo; That conversation happens at every table in
              America. So in 2019 I had an idea called Been Watching. My
              friends and I were literally running it out of a shared Apple
              Notes doc: shows we want to watch, shows we&apos;re watching, a
              one-to-three star rating when we&apos;re done. It worked, but it
              was duct tape.
            </p>
            <p>
              I brought Been Watching to my agency team, like I&apos;d done
              with ideas for years. They did beautiful branding work, some UI,
              a little development between client projects. Five years later,
              it still wasn&apos;t real. Not because they weren&apos;t
              brilliant, but because client work always comes first.
              That&apos;s the fate of most good ideas inside busy companies:
              they wait.
            </p>
          </div>
        </div>
      </section>

      {/* Then I stopped waiting */}
      <section className="border-b py-20">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h2 className={sectionHeading}>Then I stopped waiting</h2>
          <div className={bodyStack}>
            <p>
              In 2024 I went deep into AI, and in July of that year I
              discovered vibe coding. My first attempt was a little app idea
              born from doing three-minute planks at the gym. It fought me,
              and I shelved it. Then I tried building Been Watching myself,
              and hit walls there too.
            </p>
            <p>
              What changed everything was a friend. Tony Rosland, a
              photographer who was deep into vibe coding his own platform,{" "}
              <a
                href="https://studioledger.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4 hover:no-underline"
              >
                Studio Ledger
              </a>
              , took me under his wing and got me set up with real tools.
              Suddenly I was making progress I couldn&apos;t believe. I&apos;d
              build before work, run Seven2 all day, and build again at night.
              It was some of the most fun I&apos;ve ever had. A few months
              later, Been Watching was real, fully working, polished the way a
              designer polishes things. My friends ditched the Notes doc. And
              word got back to me that one of my senior developers admitted he
              was a little envious: the thing his team had circled for years,
              I&apos;d built in months. Without writing code.
            </p>
            <p>
              That plank app fought me for almost two years. I killed it three
              times. Then the tools caught up, and in March 2026, HyperChrono
              went live in the Apple App Store. I&apos;ve been an Apple fanboy
              my whole life, so I&apos;ll just say it: how many people do you
              know with their own app in the App Store? I still use it for
              every plank.
            </p>
          </div>
        </div>
      </section>

      {/* The tool nobody used */}
      <section className="border-b py-20 bg-muted/30">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h2 className={sectionHeading}>The tool nobody used</h2>
          <div className={bodyStack}>
            <p>
              Meanwhile, back at my own agency, almost nobody was touching AI.
              My team was nervous, and honestly, our clients (big
              corporations, worried about copyright) were banning AI outright.
              I kept telling people it felt like the early days of Napster:
              the industry can resist, but the path is inevitable.
            </p>
            <p>
              So I tried to help. On a four-hour flight to Spokane, I built an
              idea-sharing tool for my team, about ninety percent of it on
              airplane wi-fi. I built an AI planning tool. I built a doc
              editor. Good tools, honestly. And almost nobody used them.
            </p>
            <p>
              Then, in early 2026, I tried something different. Instead of
              handing my team tools, I designed an event: structured,
              multi-week, low-pressure, where everyone would build something
              they personally wanted to exist. The tools I&apos;d already
              built slotted in perfectly, like they&apos;d been waiting for
              it. We pitched Shark Tank style (people wore costumes). We built
              in short sessions between client work. We demoed, we voted, we
              celebrated.
            </p>
            <p>
              And then the thing happened that changed my plans: after it
              ended, my team kept building. People who&apos;d been unsure what
              their first prompt should be were shipping tools all on their
              own. The conversations changed. That was my aha moment. The
              tools were never the answer. The experience was.
            </p>
          </div>
        </div>
      </section>

      {/* Why Hacksathon.com exists */}
      <section className="py-20">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h2 className={sectionHeading}>Why Hacksathon.com exists</h2>
          <div className={bodyStack}>
            <p>
              I believe creative people are secretly the best builders in this
              new era. Ideas, taste, usability, the ability to imagine what
              something should feel like: those are the superpowers now, and
              technical skill is no longer the gate. I watched it happen to
              me, and then I watched it happen to a whole team of producers,
              designers, and strategists.
            </p>
            <p>
              Hacksathon.com is that event, rebuilt as a platform any
              organization can run on its own. We help people realize they can
              create solutions they never thought possible. I know it works,
              because I was the first person it worked on.
            </p>
          </div>
          <p className="mt-6">
            <Link
              href="/seven2"
              className="font-serif text-lg text-foreground underline underline-offset-4 hover:no-underline"
            >
              Read the full Seven2 story &rarr;
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
