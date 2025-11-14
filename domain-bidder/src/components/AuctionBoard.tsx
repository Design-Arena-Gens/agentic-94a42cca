"use client";

import type { DomainAuction } from "@/data/auctions";
import { analyzeAuction } from "@/lib/scoring";
import { timeRemaining } from "@/lib/time";
import { AuctionCard, type BidConfig } from "./AuctionCard";
import { useCallback, useMemo, useState } from "react";

type Props = {
  auctions: DomainAuction[];
};

type BidStatus = {
  status: "idle" | "scheduled" | "executing" | "complete";
  nextBidAt?: string;
  lastRun?: string;
};

export const AuctionBoard = ({ auctions }: Props) => {
  const analyzedAuctions = useMemo(
    () =>
      auctions.map((auction) => ({
        auction,
        analysis: analyzeAuction(auction),
      })),
    [auctions],
  );

  const [bidConfigs, setBidConfigs] = useState<Record<string, BidConfig>>(() =>
    Object.fromEntries(
      analyzedAuctions.map(({ auction, analysis }) => [
        auction.id,
        {
          autoBid: true,
          maxBid: analysis.recommendedMaxBid,
          snipeOffset: analysis.snipeOffsetMinutes,
          enableAutoExtend: true,
        } satisfies BidConfig,
      ]),
    )
  );

  const [bidStatuses, setBidStatuses] = useState<Record<string, BidStatus>>(() =>
    Object.fromEntries(
      analyzedAuctions.map(({ auction, analysis }) => [
        auction.id,
        {
          status: "scheduled",
          nextBidAt: new Date(
            new Date(auction.endingAt).getTime() - analysis.snipeOffsetMinutes * 60 * 1000,
          ).toISOString(),
        },
      ]),
    )
  );

  const bestAuction = useMemo(() => {
    const sorted = [...analyzedAuctions].sort((a, b) => b.analysis.score - a.analysis.score);
    return sorted[0];
  }, [analyzedAuctions]);

  const handleConfigure = useCallback((auctionId: string, config: BidConfig) => {
    setBidConfigs((prev) => ({ ...prev, [auctionId]: config }));
    if (config.autoBid) {
      const targetAuction = auctions.find((item) => item.id === auctionId);
      if (!targetAuction) return;
      const endTime = new Date(targetAuction.endingAt);
      const scheduled = new Date(endTime.getTime() - config.snipeOffset * 60 * 1000);
      setBidStatuses((prev) => ({
        ...prev,
        [auctionId]: {
          status: "scheduled",
          nextBidAt: scheduled.toISOString(),
          lastRun: prev[auctionId]?.lastRun,
        },
      }));
    } else {
      setBidStatuses((prev) => ({
        ...prev,
        [auctionId]: { status: "idle" },
      }));
    }
  }, [auctions]);

  const executeSimulatedBids = useCallback(() => {
    const now = Date.now();
    setBidStatuses((prev) => {
      const next: Record<string, BidStatus> = { ...prev };
      for (const auction of auctions) {
        const config = bidConfigs[auction.id];
        if (!config?.autoBid) continue;
        const scheduledAt = new Date(auction.endingAt).getTime() - config.snipeOffset * 60 * 1000;
        if (scheduledAt <= now && (prev[auction.id]?.status === "scheduled" || !prev[auction.id])) {
          next[auction.id] = {
            status: "complete",
            lastRun: new Date().toISOString(),
          };
        }
      }
      return next;
    });
  }, [auctions, bidConfigs]);

  return (
    <div className="space-y-10">
      {bestAuction && (
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 shadow-xl shadow-black/40">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Priority pick
              </p>
              <h2 className="mt-3 text-3xl font-bold text-white">{bestAuction.auction.domain}</h2>
              <p className="mt-2 max-w-xl text-sm text-slate-300">
                Highest composite score across authority, monetization, and trend indicators. The snipe
                window keeps you competitive while minimizing bidding wars in the final minutes.
              </p>
            </div>
            <div className="flex flex-col items-start gap-4 rounded-2xl border border-emerald-500/30 bg-slate-900/70 p-6 text-sm text-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-semibold text-emerald-400">
                  {bestAuction.analysis.score}
                </span>
                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-widest text-slate-400">
                    Composite score
                  </span>
                  <span className="font-semibold text-white">
                    {bestAuction.analysis.strength} grade • {bestAuction.analysis.risk} risk
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-8">
                  <span>Ends in</span>
                  <span className="font-semibold text-white">
                    {timeRemaining(bestAuction.auction.endingAt).label}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-8">
                  <span>Current bid</span>
                  <span className="font-semibold text-white">
                    $
                    {bestAuction.auction.currentBid.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-8">
                  <span>Recommended ceiling</span>
                  <span className="font-semibold text-emerald-400">
                    ${bestAuction.analysis.recommendedMaxBid.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-8">
                  <span>Snipe offset</span>
                  <span className="font-semibold text-white">
                    {bestAuction.analysis.snipeOffsetMinutes} minutes
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-200 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Automation controller
          </p>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Configured bidding windows execute automatically before the auction closes. Use the
            simulator to fast-forward and verify timing or tweak the strategy without waiting.
          </p>
        </div>
        <button
          className="rounded-full bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
          onClick={executeSimulatedBids}
        >
          Simulate next hour
        </button>
      </div>

      <div className="grid gap-6">
        {analyzedAuctions.map(({ auction, analysis }) => (
          <div key={auction.id} className="space-y-4">
            <AuctionCard
              auction={auction}
              analysis={analysis}
              savedConfig={bidConfigs[auction.id]}
              onConfigure={handleConfigure}
            />
            <BidSchedule
              auction={auction}
              config={bidConfigs[auction.id]}
              status={bidStatuses[auction.id]}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

type BidScheduleProps = {
  auction: DomainAuction;
  config?: BidConfig;
  status?: BidStatus;
};

const BidSchedule = ({ auction, config, status }: BidScheduleProps) => {
  if (!config?.autoBid) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
        Auto bidding is disabled. Enable automation to schedule a sniping window for this domain.
      </div>
    );
  }

  const endTime = new Date(auction.endingAt);
  const scheduled = new Date(endTime.getTime() - config.snipeOffset * 60 * 1000);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-400">
            {(status?.status ?? "scheduled").toUpperCase()}
          </span>
          <span className="font-semibold text-white">
            Bid at {scheduled.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — max $
            {config.maxBid.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-6 text-xs text-slate-400">
          <span>
            Auction closes {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {status?.lastRun && (
            <span>Executed {new Date(status.lastRun).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          )}
        </div>
      </div>
    </div>
  );
};
