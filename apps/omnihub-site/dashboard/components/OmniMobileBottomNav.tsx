/**
 * OmniMobileBottomNav — iOS-style fixed bottom tab bar
 *
 * Renders only on mobile/tablet viewports.
 * 5 tabs: Home, OmniSlate, Apps, Insights, More
 * ≥44×44px touch targets, env(safe-area-inset-bottom) aware.
 */
import type { FC } from "react";
import { useAppTranslation } from "../../src/i18n/useAppTranslation";

export type MobileTab = "home" | "slate" | "apps" | "insights" | "more";

interface OmniMobileBottomNavProps {
  readonly activeTab: MobileTab;
  readonly onSelect: (tab: MobileTab) => void;
}

// ── SVG Icon Components ───────────────────────────────────────────────────────

const IconHome: FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
    <path d="M9 21V12h6v9" />
  </svg>
);

const IconSlate: FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <circle cx="9" cy="10" r="1" fill="currentColor" />
    <circle cx="12" cy="10" r="1" fill="currentColor" />
    <circle cx="15" cy="10" r="1" fill="currentColor" />
  </svg>
);

const IconApps: FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const IconInsights: FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IconMore: FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="5" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <circle cx="12" cy="19" r="1.2" fill="currentColor" />
  </svg>
);

const TAB_ICONS: Record<MobileTab, FC> = {
  home: IconHome,
  slate: IconSlate,
  apps: IconApps,
  insights: IconInsights,
  more: IconMore,
};

const TAB_IDS: readonly MobileTab[] = ["home", "slate", "apps", "insights", "more"];

export function OmniMobileBottomNav({ activeTab, onSelect }: OmniMobileBottomNavProps) {
  const { tx } = useAppTranslation();

  return (
    <div
      className="omni-mobile-bottom-nav"
      role="tablist"
      aria-label={tx("dashboard.mobile.dashboardNav", { defaultValue: "Dashboard navigation" })}
    >
      {TAB_IDS.map((tabId) => {
        const isActive = activeTab === tabId;
        const Icon = TAB_ICONS[tabId];
        const label = tx(`dashboard.mobile.${tabId}`, { defaultValue: tabId });
        return (
          <button
            key={tabId}
            data-testid={`omni-mobile-tab-${tabId}`}
            role="tab"
            aria-selected={isActive}
            aria-label={label}
            className={`omni-mobile-tab${isActive ? " omni-mobile-tab--active" : ""}`}
            onClick={() => onSelect(tabId)}
            type="button"
          >
            <span className="omni-mobile-tab__icon"><Icon /></span>
            <span className="omni-mobile-tab__label">{label}</span>
            {isActive && <span className="omni-mobile-tab__indicator" />}
          </button>
        );
      })}
    </div>
  );
}
