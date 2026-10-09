import { cn } from "@/lib/utils";

export type TabDef = { id: string; label: string };

export function TabBar({
  tabs,
  activeTab,
  onChange,
  className,
}: {
  tabs: readonly TabDef[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex gap-1 rounded-[14px] border border-border bg-card p-1",
        className,
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            activeTab === tab.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
