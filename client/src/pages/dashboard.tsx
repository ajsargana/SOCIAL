import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  LayoutDashboard, Zap, FileText, CheckCircle2, BarChart2,
  LogOut, Play, X, RefreshCw, Bot, AlertCircle,
  TrendingUp, Clock, Settings, Plus, Sparkles, Eye,
  Instagram, Linkedin, Twitter, Youtube, Send, Calendar,
  ChevronDown, Lock, Shield, User, Key, Bell, Trash2,
  ArrowUpRight, Activity, Target, Layers, Edit3, Check
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Post {
  id: string; platform: string; caption: string; status: string;
  scheduledAt: string | null; postedAt: string | null; createdAt: string;
  engagement: { likes?: number; comments?: number; shares?: number; views?: number } | null;
}
interface Decision {
  id: string; decisionType: string; status: string; reasoning: string | null;
  suggestedContent: { topic?: string; platform?: string; scheduledTime?: string } | null;
  createdAt: string;
}
interface AutopilotSettings {
  enabled: boolean; autoApprove: boolean; maxPostsPerDay: number;
  postingGapHours: number; brandVoice: string | null; noGoTopics: string[] | null;
}
interface Analytics {
  totalPosts: number; postsLast30Days: number; postsLast7Days: number;
  totalEngagement: number; avgEngagement: number;
  platformBreakdown: Record<string, number>; connectedAccounts: number;
  pendingDecisions: number; autoPosted: number; pendingApproval: number; scheduled: number;
}
interface SocialAccount { id: string; platform: string; handle: string; isConnected: boolean; }

// ─── Constants ───────────────────────────────────────────────────────────────
const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "autopilot", label: "Autopilot", icon: Zap },
  { id: "posts", label: "Posts", icon: FileText },
  { id: "decisions", label: "Decisions", icon: Bot },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "settings", label: "Settings", icon: Settings },
];

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "from-pink-500 to-rose-500",
  tiktok: "from-slate-800 to-slate-900",
  x: "from-slate-600 to-slate-700",
  linkedin: "from-blue-600 to-blue-700",
  youtube: "from-red-600 to-red-700",
};

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram, linkedin: Linkedin, x: Twitter, youtube: Youtube,
};

const STATUS_BADGE: Record<string, string> = {
  pending_approval: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  scheduled: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  posted: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  rejected: "bg-red-500/20 text-red-300 border-red-500/30",
  pending: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const BRAND_VOICES = ["professional","casual","enthusiastic","minimal","storytelling"];
const PLATFORMS = ["instagram","tiktok","x","linkedin","youtube"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function PlatformIcon({ platform, size = 14 }: { platform: string; size?: number }) {
  const Icon = PLATFORM_ICONS[platform] || Send;
  return <Icon size={size} />;
}

// ─── Create Post Modal ────────────────────────────────────────────────────────
function CreatePostModal({ accounts, onClose, onCreated }: {
  accounts: SocialAccount[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [platform, setPlatform] = useState(accounts[0]?.platform || "instagram");
  const [caption, setCaption] = useState("");
  const [topic, setTopic] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const generateCaption = async () => {
    if (!topic.trim()) { toast({ title: "Enter a topic first", variant: "destructive" }); return; }
    setIsGenerating(true);
    try {
      const data = await apiRequest("POST", "/api/caption/generate", { platform, topic });
      setCaption(data.caption);
    } catch { toast({ title: "Generation failed", variant: "destructive" }); }
    finally { setIsGenerating(false); }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const account = accounts.find(a => a.platform === platform) || accounts[0];
      return apiRequest("POST", "/api/posts", {
        platform, caption, socialAccountId: account.id,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        status: scheduledAt ? "scheduled" : "pending_approval",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/posts"] });
      qc.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Post created!" });
      onCreated();
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="glass w-full max-w-lg rounded-2xl border border-slate-700/80 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-100">Create post</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition"><X size={18} /></button>
        </div>

        {/* Platform selector */}
        <div className="mb-4">
          <label className="block text-xs text-slate-400 mb-2">Platform</label>
          <div className="flex gap-2 flex-wrap">
            {accounts.map(a => (
              <button key={a.id} onClick={() => setPlatform(a.platform)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  platform === a.platform ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300" : "border-slate-700 text-slate-400 hover:border-slate-500"
                }`}>
                <PlatformIcon platform={a.platform} size={12} />
                <span>{a.platform}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Topic + generate */}
        <div className="mb-3">
          <label className="block text-xs text-slate-400 mb-2">Topic (for AI generation)</label>
          <div className="flex gap-2">
            <input value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="e.g. product launch, tips & tricks..."
              className="flex-1 bg-slate-900/50 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
            <button onClick={generateCaption} disabled={isGenerating}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium hover:from-emerald-500/30 hover:to-sky-500/30 transition disabled:opacity-50">
              <Sparkles size={13} />
              {isGenerating ? "..." : "Generate"}
            </button>
          </div>
        </div>

        {/* Caption editor */}
        <div className="mb-4">
          <label className="block text-xs text-slate-400 mb-2">Caption</label>
          <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={4}
            placeholder="Write your caption or generate one with AI..."
            className="w-full bg-slate-900/50 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none" />
          <p className="text-right text-[10px] text-slate-600 mt-1">{caption.length} chars</p>
        </div>

        {/* Schedule picker */}
        <div className="mb-5">
          <label className="block text-xs text-slate-400 mb-2">Schedule (optional — leave blank to queue for approval)</label>
          <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-full border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 transition">Cancel</button>
          <button onClick={() => createMutation.mutate()} disabled={!caption.trim() || createMutation.isPending}
            className="flex-1 btn-gradient text-sm font-semibold text-slate-900 rounded-full py-2.5 disabled:opacity-50 transition">
            {createMutation.isPending ? "Creating..." : scheduledAt ? "Schedule post" : "Send for approval"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Plan Upgrade Modal ───────────────────────────────────────────────────────
function UpgradeModal({ currentPlan, onClose }: { currentPlan: string; onClose: () => void }) {
  const plans = [
    { id: "starter", name: "Starter", price: "Free", color: "border-slate-700", features: ["2 social accounts", "5 posts/month", "Manual approval only", "Basic analytics"] },
    { id: "pro", name: "Pro", price: "$29/mo", color: "border-emerald-500/60", badge: "Most popular", features: ["Unlimited accounts", "Unlimited posts", "Auto-approve AI posts", "Brand voice learning", "Priority support"] },
    { id: "enterprise", name: "Enterprise", price: "$99/mo", color: "border-purple-500/60", features: ["Everything in Pro", "Custom integrations", "Dedicated account manager", "SLA guarantee", "White-label option"] },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="glass w-full max-w-2xl rounded-2xl border border-slate-700/80 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Upgrade your plan</h3>
            <p className="text-xs text-slate-400 mt-0.5">You're on <span className="text-emerald-400 font-medium capitalize">{currentPlan}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan.id} className={`relative rounded-xl border p-4 ${plan.color} ${plan.id === currentPlan ? "opacity-60" : ""}`}>
              {plan.badge && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{plan.badge}</span>
              )}
              <p className="text-sm font-semibold text-slate-100 mb-0.5">{plan.name}</p>
              <p className="text-xl font-bold text-slate-50 mb-3">{plan.price}</p>
              <ul className="space-y-1.5 mb-4">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-slate-300">
                    <Check size={11} className="text-emerald-400 shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              {plan.id !== currentPlan ? (
                <button className="w-full py-2 rounded-lg text-xs font-semibold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 transition">
                  {plan.id === "starter" ? "Downgrade" : "Upgrade"}
                </button>
              ) : (
                <div className="w-full py-2 rounded-lg text-xs font-semibold text-center text-slate-500 bg-slate-800/50">Current plan</div>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">Stripe payments coming soon — get in touch to unlock Pro early.</p>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [tab, setTab] = useState("overview");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  // ── Queries ──
  const { data: posts = [] } = useQuery<Post[]>({ queryKey: ["/api/posts"] });
  const { data: decisions = [] } = useQuery<Decision[]>({ queryKey: ["/api/decisions"] });
  const { data: analytics } = useQuery<Analytics>({ queryKey: ["/api/analytics"] });
  const { data: autopilot } = useQuery<AutopilotSettings>({ queryKey: ["/api/autopilot"] });
  const { data: accounts = [] } = useQuery<SocialAccount[]>({ queryKey: ["/api/social-accounts"] });

  // ── Mutations ──
  const evaluateMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/decisions/evaluate"),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/decisions"] });
      qc.invalidateQueries({ queryKey: ["/api/posts"] });
      qc.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: data.shouldPost ? "Post queued by AI!" : "No action needed", description: data.reasoning });
    },
    onError: () => toast({ title: "Evaluation failed", variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/posts/${id}/approve`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/posts"] }); toast({ title: "Post approved!" }); },
  });
  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/posts/${id}/reject`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/posts"] }); toast({ title: "Post rejected" }); },
  });
  const publishNowMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/posts/${id}/publish`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/posts"] }); toast({ title: "Published!" }); },
  });
  const deleteAccountMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/social-accounts/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/social-accounts"] }); toast({ title: "Account removed" }); },
  });
  const updateAutopilotMutation = useMutation({
    mutationFn: (data: Partial<AutopilotSettings>) => apiRequest("PATCH", "/api/autopilot", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/autopilot"] }); toast({ title: "Settings saved" }); },
  });

  const pendingPosts = posts.filter(p => p.status === "pending_approval");
  const plan = (user as { plan?: string })?.plan || "starter";
  const postsUsed = (user as { postsUsedThisMonth?: number })?.postsUsedThisMonth || 0;
  const planLimit = plan === "starter" ? 5 : Infinity;
  const usagePercent = planLimit === Infinity ? 0 : Math.min(100, (postsUsed / planLimit) * 100);

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside className="flex flex-col w-56 h-full border-r border-slate-800/80 px-3 py-5 gap-1" style={{ background: "var(--bg-base)" }}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mb-5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 via-sky-500 to-purple-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
          <span className="font-bold text-xs text-white">FP</span>
        </div>
        <span className="font-semibold text-slate-100">FlowPulse</span>
      </div>

      {NAV.map(item => {
        const Icon = item.icon;
        const active = tab === item.id;
        return (
          <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false); }}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left relative ${
              active ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}>
            <Icon size={16} />
            {item.label}
            {item.id === "decisions" && pendingPosts.length > 0 && (
              <span className="ml-auto text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-1.5 py-0.5 font-semibold">{pendingPosts.length}</span>
            )}
          </button>
        );
      })}

      <div className="mt-auto space-y-2 px-2">
        {/* Usage meter */}
        {plan === "starter" && (
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-slate-400">Posts this month</span>
              <span className="text-[10px] text-slate-300 font-medium">{postsUsed}/{planLimit}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all" style={{ width: `${usagePercent}%` }} />
            </div>
            {usagePercent >= 80 && (
              <button onClick={() => setShowUpgrade(true)} className="mt-2 w-full text-[10px] text-emerald-300 font-medium hover:text-emerald-200 transition">
                Upgrade for unlimited →
              </button>
            )}
          </div>
        )}

        {/* Plan badge */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-400 to-sky-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.username?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">{user?.username}</p>
            <p className="text-[10px] text-slate-500 capitalize">{plan} plan</p>
          </div>
        </div>

        <button onClick={() => { logout.mutate(); navigate("/"); }}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition px-0.5 w-full">
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </aside>
  );

  // ── Tab: Overview ─────────────────────────────────────────────────────────
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Posts published", value: analytics?.totalPosts ?? 0, sub: `+${analytics?.postsLast7Days ?? 0} this week`, icon: FileText, color: "text-emerald-400" },
          { label: "Accounts", value: analytics?.connectedAccounts ?? accounts.length, sub: "connected", icon: Layers, color: "text-sky-400" },
          { label: "Engagement", value: analytics?.totalEngagement ?? 0, sub: `avg ${analytics?.avgEngagement ?? 0}/post`, icon: Activity, color: "text-purple-400" },
          { label: "AI decisions", value: analytics?.autoPosted ?? 0, sub: `${analytics?.pendingDecisions ?? 0} pending`, icon: Target, color: "text-amber-400" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass rounded-xl border border-slate-700/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400">{stat.label}</span>
                <Icon size={15} className={stat.color} />
              </div>
              <p className="text-2xl font-bold text-slate-50">{stat.value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Pending approvals + quick actions */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Approval inbox */}
        <div className="glass rounded-xl border border-slate-700/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-400" /> Pending approval
              {pendingPosts.length > 0 && <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] px-1.5 py-0.5">{pendingPosts.length}</span>}
            </h3>
          </div>
          {pendingPosts.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No posts awaiting approval</p>
          ) : (
            <div className="space-y-3">
              {pendingPosts.slice(0, 3).map(post => (
                <div key={post.id} className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border bg-gradient-to-r ${PLATFORM_COLORS[post.platform] || "from-slate-700 to-slate-800"} text-white`}>
                      <PlatformIcon platform={post.platform} size={10} /> {post.platform}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-auto">{timeAgo(post.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-300 mb-2 line-clamp-2">{post.caption}</p>
                  <div className="flex gap-2">
                    <button onClick={() => approveMutation.mutate(post.id)} disabled={approveMutation.isPending}
                      className="flex-1 py-1.5 rounded-lg text-[11px] font-medium bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 transition">
                      <Check size={11} className="inline mr-1" />Approve
                    </button>
                    <button onClick={() => rejectMutation.mutate(post.id)} disabled={rejectMutation.isPending}
                      className="flex-1 py-1.5 rounded-lg text-[11px] font-medium bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition">
                      <X size={11} className="inline mr-1" />Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="glass rounded-xl border border-slate-700/60 p-5">
          <h3 className="text-sm font-semibold text-slate-100 mb-4">Quick actions</h3>
          <div className="space-y-2.5">
            <button onClick={() => setShowCreatePost(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition text-sm font-medium">
              <Plus size={16} /> Create post
            </button>
            <button onClick={() => evaluateMutation.mutate()} disabled={evaluateMutation.isPending}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 transition text-sm font-medium disabled:opacity-60">
              <RefreshCw size={16} className={evaluateMutation.isPending ? "animate-spin" : ""} />
              {evaluateMutation.isPending ? "Evaluating..." : "Run AI evaluation"}
            </button>
            <button onClick={() => setTab("autopilot")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition text-sm font-medium">
              <Zap size={16} /> {autopilot?.enabled ? "Autopilot is ON" : "Enable autopilot"}
            </button>
            {plan === "starter" && (
              <button onClick={() => setShowUpgrade(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition text-sm font-medium">
                <ArrowUpRight size={16} /> Upgrade plan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recent posts */}
      <div className="glass rounded-xl border border-slate-700/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-100">Recent posts</h3>
          <button onClick={() => setTab("posts")} className="text-xs text-emerald-400 hover:text-emerald-300 transition">View all →</button>
        </div>
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <FileText size={24} className="text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No posts yet. Create your first post!</p>
            <button onClick={() => setShowCreatePost(true)} className="mt-3 btn-gradient text-xs font-semibold text-slate-900 rounded-full px-4 py-2">Create post</button>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.slice(0, 5).map(post => (
              <div key={post.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-800/60 transition">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br ${PLATFORM_COLORS[post.platform] || "from-slate-700 to-slate-800"} text-white shrink-0`}>
                  <PlatformIcon platform={post.platform} size={12} />
                </span>
                <p className="flex-1 text-xs text-slate-300 truncate">{post.caption}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_BADGE[post.status] || STATUS_BADGE.pending}`}>{post.status.replace("_", " ")}</span>
                <span className="text-[10px] text-slate-600 shrink-0">{timeAgo(post.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Tab: Autopilot ────────────────────────────────────────────────────────
  const AutopilotTab = () => {
    const [local, setLocal] = useState<AutopilotSettings>(autopilot || {
      enabled: false, autoApprove: false, maxPostsPerDay: 3, postingGapHours: 6, brandVoice: "professional", noGoTopics: [],
    });
    const [topicInput, setTopicInput] = useState((local.noGoTopics || []).join(", "));

    const save = () => {
      updateAutopilotMutation.mutate({
        ...local,
        noGoTopics: topicInput.split(",").map(t => t.trim()).filter(Boolean),
      });
    };

    return (
      <div className="space-y-5 max-w-2xl">
        <div className="glass rounded-xl border border-slate-700/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Autopilot engine</h3>
              <p className="text-xs text-slate-400 mt-0.5">AI monitors your posting gaps and creates content autonomously</p>
            </div>
            <button onClick={() => setLocal(l => ({ ...l, enabled: !l.enabled }))}
              className={`relative w-12 h-6 rounded-full transition-all ${local.enabled ? "bg-emerald-500" : "bg-slate-700"}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${local.enabled ? "left-6" : "left-0.5"}`} />
            </button>
          </div>

          {!local.enabled && (
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-4">
              <AlertCircle size={12} /> Autopilot is off. Enable to let AI fill your content gaps.
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-xs text-slate-400 mb-2">Max posts per day: <span className="text-slate-200 font-medium">{local.maxPostsPerDay}</span></label>
              <input type="range" min={1} max={10} value={local.maxPostsPerDay}
                onChange={e => setLocal(l => ({ ...l, maxPostsPerDay: Number(e.target.value) }))}
                className="w-full accent-emerald-500" />
              <div className="flex justify-between text-[10px] text-slate-600 mt-1"><span>1</span><span>10</span></div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">Minimum gap between posts: <span className="text-slate-200 font-medium">{local.postingGapHours}h</span></label>
              <input type="range" min={1} max={48} value={local.postingGapHours}
                onChange={e => setLocal(l => ({ ...l, postingGapHours: Number(e.target.value) }))}
                className="w-full accent-sky-500" />
              <div className="flex justify-between text-[10px] text-slate-600 mt-1"><span>1h</span><span>48h</span></div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">Brand voice</label>
              <div className="flex flex-wrap gap-2">
                {BRAND_VOICES.map(v => (
                  <button key={v} onClick={() => setLocal(l => ({ ...l, brandVoice: v }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize ${
                      local.brandVoice === v ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300" : "border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}>{v}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">No-go topics</label>
              <input value={topicInput} onChange={e => setTopicInput(e.target.value)}
                placeholder="politics, competitors, pricing..."
                className="w-full bg-slate-900/50 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/30" />
            </div>

            {plan !== "starter" && (
              <div onClick={() => setLocal(l => ({ ...l, autoApprove: !l.autoApprove }))}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                  local.autoApprove ? "border-emerald-500/60 bg-emerald-500/10" : "border-slate-700/80"
                }`}>
                <div>
                  <p className="text-sm font-medium text-slate-100">Auto-approve posts</p>
                  <p className="text-xs text-slate-400">Skip manual review — AI posts directly</p>
                </div>
                <div className={`w-10 h-5 rounded-full transition-all relative ${local.autoApprove ? "bg-emerald-500" : "bg-slate-700"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${local.autoApprove ? "left-5" : "left-0.5"}`} />
                </div>
              </div>
            )}

            {plan === "starter" && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3">
                <Lock size={13} className="text-amber-400 shrink-0" />
                Auto-approve is a Pro feature. <button onClick={() => setShowUpgrade(true)} className="text-emerald-400 hover:text-emerald-300 transition ml-1">Upgrade →</button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={save} disabled={updateAutopilotMutation.isPending}
            className="btn-gradient text-sm font-semibold text-slate-900 rounded-full px-6 py-2.5 disabled:opacity-50 transition">
            {updateAutopilotMutation.isPending ? "Saving..." : "Save settings"}
          </button>
        </div>
      </div>
    );
  };

  // ── Tab: Posts ────────────────────────────────────────────────────────────
  const PostsTab = () => {
    const [filter, setFilter] = useState<string>("all");
    const statuses = ["all", "pending_approval", "scheduled", "posted", "rejected"];
    const filtered = filter === "all" ? posts : posts.filter(p => p.status === filter);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 flex-wrap">
            {statuses.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize ${
                  filter === s ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300" : "border-slate-700 text-slate-400 hover:border-slate-500"
                }`}>{s.replace("_", " ")}</button>
            ))}
          </div>
          <button onClick={() => setShowCreatePost(true)}
            className="flex items-center gap-1.5 btn-gradient text-xs font-semibold text-slate-900 rounded-full px-4 py-2">
            <Plus size={13} /> New post
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 glass rounded-xl border border-slate-700/60">
            <FileText size={24} className="text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No posts found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(post => (
              <div key={post.id} className="glass rounded-xl border border-slate-700/60 p-4">
                <div className="flex items-start gap-3">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${PLATFORM_COLORS[post.platform] || "from-slate-700 to-slate-800"} text-white shrink-0 mt-0.5`}>
                    <PlatformIcon platform={post.platform} size={13} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-300 capitalize">{post.platform}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_BADGE[post.status] || STATUS_BADGE.pending}`}>{post.status.replace("_", " ")}</span>
                      <span className="text-[10px] text-slate-600 ml-auto">{timeAgo(post.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-300">{post.caption}</p>
                    {post.scheduledAt && (
                      <p className="text-[10px] text-sky-400 mt-1 flex items-center gap-1">
                        <Calendar size={10} /> {new Date(post.scheduledAt).toLocaleString()}
                      </p>
                    )}
                    {post.engagement && Object.keys(post.engagement).length > 0 && (
                      <div className="flex gap-3 mt-1.5">
                        {Object.entries(post.engagement).map(([k, v]) => v != null && (
                          <span key={k} className="text-[10px] text-slate-500">{k}: <span className="text-slate-300">{v}</span></span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {post.status === "pending_approval" && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-800">
                    <button onClick={() => approveMutation.mutate(post.id)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 transition">
                      Approve
                    </button>
                    <button onClick={() => publishNowMutation.mutate(post.id)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-sky-500/20 border border-sky-500/30 text-sky-300 hover:bg-sky-500/30 transition">
                      Publish now
                    </button>
                    <button onClick={() => rejectMutation.mutate(post.id)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition">
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Tab: Decisions ────────────────────────────────────────────────────────
  const DecisionsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">AI decision log</h3>
        <button onClick={() => evaluateMutation.mutate()} disabled={evaluateMutation.isPending}
          className="flex items-center gap-1.5 text-xs bg-sky-500/15 border border-sky-500/30 text-sky-300 rounded-full px-3 py-1.5 hover:bg-sky-500/25 transition disabled:opacity-60">
          <Play size={12} className={evaluateMutation.isPending ? "animate-pulse" : ""} />
          {evaluateMutation.isPending ? "Evaluating..." : "Trigger evaluation"}
        </button>
      </div>

      {decisions.length === 0 ? (
        <div className="text-center py-12 glass rounded-xl border border-slate-700/60">
          <Bot size={24} className="text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400 mb-1">No decisions yet</p>
          <p className="text-xs text-slate-500">Run an evaluation to let the AI assess your posting needs</p>
        </div>
      ) : (
        <div className="space-y-2">
          {decisions.map(d => (
            <div key={d.id} className="glass rounded-xl border border-slate-700/60 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bot size={13} className="text-purple-400" />
                <span className="text-xs font-medium text-slate-200 capitalize">{d.decisionType.replace("_", " ")}</span>
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                  d.status === "approved" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                  d.status === "rejected" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                  "bg-amber-500/20 text-amber-300 border-amber-500/30"
                }`}>{d.status}</span>
                <span className="text-[10px] text-slate-600">{timeAgo(d.createdAt)}</span>
              </div>
              {d.reasoning && <p className="text-xs text-slate-400 mb-2">{d.reasoning}</p>}
              {d.suggestedContent && Object.keys(d.suggestedContent).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {d.suggestedContent.platform && <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full capitalize">{d.suggestedContent.platform}</span>}
                  {d.suggestedContent.topic && <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{d.suggestedContent.topic}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── Tab: Analytics ────────────────────────────────────────────────────────
  const AnalyticsTab = () => {
    const breakdown = analytics?.platformBreakdown || {};
    const maxVal = Math.max(...Object.values(breakdown), 1);

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Total posts", value: analytics?.totalPosts ?? 0, icon: FileText },
            { label: "Posts (30 days)", value: analytics?.postsLast30Days ?? 0, icon: TrendingUp },
            { label: "Posts (7 days)", value: analytics?.postsLast7Days ?? 0, icon: Clock },
            { label: "Total engagement", value: analytics?.totalEngagement ?? 0, icon: Activity },
            { label: "Avg engagement/post", value: analytics?.avgEngagement ?? 0, icon: Target },
            { label: "Auto-posted by AI", value: analytics?.autoPosted ?? 0, icon: Bot },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="glass rounded-xl border border-slate-700/60 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={13} className="text-emerald-400" />
                  <span className="text-xs text-slate-400">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-slate-50">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {Object.keys(breakdown).length > 0 && (
          <div className="glass rounded-xl border border-slate-700/60 p-5">
            <h4 className="text-sm font-semibold text-slate-100 mb-4">Posts by platform (last 30 days)</h4>
            <div className="space-y-3">
              {Object.entries(breakdown).sort(([, a], [, b]) => b - a).map(([platform, count]) => (
                <div key={platform} className="flex items-center gap-3">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br ${PLATFORM_COLORS[platform] || "from-slate-700 to-slate-800"} text-white shrink-0`}>
                    <PlatformIcon platform={platform} size={12} />
                  </span>
                  <span className="text-xs text-slate-300 w-20 capitalize">{platform}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all" style={{ width: `${(count / maxVal) * 100}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.keys(breakdown).length === 0 && (
          <div className="text-center py-10 glass rounded-xl border border-slate-700/60">
            <BarChart2 size={24} className="text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Analytics will appear after your first posts</p>
          </div>
        )}
      </div>
    );
  };

  // ── Tab: Settings ─────────────────────────────────────────────────────────
  const SettingsTab = () => {
    const [username, setUsername] = useState(user?.username || "");
    const [email, setEmail] = useState((user as { email?: string })?.email || "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const { toast } = useToast();
    const qc = useQueryClient();

    const profileMutation = useMutation({
      mutationFn: () => apiRequest("PATCH", "/api/profile", { username, email }),
      onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/auth/me"] }); toast({ title: "Profile updated!" }); },
      onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
    });

    const passwordMutation = useMutation({
      mutationFn: () => apiRequest("POST", "/api/profile/change-password", { currentPassword, newPassword }),
      onSuccess: () => { setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); toast({ title: "Password changed!" }); },
      onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
    });

    const handlePasswordChange = () => {
      if (newPassword !== confirmPassword) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
      if (newPassword.length < 6) { toast({ title: "Password too short", variant: "destructive" }); return; }
      passwordMutation.mutate();
    };

    return (
      <div className="space-y-5 max-w-2xl">
        {/* Profile */}
        <div className="glass rounded-xl border border-slate-700/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={15} className="text-sky-400" />
            <h3 className="text-sm font-semibold text-slate-100">Profile</h3>
          </div>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 via-sky-500 to-purple-500 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-emerald-500/20">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">{user?.username}</p>
              <p className="text-xs text-slate-400 capitalize">{plan} plan · {postsUsed} posts used this month</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                className="w-full bg-slate-900/50 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
            </div>
            <div className="flex justify-end">
              <button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}
                className="btn-gradient text-xs font-semibold text-slate-900 rounded-full px-5 py-2 disabled:opacity-50">
                {profileMutation.isPending ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="glass rounded-xl border border-slate-700/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Key size={15} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-100">Change password</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "Current password", val: currentPassword, set: setCurrentPassword },
              { label: "New password", val: newPassword, set: setNewPassword },
              { label: "Confirm new password", val: confirmPassword, set: setConfirmPassword },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs text-slate-400 mb-1.5">{f.label}</label>
                <input type="password" value={f.val} onChange={e => f.set(e.target.value)} placeholder="••••••••"
                  className="w-full bg-slate-900/50 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
              </div>
            ))}
            <div className="flex justify-end">
              <button onClick={handlePasswordChange} disabled={passwordMutation.isPending}
                className="text-xs font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-full px-5 py-2 hover:bg-amber-500/25 transition disabled:opacity-50">
                {passwordMutation.isPending ? "Updating..." : "Update password"}
              </button>
            </div>
          </div>
        </div>

        {/* Connected accounts */}
        <div className="glass rounded-xl border border-slate-700/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers size={15} className="text-purple-400" />
              <h3 className="text-sm font-semibold text-slate-100">Connected accounts</h3>
            </div>
            {plan === "starter" && accounts.length >= 2 && (
              <button onClick={() => setShowUpgrade(true)} className="text-xs text-emerald-400 hover:text-emerald-300 transition">+ Upgrade for more</button>
            )}
          </div>
          {accounts.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No accounts connected. Go through onboarding to add accounts.</p>
          ) : (
            <div className="space-y-2">
              {accounts.map(a => (
                <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-900/40">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${PLATFORM_COLORS[a.platform] || "from-slate-700 to-slate-800"} text-white shrink-0`}>
                    <PlatformIcon platform={a.platform} size={13} />
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-200 capitalize">{a.platform}</p>
                    <p className="text-[10px] text-slate-500">{a.handle}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${a.isConnected ? "bg-emerald-400" : "bg-red-400"}`} />
                  <button onClick={() => { if (confirm("Remove this account?")) deleteAccountMutation.mutate(a.id); }}
                    className="text-slate-600 hover:text-red-400 transition p-1">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plan */}
        <div className="glass rounded-xl border border-slate-700/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={15} className="text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-100">Subscription plan</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-100 capitalize">{plan}</p>
              <p className="text-xs text-slate-400">
                {plan === "starter" ? `${postsUsed}/5 posts used · 2 accounts max` : "Unlimited posts & accounts"}
              </p>
            </div>
            {plan === "starter" && (
              <button onClick={() => setShowUpgrade(true)}
                className="btn-gradient text-xs font-semibold text-slate-900 rounded-full px-4 py-2 flex items-center gap-1.5">
                <ArrowUpRight size={12} /> Upgrade
              </button>
            )}
          </div>
        </div>

        {/* Danger zone */}
        <div className="glass rounded-xl border border-red-500/20 p-5">
          <h3 className="text-sm font-semibold text-red-400 mb-3">Danger zone</h3>
          <p className="text-xs text-slate-400 mb-3">Permanently delete your account and all data. This cannot be undone.</p>
          <button className="text-xs text-red-400 border border-red-500/30 bg-red-500/10 rounded-full px-4 py-2 hover:bg-red-500/20 transition">
            Delete account
          </button>
        </div>
      </div>
    );
  };

  // ── Layout ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-56">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-400 hover:text-slate-200">
              <Layers size={18} />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-slate-100 capitalize">
                {NAV.find(n => n.id === tab)?.label || "Dashboard"}
              </h1>
              <p className="text-[10px] text-slate-500 hidden sm:block">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingPosts.length > 0 && (
              <button onClick={() => setTab("posts")} className="relative p-2 text-amber-400 hover:text-amber-300 transition">
                <Bell size={16} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              </button>
            )}
            <button onClick={() => setShowCreatePost(true)}
              className="flex items-center gap-1.5 btn-gradient text-xs font-semibold text-slate-900 rounded-full px-3.5 py-2">
              <Plus size={13} /> Post
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {tab === "overview" && <OverviewTab />}
          {tab === "autopilot" && <AutopilotTab />}
          {tab === "posts" && <PostsTab />}
          {tab === "decisions" && <DecisionsTab />}
          {tab === "analytics" && <AnalyticsTab />}
          {tab === "settings" && <SettingsTab />}
        </div>
      </main>

      {/* Modals */}
      {showCreatePost && accounts.length > 0 && (
        <CreatePostModal accounts={accounts} onClose={() => setShowCreatePost(false)} onCreated={() => setShowCreatePost(false)} />
      )}
      {showCreatePost && accounts.length === 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="glass w-full max-w-sm rounded-2xl border border-slate-700/80 p-6 text-center">
            <AlertCircle size={32} className="text-amber-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-100 mb-2">No accounts connected</h3>
            <p className="text-xs text-slate-400 mb-4">Connect a social account first to create posts.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowCreatePost(false)} className="flex-1 py-2 rounded-full border border-slate-700 text-xs font-medium text-slate-300">Cancel</button>
              <button onClick={() => { setShowCreatePost(false); setTab("settings"); }} className="flex-1 btn-gradient text-xs font-semibold text-slate-900 rounded-full py-2">Go to Settings</button>
            </div>
          </div>
        </div>
      )}
      {showUpgrade && <UpgradeModal currentPlan={plan} onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}
