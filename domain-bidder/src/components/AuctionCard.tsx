"use client";

import type { DomainAuction } from "@/data/auctions";
import type { AuctionAnalysis } from "@/lib/scoring";
import { timeRemaining } from "@/lib/time";
import clsx from "clsx";
import { useMemo, useState } from "react";

type Props = {
  auction: DomainAuction;
  analysis: AuctionAnalysis;
  onConfigure: (auctionId: string, config: BidConfig) => void;
  savedConfig?: BidConfig;
};

export type BidConfig = {
  autoBid: boolean;
  maxBid: number;
  snipeOffset: number;
  enableAutoExtend: boolean;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export const AuctionCard = ({ auction, analysis, onConfigure, savedConfig }: Props) => {
  const { label: remainingLabel } = timeRemaining(auction.endingAt);
  const [config, setConfig] = useState<BidConfig>(
    savedConfig ?? {
      autoBid: true,
      maxBid: analysis.recommendedMaxBid,
      snipeOffset: analysis.snipeOffsetMinutes,
      enableAutoExtend: true,
    },
  );

  const bidWindow = useMemo(() => {
    const end = new Date(auction.endingAt);
    const bidTime = new Date(end.getTime() - config.snipeOffset * 60 * 1000);
    return {
      placeBidAt: bidTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      endTime: end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  }, [auction.endingAt, config.snipeOffset]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg shadow-slate-900/40 backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-400">
              {analysis.strength}
            </span>
            <span
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                analysis.risk === "Very Low" || analysis.risk === "Low"
                  ? "bg-blue-500/10 text-blue-300"
                  : analysis.risk === "Medium"
                    ? "bg-amber-500/10 text-amber-300"
                    : "bg-rose-500/10 text-rose-300",
              )}
            >
              {analysis.risk} risk
            </span>
          </div>
          <h3 className="mt-3 text-xl font-semibold text-white">{auction.domain}</h3>
          <p className="text-sm text-slate-300">
            {auction.marketplace} • {auction.niche}
          </p>
        </div>
        <div className="text-right text-sm text-slate-300">
          <p>
            Ends in <span className="font-semibold text-white">{remainingLabel}</span>
          </p>
          <p>
            Current bid:{" "}
            <span className="font-semibold text-white">{formatCurrency(auction.currentBid)}</span>
          </p>
          <p>
            Est. ceiling:{" "}
            <span className="font-semibold text-emerald-400">
              {formatCurrency(analysis.recommendedMaxBid)}
            </span>
          </p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm text-slate-300 md:grid-cols-4">
        <div>
          <dt className="text-slate-400">Authority</dt>
          <dd className="text-white">{auction.domainAuthority}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Backlinks</dt>
          <dd className="text-white">{auction.backlinks.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Est. Traffic</dt>
          <dd className="text-white">{auction.estTraffic.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Est. Revenue</dt>
          <dd className="text-white">{formatCurrency(auction.estRevenue)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Bids</dt>
          <dd className="text-white">{auction.bids}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Spam score</dt>
          <dd className="text-white">{auction.spamScore}/10</dd>
        </div>
        <div>
          <dt className="text-slate-400">Keywords</dt>
          <dd className="text-white">{auction.keywords.join(", ")}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Bid increment</dt>
          <dd className="text-white">{formatCurrency(auction.bidIncrement)}</dd>
        </div>
      </dl>

      {analysis.notes.length > 0 && (
        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Signals</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-200">
            {analysis.notes.map((note) => (
              <li key={note} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200 md:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-white" htmlFor={`${auction.id}-autobid`}>
              Auto bidding
            </label>
            <input
              id={`${auction.id}-autobid`}
              type="checkbox"
              className="h-5 w-10 cursor-pointer appearance-none rounded-full bg-slate-700 transition hover:bg-slate-600 checked:bg-emerald-500"
              checked={config.autoBid}
              onChange={(event) => {
                const next = { ...config, autoBid: event.target.checked };
                setConfig(next);
                onConfigure(auction.id, next);
              }}
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor={`${auction.id}-max`}>
              Max bid
            </label>
            <input
              id={`${auction.id}-max`}
              type="number"
              min={auction.currentBid + auction.bidIncrement}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              value={config.maxBid}
              onChange={(event) => {
                const next = { ...config, maxBid: Number(event.target.value) };
                setConfig(next);
                onConfigure(auction.id, next);
              }}
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor={`${auction.id}-offset`}>
              Snipe offset (minutes before close)
            </label>
            <input
              id={`${auction.id}-offset`}
              type="number"
              min={1}
              max={45}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              value={config.snipeOffset}
              onChange={(event) => {
                const next = { ...config, snipeOffset: Number(event.target.value) };
                setConfig(next);
                onConfigure(auction.id, next);
              }}
            />
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-400"
              checked={config.enableAutoExtend}
              onChange={(event) => {
                const next = { ...config, enableAutoExtend: event.target.checked };
                setConfig(next);
                onConfigure(auction.id, next);
              }}
            />
            <span>Extend watch window when rival bids push price near ceiling</span>
          </label>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bid timing</p>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Place snipe bid at</span>
            <span className="font-semibold text-white">{bidWindow.placeBidAt}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Auction ends</span>
            <span className="font-semibold text-white">{bidWindow.endTime}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Safety buffer</span>
            <span className="font-semibold text-white">{config.enableAutoExtend ? "Dynamic ±2m" : "Fixed"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
