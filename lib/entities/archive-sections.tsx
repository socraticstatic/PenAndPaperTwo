// Server components that render the entire pen/paper/ink/pairings
// archive section with bound section-head + FilterableArchive client
// wrapper. Used by home-replace.tsx and the /ink page.
//
// All card-rendering + facet logic lives inside the client component
// (FilterableArchive) because RSC forbids passing functions across the
// boundary. We only pass serializable rows + kind + copy strings here.

import { FilterableArchive } from "@/components/FilterableArchive";
import type { PenRow } from "@/lib/supabase/pens";
import type { PaperRow } from "@/lib/supabase/papers";
import type { InkRow } from "@/lib/supabase/inks";
import type { PairingWithSides } from "@/lib/supabase/pairings";

type SectionHeadProps = {
  sectionNo: string;
  titleTemplate: string;
  emphasis?: string;
  kicker: string;
};

function SectionHead({ sectionNo, titleTemplate, emphasis, kicker }: SectionHeadProps) {
  const idx = emphasis
    ? titleTemplate.toLowerCase().indexOf(emphasis.toLowerCase())
    : -1;
  return (
    <div className="section-head">
      {sectionNo ? <span className="section-no">{sectionNo}</span> : null}
      <h2 className="section-title">
        {idx >= 0 ? (
          <>
            {titleTemplate.slice(0, idx)}
            <em>{titleTemplate.slice(idx, idx + emphasis!.length)}</em>
            {titleTemplate.slice(idx + emphasis!.length)}
          </>
        ) : (
          titleTemplate
        )}
      </h2>
      {kicker ? <span className="section-kicker">{kicker}</span> : null}
    </div>
  );
}

// FilterableArchive's Row type is loose (Record-like) — entity Rows
// from Supabase are compatible since JSONB columns deserialize as
// plain objects. Cast through unknown to satisfy the boundary.
type ArchiveRow = Parameters<typeof FilterableArchive>[0]["rows"][number];

export function PenArchiveSection({
  rows,
  totalCount,
  sectionNo,
  titleTemplate,
  kicker,
  searchPlaceholder,
}: {
  rows: PenRow[];
  totalCount: number;
  sectionNo: string;
  titleTemplate: string;
  kicker: string;
  searchPlaceholder: string;
}) {
  return (
    <section className="section" id="archive-pens">
      <div className="wrap">
        <SectionHead
          sectionNo={sectionNo}
          titleTemplate={titleTemplate}
          emphasis="pens"
          kicker={kicker}
        />
        <FilterableArchive
          kind="pen"
          rows={rows as unknown as ArchiveRow[]}
          searchPlaceholder={(searchPlaceholder || "Search pens — by model, maker, nib…")
            .replace("172", String(totalCount))}
        />
      </div>
    </section>
  );
}

export function PaperArchiveSection({
  rows,
  sectionNo,
  titleTemplate,
  kicker,
}: {
  rows: PaperRow[];
  sectionNo: string;
  titleTemplate: string;
  kicker: string;
}) {
  return (
    <section className="section" id="archive-papers">
      <div className="wrap">
        <SectionHead
          sectionNo={sectionNo}
          titleTemplate={titleTemplate}
          emphasis="papers"
          kicker={kicker}
        />
        <FilterableArchive kind="paper" rows={rows as unknown as ArchiveRow[]} />
      </div>
    </section>
  );
}

export function PairingsCatalogueSection({
  rows,
  sectionNo,
  titleTemplate,
  kicker,
}: {
  rows: PairingWithSides[];
  sectionNo: string;
  titleTemplate: string;
  kicker: string;
}) {
  return (
    <section className="section" id="pairings">
      <div className="wrap">
        <SectionHead
          sectionNo={sectionNo}
          titleTemplate={titleTemplate}
          emphasis="marriages"
          kicker={kicker}
        />
        <FilterableArchive kind="pairing" rows={rows as unknown as ArchiveRow[]} />
      </div>
    </section>
  );
}

export function InkCupboardSection({
  rows,
  sectionNo,
  titleTemplate,
  kicker,
}: {
  rows: InkRow[];
  sectionNo: string;
  titleTemplate: string;
  kicker: string;
}) {
  return (
    <section className="section">
      <div className="wrap">
        <SectionHead
          sectionNo={sectionNo}
          titleTemplate={titleTemplate}
          emphasis="cupboard"
          kicker={kicker}
        />
        <FilterableArchive kind="ink" rows={rows as unknown as ArchiveRow[]} />
      </div>
    </section>
  );
}
