import {
  ArrowUpRight,
  ChevronRight,
  ShieldCheck,
  Users,
  PanelsTopLeft,
  LogOut,
  RefreshCw,
  MessageCircle,
  CalendarDays,
  Activity,
  Flag,
} from "lucide-react";
import "./admin-workspace.css";
export type AdminOverview = {
  counts: Record<string, number | null>;
  since: string;
  updatedAt: string;
};
type Props = {
  email: string | null;
  busy: boolean;
  overview?: AdminOverview | null;
  loading?: boolean;
  loadError?: boolean;
  onRefresh?: () => void;
  onOpenCustomer: () => void;
  onReports: () => void;
  onPreview: () => void;
  onSignOut: () => void;
};
export function AdminHome({
  email,
  busy,
  overview,
  loading = false,
  loadError = false,
  onRefresh,
  onOpenCustomer,
  onReports,
  onPreview,
  onSignOut,
}: Props) {
  const count = (key: string) => overview?.counts[key]?.toLocaleString() ?? "—";
  return (
    <main className="la-admin-main">
      <div className="la-admin-heading">
        <div>
          <h1>LiveAskew at a glance</h1>
          <p>Your members, content, and community in one place.</p>
        </div>
        <button className="la-admin-refresh" onClick={onRefresh} disabled={loading || !onRefresh}>
          <RefreshCw size={15} aria-hidden /> {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <div className="la-overview-period">
        <span>
          <Activity size={14} aria-hidden /> App overview
        </span>
        <span>
          {overview
            ? `Updated ${new Date(overview.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
            : "Live data not connected in this preview"}
        </span>
      </div>
      {loadError && (
        <p role="status" className="la-overview-error">
          App activity couldn’t load. Refresh to try again. Previously loaded counts, if any, are
          retained.
        </p>
      )}
      <section className="la-metrics" aria-label="App activity">
        <article>
          <Users size={20} aria-hidden />
          <span>Member style profiles</span>
          <strong>{count("members")}</strong>
          <small>All time · not total sign-ups</small>
        </article>
        <article>
          <PanelsTopLeft size={20} aria-hidden />
          <span>Weekly Style Guides</span>
          <strong>{count("guides")}</strong>
          <small>All time</small>
        </article>
        <article>
          <MessageCircle size={20} aria-hidden />
          <span>Hive conversations</span>
          <strong>{count("messages")}</strong>
          <small>Messages in the last 7 days</small>
        </article>
        <article>
          <ArrowUpRight size={20} aria-hidden />
          <span>Published Buzz posts</span>
          <strong>{count("posted")}</strong>
          <small>Last 7 days</small>
        </article>
      </section>
      <div className="la-overview-columns">
        <section className="la-overview-card">
          <div className="la-admin-section-heading">
            <h2>Needs attention</h2>
            <Flag size={18} aria-hidden />
          </div>
          <button className="la-overview-row" onClick={onReports} disabled={busy}>
            <span>
              <strong>Hive reports</strong>
              <small>Review member reports and moderation decisions.</small>
            </span>
            <span className="la-admin-tool-link">
              {busy ? "Loading…" : "Review queue"} <ChevronRight size={16} aria-hidden />
            </span>
          </button>
          <div className="la-overview-row">
            <span>
              <strong>Publishing failures</strong>
              <small>Posts that need a retry or connection check.</small>
            </span>
            <b>{count("failed")}</b>
          </div>
          <p className="la-admin-tools-note">Unavailable counts are shown as —, never as zero.</p>
        </section>
        <section className="la-overview-card">
          <div className="la-admin-section-heading">
            <h2>Content & engagement</h2>
            <CalendarDays size={18} aria-hidden />
          </div>
          <div className="la-overview-row">
            <span>
              <strong>Posts scheduled</strong>
              <small>Buzz posts waiting to publish</small>
            </span>
            <b>{count("scheduled")}</b>
          </div>
          <div className="la-overview-row">
            <span>
              <strong>Reach & reactions</strong>
              <small>Social-platform analytics</small>
            </span>
            <span className="la-data-status">Not connected</span>
          </div>
          <div className="la-overview-row">
            <span>
              <strong>Revenue & subscriptions</strong>
              <small>Billing reporting</small>
            </span>
            <span className="la-data-status">Not connected</span>
          </div>
        </section>
      </div>
      <section className="la-overview-help">
        <div>
          <h2>See what your members see</h2>
          <p>Preview the app with sample content, or open your personal experience.</p>
        </div>
        <button className="la-admin-primary" onClick={onPreview}>
          Preview app <ArrowUpRight size={16} aria-hidden />
        </button>
      </section>
      <footer className="la-admin-footer">
        <div className="la-admin-account">
          <span className="la-admin-avatar" aria-hidden>
            <ShieldCheck size={19} />
          </span>
          <span>
            <strong>{email || "Administrator"}</strong>
            <span>Administrator access</span>
          </span>
        </div>
        <div className="la-admin-footer-actions">
          <button onClick={onOpenCustomer}>
            My LiveAskew <ArrowUpRight size={14} aria-hidden />
          </button>
          <a href="/" target="_blank" rel="noreferrer">
            Website <span className="sr-only">(opens in new tab)</span>
            <ArrowUpRight size={14} aria-hidden />
          </a>
          <button onClick={onSignOut}>
            <LogOut size={15} aria-hidden /> Sign out
          </button>
        </div>
      </footer>
    </main>
  );
}
