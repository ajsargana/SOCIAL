import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, ChevronRight, Zap, Globe, Mic, Bot } from "lucide-react";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "from-pink-500 to-rose-500", dot: "bg-pink-400" },
  { id: "tiktok", label: "TikTok", color: "from-slate-800 to-slate-900", dot: "bg-white" },
  { id: "x", label: "X (Twitter)", color: "from-slate-700 to-slate-800", dot: "bg-sky-400" },
  { id: "linkedin", label: "LinkedIn", color: "from-blue-600 to-blue-700", dot: "bg-blue-300" },
  { id: "youtube", label: "YouTube", color: "from-red-600 to-red-700", dot: "bg-red-300" },
];

const BRAND_VOICES = [
  { id: "professional", label: "Professional", desc: "Authoritative and polished" },
  { id: "casual", label: "Casual", desc: "Friendly and approachable" },
  { id: "enthusiastic", label: "Enthusiastic", desc: "High energy and motivating" },
  { id: "minimal", label: "Minimal", desc: "Concise and no-frills" },
  { id: "storytelling", label: "Storytelling", desc: "Narrative-driven and personal" },
];

const STEPS = [
  { icon: Globe, label: "Connect accounts" },
  { icon: Mic, label: "Brand voice" },
  { icon: Bot, label: "Autopilot rules" },
  { icon: Zap, label: "Go live" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [handles, setHandles] = useState<Record<string, string>>({});
  const [brandVoice, setBrandVoice] = useState("professional");
  const [noGoTopics, setNoGoTopics] = useState("");
  const [maxPostsPerDay, setMaxPostsPerDay] = useState(3);
  const [postingGapHours, setPostingGapHours] = useState(6);
  const [autoApprove, setAutoApprove] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const connectPlatform = (platformId: string) => {
    setConnectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((p) => p !== platformId) : [...prev, platformId]
    );
  };

  const saveAccountsMutation = useMutation({
    mutationFn: async () => {
      for (const platformId of connectedPlatforms) {
        const handle = handles[platformId] || `@${user?.username || "user"}`;
        await apiRequest("POST", "/api/social-accounts", {
          platform: platformId,
          handle,
        });
      }
    },
  });

  const saveAutopilotMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/autopilot", {
        enabled: true,
        autoApprove,
        maxPostsPerDay,
        postingGapHours,
        brandVoice,
        noGoTopics: noGoTopics.split(",").map((t) => t.trim()).filter(Boolean),
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/onboarding/complete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/dashboard");
    },
  });

  const handleNext = async () => {
    if (step === 0) {
      if (connectedPlatforms.length === 0) {
        toast({ title: "Select at least one platform", variant: "destructive" });
        return;
      }
      await saveAccountsMutation.mutateAsync();
    }
    if (step === 2) {
      await saveAutopilotMutation.mutateAsync();
    }
    if (step === 3) {
      await completeMutation.mutateAsync();
      return;
    }
    setStep((s) => s + 1);
  };

  const isPending =
    saveAccountsMutation.isPending ||
    saveAutopilotMutation.isPending ||
    completeMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: "var(--bg-base)" }}>
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-400 via-sky-500 to-purple-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
          <span className="font-bold text-sm text-white">FP</span>
        </div>
        <span className="font-semibold text-slate-100 text-xl">FlowPulse</span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex items-center">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  i === step
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                    : i < step
                    ? "text-slate-400"
                    : "text-slate-600"
                }`}
              >
                {i < step ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-px mx-1 ${i < step ? "bg-emerald-600" : "bg-slate-700"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="w-full max-w-lg">
        <div className="glass rounded-2xl border border-slate-700/80 p-6 sm:p-8 shadow-soft">
          {/* Step 0: Connect accounts */}
          {step === 0 && (
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-300 mb-1.5">Step 1</p>
              <h2 className="text-xl font-semibold text-slate-50 mb-1">Connect your social accounts</h2>
              <p className="text-sm text-slate-400 mb-6">Select the platforms FlowPulse will manage for you.</p>

              <div className="space-y-3">
                {PLATFORMS.map((platform) => {
                  const selected = connectedPlatforms.includes(platform.id);
                  return (
                    <div key={platform.id}>
                      <button
                        onClick={() => connectPlatform(platform.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                          selected
                            ? "border-emerald-500/60 bg-emerald-500/10"
                            : "border-slate-700/80 bg-slate-900/40 hover:bg-slate-800/60"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${platform.dot}`} />
                        <span className="text-sm font-medium text-slate-100 flex-1">{platform.label}</span>
                        {selected && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                      </button>
                      {selected && (
                        <input
                          type="text"
                          placeholder={`@your${platform.id}handle`}
                          value={handles[platform.id] || ""}
                          onChange={(e) => setHandles((h) => ({ ...h, [platform.id]: e.target.value }))}
                          className="w-full mt-1.5 bg-slate-900/50 border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1: Brand voice */}
          {step === 1 && (
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-sky-300 mb-1.5">Step 2</p>
              <h2 className="text-xl font-semibold text-slate-50 mb-1">Set your brand voice</h2>
              <p className="text-sm text-slate-400 mb-6">FlowPulse will generate captions that match your tone.</p>

              <div className="space-y-2.5 mb-6">
                {BRAND_VOICES.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setBrandVoice(voice.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
                      brandVoice === voice.id
                        ? "border-sky-500/60 bg-sky-500/10"
                        : "border-slate-700/80 bg-slate-900/40 hover:bg-slate-800/60"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-100">{voice.label}</p>
                      <p className="text-xs text-slate-400">{voice.desc}</p>
                    </div>
                    {brandVoice === voice.id && <CheckCircle className="w-4 h-4 text-sky-400 shrink-0" />}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">No-go topics (comma separated, optional)</label>
                <input
                  type="text"
                  placeholder="politics, competitors, pricing..."
                  value={noGoTopics}
                  onChange={(e) => setNoGoTopics(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all"
                />
              </div>
            </div>
          )}

          {/* Step 2: Autopilot rules */}
          {step === 2 && (
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-fuchsia-300 mb-1.5">Step 3</p>
              <h2 className="text-xl font-semibold text-slate-50 mb-1">Configure autopilot rules</h2>
              <p className="text-sm text-slate-400 mb-6">Define the guardrails for your autonomous posting engine.</p>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Max posts per day: <span className="text-slate-200">{maxPostsPerDay}</span></label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={maxPostsPerDay}
                    onChange={(e) => setMaxPostsPerDay(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                    <span>1</span><span>10</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Minimum gap between posts: <span className="text-slate-200">{postingGapHours}h</span></label>
                  <input
                    type="range"
                    min={1}
                    max={24}
                    value={postingGapHours}
                    onChange={(e) => setPostingGapHours(Number(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                    <span>1h</span><span>24h</span>
                  </div>
                </div>

                <div
                  onClick={() => setAutoApprove(!autoApprove)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                    autoApprove
                      ? "border-emerald-500/60 bg-emerald-500/10"
                      : "border-slate-700/80 bg-slate-900/40"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-100">Auto-approve posts</p>
                    <p className="text-xs text-slate-400">Skip manual review — AI posts autonomously</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-all relative ${autoApprove ? "bg-emerald-500" : "bg-slate-700"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${autoApprove ? "left-5" : "left-0.5"}`} />
                  </div>
                </div>

                {!autoApprove && (
                  <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                    Manual review mode: you'll approve each post before it goes live.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Go live */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 via-sky-500 to-purple-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/30">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-slate-50 mb-2">You're all set!</h2>
              <p className="text-sm text-slate-400 mb-6">
                FlowPulse is ready to fill your content gaps autonomously. Your autopilot is armed and ready.
              </p>

              <div className="glass rounded-xl border border-slate-700/60 p-4 text-left mb-6 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{connectedPlatforms.length} platform{connectedPlatforms.length !== 1 ? "s" : ""} connected: {connectedPlatforms.join(", ")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Brand voice: {brandVoice}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Max {maxPostsPerDay} posts/day · {postingGapHours}h minimum gap</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Approval mode: {autoApprove ? "Autonomous (auto-approve)" : "Manual review"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2 rounded-full border border-slate-600/80 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={handleNext}
              disabled={isPending}
              className="btn-gradient text-sm font-semibold text-slate-900 rounded-full px-6 py-2.5 shadow-lg hover-elevate active-elevate-2 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isPending
                ? "Saving..."
                : step === 3
                ? "Launch autopilot"
                : "Continue"}
              {!isPending && step < 3 && <ChevronRight className="w-4 h-4" />}
              {!isPending && step === 3 && <Zap className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
