import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const simulationSteps = [
  { step: "Detecting content gap...", topic: "Scanning your content calendar...", caption: "FlowPulse analyzes your posting history, audience behavior, and topics to decide what to publish next.", decision: "Wait", eta: "Calculating best send time..." },
  { step: "Gap detected!", topic: "6-hour silence on Instagram", caption: "Your last IG post was 6h ago. Engagement typically drops after 4h of silence for your audience.", decision: "Generate", eta: "18 min" },
  { step: "Generating caption...", topic: "Topic: Behind-the-scenes content", caption: '"Ever wonder what goes into creating content? Here\'s a sneak peek at my creative process..."', decision: "Pending", eta: "12 min" },
  { step: "Scheduling post", topic: "Ready to publish", caption: "Caption optimized for IG algorithm. Hashtags and CTA added. Visual generated.", decision: "Auto-post", eta: "Now" },
  { step: "Posted successfully!", topic: "Content live on Instagram", caption: "Post published. Monitoring engagement metrics and learning from performance.", decision: "Complete", eta: "Tracking..." },
];

export default function LandingPage() {
  const { toast } = useToast();
  const [simIndex, setSimIndex] = useState(0);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setSimIndex((prev) => (prev + 1) % simulationSteps.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const currentSim = simulationSteps[simIndex];

  const waitlistMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/waitlist", { email });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to join waitlist");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ 
        title: "You're on the list!", 
        description: "We'll notify you when FlowPulse launches.",
        className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-50"
      });
      setEmail("");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Signup status", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      waitlistMutation.mutate(email);
    }
  };

  return (
    <div className="text-slate-100">
      <title>FlowPulse - AI-Driven Autonomous Social Media Posting</title>
      <meta name="description" content="FlowPulse automatically detects content gaps and generates on-brand posts across all your social channels. Never go dark again with our AI decision engine." />
      <meta property="og:title" content="FlowPulse - AI Autonomous Social Media" />
      <meta property="og:description" content="Automatically fill your content calendar with AI-driven posting that mirrors your brand voice." />
      <meta property="og:type" content="website" />
      <header className="fixed top-0 inset-x-0 z-40 nav-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-400 via-sky-500 to-purple-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                <span className="font-bold text-sm tracking-tight">FP</span>
              </div>
              <span className="font-semibold text-slate-100 tracking-tight text-lg">FlowPulse</span>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm">
              <a href="#how-it-works" className="text-slate-300 hover:text-white transition" data-testid="link-how-it-works">How it works</a>
              <a href="#features" className="text-slate-300 hover:text-white transition" data-testid="link-features">Features</a>
              <a href="#pricing" className="text-slate-300 hover:text-white transition" data-testid="link-pricing">Pricing</a>
              <a href="#demo" className="text-slate-300 hover:text-white transition" data-testid="link-demo">Live demo</a>
            </nav>
            <div className="flex items-center gap-3">
              <button className="hidden sm:inline-flex px-3.5 py-1.5 rounded-full border border-slate-600/80 text-xs font-medium text-slate-200 hover:bg-slate-800/80 hover-elevate active-elevate-2 transition" data-testid="button-login">
                Log in
              </button>
              <a href="#demo" className="btn-gradient text-xs sm:text-sm font-semibold text-slate-900 rounded-full px-4 py-2 shadow-lg flex items-center gap-1.5 hover-elevate active-elevate-2 transition-all" data-testid="link-start-free">
                <span>Start free</span>
                <span className="text-xs bg-black/10 rounded-full px-1.5 py-0.5">60s setup</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-20">
        <section className="relative overflow-hidden">
          <div className="hero-glow -top-40 -right-52"></div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 badge-pill rounded-full px-2.5 py-1 text-xs text-emerald-100 border border-emerald-300/40 shadow-soft shadow-emerald-500/20 mb-5">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300"></span>
                  Fully autonomous content gaps filled in real time
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-50 mb-4" data-testid="text-hero-headline">
                  Never go dark on social again.
                </h1>
                <p className="text-slate-300 max-w-xl text-sm sm:text-base mb-6">
                  FlowPulse watches your posting cadence and fills every gap automatically – generating on-brand images, captions, and posting across all your connected social accounts, without you lifting a finger.
                </p>

                <ul className="flex flex-wrap gap-2 text-xs text-slate-300 mb-7">
                  <li className="chip pill px-2.5 py-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> AI topics & visuals
                  </li>
                  <li className="chip pill px-2.5 py-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span> All socials linked
                  </li>
                  <li className="chip pill px-2.5 py-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400"></span> Auto gap detection
                  </li>
                  <li className="chip pill px-2.5 py-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span> Decision engine
                  </li>
                </ul>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                  <div className="flex flex-wrap gap-2 items-stretch">
                    <a href="#demo" className="btn-gradient text-sm font-semibold text-slate-900 rounded-full px-5 py-2.5 shadow-lg flex items-center gap-2 hover-elevate active-elevate-2 transition-all" data-testid="button-connect-socials">
                      <span>Connect your socials</span>
                      <span className="text-xs bg-black/10 rounded-full px-2 py-0.5">Free 14-day trial</span>
                    </a>
                    <button className="px-4 py-2.5 rounded-full border border-slate-600/80 text-sm font-medium text-slate-200 hover:bg-slate-900/80 hover-elevate active-elevate-2 transition" data-testid="button-watch-demo">
                      Watch 2-min demo
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-400">
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-full border border-slate-900 bg-gradient-to-tr from-pink-500 to-rose-400"></div>
                    <div className="w-7 h-7 rounded-full border border-slate-900 bg-gradient-to-tr from-sky-500 to-cyan-400"></div>
                    <div className="w-7 h-7 rounded-full border border-slate-900 bg-gradient-to-tr from-amber-400 to-orange-500"></div>
                  </div>
                  <span>Trusted by solo creators & enterprise teams posting 10K+ times a month.</span>
                </div>
              </div>

              <div className="gradient-border shadow-soft">
                <div className="gradient-border-inner p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                      <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Live autopilot</span>
                    </div>
                    <span className="pill px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-400/40 flex items-center gap-1" data-testid="status-autopilot">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                      Engaged
                    </span>
                  </div>

                  <div className="glass rounded-2xl border border-slate-700/60 p-3 sm:p-4 card-hover">
                    <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                      <div>
                        <p className="text-xs text-slate-400">Creator profile</p>
                        <p className="text-sm font-semibold text-slate-50">You • @yourhandle</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>Posting gap</span>
                          <span className="pill px-2 py-0.5 bg-slate-900/70 border border-slate-700/80">6 hours</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <span>Autopilot</span>
                          <div className="w-8 h-4 pill bg-emerald-500/40 fp-toggle flex items-center px-0.5">
                            <div className="w-3 h-3 rounded-full bg-slate-900 toggle-knob translate-x-3"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="relative rounded-xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-3 overflow-hidden mb-3">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),transparent_55%)] opacity-70 pointer-events-none"></div>
                      <div className="relative z-10 flex items-center justify-between mb-2 text-[11px] text-slate-300 gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-sky-400"></span>
                          <span>AI topic engine</span>
                        </div>
                        <span className="pill px-2 py-0.5 bg-black/30 border border-slate-700 text-[10px] text-slate-300" data-testid="text-sim-step">
                          {currentSim.step}
                        </span>
                      </div>
                      <p className="relative z-10 text-sm font-medium text-slate-50" data-testid="text-sim-topic">
                        {currentSim.topic}
                      </p>
                      <p className="relative z-10 mt-2 text-xs text-slate-300" data-testid="text-sim-caption">
                        {currentSim.caption}
                      </p>
                      <div className="relative z-10 mt-3 flex items-center justify-between text-[10px] text-slate-400 gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="pill px-2 py-0.5 bg-black/30 border border-slate-700/80 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                            Decision: {currentSim.decision}
                          </span>
                          <span>Best window in {currentSim.eta}</span>
                        </div>
                        <span className="pill px-2 py-0.5 bg-black/30 border border-slate-700/80">Engagement +23%</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 text-[11px] text-slate-300">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="pill px-1.5 py-0.5 bg-slate-900/70 border border-slate-700/80 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                            IG
                          </span>
                          <span className="pill px-1.5 py-0.5 bg-slate-900/70 border border-slate-700/80 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                            X
                          </span>
                          <span className="pill px-1.5 py-0.5 bg-slate-900/70 border border-slate-700/80 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                            TikTok
                          </span>
                          <span className="pill px-1.5 py-0.5 bg-slate-900/70 border border-slate-700/80 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                            LinkedIn
                          </span>
                        </div>
                        <span className="text-slate-400">Synced</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 gap-2">
                        <span>Next post ETA</span>
                        <span className="pill px-2 py-0.5 bg-slate-900/70 border border-slate-700/80 text-[10px]" data-testid="text-sim-eta">
                          {currentSim.eta}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 gap-2">
                    <span>By enabling Autopilot, you grant FlowPulse permission to generate and schedule posts across your connected profiles.</span>
                    <span className="hidden sm:block text-slate-400 whitespace-nowrap">No credit card required</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mt-16 sm:mt-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-300 mb-1.5">How it works</p>
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-50">Always-on posting, with guardrails you control.</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md">
                FlowPulse observes your publishing rhythm, predicts when you're about to miss a beat, and then generates and ships content that feels like you – not a bot.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-5">
              <div className="glass rounded-2xl border border-slate-700/80 p-4 card-hover">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <span className="pill px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-400/40">Step 1</span>
                  <span className="text-[11px] text-slate-400">Connect & learn</span>
                </div>
                <h3 className="text-sm font-semibold mb-2 text-slate-50">Link all your social accounts</h3>
                <p className="text-xs text-slate-300 mb-3">
                  Connect Instagram, TikTok, X, LinkedIn, YouTube and more in seconds. FlowPulse ingests your last 12 months of posts, engagement curves, and brand voice.
                </p>
                <ul className="space-y-1 text-xs text-slate-300">
                  <li>• Understands your posting frequency & gaps</li>
                  <li>• Clones your tone, style, and visual identity</li>
                  <li>• Maps audience peaks by timezone</li>
                </ul>
              </div>

              <div className="glass rounded-2xl border border-slate-700/80 p-4 card-hover">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <span className="pill px-2 py-0.5 text-[10px] bg-sky-500/10 text-sky-300 border border-sky-400/40">Step 2</span>
                  <span className="text-[11px] text-slate-400">Detect & decide</span>
                </div>
                <h3 className="text-sm font-semibold mb-2 text-slate-50">AI detects content gaps</h3>
                <p className="text-xs text-slate-300 mb-3">
                  The decision engine monitors your cadence. When a gap appears that could hurt reach or revenue, FlowPulse decides what to post, where, and when.
                </p>
                <ul className="space-y-1 text-xs text-slate-300">
                  <li>• Predicts "silent" hours before they happen</li>
                  <li>• Chooses topic clusters that keep series alive</li>
                  <li>• Respects your brand rules & no-go topics</li>
                </ul>
              </div>

              <div className="glass rounded-2xl border border-slate-700/80 p-4 card-hover">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <span className="pill px-2 py-0.5 text-[10px] bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-400/40">Step 3</span>
                  <span className="text-[11px] text-slate-400">Create & post</span>
                </div>
                <h3 className="text-sm font-semibold mb-2 text-slate-50">Auto-generate image + caption</h3>
                <p className="text-xs text-slate-300 mb-3">
                  FlowPulse designs an on-brand visual, writes a caption, adapts it per platform, then posts or schedules – fully automated or with your approval.
                </p>
                <ul className="space-y-1 text-xs text-slate-300">
                  <li>• Image generation tuned to your palette</li>
                  <li>• Platform-specific hooks, CTAs & hashtags</li>
                  <li>• Safety layer for brand & compliance</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-16 sm:mt-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-sky-300 mb-1.5">Features</p>
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-50">Your AI content ops team, in one dashboard.</h2>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                <span className="pill px-2 py-0.5 bg-slate-900/80 border border-slate-700/80">Influencers</span>
                <span className="pill px-2 py-0.5 bg-slate-900/80 border border-slate-700/80">Brands</span>
                <span className="pill px-2 py-0.5 bg-slate-900/80 border border-slate-700/80">Agencies</span>
                <span className="pill px-2 py-0.5 bg-slate-900/80 border border-slate-700/80">CMOs</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.95fr)] gap-6 items-start">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="glass rounded-2xl border border-slate-700/80 p-4 card-hover">
                  <div className="flex items-center justify-between mb-2">
                    <span className="pill px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-400/40">Decision engine</span>
                  </div>
                  <h3 className="text-sm font-semibold mb-1 text-slate-50">Autonomous posting logic</h3>
                  <p className="text-xs text-slate-300">
                    Configure guardrails once. FlowPulse decides what to post, how often, which channels, and when to hold content for key launches.
                  </p>
                </div>

                <div className="glass rounded-2xl border border-slate-700/80 p-4 card-hover">
                  <div className="flex items-center justify-between mb-2">
                    <span className="pill px-2 py-0.5 text-[10px] bg-sky-500/10 text-sky-300 border border-sky-400/40">Smart visuals</span>
                  </div>
                  <h3 className="text-sm font-semibold mb-1 text-slate-50">AI-generated on-brand images</h3>
                  <p className="text-xs text-slate-300">
                    From product mockups to creator carousels, images are built with your fonts, colors, and templates baked in.
                  </p>
                </div>

                <div className="glass rounded-2xl border border-slate-700/80 p-4 card-hover">
                  <div className="flex items-center justify-between mb-2">
                    <span className="pill px-2 py-0.5 text-[10px] bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-400/40">Tone engine</span>
                  </div>
                  <h3 className="text-sm font-semibold mb-1 text-slate-50">Caption & hook intelligence</h3>
                  <p className="text-xs text-slate-300">
                    Captions tuned per platform with hooks, CTAs, and hashtag strategies that mirror your past best performers.
                  </p>
                </div>

                <div className="glass rounded-2xl border border-slate-700/80 p-4 card-hover">
                  <div className="flex items-center justify-between mb-2">
                    <span className="pill px-2 py-0.5 text-[10px] bg-amber-500/10 text-amber-300 border border-amber-400/40">Control</span>
                  </div>
                  <h3 className="text-sm font-semibold mb-1 text-slate-50">Hands-off or hands-on</h3>
                  <p className="text-xs text-slate-300">
                    Choose fully automated posting or approval flows. Override any decision with one click, without breaking the system.
                  </p>
                </div>
              </div>

              <div className="glass rounded-2xl border border-slate-700/80 p-4 shadow-soft">
                <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                  <div>
                    <p className="text-xs text-slate-400">Autopilot feed</p>
                    <p className="text-sm font-semibold text-slate-50">Today's automated decisions</p>
                  </div>
                  <button className="pill px-2 py-1 text-[10px] bg-slate-900/80 border border-slate-700/80 text-slate-200 hover:bg-slate-900 transition" data-testid="button-pause-autopilot">
                    Pause autopilot
                  </button>
                </div>
                <div className="relative flex gap-3">
                  <div className="w-0.5 rounded-full timeline-line"></div>
                  <div className="flex-1 space-y-4 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-0.5 gap-2 flex-wrap">
                        <span className="text-slate-300">9:05 AM • TikTok & IG Reels</span>
                        <span className="pill px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-400/40 text-[10px]">Posted</span>
                      </div>
                      <p className="text-slate-400">"Morning routine just dropped. Link in bio."</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5 gap-2 flex-wrap">
                        <span className="text-slate-300">12:30 PM • LinkedIn</span>
                        <span className="pill px-2 py-0.5 bg-sky-500/10 text-sky-300 border border-sky-400/40 text-[10px]">Scheduled</span>
                      </div>
                      <p className="text-slate-400">"3 lessons from scaling to 1M followers..."</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5 gap-2 flex-wrap">
                        <span className="text-slate-300">4:00 PM • X (Twitter)</span>
                        <span className="pill px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-400/40 text-[10px]">Awaiting approval</span>
                      </div>
                      <p className="text-slate-400">"Hot take: AI won't replace creators..."</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5 gap-2 flex-wrap">
                        <span className="text-slate-300">7:30 PM • Instagram</span>
                        <span className="pill px-2 py-0.5 bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-400/40 text-[10px]">Generating</span>
                      </div>
                      <p className="text-slate-400">Analyzing trends for evening post...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="mt-16 sm:mt-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-fuchsia-300 mb-1.5">Pricing</p>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-50 mb-2">Simple, transparent pricing</h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">Start free, scale as you grow. No hidden fees, no per-post charges.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
              <div className="glass rounded-2xl border border-slate-700/80 p-5 card-hover">
                <div className="mb-4">
                  <span className="pill px-2 py-0.5 text-[10px] bg-slate-900/80 border border-slate-700/80 text-slate-300">Starter</span>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-semibold text-slate-50">$0</span>
                  <span className="text-sm text-slate-400">/month</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 mb-6">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    2 social accounts
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    5 AI posts/month
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    Basic gap detection
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-600"></span>
                    Manual approval only
                  </li>
                </ul>
                <button className="w-full px-4 py-2 rounded-full border border-slate-600/80 text-sm font-medium text-slate-200 hover:bg-slate-900/80 transition" data-testid="button-get-started-free">
                  Get started free
                </button>
              </div>

              <div className="gradient-border shadow-soft">
                <div className="gradient-border-inner p-5 h-full">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <span className="pill px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-400/40">Pro</span>
                    <span className="pill px-2 py-0.5 text-[10px] bg-sky-500/10 text-sky-300 border border-sky-400/40">Most popular</span>
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-semibold text-slate-50">$29</span>
                    <span className="text-sm text-slate-400">/month</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300 mb-6">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      Unlimited social accounts
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      Unlimited AI posts
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      Full autopilot mode
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      Brand voice learning
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      Priority support
                    </li>
                  </ul>
                  <button className="w-full btn-gradient text-sm font-semibold text-slate-900 rounded-full px-4 py-2 shadow-lg hover-elevate active-elevate-2 transition-all" data-testid="button-start-pro-trial">
                    Start 14-day free trial
                  </button>
                </div>
              </div>

              <div className="glass rounded-2xl border border-slate-700/80 p-5 card-hover">
                <div className="mb-4">
                  <span className="pill px-2 py-0.5 text-[10px] bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-400/40">Enterprise</span>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-semibold text-slate-50">Custom</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 mb-6">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    Multi-team workspaces
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    Custom integrations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    Advanced analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    Dedicated success manager
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    SLA & compliance
                  </li>
                </ul>
                <button className="w-full px-4 py-2 rounded-full border border-slate-600/80 text-sm font-medium text-slate-200 hover:bg-slate-900/80 transition" data-testid="button-contact-sales">
                  Contact sales
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="mt-16 sm:mt-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="gradient-border shadow-soft max-w-2xl mx-auto">
              <div className="gradient-border-inner p-6 sm:p-8 text-center">
                <div className="inline-flex items-center gap-2 badge-pill rounded-full px-2.5 py-1 text-xs text-emerald-100 border border-emerald-300/40 mb-4">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                  Limited beta access
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-50 mb-2">Ready to automate your social presence?</h2>
                <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                  Join thousands of creators and brands using FlowPulse to never miss a posting window again.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-slate-900/50 border border-slate-700/80 rounded-full px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                    required
                    data-testid="input-waitlist-email"
                  />
                  <button
                    type="submit"
                    disabled={waitlistMutation.isPending}
                    className="btn-gradient text-sm font-semibold text-slate-900 rounded-full px-5 py-2.5 shadow-lg hover-elevate active-elevate-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="button-join-waitlist"
                  >
                    {waitlistMutation.isPending ? "Joining..." : "Join waitlist"}
                  </button>
                </form>
                <p className="text-[11px] text-slate-500 mt-4">No spam, ever. Unsubscribe anytime.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/60 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 via-sky-500 to-purple-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                <span className="font-bold text-xs tracking-tight">FP</span>
              </div>
              <span className="font-semibold text-slate-100 tracking-tight">FlowPulse</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <a href="#how-it-works" className="hover:text-slate-200 transition">How it works</a>
              <a href="#features" className="hover:text-slate-200 transition">Features</a>
              <a href="#pricing" className="hover:text-slate-200 transition">Pricing</a>
              <a href="#" className="hover:text-slate-200 transition">Privacy</a>
              <a href="#" className="hover:text-slate-200 transition">Terms</a>
            </nav>
            <p className="text-xs text-slate-500">© 2026 FlowPulse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
