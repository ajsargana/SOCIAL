import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  LayoutDashboard, Zap, FileText, CheckCircle2, BarChart2,
  LogOut, ChevronRight, Play, X, RefreshCw, Bot, AlertCircle,
  TrendingUp, Users, Clock, Settings
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Post {
  id: string;
  platform: string;
  caption: string;
  status: string;
  scheduledAt: string | null;
  postedAt: string | null;
  createdAt: string;
  engagement: { likes?: number; comments?: number; shares?: number; views?: number } | null;
}

interface Decision {
  id: string;
  decisionType: string;
  status: string;
  reasoning: string | null;
  suggestedContent: { topic?: string; platform?: string; scheduledTime?: string } | null;
  createdAt: string;
}

interface AutopilotSettings {
  enabled: boolean;
  autoApprove: boolean;
  maxPostsPerDay: number;
  postingGapHours: number;
  brandVoice: string | null;
  noGoTopics: string[] | null;
}

interface Analytics {
  totalPosts: number;
  postsLast30Days: number;
  postsLast7Days: number;
  totalEngagement: number;
  avgEngagement: number;
  platformBreakdown: Record<string, number>;
  connectedAccounts: number;
  pendingDecisions: number;
  autoPosted: number;
  pendingApproval: number;
  scheduled: number;
}

// ─── Nav items ──────────────────────────────────────────────────────────────
const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "autopilot", label: "Autopilot", icon: Zap },
  { id: "posts", label: "Posts", icon: FileText },
  { id: "decisions", label: "Decisions", icon: Bot },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "settings", label: "Settings", icon: Settings },
];

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "text-pink-400",
  tiktok: "text-white",
  x: "text-sky-400",
  linkedin: "text-blue-400",
  youtube: "text-red-400",
};

const STATUS_STYLES: Record<string, string> = {
  posted: "bg-emerald-500/10 text-emerald-300 border-emerald-400/40",
  scheduled: "bg-sky-500/10 text-sky-300 border-sky-400/40",
  pending_approval: "bg-amber-500/10 text-amber-300 border-amber-400/40",
  pending: "bg-slate-700/50 text-slate-300 border-slate-600/40",
  rejected: "bg-red-500/10 text-red-400 border-red-400/40",
  approved: "bg-emerald-500/10 text-emerald-300 border-emerald-400/40",
  awaiting_approval: "bg-amber-500/10 text-amber-300 border-amber-400/40",
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();

  const { data: posts = [] } = useQuery<Post[]>({ queryKey: ["/api/posts"] });
  const { data: decisions = [] } = useQuery<Decision[]>({ queryKey: ["/api/decisions"] });
  const { data: autopilot } = useQuery<AutopilotSettings | null>({ queryKey: ["/api/autopilot"] });
  const { data: analytics } = useQuery<Analytics>({ queryKey: ["/api/analytics"] });

  const evaluateMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/decisions/evaluate").then((r) => r.json()),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/decisions"] });
      qc.invalidateQueries({ queryKey: ["/api/posts"] });
      qc.invalidateQueries({ queryKey: ["/api/analytics"] });
      if (data.shouldPost) {
        toast({
          title: "Decision made!",
          description: data.reasoning,
          className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-50",
        });
      } else {
        toast({ title: "No action needed", description: data.reasoning });
      }
    },
    onError: () => toast({ title: "Evaluation failed", variant: "destructive" }),
  });

  const autopilotToggle = useMutation({
    mutationFn: (enabled: boolean) =>
      apiRequest("PATCH", "/api/autopilot", { enabled }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/autopilot"] }),
  });

  const approvePost = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/posts/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Post approved!", className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-50" });
    },
  });

  const rejectPost = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/posts/${id}/reject`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/posts"] }),
  });

  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate("/");
  };

  const pendingApprovalPosts = posts.filter((p) => p.status === "pending_approval");
  const recentPosts = [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
  const recentDecisions = [...decisions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-base)" }}>
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-slate-800/60 flex flex-col py-5 px-3 hidden md:flex">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 via-sky-500 to-purple-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
            <span className="font-bold text-xs text-white">FP</span>
          </div>
          <span className="font-semibold text-slate-100 tracking-tight">FlowPulse</span>
        </div>

        <nav className="flex-1 space-y-0.5">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === id
                  ? "bg-slate-800 text-slate-100"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {id === "decisions" && pendingApprovalPosts.length > 0 && (
                <span className="ml-auto bg-amber-500 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingApprovalPosts.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-2 mt-4 pt-4 border-t border-slate-800/60">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-400 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.username}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user?.plan} plan</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-400 via-sky-500 to-purple-500 flex items-center justify-center">
              <span className="font-bold text-[10px] text-white">FP</span>
            </div>
            <span className="font-semibold text-slate-100 text-sm">FlowPulse</span>
          </div>
          <div className="flex gap-1">
            {NAV.map(({ id, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)} className={`p-1.5 rounded-lg ${activeTab === id ? "bg-slate-700" : ""}`}>
                <Icon className={`w-4 h-4 ${activeTab === id ? "text-slate-100" : "text-slate-500"}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
          {/* ── Overview ────────────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div>
              <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                <div>
                  <h1 className="text-xl font-semibold text-slate-50">Good to see you, {user?.username} 👋</h1>
                  <p className="text-sm text-slate-400 mt-0.5">Here's what your autopilot is doing right now.</p>
                </div>
                <button
                  onClick={() => evaluateMutation.mutate()}
                  disabled={evaluateMutation.isPending}
                  className="btn-gradient text-sm font-semibold text-slate-900 rounded-full px-4 py-2 shadow-lg hover-elevate transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {evaluateMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Run evaluation
                </button>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Posts this month", value: analytics?.postsLast30Days ?? 0, icon: FileText, color: "text-emerald-400" },
                  { label: "Auto-posted", value: analytics?.autoPosted ?? 0, icon: Bot, color: "text-sky-400" },
                  { label: "Pending approval", value: analytics?.pendingApproval ?? 0, icon: AlertCircle, color: "text-amber-400" },
                  { label: "Avg engagement", value: analytics?.avgEngagement ?? 0, icon: TrendingUp, color: "text-fuchsia-400" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="glass rounded-2xl border border-slate-700/80 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-xs text-slate-400">{label}</span>
                    </div>
                    <p className="text-2xl font-semibold text-slate-50">{value}</p>
                  </div>
                ))}
              </div>

              {/* Autopilot status card */}
              <div className="glass rounded-2xl border border-slate-700/80 p-5 mb-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Autopilot status</p>
                    <h3 className="text-sm font-semibold text-slate-50">
                      {autopilot?.enabled ? "Active — watching for content gaps" : "Paused — not generating posts"}
                    </h3>
                    {autopilot && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {autopilot.maxPostsPerDay} posts/day max · {autopilot.postingGapHours}h gap · {autopilot.autoApprove ? "Auto-approve on" : "Manual review"}
                      </p>
                    )}
                  </div>
                  {autopilot !== undefined && (
                    <div
                      onClick={() => autopilotToggle.mutate(!autopilot?.enabled)}
                      className={`w-12 h-6 rounded-full cursor-pointer transition-all relative ${
                        autopilot?.enabled ? "bg-emerald-500" : "bg-slate-700"
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${autopilot?.enabled ? "left-7" : "left-1"}`} />
                    </div>
                  )}
                </div>
              </div>

              {/* Recent decisions */}
              {recentDecisions.length > 0 && (
                <div className="glass rounded-2xl border border-slate-700/80 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-50">Recent decisions</h3>
                    <button onClick={() => setActiveTab("decisions")} className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1">
                      View all <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {recentDecisions.slice(0, 4).map((d) => (
                      <div key={d.id} className="flex items-start gap-3">
                        <span className={`pill px-2 py-0.5 text-[10px] border ${STATUS_STYLES[d.status] || STATUS_STYLES.pending} shrink-0 mt-0.5`}>
                          {d.status.replace(/_/g, " ")}
                        </span>
                        <p className="text-xs text-slate-400 leading-relaxed">{d.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Autopilot ───────────────────────────────────────────────────── */}
          {activeTab === "autopilot" && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-semibold text-slate-50 mb-1">Autopilot control</h1>
                <p className="text-sm text-slate-400">Manage your AI posting engine and rules.</p>
              </div>

              <div className="glass rounded-2xl border border-slate-700/80 p-6 mb-4">
                <div className="flex items-center justify-between mb-5 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-50">Autopilot</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {autopilot?.enabled ? "Actively monitoring and filling content gaps." : "Paused. No posts will be generated."}
                    </p>
                  </div>
                  <div
                    onClick={() => autopilotToggle.mutate(!autopilot?.enabled)}
                    className={`w-12 h-6 rounded-full cursor-pointer transition-all relative ${autopilot?.enabled ? "bg-emerald-500" : "bg-slate-700"}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${autopilot?.enabled ? "left-7" : "left-1"}`} />
                  </div>
                </div>

                {autopilot && (
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    {[
                      { label: "Brand voice", value: autopilot.brandVoice || "Default" },
                      { label: "Max posts/day", value: String(autopilot.maxPostsPerDay) },
                      { label: "Posting gap", value: `${autopilot.postingGapHours}h` },
                      { label: "Approval", value: autopilot.autoApprove ? "Auto" : "Manual review" },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-slate-900/40 rounded-xl px-4 py-3">
                        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                        <p className="font-medium text-slate-100 capitalize">{value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {autopilot?.noGoTopics && autopilot.noGoTopics.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-400 mb-2">No-go topics</p>
                    <div className="flex flex-wrap gap-1.5">
                      {autopilot.noGoTopics.map((t) => (
                        <span key={t} className="pill px-2 py-0.5 text-xs bg-red-500/10 text-red-400 border border-red-500/20">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => evaluateMutation.mutate()}
                disabled={evaluateMutation.isPending}
                className="btn-gradient text-sm font-semibold text-slate-900 rounded-full px-5 py-2.5 shadow-lg hover-elevate transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {evaluateMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Trigger evaluation now
              </button>
            </div>
          )}

          {/* ── Posts ───────────────────────────────────────────────────────── */}
          {activeTab === "posts" && (
            <div>
              <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                <div>
                  <h1 className="text-xl font-semibold text-slate-50 mb-1">Posts</h1>
                  <p className="text-sm text-slate-400">All posts generated and managed by FlowPulse.</p>
                </div>
              </div>

              {pendingApprovalPosts.length > 0 && (
                <div className="glass rounded-2xl border border-amber-500/30 p-5 mb-5">
                  <h3 className="text-sm font-semibold text-amber-300 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {pendingApprovalPosts.length} post{pendingApprovalPosts.length !== 1 ? "s" : ""} awaiting your approval
                  </h3>
                  <div className="space-y-3">
                    {pendingApprovalPosts.map((p) => (
                      <div key={p.id} className="bg-slate-900/50 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-medium capitalize ${PLATFORM_COLORS[p.platform] || "text-slate-300"}`}>{p.platform}</span>
                          {p.scheduledAt && (
                            <span className="text-[10px] text-slate-500">· {new Date(p.scheduledAt).toLocaleString()}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 mb-3 leading-relaxed">{p.caption}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approvePost.mutate(p.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-medium hover:bg-emerald-500/30 transition"
                          >
                            <Play className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => rejectPost.mutate(p.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition"
                          >
                            <X className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recentPosts.length === 0 ? (
                <div className="glass rounded-2xl border border-slate-700/80 p-10 text-center">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No posts yet. Run an autopilot evaluation to generate your first post.</p>
                  <button onClick={() => evaluateMutation.mutate()} className="mt-4 btn-gradient text-sm font-semibold text-slate-900 rounded-full px-5 py-2 shadow-lg">
                    Run evaluation
                  </button>
                </div>
              ) : (
                <div className="glass rounded-2xl border border-slate-700/80 overflow-hidden">
                  <div className="divide-y divide-slate-800/60">
                    {recentPosts.map((p) => (
                      <div key={p.id} className="px-5 py-4">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`text-xs font-semibold capitalize ${PLATFORM_COLORS[p.platform] || "text-slate-300"}`}>{p.platform}</span>
                          <span className={`pill px-2 py-0.5 text-[10px] border ${STATUS_STYLES[p.status] || STATUS_STYLES.pending}`}>
                            {p.status.replace(/_/g, " ")}
                          </span>
                          {p.scheduledAt && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(p.scheduledAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{p.caption}</p>
                        {p.engagement && (
                          <div className="flex gap-3 mt-2 text-[10px] text-slate-500">
                            {p.engagement.likes !== undefined && <span>❤️ {p.engagement.likes}</span>}
                            {p.engagement.comments !== undefined && <span>💬 {p.engagement.comments}</span>}
                            {p.engagement.shares !== undefined && <span>🔄 {p.engagement.shares}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Decisions ───────────────────────────────────────────────────── */}
          {activeTab === "decisions" && (
            <div>
              <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                <div>
                  <h1 className="text-xl font-semibold text-slate-50 mb-1">Decision inbox</h1>
                  <p className="text-sm text-slate-400">Every call the AI made about your content.</p>
                </div>
                <button
                  onClick={() => evaluateMutation.mutate()}
                  disabled={evaluateMutation.isPending}
                  className="btn-gradient text-sm font-semibold text-slate-900 rounded-full px-4 py-2 shadow-lg hover-elevate transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {evaluateMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Evaluate now
                </button>
              </div>

              {recentDecisions.length === 0 ? (
                <div className="glass rounded-2xl border border-slate-700/80 p-10 text-center">
                  <Bot className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No decisions yet. Trigger your first evaluation.</p>
                </div>
              ) : (
                <div className="glass rounded-2xl border border-slate-700/80 overflow-hidden">
                  <div className="divide-y divide-slate-800/60">
                    {recentDecisions.map((d) => (
                      <div key={d.id} className="px-5 py-4">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`pill px-2 py-0.5 text-[10px] border ${STATUS_STYLES[d.status] || STATUS_STYLES.pending}`}>
                            {d.status.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-slate-500">{new Date(d.createdAt).toLocaleString()}</span>
                          {d.suggestedContent?.platform && (
                            <span className={`text-[10px] font-medium capitalize ${PLATFORM_COLORS[d.suggestedContent.platform] || "text-slate-400"}`}>
                              {d.suggestedContent.platform}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{d.reasoning}</p>
                        {d.suggestedContent?.topic && (
                          <p className="text-[10px] text-slate-500 mt-1">Topic: {d.suggestedContent.topic}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Analytics ───────────────────────────────────────────────────── */}
          {activeTab === "analytics" && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-semibold text-slate-50 mb-1">Analytics</h1>
                <p className="text-sm text-slate-400">Performance overview for the last 30 days.</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Total posts", value: analytics?.totalPosts ?? 0, icon: FileText },
                  { label: "Posts (30d)", value: analytics?.postsLast30Days ?? 0, icon: TrendingUp },
                  { label: "Posts (7d)", value: analytics?.postsLast7Days ?? 0, icon: BarChart2 },
                  { label: "Total engagement", value: analytics?.totalEngagement ?? 0, icon: CheckCircle2 },
                  { label: "Avg engagement", value: analytics?.avgEngagement ?? 0, icon: TrendingUp },
                  { label: "Connected accounts", value: analytics?.connectedAccounts ?? 0, icon: Users },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="glass rounded-2xl border border-slate-700/80 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-400">{label}</span>
                    </div>
                    <p className="text-2xl font-semibold text-slate-50">{value.toLocaleString()}</p>
                  </div>
                ))}
              </div>

              {analytics?.platformBreakdown && Object.keys(analytics.platformBreakdown).length > 0 && (
                <div className="glass rounded-2xl border border-slate-700/80 p-5">
                  <h3 className="text-sm font-semibold text-slate-50 mb-4">Posts by platform (30d)</h3>
                  <div className="space-y-3">
                    {Object.entries(analytics.platformBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([platform, count]) => {
                        const max = Math.max(...Object.values(analytics.platformBreakdown));
                        const pct = max > 0 ? (count / max) * 100 : 0;
                        return (
                          <div key={platform}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className={`font-medium capitalize ${PLATFORM_COLORS[platform] || "text-slate-300"}`}>{platform}</span>
                              <span className="text-slate-400">{count} posts</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-sky-400"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Settings ────────────────────────────────────────────────────── */}
          {activeTab === "settings" && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-semibold text-slate-50 mb-1">Settings</h1>
                <p className="text-sm text-slate-400">Your account and plan details.</p>
              </div>

              <div className="glass rounded-2xl border border-slate-700/80 p-5 mb-4">
                <h3 className="text-sm font-semibold text-slate-50 mb-4">Account</h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  {[
                    { label: "Username", value: user?.username || "" },
                    { label: "Email", value: user?.email || "" },
                    { label: "Plan", value: user?.plan || "starter" },
                    { label: "Posts used (this month)", value: String(user?.postsUsedThisMonth ?? 0) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-900/40 rounded-xl px-4 py-3">
                      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                      <p className="font-medium text-slate-100 capitalize">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl border border-slate-700/80 p-5">
                <h3 className="text-sm font-semibold text-slate-50 mb-2">Upgrade your plan</h3>
                <p className="text-xs text-slate-400 mb-4">Unlock unlimited posts, auto-approve, and brand voice learning.</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { plan: "Starter", price: "$0", features: ["2 accounts", "5 posts/month", "Manual approval"] },
                    { plan: "Pro", price: "$29/mo", features: ["Unlimited accounts", "Unlimited posts", "Auto-approve", "Brand voice AI"], highlight: true },
                    { plan: "Enterprise", price: "Custom", features: ["Multi-team", "Custom integrations", "SLA & compliance"] },
                  ].map(({ plan, price, features, highlight }) => (
                    <div key={plan} className={`rounded-xl border p-4 ${highlight ? "border-emerald-500/40 bg-emerald-500/5" : "border-slate-700/60 bg-slate-900/30"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-100">{plan}</span>
                        <span className="text-sm text-slate-300">{price}</span>
                      </div>
                      <ul className="space-y-1 text-xs text-slate-400">
                        {features.map((f) => (
                          <li key={f} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      {highlight && (
                        <button className="w-full mt-3 btn-gradient text-xs font-semibold text-slate-900 rounded-full py-1.5 shadow">
                          Upgrade to Pro
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
