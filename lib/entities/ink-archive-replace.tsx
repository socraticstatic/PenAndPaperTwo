import {
  type DOMNode,
  type HTMLReactParserOptions,
  Element,
} from "html-react-parser";
import type { CSSProperties } from "react";
import type { InkRow } from "@/lib/supabase/inks";
import type {
  InkColor,
  InkPerformance,
  Pricing,
} from "@/lib/supabase/jsonb-shapes";
import { formatArchive, hasClass } from "./format";

function originLine(ink: InkRow): string {
  const country = isoCountry(ink.country_of_origin);
  return ink.year_introduced ? `${country} · ${ink.year_introduced}` : country;
}

// Best-effort 2-letter country code for the card-top corner label.
// Falls back to first 2 letters uppercased.
function isoCountry(name: string): string {
  const map: Record<string, string> = {
    Japan: "JP",
    "United Kingdom": "UK",
    "United States": "US",
    Germany: "DE",
    France: "FR",
    Italy: "IT",
    Switzerland: "CH",
    Taiwan: "TW",
    China: "CN",
    Austria: "AT",
  };
  return map[name] ?? name.slice(0, 2).toUpperCase();
}

function cssVarsForInk(color: InkColor): CSSProperties {
  const vars: Record<string, string> = {};
  if (color.oklch) vars["--ink-color"] = color.oklch;
  else if (color.hex) vars["--ink-color"] = color.hex;
  if (color.shadingLow) vars["--ink-shade-low"] = color.shadingLow;
  if (color.sheenHex) vars["--ink-sheen"] = color.sheenHex;
  return vars as CSSProperties;
}

function inkCard(ink: InkRow) {
  const color = (ink.color ?? {}) as InkColor;
  const performance = (ink.performance ?? {}) as InkPerformance;
  const pricing = (ink.pricing ?? {}) as Pricing;
  const wetness = performance.wetness ?? 0;
  const saturation = performance.saturation ?? 0;
  const sheen = performance.sheenVisibility ?? 0;
  const dryM = performance.dryTimeByNib?.M ?? performance.dryTimeBaseSec ?? 0;
  const price =
    pricing.msrpUsd != null
      ? `$ ${pricing.msrpUsd}${pricing.bottleMl ? ` / ${pricing.bottleMl} ml` : ""}`
      : null;
  const marks: string[] = [];
  if (sheen >= 4) marks.push("SHEEN");
  if ((performance.shimmerVisibility ?? 0) >= 3) marks.push("SHIMMER");

  return (
    <a
      key={ink.id}
      className="ink-card"
      href={`/inks/${ink.id}`}
      style={cssVarsForInk(color)}
    >
      <div className="card-top">
        <span className="card-no">{formatArchive(ink.archive_number)}</span>
        <span className="card-origin">{originLine(ink)}</span>
      </div>
      <div className="ink-swatch">
        {color.hex ? (
          <span className="swatch-tag">{color.hex.toUpperCase()}</span>
        ) : null}
        {marks.length ? (
          <span className="swatch-marks">
            {marks.map((m) => (
              <span key={m} className="m">
                {m}
              </span>
            ))}
          </span>
        ) : null}
        <span className="sheen-stripe"></span>
        {/* Editorial deck line, falls back to color name */}
        <span className="writing">{color.name ?? ink.model}</span>
      </div>
      <div>
        <div className="card-brand">{ink.brand}</div>
        <h3 className="card-name">{ink.model}</h3>
        {ink.model_english ? (
          <div className="card-trans">— {ink.model_english}</div>
        ) : null}
      </div>
      <div className="stats">
        <div className="row">
          <span className="k">Wetness</span>
          <div className="bar">
            <i style={{ left: `${wetness}%` }}></i>
          </div>
          <span className="v">{wetness}</span>
        </div>
        <div className="row">
          <span className="k">Saturation</span>
          <div className="bar">
            <i style={{ left: `${saturation}%` }}></i>
          </div>
          <span className="v">{saturation}</span>
        </div>
        <div className="row">
          <span className="k">Sheen</span>
          <div className="bar">
            <i style={{ left: `${sheen * 20}%` }}></i>
          </div>
          <span className="v">{sheen}/5</span>
        </div>
        <div className="row">
          <span className="k">Dry time</span>
          <div className="bar">
            <i style={{ left: `${Math.min(100, dryM * 2)}%` }}></i>
          </div>
          <span className="v">{dryM} s</span>
        </div>
      </div>
      <div className="card-foot">
        <span className="fam">{ink.family}</span>
        {price ? <span className="price">{price}</span> : null}
      </div>
    </a>
  );
}

export function buildInkArchiveReplace(
  inks: InkRow[],
): HTMLReactParserOptions["replace"] {
  function inkArchiveReplace(node: DOMNode) {
    if (!(node instanceof Element)) return undefined;
    if (node.name === "div" && hasClass(node, "ink-archive")) {
      return <div className="ink-archive">{inks.map(inkCard)}</div>;
    }
    return undefined;
  }
  return inkArchiveReplace;
}
