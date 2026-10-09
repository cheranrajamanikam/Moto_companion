import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bike, Sparkles, Users } from "lucide-react";
import { matchingService } from "@/services/matchingService";
import { FilterPanel } from "@/components/matching/FilterPanel";
import { MatchCard } from "@/components/matching/MatchCard";
import { MatchExplanation } from "@/components/matching/MatchExplanation";
import { RideRequestModal } from "@/components/matching/RideRequestModal";
import { EmptyState } from "@/components/matching/EmptyState";
import type { MatchFilterOptions, MatchResult } from "@/types/rider";
import { getCcMatchRange } from "@/lib/ccMatching";

function defaultFilters(role: "rider" | "pillion"): MatchFilterOptions {
  const { min, max } = getCcMatchRange();
  return {
    role,
    searchQuery: "",
    minCC: min,
    maxCC: max,
    maxDistanceKm: 500,
    city: "ALL",
    minRating: 0,
    kycOnly: false,
    experienceLevel: "ALL",
    sortBy: "BEST_MATCH",
  };
}

export function MatchPageContent({
  role,
  onRoleChange,
}: {
  role: "rider" | "pillion";
  onRoleChange: (role: "rider" | "pillion") => void;
}) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<MatchFilterOptions>(() => defaultFilters(role));
  const [results, setResults] = useState<MatchResult[]>([]);
  const [selectedMatchForExplain, setSelectedMatchForExplain] = useState<MatchResult | null>(null);
  const [selectedMatchForConnect, setSelectedMatchForConnect] = useState<MatchResult | null>(null);

  useEffect(() => {
    setFilters((prev) => ({ ...defaultFilters(role), searchQuery: prev.searchQuery, kycOnly: prev.kycOnly, maxDistanceKm: prev.maxDistanceKm }));
  }, [role]);

  useEffect(() => {
    setResults(matchingService.getMatches(filters));
  }, [filters]);

  const bestMatch = useMemo(() => (results.length > 0 ? results[0] : null), [results]);

  const handleResetFilters = () => setFilters(defaultFilters(role));

  return (
    <div className="animate-page-in space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {role === "rider" ? "Rider Matching Engine" : "Pillion Matching Engine"}
          </div>
          <p className="text-sm text-muted-foreground">
            Matched on CC compatibility (±150cc), distance, experience, safety ratings & partner preferences.
          </p>
        </div>

        <div className="flex shrink-0 items-center rounded-[14px] border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => onRoleChange("rider")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              role === "rider" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Find Rider
          </button>
          <button
            type="button"
            onClick={() => onRoleChange("pillion")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              role === "pillion" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <Bike className="h-3.5 w-3.5" />
            Find Pillion
          </button>
        </div>
      </div>

      <FilterPanel filters={filters} onFilterChange={setFilters} onReset={handleResetFilters} />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing <strong className="text-foreground">{results.length}</strong> compatible match(es)
        </span>
        <span>Sorted by {filters.sortBy?.replace("_", " ").toLowerCase()}</span>
      </div>

      {results.length === 0 ? (
        <EmptyState
          title="No suitable matches found"
          description="No riders match your filters within your ±150cc range. Try increasing distance or clearing city filters."
          actionText="Reset All Filters"
          onAction={handleResetFilters}
          iconType="search"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {results.map((match) => (
              <MatchCard
                key={match.matchId}
                match={match}
                onViewProfile={(id) => navigate({ to: "/profile", search: { userId: String(id) } })}
                onConnect={(m) => setSelectedMatchForConnect(m)}
                onExplain={(m) => setSelectedMatchForExplain(m)}
              />
            ))}
          </div>

          {bestMatch ? (
            <div className="card-lift rounded-[14px] border border-border bg-card p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">AI match insight</p>
              <p className="mt-2 text-sm text-foreground">
                <strong>{bestMatch.matchedUser.name.split(" ")[0]}</strong> is your best match — same CC
                range, {bestMatch.matchedUser.stats.completedAsRider} verified group rides,{" "}
                {bestMatch.matchedUser.reputation.rating} safety rating, {bestMatch.distanceKm} km away.
              </p>
            </div>
          ) : null}
        </>
      )}

      <MatchExplanation
        isOpen={!!selectedMatchForExplain}
        match={selectedMatchForExplain}
        onClose={() => setSelectedMatchForExplain(null)}
        onConnect={(m) => setSelectedMatchForConnect(m)}
      />

      <RideRequestModal
        isOpen={!!selectedMatchForConnect}
        match={selectedMatchForConnect}
        targetUser={null}
        onClose={() => setSelectedMatchForConnect(null)}
      />
    </div>
  );
}
