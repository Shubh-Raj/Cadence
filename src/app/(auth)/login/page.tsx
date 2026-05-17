"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { loginAction, type LoginState } from "@/lib/actions/auth.actions";
import { Mail, Lock, ArrowRight, Loader2, Zap, Shield, Target, TrendingUp, Users, BarChart3, Sun, Moon, CheckCircle2, Workflow, BellRing, ChartBar, MailPlus, ShieldCheck, MousePointer2, Building2, Server } from "lucide-react";
import { useTheme } from "next-themes";

const demoAccounts = [
  { role: "Employee", email: "employee@cadence.dev", pass: "Employee@123", color: "var(--brand-yellow)" },
  { role: "Manager", email: "manager@cadence.dev", pass: "Manager@123", color: "var(--brand-pink)" },
  { role: "Admin / HR", email: "admin@cadence.dev", pass: "Admin@123", color: "var(--brand-cyan)" },
];

const stats = [
  { icon: Target, label: "Goal Setting", value: "8 Max" },
  { icon: TrendingUp, label: "Quarterly Cycles", value: "Q1–Q4" },
  { icon: Users, label: "Team Oversight", value: "3 Roles" },
  { icon: BarChart3, label: "Analytics", value: "Live" },
];

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, undefined);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [ssoModal, setSsoModal] = useState(false);
  const [ssoChecking, setSsoChecking] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function fillDemo(email: string, pass: string, el: HTMLElement) {
    if (emailRef.current) { emailRef.current.value = email; emailRef.current.dispatchEvent(new Event("input", { bubbles: true })); }
    if (passwordRef.current) { passwordRef.current.value = pass; passwordRef.current.dispatchEvent(new Event("input", { bubbles: true })); }
    // Brief flash on the row
    el.style.background = "rgba(250,255,0,0.12)";
    setTimeout(() => { el.style.background = ""; }, 400);
    emailRef.current?.focus();
  }

  async function handleSSOClick() {
    setSsoChecking(true);
    // Test if the SSO endpoint is reachable / actually configured
    try {
      const res = await fetch("/api/auth/signin/microsoft-entra-id", { method: "HEAD", redirect: "manual" });
      // A redirect (3xx) or 200 means the provider is configured and handling the flow
      if (res.type === "opaqueredirect" || res.ok || res.status === 302 || res.status === 307) {
        // Navigate normally
        window.location.href = "/api/auth/signin/microsoft-entra-id";
        return;
      }
    } catch {
      // Network error or provider not set up
    }
    setSsoChecking(false);
    setSsoModal(true);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;
    let t = 0;

    const isDark = resolvedTheme !== "light";
    const r = isDark ? 250 : 108;
    const g = isDark ? 255 : 71;
    const b = isDark ? 0 : 255;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cols = 14, rows = 10;
      const gx = canvas.width / cols, gy = canvas.height / rows;
      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const w = Math.sin(t * 0.018 + i * 0.45 + j * 0.28) * 8;
          const x = i * gx + w, y = j * gy + w;
          const alphaMultiplier = isDark ? 1 : 3.5;
          const a = (0.08 + 0.08 * Math.sin(t * 0.012 + i * 0.6 + j * 0.4)) * alphaMultiplier;
          ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${a})`; ctx.fill();
          if (i < cols) {
            ctx.beginPath(); ctx.moveTo(x, y);
            ctx.lineTo((i + 1) * gx + w, y);
            const lineA = isDark ? a * 0.35 : a * 0.6;
            ctx.strokeStyle = `rgba(${r},${g},${b},${lineA})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
          if (j < rows) {
            ctx.beginPath(); ctx.moveTo(x, y);
            ctx.lineTo(x, (j + 1) * gy + w);
            ctx.stroke();
          }
        }
      }
      t++; raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [resolvedTheme]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        :root{--y:var(--brand-yellow);--p:var(--brand-pink);--c:var(--brand-cyan);--bg:var(--background);--bg2:var(--card);--txt:var(--foreground);--txt2:var(--muted-foreground);}
        .login-wrapper{display:flex;flex-direction:column;width:100%;min-height:100vh;background:var(--bg);font-family:'Space Grotesk',sans-serif;color:var(--txt);}
        .lr{display:flex;min-height:100vh;width:100%;position:relative;}
        /* LEFT */
        .ll{position:relative;width:52%;display:none;flex-direction:column;justify-content:space-between;padding:44px 48px;overflow:hidden;background:var(--bg2);}
        @media(min-width:1024px){.ll{display:flex;}}
        .ll-glow1{position:absolute;top:-180px;left:-180px;width:500px;height:500px;background:radial-gradient(circle,rgba(250,255,0,.13) 0%,transparent 65%);pointer-events:none;}
        .ll-glow2{position:absolute;bottom:-160px;right:-100px;width:440px;height:440px;background:radial-gradient(circle,rgba(255,45,120,.14) 0%,transparent 65%);pointer-events:none;}
        canvas.cg{position:absolute;inset:0;width:100%;height:100%;}
        /* geometric shapes */
        .g-ring{position:absolute;top:42%;right:-70px;width:200px;height:200px;border:1.5px solid rgba(250,255,0,.18);transform:rotate(45deg);animation:gspin 22s linear infinite;}
        .g-ring2{position:absolute;top:42%;right:-70px;width:130px;height:130px;border:1px solid rgba(255,45,120,.18);transform:rotate(45deg);margin:35px;animation:gspin 14s linear infinite reverse;}
        .g-tri{position:absolute;bottom:100px;left:36px;width:0;height:0;border-left:40px solid transparent;border-right:40px solid transparent;border-bottom:70px solid rgba(0,245,255,.12);animation:gpulse 5s ease-in-out infinite;}
        .g-sq{position:absolute;top:120px;right:90px;width:30px;height:30px;background:rgba(250,255,0,.15);transform:rotate(45deg);animation:gpulse 3.5s ease-in-out infinite 1s;}
        @keyframes gspin{to{transform:rotate(calc(45deg + 360deg));}}
        @keyframes gpulse{0%,100%{opacity:.3;transform:scale(1) rotate(45deg);}50%{opacity:.8;transform:scale(1.15) rotate(45deg);}}
        /* logo */
        .logo{position:relative;z-index:2;display:flex;align-items:center;gap:14px;}
        .logo-icon{width:46px;height:46px;background:var(--y);clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .logo-name{font-size:22px;font-weight:700;color:var(--foreground);letter-spacing:-.5px;}
        .logo-sub{font-size:9px;font-weight:700;letter-spacing:3.5px;text-transform:uppercase;color:var(--y);margin-top:2px;}
        /* hero */
        .hero{position:relative;z-index:2;}
        .eyebrow{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(250,255,0,.3);padding:7px 16px;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--y);margin-bottom:26px;}
        .eyebrow-dot{width:7px;height:7px;background:var(--y);transform:rotate(45deg);flex-shrink:0;}
        .h1{font-size:clamp(42px,4.2vw,62px);font-weight:700;line-height:1.03;letter-spacing:-2.5px;color:var(--foreground);margin-bottom:22px;}
        .h1 .y{color:var(--y);}.h1 .p{color:var(--p);}
        .hsub{color:var(--txt2);font-size:15px;line-height:1.7;max-width:390px;margin-bottom:38px;}
        /* stats grid */
        .sg{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .sc{display:flex;align-items:center;gap:12px;padding:16px 20px;background:var(--accent);border:1px solid var(--border);border-radius:12px;transition:all .3s cubic-bezier(0.4, 0, 0.2, 1);position:relative;overflow:hidden;}
        .sc::before{content:'';position:absolute;top:0;left:0;width:3px;height:100%;background:var(--y);opacity:0.3;transition:all .3s;}
        .sc:hover{background:var(--card);border-color:var(--y);transform:translateY(-3px);box-shadow:0 10px 30px rgba(250,255,0,0.12);}
        .sc:hover::before{opacity:1;}
        .sc-dot{width:6px;height:6px;background:var(--y);border-radius:50%;flex-shrink:0;display:none;}
        .sc-label{font-size:13px;font-weight:600;color:var(--foreground);}
        .sc-val{font-size:11px;font-weight:700;color:var(--y);margin-left:auto;}
        /* badge */
        .badge{position:relative;z-index:2;display:inline-flex;align-items:center;gap:8px;padding:9px 18px;border:1px solid var(--border);font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted-foreground);}
        /* RIGHT */
        .lr-right{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:40px 28px;background:var(--bg);position:relative;overflow:hidden;}
        .lr-right::before{content:'';position:absolute;top:0;left:0;width:2px;height:100%;background:linear-gradient(to bottom,transparent 0%,var(--y) 35%,var(--p) 65%,transparent 100%);}
        .lr-right::after{content:'';position:absolute;top:-200px;right:-200px;width:500px;height:500px;background:radial-gradient(circle,rgba(255,45,120,.06) 0%,transparent 60%);pointer-events:none;}
        .fc{width:100%;max-width:430px;position:relative;z-index:1;}
        /* mobile logo */
        .mlogo{display:flex;align-items:center;gap:10px;margin-bottom:32px;}
        @media(min-width:1024px){.mlogo{display:none;}}
        .mlogo-icon{width:38px;height:38px;background:var(--y);clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%);}
        .mlogo-name{font-size:20px;font-weight:700;color:var(--foreground);}
        /* form heading */
        .fh{margin-bottom:30px;}
        .fey{font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--y);margin-bottom:10px;}
        .ft{font-size:clamp(32px,4vw,44px);font-weight:700;color:var(--foreground);line-height:1.05;letter-spacing:-1.8px;}
        .fs{color:var(--txt2);font-size:14px;margin-top:8px;}
        /* error */
        .ferr{display:flex;align-items:center;gap:10px;padding:14px 16px;background:rgba(255,45,120,.08);border:1px solid rgba(255,45,120,.28);color:var(--p);font-size:13px;font-weight:500;margin-bottom:18px;}
        /* input */
        .ig{margin-bottom:16px;}
        .il{display:block;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--muted-foreground);margin-bottom:8px;}
        .iw{position:relative;}
        .ii{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--muted-foreground);pointer-events:none;}
        input.li{width:100%;height:52px;padding-left:46px;padding-right:16px;background:var(--input);border:1px solid var(--border);color:var(--foreground);font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:500;outline:none;transition:all .2s;-webkit-appearance:none;}
        input.li::placeholder{color:var(--muted-foreground);}
        input.li:focus{background:rgba(250,255,0,.04);border-color:var(--y);box-shadow:0 0 0 3px rgba(250,255,0,.09);}
        .ie{color:var(--p);font-size:12px;margin-top:4px;}
        /* button */
        .sb{width:100%;height:54px;background:var(--y);border:none;font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--primary-foreground);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:all .22s;margin-top:22px;position:relative;overflow:hidden;}
        .sb::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.18) 0%,transparent 55%);}
        .sb:hover:not(:disabled){background:var(--foreground);color:var(--background);transform:translateY(-3px);box-shadow:0 12px 40px rgba(250,255,0,.35);}
        .sb:active{transform:translateY(0);}
        .sb:disabled{opacity:.55;cursor:not-allowed;}
        @keyframes spin{to{transform:rotate(360deg);}}
        .spin{animation:spin 1s linear infinite;}
        /* divider */
        .dv{display:flex;align-items:center;gap:12px;margin:22px 0;}
        .dvl{flex:1;height:1px;background:var(--border);}
        .dvt{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted-foreground);}
        /* sso */
        .sso{width:100%;height:50px;display:flex;align-items:center;justify-content:center;gap:12px;background:transparent;border:1px solid var(--border);color:var(--foreground);font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:600;cursor:pointer;text-decoration:none;transition:all .2s;}
        .sso:hover{background:var(--accent);border-color:var(--border);color:var(--foreground);}
        /* demo */
        .dem{margin-top:24px;}
        .dh{font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--muted-foreground);margin-bottom:12px;text-align:center;display:flex;align-items:center;justify-content:center;gap:6px;}
        .dl{display:flex;flex-direction:column;gap:8px;}
        .dr{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;background:var(--card);border:1px solid var(--border);border-radius:6px;border-left-width:3px;transition:all .22s;cursor:default;}
        .dr:hover{background:var(--accent);transform:translateX(4px);}
        .drl{font-size:13px;font-weight:700;color:var(--foreground);margin-bottom:3px;}
        .dre{font-size:11px;color:var(--muted-foreground);}
        .drp{font-family:monospace;font-size:11px;font-weight:700;padding:5px 10px;background:var(--accent);color:var(--foreground);border-radius:4px;}
        
        /* SHOWCASE SECTION - MESH GRADIENT & GLASSMORPHISM */
        .showcase{padding:120px 40px;background:transparent;position:relative;overflow:hidden;border-top:1px solid var(--border);}
        .sh-bg-1{position:absolute;top:-10%;left:-10%;width:60vw;height:60vw;background:radial-gradient(circle, var(--brand-yellow) 0%, transparent 60%);pointer-events:none;z-index:0;opacity:0.12;}
        .sh-bg-2{position:absolute;top:30%;right:-10%;width:50vw;height:50vw;background:radial-gradient(circle, var(--brand-pink) 0%, transparent 60%);pointer-events:none;z-index:0;opacity:0.12;}
        .sh-bg-3{position:absolute;bottom:-10%;left:20%;width:70vw;height:70vw;background:radial-gradient(circle, var(--brand-cyan) 0%, transparent 60%);pointer-events:none;z-index:0;opacity:0.10;}
        .sh-mesh{position:absolute;inset:0;background-image:radial-gradient(var(--foreground) 1.5px, transparent 1.5px);background-size:32px 32px;pointer-events:none;z-index:1;mask-image:linear-gradient(to bottom, black 40%, transparent 100%);-webkit-mask-image:linear-gradient(to bottom, black 40%, transparent 100%);opacity:0.15;}
        
        .sh-container{max-width:1200px;margin:0 auto;position:relative;z-index:2;}
        .sh-title{text-align:center;font-size:clamp(32px, 4vw, 48px);font-weight:700;letter-spacing:-1.5px;color:var(--foreground);margin-bottom:16px;}
        .sh-title span{color:var(--y);}
        .sh-sub{text-align:center;font-size:16px;color:var(--muted-foreground);max-width:600px;margin:0 auto 80px;}
        
        /* Glassmorphic Cards */
        .sh-grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(340px, 1fr));gap:24px;}
        .sh-card{background:rgba(255,255,255,0.02);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.06);padding:32px;border-radius:20px;display:flex;flex-direction:column;gap:24px;transition:all .4s;position:relative;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.15);}
        .sh-card::after{content:'';position:absolute;top:0;right:0;width:150px;height:150px;background:radial-gradient(circle, rgba(255,45,120,0.08) 0%, transparent 70%);border-radius:50%;transform:translate(30%, -30%);}
        .sh-card:hover{border-color:var(--y);transform:translateY(-5px);box-shadow:0 12px 40px rgba(0,0,0,0.15);}
        .sh-card-icon{width:56px;height:56px;background:rgba(255,255,255,0.05);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.08);border-radius:14px;display:flex;align-items:center;justify-content:center;color:var(--foreground);}
        .sh-card-title{font-size:22px;font-weight:700;color:var(--foreground);letter-spacing:-0.5px;}
        .sh-card-desc{font-size:15px;line-height:1.6;color:var(--muted-foreground);}
        
        /* Glass mock objects inside cards */
        .sh-mock{flex:1;background:rgba(0,0,0,0.15);border:1px solid rgba(255,255,255,0.04);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:14px;position:relative;min-height:140px;justify-content:center;box-shadow:inset 0 2px 10px rgba(0,0,0,0.2);}
        .m-bar{height:8px;border-radius:4px;background:rgba(255,255,255,0.08);}
        .m-bar.y{background:var(--y);opacity:0.6;}
        .m-bar.p{background:var(--p);opacity:0.6;}
        .m-row{display:flex;align-items:center;gap:12px;}
        .m-circle{width:32px;height:32px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:10px;backdrop-filter:blur(4px);border:1px solid var(--border);}
        .m-line{flex:1;height:2px;background:var(--border);position:relative;}
        .m-line::after{content:'';position:absolute;top:-3px;right:0;border-left:5px solid var(--foreground);border-top:4px solid transparent;border-bottom:4px solid transparent;opacity:0.4;}
        
        .sh-bonus{margin-top:80px;}
        .sh-b-title{font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--p);margin-bottom:30px;display:flex;align-items:center;gap:12px;}
        .sh-b-title::after{content:'';flex:1;height:1px;background:linear-gradient(to right, rgba(255,45,120,0.3), transparent);}
        .sh-b-grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;}
        .sh-b-card{padding:24px;background:rgba(255,255,255,0.02);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.06);border-radius:16px;display:flex;gap:16px;align-items:flex-start;transition:all .3s;box-shadow:0 4px 16px rgba(0,0,0,0.1);}
        .sh-b-card:hover{background:rgba(255,45,120,0.04);border-color:rgba(255,45,120,0.3);transform:translateY(-3px);}
        .sh-b-icon{color:var(--p);flex-shrink:0;margin-top:2px;background:rgba(255,45,120,0.1);padding:6px;border-radius:8px;}
        .sh-b-card-title{font-size:16px;font-weight:700;color:var(--foreground);margin-bottom:6px;}
        .sh-b-card-desc{font-size:13px;line-height:1.5;color:var(--muted-foreground);}
        /* animations */
        @keyframes sup{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
        @keyframes sil{from{opacity:0;transform:translateX(-24px);}to{opacity:1;transform:translateX(0);}}
        .a1{animation:sup .5s cubic-bezier(.22,1,.36,1) .05s both;}
        .a2{animation:sup .5s cubic-bezier(.22,1,.36,1) .12s both;}
        .a3{animation:sup .5s cubic-bezier(.22,1,.36,1) .2s both;}
        .a4{animation:sup .5s cubic-bezier(.22,1,.36,1) .28s both;}
        .a5{animation:sup .5s cubic-bezier(.22,1,.36,1) .36s both;}
        .hal{animation:sil .65s cubic-bezier(.22,1,.36,1) .08s both;}
        /* responsive */
        @media(max-width:1023px){
          .lr{flex-direction:column;}
          .lr-right::before{width:100%;height:2px;top:0;left:0;bottom:auto;background:linear-gradient(to right,transparent,var(--y) 35%,var(--p) 65%,transparent);}
        }
        @media(max-width:480px){.fc{padding:0 4px;}.sb{font-size:12px;}}
      `}</style>

      <div className="login-wrapper">
        <div className="lr">
          {/* LEFT */}
          <div className="ll">
            <div className="ll-glow1" />
            <div className="ll-glow2" />
            <canvas ref={canvasRef} className="cg" />
            <div className="g-ring"><div className="g-ring2" /></div>
            <div className="g-tri" />
            <div className="g-sq" />

            <div className="logo hal">
              <div className="logo-icon">
                <Zap size={20} strokeWidth={3} color="#06060A" />
              </div>
              <div>
                <div className="logo-name">Cadence</div>
                <div className="logo-sub">Goal Portal</div>
              </div>
            </div>

            <div className="hero hal">
              <div className="eyebrow">
                <span className="eyebrow-dot" />
                Enterprise Performance
              </div>
              <h1 className="h1">
                Drive <span className="y">Goals.</span><br />
                Track <span className="p">Progress.</span><br />
                Win Together.
              </h1>
              <p className="hsub">
                Set meaningful goals, align teams with OKRs, and track quarterly achievement, all in one high-velocity platform.
              </p>
              <div className="sg">
                {stats.map(({ icon: Icon, label, value }) => (
                  <div className="sc" key={label}>
                    <Icon size={18} style={{ color: "var(--brand-yellow)", flexShrink: 0 }} />
                    <div>
                      <span className="sc-label" style={{ display: "block", marginBottom: 2 }}>{label}</span>
                      <span className="sc-val">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="badge hal">
              <Shield size={11} />
              AtomQuest Hackathon 2026
            </div>
          </div>

          {/* RIGHT */}
          <div className="lr-right">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                style={{ position: "absolute", top: 20, right: 20, background: "transparent", border: "none", cursor: "pointer", color: "var(--foreground)", opacity: 0.7, zIndex: 10 }}
                title="Toggle Theme"
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}
            <div className="fc">
              <div className="mlogo">
                <div className="mlogo-icon" />
                <span className="mlogo-name">Cadence</span>
              </div>

              <div className="fh a1">
                <p className="fey">Access Portal</p>
                <h2 className="ft">Welcome<br />Back.</h2>
                <p className="fs">Sign in to your goal dashboard</p>
              </div>

              {state?.message && (
                <div className="ferr a1">
                  <Shield size={14} style={{ flexShrink: 0 }} />
                  {state.message}
                </div>
              )}

              <form action={action}>
                <div className="ig a2">
                  <label className="il" htmlFor="email">Work Email</label>
                  <div className="iw">
                    <Mail size={16} className="ii" />
                    <input ref={emailRef} id="email" name="email" type="email" autoComplete="email"
                      placeholder="you@company.com" className="li" aria-describedby="email-error" />
                  </div>
                  {state?.errors?.email && <p id="email-error" className="ie">{state.errors.email[0]}</p>}
                </div>

                <div className="ig a3">
                  <label className="il" htmlFor="password">Password</label>
                  <div className="iw">
                    <Lock size={16} className="ii" />
                    <input ref={passwordRef} id="password" name="password" type="password" autoComplete="current-password"
                      placeholder="••••••••" className="li" aria-describedby="password-error" />
                  </div>
                  {state?.errors?.password && <p id="password-error" className="ie">{state.errors.password[0]}</p>}
                </div>

                <button id="login-submit" type="submit" disabled={pending} className="sb a4">
                  {pending
                    ? <><Loader2 size={16} className="spin" /> Signing in…</>
                    : <>Sign In <ArrowRight size={16} /></>}
                </button>

                <div className="dv a5"><div className="dvl" /><span className="dvt">or</span><div className="dvl" /></div>

                <button
                  type="button"
                  onClick={handleSSOClick}
                  disabled={ssoChecking}
                  className="sso a5"
                  id="sso-btn"
                >
                  {ssoChecking ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
                      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                    </svg>
                  )}
                  Sign in with Microsoft
                </button>

                <div className="dem a5">
                  <p className="dh"><MousePointer2 size={12} /> Click a demo account to autofill</p>
                  <div className="dl">
                    {demoAccounts.map(({ role, email, pass, color }) => (
                      <div
                        className="dr"
                        key={role}
                        style={{ borderLeftColor: color, cursor: "pointer", transition: "all 0.25s" }}
                        onClick={e => fillDemo(email, pass, e.currentTarget)}
                        title={`Click to fill: ${email}`}
                      >
                        <div>
                          <p className="drl">{role}</p>
                          <p className="dre">{email}</p>
                        </div>
                        <code className="drp" style={{ color }}>{pass}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* NEW SHOWCASE SECTION */}
        <div className="showcase">
          <div className="sh-bg-1" />
          <div className="sh-bg-2" />
          <div className="sh-bg-3" />
          <div className="sh-mesh" />
          {/* Decorative floating shapes behind glassmorphism */}
          <div className="g-ring" style={{ top: '20%', right: '5%', zIndex: 1, opacity: 0.5 }}><div className="g-ring2" /></div>
          <div className="g-sq" style={{ top: '60%', left: '10%', zIndex: 1, opacity: 0.5 }} />
          <div className="g-tri" style={{ top: '80%', right: '20%', zIndex: 1, opacity: 0.5 }} />

          <div className="sh-container">
            <h2 className="sh-title">Platform <span>Capabilities</span></h2>
            <p className="sh-sub">Built to handle complex enterprise performance workflows out-of-the-box.</p>

            <div className="sh-grid">
              {/* Feature 1 */}
              <div className="sh-card">
                <div className="sh-card-icon"><Target size={24} /></div>
                <div>
                  <h3 className="sh-card-title">Goal Creation & Approval</h3>
                  <p className="sh-card-desc">Define thrust areas, strict weightage rules (min 10%, max 100%), and L1 manager approval cycles.</p>
                </div>
                <div className="sh-mock">
                  <div className="m-row"><div className="m-circle" style={{ background: 'var(--y)', color: '#000' }}>Q1</div><div className="m-bar" style={{ width: '40%' }}></div></div>
                  <div className="m-row"><div className="m-circle">Q2</div><div className="m-bar" style={{ width: '70%' }}></div></div>
                  <div className="m-row"><div className="m-circle">Q3</div><div className="m-bar y" style={{ width: '20%' }}></div></div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="sh-card">
                <div className="sh-card-icon"><CheckCircle2 size={24} /></div>
                <div>
                  <h3 className="sh-card-title">Quarterly Check-ins</h3>
                  <p className="sh-card-desc">Enforced quarterly windows for achievement capture, complete with manager commentary and computed scores.</p>
                </div>
                <div className="sh-mock" style={{ justifyContent: 'space-around' }}>
                  <div className="m-row"><div style={{ fontSize: 12, fontWeight: 600, width: 40 }}>Target</div><div className="m-bar" style={{ flex: 1 }}></div></div>
                  <div className="m-row"><div style={{ fontSize: 12, fontWeight: 600, width: 40 }}>Actual</div><div className="m-bar y" style={{ width: '60%' }}></div></div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="sh-card">
                <div className="sh-card-icon"><Workflow size={24} /></div>
                <div>
                  <h3 className="sh-card-title">Shared Departmental KPIs</h3>
                  <p className="sh-card-desc">Push goals top-down to multiple employees. Achievement syncs seamlessly while allowing individual weightage tweaks.</p>
                </div>
                <div className="sh-mock" style={{ alignItems: 'center' }}>
                  <div className="m-bar p" style={{ width: 80, marginBottom: 8 }}></div>
                  <div className="m-row" style={{ width: '100%' }}>
                    <div className="m-circle" style={{ width: 16, height: 16 }}></div><div className="m-line"></div>
                    <div className="m-circle" style={{ width: 16, height: 16 }}></div><div className="m-line"></div>
                    <div className="m-circle" style={{ width: 16, height: 16 }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sh-bonus">
              <h4 className="sh-b-title">Enterprise Add-ons</h4>
              <div className="sh-b-grid">
                <div className="sh-b-card">
                  <div className="sh-b-icon"><Server size={18} /></div>
                  <div>
                    <div className="sh-b-card-title">Entra ID (SSO) Sync</div>
                    <div className="sh-b-card-desc">Auto-provision roles and reporting hierarchies via Azure AD groups.</div>
                  </div>
                </div>
                <div className="sh-b-card">
                  <div className="sh-b-icon"><MailPlus size={18} /></div>
                  <div>
                    <div className="sh-b-card-title">Teams Integration</div>
                    <div className="sh-b-card-desc">Adaptive cards, deep links, and email notifications for cycle events.</div>
                  </div>
                </div>
                <div className="sh-b-card">
                  <div className="sh-b-icon"><BellRing size={18} /></div>
                  <div>
                    <div className="sh-b-card-title">Escalation Engine</div>
                    <div className="sh-b-card-desc">Rule-based auto-alerts that trigger skip-level HR notifications for delays.</div>
                  </div>
                </div>
                <div className="sh-b-card">
                  <div className="sh-b-icon"><ChartBar size={18} /></div>
                  <div>
                    <div className="sh-b-card-title">Advanced Analytics</div>
                    <div className="sh-b-card-desc">QoQ achievement trends and L1 manager effectiveness dashboards.</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── SSO Setup Modal ───────────────────────────────────────────────── */}
      {ssoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={() => setSsoModal(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-5"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div style={{ background: "rgba(59,130,246,0.12)", borderRadius: 12, padding: 10 }}>
                  <svg width="22" height="22" viewBox="0 0 21 21" fill="none">
                    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.3 }} className="text-foreground">Microsoft SSO Setup Required</h2>
                  <p className="text-muted-foreground text-xs mt-0.5">Azure AD is not yet configured. Follow these steps to enable it.</p>
                </div>
              </div>
              <button
                onClick={() => setSsoModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                style={{ fontSize: 20, lineHeight: 1, background: "none", border: "none", cursor: "pointer" }}
              >✕</button>
            </div>

            {/* Steps */}
            <ol className="space-y-3">
              {[
                { n: 1, title: "Register an Azure AD App", body: "portal.azure.com → Microsoft Entra ID → App Registrations → New Registration" },
                { n: 2, title: "Set the Redirect URI", body: "Authentication → Add URI → Web → https://your-domain/api/auth/callback/microsoft-entra-id" },
                { n: 3, title: "Create a Client Secret", body: "Certificates & Secrets → New client secret → copy value" },
                { n: 4, title: "Enable Group Claims", body: 'App Manifest → set "groupMembershipClaims": "SecurityGroup"' },
                { n: 5, title: "Create Security Groups", body: "Entra ID → Groups → Create Cadence-Employees, Cadence-Managers, Cadence-Admins" },
                { n: 6, title: "Add env vars to .env", body: "AZURE_AD_CLIENT_ID · AZURE_AD_CLIENT_SECRET · AZURE_AD_TENANT_ID · AZURE_AD_GROUP_EMPLOYEE/MANAGER/ADMIN" },
              ].map(({ n, title, body }) => (
                <li key={n} className="flex gap-3">
                  <span style={{ minWidth: 24, height: 24, borderRadius: "50%", background: "oklch(0.55 0.26 270)", color: "#fff", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {n}
                  </span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 13 }} className="text-foreground">{title}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{body}</p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">Full guide in Admin → Integrations</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSsoModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Dismiss
                </button>
                <a
                  href="/api/auth/signin/microsoft-entra-id"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors"
                  style={{ background: "oklch(0.55 0.26 270)" }}
                >
                  Try Anyway →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
