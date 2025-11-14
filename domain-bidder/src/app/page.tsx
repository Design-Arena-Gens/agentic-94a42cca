import { domainAuctions } from "@/data/auctions";
import { AuctionBoard } from "@/components/AuctionBoard";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 pb-16">
      <div className="relative mx-auto max-w-6xl px-6 pt-24 sm:px-10">
        <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-emerald-600/20 to-slate-950 blur-2xl" />
        <header className="flex flex-col gap-4 text-white">
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-300">
            Domain pursuit autopilot
          </span>
          <h1 className="text-4xl font-bold sm:text-5xl">
            Track, evaluate, and snipe premium domains before the window closes.
          </h1>
          <p className="max-w-2xl text-base text-slate-300">
            Live scoring blends authority, monetization, and momentum signals so you always know where
            to deploy capital. Configure auto-snipe windows per auction and let the bot fire at the
            optimal time.
          </p>
        </header>

        <main className="mt-12">
          <AuctionBoard auctions={domainAuctions} />
        </main>
      </div>
    </div>
  );
}
