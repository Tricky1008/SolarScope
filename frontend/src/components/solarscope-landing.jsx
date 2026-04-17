import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import StepsLine from "./StepsLine";
import { Component as HorizonHero } from "./ui/horizon-hero-section";


// ═══════════════════════════════════════════════════════════
//  GLOBAL STYLES
// ═══════════════════════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&family=IBM+Plex+Mono:wght@400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --bg:#04040a;
  --surface:#09090f;
  --surface2:#0e0e18;
  --border:rgba(255,255,255,0.07);
  --text:#eeeef5;
  --muted:#6a6a82;
  --amber:#f59e0b;
  --orange:#f97316;
  --cyan:#22d3ee;
  --green:#4ade80;
  --red:#f87171;
  --gAmber:rgba(245,158,11,0.25);
  --gOrange:rgba(249,115,22,0.2);
  --gCyan:rgba(34,211,238,0.2);
  --gGreen:rgba(74,222,128,0.18);
  --fHead:'Bebas Neue',sans-serif;
  --fBody:'IBM Plex Sans',sans-serif;
  --fMono:'IBM Plex Mono',monospace;
  --expo:cubic-bezier(0.16,1,0.3,1);
  --back:cubic-bezier(0.34,1.56,0.64,1);
}

.ss-root{scroll-behavior:smooth;overflow-x:hidden}
.ss-root{background:var(--bg);color:var(--text);font-family:var(--fBody);cursor:none;overflow-x:hidden;min-height:100vh;}

::-webkit-scrollbar{width:3px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--amber);border-radius:2px}

/* ── CURSOR ── */
#cs-dot,#cs-ring{position:fixed;top:0;left:0;border-radius:50%;pointer-events:none;z-index:9999;transform:translate(-50%,-50%)}
#cs-dot{width:5px;height:5px;background:#fff;transition:width .15s var(--back),height .15s var(--back),background .2s}
#cs-ring{width:34px;height:34px;border:1.5px solid rgba(245,158,11,0.5);transition:width .4s var(--expo),height .4s var(--expo),border-color .3s,background .3s}
.ss-root.ch #cs-dot{width:8px;height:8px;background:var(--amber)}
.ss-root.ch #cs-ring{width:52px;height:52px;border-color:var(--amber);background:var(--gAmber)}

/* ── NOISE ── */
#noise{position:fixed;inset:0;z-index:1;pointer-events:none;opacity:.03;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size:128px}

/* ── CANVAS ── */
#pc{position:fixed;inset:0;z-index:0;pointer-events:none}

/* ── REVEAL ── */
.rv{opacity:0;transform:translateY(36px);transition:opacity .9s var(--expo),transform .9s var(--expo)}
.rv.on{opacity:1;transform:none}
.rvl{opacity:0;transform:translateX(-44px);transition:opacity .9s var(--expo),transform .9s var(--expo)}
.rvl.on{opacity:1;transform:none}
.rvr{opacity:0;transform:translateX(44px);transition:opacity .9s var(--expo),transform .9s var(--expo)}
.rvr.on{opacity:1;transform:none}
.rvs{opacity:0;transform:scale(.9);transition:opacity .9s var(--expo),transform .9s var(--expo)}
.rvs.on{opacity:1;transform:scale(1)}
.stg>*{opacity:0;transform:translateY(28px);transition:opacity .7s var(--expo),transform .7s var(--expo)}
.stg.on>*:nth-child(1){opacity:1;transform:none;transition-delay:.04s}
.stg.on>*:nth-child(2){opacity:1;transform:none;transition-delay:.12s}
.stg.on>*:nth-child(3){opacity:1;transform:none;transition-delay:.20s}
.stg.on>*:nth-child(4){opacity:1;transform:none;transition-delay:.28s}
.stg.on>*:nth-child(5){opacity:1;transform:none;transition-delay:.36s}
.stg.on>*:nth-child(6){opacity:1;transform:none;transition-delay:.44s}
.stg.on>*:nth-child(7){opacity:1;transform:none;transition-delay:.52s}
.stg.on>*:nth-child(8){opacity:1;transform:none;transition-delay:.60s}
.stg.on>*:nth-child(9){opacity:1;transform:none;transition-delay:.68s}
.stg.on>*:nth-child(10){opacity:1;transform:none;transition-delay:.76s}

/* ── NAV ── */
.nav{position:fixed;top:0;left:0;right:0;z-index:100;height:62px;display:flex;align-items:center;justify-content:space-between;padding:0 52px;backdrop-filter:blur(16px);background:rgba(4,4,10,.75);border-bottom:1px solid var(--border);transition:box-shadow .4s}
.nav.scrolled{box-shadow:0 8px 48px rgba(0,0,0,.6)}
.nav-logo{font-family:var(--fHead);font-size:1.6rem;letter-spacing:.06em;display:flex;align-items:center;gap:8px}
.logo-sun{width:28px;height:28px;position:relative;display:flex;align-items:center;justify-content:center}
.logo-sun-core{width:14px;height:14px;border-radius:50%;background:radial-gradient(circle,#fff 0%,var(--amber) 60%,var(--orange) 100%);box-shadow:0 0 16px var(--amber),0 0 32px var(--gAmber);animation:sunPulse 3s ease-in-out infinite}
@keyframes sunPulse{0%,100%{box-shadow:0 0 16px var(--amber),0 0 32px var(--gAmber)}50%{box-shadow:0 0 24px var(--amber),0 0 48px var(--gAmber),0 0 64px rgba(245,158,11,.1)}}
.ray{position:absolute;width:2px;height:6px;background:var(--amber);border-radius:1px;transform-origin:50% 200%;animation:rayRot 4s linear infinite}
.nav-links{display:flex;gap:28px}
.nl{font-size:.875rem;font-weight:500;color:var(--muted);cursor:pointer;transition:color .2s;text-decoration:none;position:relative}
.nl::after{content:'';position:absolute;bottom:-2px;left:0;right:100%;height:1px;background:var(--amber);transition:right .3s var(--expo)}
.nl:hover{color:var(--text)}
.nl:hover::after{right:0}
.nav-cta{padding:8px 20px;border-radius:8px;background:linear-gradient(135deg,var(--amber),var(--orange));color:#000;font-size:.875rem;font-weight:600;font-family:var(--fBody);border:none;cursor:pointer;position:relative;overflow:hidden;transition:transform .2s var(--back),box-shadow .3s}
.nav-cta:hover{transform:translateY(-2px);box-shadow:0 8px 24px var(--gAmber)}

/* ── HERO ── */
.hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:110px 52px 80px;text-align:center;position:relative;z-index:2;overflow:hidden}
.hero-sunburst{position:absolute;width:900px;height:900px;border-radius:50%;top:50%;left:50%;transform:translate(-50%,-55%);background:radial-gradient(circle,rgba(245,158,11,.18) 0%,rgba(249,115,22,.07) 35%,transparent 70%);pointer-events:none;animation:burstPulse 6s ease-in-out infinite}
@keyframes burstPulse{0%,100%{transform:translate(-50%,-55%) scale(1);opacity:.8}50%{transform:translate(-50%,-55%) scale(1.12);opacity:.5}}
.hero-ring{position:absolute;border-radius:50%;pointer-events:none;border:1px solid;animation:hrRing 5s ease-in-out infinite}
.hr1{width:360px;height:360px;top:50%;left:50%;margin:-180px 0 0 -180px;border-color:rgba(245,158,11,.12);animation-delay:0s}
.hr2{width:560px;height:560px;top:50%;left:50%;margin:-280px 0 0 -280px;border-color:rgba(245,158,11,.07);animation-delay:1.2s}
.hr3{width:760px;height:760px;top:50%;left:50%;margin:-380px 0 0 -380px;border-color:rgba(245,158,11,.04);animation-delay:2.4s}
.hr4{width:960px;height:960px;top:50%;left:50%;margin:-480px 0 0 -480px;border-color:rgba(245,158,11,.02);animation-delay:3.6s}
@keyframes hrRing{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.05);opacity:.4}}
.hero-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:999px;border:1px solid rgba(245,158,11,.3);background:rgba(245,158,11,.06);font-size:.75rem;font-weight:500;color:var(--amber);margin-bottom:28px;opacity:0;animation:fadeUp .8s var(--expo) .2s forwards}
.badge-live{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);animation:livePulse 2s ease-in-out infinite}
@keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.5)}}
.hero-title{font-family:var(--fHead);font-size:clamp(4rem,10vw,9rem);letter-spacing:.04em;line-height:.95;color:var(--text);opacity:0;animation:fadeUp .9s var(--expo) .35s forwards}
.ht-solar{background:linear-gradient(135deg,var(--amber) 0%,var(--orange) 50%,#fbbf24 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;background-size:200% 200%;animation:gradShift 3s ease-in-out infinite alternate}
@keyframes gradShift{0%{background-position:0% 50%}100%{background-position:100% 50%}}
.hero-sub{max-width:580px;margin:20px auto 36px;font-size:1.1rem;line-height:1.75;color:var(--muted);font-weight:300;opacity:0;animation:fadeUp .9s var(--expo) .5s forwards}
.hero-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;opacity:0;animation:fadeUp .9s var(--expo) .65s forwards}
.btn-primary{padding:14px 32px;border-radius:10px;background:linear-gradient(135deg,var(--amber),var(--orange));color:#000;font-size:1rem;font-weight:600;font-family:var(--fBody);border:none;cursor:pointer;position:relative;overflow:hidden;transition:transform .25s var(--back),box-shadow .3s}
.btn-primary:hover{transform:translateY(-3px) scale(1.02);box-shadow:0 16px 40px var(--gAmber)}
.btn-ghost{padding:14px 32px;border-radius:10px;background:transparent;color:var(--text);font-size:1rem;font-weight:500;font-family:var(--fBody);border:1px solid var(--border);cursor:pointer;transition:border-color .3s,background .3s,transform .25s var(--back)}
.btn-ghost:hover{border-color:var(--amber);background:var(--gAmber);transform:translateY(-3px)}

/* Hero stats strip */
.hero-stats{display:flex;gap:40px;margin-top:56px;opacity:0;animation:fadeUp .9s var(--expo) .8s forwards}
.hs-item{text-align:center}
.hs-val{font-family:var(--fHead);font-size:1.8rem;letter-spacing:.04em;background:linear-gradient(135deg,var(--amber),var(--orange));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hs-lbl{font-size:.72rem;color:var(--muted);margin-top:2px;font-weight:500;letter-spacing:.06em;text-transform:uppercase}
.hs-div{width:1px;background:var(--border);align-self:stretch}

/* Map mockup */
.hero-map{position:relative;margin-top:72px;width:100%;max-width:1100px;opacity:0;animation:fadeUp 1s var(--expo) .9s forwards}
.map-window{border-radius:16px;overflow:hidden;border:1px solid var(--border);background:#070712;box-shadow:0 40px 120px rgba(0,0,0,.8),0 0 80px var(--gAmber);transform:perspective(1400px) rotateX(5deg);transition:transform .6s var(--expo)}
.map-window:hover{transform:perspective(1400px) rotateX(0deg)}
.map-bar{display:flex;align-items:center;gap:8px;padding:10px 16px;background:rgba(255,255,255,.03);border-bottom:1px solid var(--border)}
.map-dot{width:10px;height:10px;border-radius:50%}
.map-url{flex:1;background:rgba(255,255,255,.05);border-radius:6px;padding:5px 12px;font-family:var(--fMono);font-size:.72rem;color:var(--muted);text-align:left}
.map-body{display:grid;grid-template-columns:1fr 380px;height:400px}
.map-tiles{background:#0c0c1a;position:relative;overflow:hidden}
.map-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(34,211,238,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.04) 1px,transparent 1px);background-size:32px 32px}
.map-tile{position:absolute;border:1px solid rgba(34,211,238,.06);background:rgba(255,255,255,.01);border-radius:2px}
.building-poly{position:absolute;border:2px solid var(--amber);background:rgba(245,158,11,.15);border-radius:3px;animation:polyAppear .8s var(--expo) 1.5s both;box-shadow:0 0 20px var(--gAmber),inset 0 0 20px rgba(245,158,11,.1)}
@keyframes polyAppear{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
.map-click-ring{position:absolute;width:40px;height:40px;border-radius:50%;border:2px solid var(--amber);animation:clickRing 2s ease-out 1.2s infinite;margin:-20px 0 0 -20px}
@keyframes clickRing{0%{transform:scale(0);opacity:1}100%{transform:scale(3);opacity:0}}
.map-label{position:absolute;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:.7rem;color:var(--text);white-space:nowrap;animation:fadeUp .5s var(--expo) 2s both}
.panel-side{border-left:1px solid var(--border);background:var(--surface);display:flex;flex-direction:column;overflow:hidden}
.panel-header{padding:14px 16px;border-bottom:1px solid var(--border);font-size:.85rem;font-weight:600;display:flex;align-items:center;gap:8px}
.panel-body{flex:1;padding:14px 16px;display:flex;flex-direction:column;gap:12px;overflow-y:auto}
.score-row{display:flex;align-items:center;gap:10px}
.score-badge{font-family:var(--fHead);font-size:2.2rem;letter-spacing:.04em;background:linear-gradient(135deg,var(--green),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.metric-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.metric-card{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px 12px}
.mc-val{font-family:var(--fMono);font-size:.95rem;font-weight:500;color:var(--amber)}
.mc-lbl{font-size:.65rem;color:var(--muted);margin-top:2px}
.mini-bars{display:flex;align-items:flex-end;gap:3px;height:40px;padding:4px 0}
.mb-bar{flex:1;border-radius:2px 2px 0 0;background:linear-gradient(to top,var(--amber),var(--orange));opacity:.7;transition:opacity .2s}
.mb-bar:hover{opacity:1}

/* ── MARQUEE ── */
.mq-wrap{overflow:hidden;padding:20px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:rgba(255,255,255,.01);position:relative;z-index:2}
.mq-track{display:flex;gap:40px;width:max-content;animation:mq 35s linear infinite}
.mq-track:hover{animation-play-state:paused}
@keyframes mq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.mq-item{display:flex;align-items:center;gap:10px;font-size:.82rem;color:var(--muted);white-space:nowrap;font-weight:500}
.mq-dot{width:4px;height:4px;border-radius:50%;background:var(--amber);flex-shrink:0}

/* ── SECTION BASE ── */
section{position:relative;z-index:2;width:100%;overflow:hidden}
.container{max-width:1200px;margin:0 auto;padding:0 52px}
.sec-label{font-size:.72rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--amber);margin-bottom:14px;display:flex;align-items:center;gap:10px}
.sec-label::before{content:'';width:20px;height:1px;background:var(--amber)}
.sec-title{font-family:var(--fHead);font-size:clamp(2.2rem,5vw,4.5rem);letter-spacing:.04em;line-height:1}
.sec-sub{font-size:1rem;color:var(--muted);line-height:1.75;font-weight:300;max-width:520px;margin-top:14px}

/* ── HOW IT WORKS PIPELINE ── */
.pipeline-sec{padding:130px 0;background:linear-gradient(180deg,var(--bg) 0%,var(--surface) 50%,var(--bg) 100%)}
.pipeline-header{text-align:center;margin-bottom:80px}
.pipeline-header .sec-label{justify-content:center}
.pipeline-header .sec-label::before{display:none}
.pipeline-track{position:relative;padding:0 52px}
.pipe-line{position:absolute;left:50%;top:0;bottom:0;width:1px;background:linear-gradient(180deg,transparent,var(--amber),var(--orange),var(--cyan),transparent);transform:translateX(-50%);animation:pipeFlow 4s ease-in-out infinite}
@keyframes pipeFlow{0%,100%{opacity:.4}50%{opacity:1}}
.pipe-dot-travel{position:absolute;left:50%;width:8px;height:8px;background:var(--amber);border-radius:50%;box-shadow:0 0 16px var(--amber);transform:translateX(-50%);animation:dotTravel 4s ease-in-out infinite}
@keyframes dotTravel{0%{top:0%;opacity:0}10%{opacity:1}90%{opacity:1}100%{top:100%;opacity:0}}
.steps-grid{display:flex;flex-direction:column;gap:0}
.step-row{display:grid;grid-template-columns:1fr 60px 1fr;align-items:center;gap:0;min-height:100px}
.step-row:nth-child(odd) .step-card{grid-column:1;grid-row:1}
.step-row:nth-child(odd) .step-center{grid-column:2;grid-row:1}
.step-row:nth-child(odd) .step-empty{grid-column:3;grid-row:1}
.step-row:nth-child(even) .step-card{grid-column:3;grid-row:1;order:3}
.step-row:nth-child(even) .step-center{grid-column:2;grid-row:1;order:2}
.step-row:nth-child(even) .step-empty{grid-column:1;grid-row:1;order:1}
.step-center{display:flex;justify-content:center;align-items:center}
.step-node{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--fHead);font-size:1.1rem;border:2px solid var(--amber);background:var(--bg);color:var(--amber);position:relative;z-index:2;transition:all .3s;box-shadow:0 0 0 4px rgba(245,158,11,.08)}
.step-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px 24px;margin:8px 12px;transition:border-color .3s,transform .3s,box-shadow .3s;cursor:default;position:relative;overflow:hidden}
.step-card::before{content:'';position:absolute;inset:0;opacity:0;background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(245,158,11,.1) 0%,transparent 60%);pointer-events:none;transition:opacity .4s}
.step-card:hover{border-color:rgba(245,158,11,.3);transform:translateY(-3px);box-shadow:0 16px 40px rgba(0,0,0,.4)}
.step-card:hover::before{opacity:1}
.step-card:hover .step-node{background:var(--amber);color:#000;box-shadow:0 0 24px var(--gAmber)}
.step-num{font-size:.65rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--amber);margin-bottom:6px}
.step-title{font-family:var(--fHead);font-size:1.15rem;letter-spacing:.04em;margin-bottom:6px}
.step-desc{font-size:.82rem;color:var(--muted);line-height:1.6}
.step-badge{display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:4px 10px;border-radius:6px;font-size:.68rem;font-weight:600;font-family:var(--fMono)}

/* ── FEATURES BENTO ── */
.features-sec{padding:130px 0;background:radial-gradient(ellipse at 50% 0%,rgba(245,158,11,.08) 0%,transparent 60%),var(--bg)}
.features-bento{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:auto auto;gap:18px;margin-top:72px}
.fb{background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;position:relative;transition:border-color .3s,transform .4s var(--expo),box-shadow .4s;cursor:default}
.fb::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--amber),var(--orange));transform:scaleX(0);transform-origin:left;transition:transform .5s var(--expo)}
.fb:hover{border-color:rgba(245,158,11,.35);transform:translateY(-4px);box-shadow:0 24px 60px rgba(0,0,0,.4)}
.fb:hover::after{transform:scaleX(1)}
.fb-wide{grid-column:span 2}
.fb-tall{grid-row:span 2}
.fb-inner{padding:28px;height:100%;display:flex;flex-direction:column;position:relative;z-index:1}
.fb-glow{position:absolute;inset:0;opacity:0;pointer-events:none;transition:opacity .4s}
.fb:hover .fb-glow{opacity:1}
.fb-icon{width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;margin-bottom:16px;background:rgba(255,255,255,.04)}
.fb-title{font-family:var(--fHead);font-size:1.25rem;letter-spacing:.04em;margin-bottom:8px}
.fb-desc{font-size:.85rem;color:var(--muted);line-height:1.65}
.fb-visual{flex:1;margin-top:20px;border-radius:10px;overflow:hidden}

/* ── SCORE GAUGE ── */
.gauge-wrap{display:flex;align-items:center;justify-content:center;padding:24px}

/* ── TECH STACK ── */
.tech-sec{padding:130px 0;background:linear-gradient(180deg,var(--bg) 0%,var(--surface) 60%,var(--bg) 100%)}
.tech-tabs{display:flex;gap:8px;margin-top:48px;margin-bottom:40px;flex-wrap:wrap}
.tech-tab{padding:8px 18px;border-radius:8px;font-size:.82rem;font-weight:500;border:1px solid var(--border);color:var(--muted);cursor:pointer;transition:all .25s;font-family:var(--fBody)}
.tech-tab.active{background:rgba(245,158,11,.12);border-color:rgba(245,158,11,.4);color:var(--amber)}
.tech-tab:hover:not(.active){border-color:rgba(255,255,255,.15);color:var(--text)}
.tech-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px}
.tech-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px 20px;transition:all .3s;cursor:default}
.tech-card:hover{border-color:rgba(245,158,11,.3);transform:translateY(-3px);box-shadow:0 16px 40px rgba(0,0,0,.3)}
.tc-name{font-family:var(--fHead);font-size:1.1rem;letter-spacing:.04em;margin-bottom:4px}
.tc-version{font-family:var(--fMono);font-size:.65rem;color:var(--amber);margin-bottom:8px}
.tc-desc{font-size:.78rem;color:var(--muted);line-height:1.55}
.tc-tag{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.62rem;font-weight:600;margin-top:8px}

/* ── ARCHITECTURE ── */
.arch-sec{padding:130px 0;background:radial-gradient(ellipse 100% 60% at 50% 100%,rgba(34,211,238,.06) 0%,transparent 60%),var(--bg)}
.arch-diagram{margin-top:60px;position:relative}
.arch-layer{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px 28px;display:flex;align-items:center;gap:20px;margin-bottom:0;transition:all .3s}
.arch-layer:hover{border-color:rgba(34,211,238,.3);box-shadow:0 0 40px rgba(34,211,238,.08)}
.al-icon{width:48px;height:48px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0}
.al-name{font-family:var(--fHead);font-size:1.1rem;letter-spacing:.04em}
.al-desc{font-size:.8rem;color:var(--muted);margin-top:3px}
.al-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.al-tag{padding:2px 9px;border-radius:5px;font-size:.68rem;font-weight:600;font-family:var(--fMono)}
.arch-arrow{display:flex;justify-content:center;padding:6px 0;position:relative}
.arch-arrow::before{content:'';position:absolute;left:52px;right:52px;top:50%;height:1px;background:linear-gradient(90deg,transparent,var(--border),transparent)}
.arrow-label{font-size:.68rem;color:var(--muted);font-family:var(--fMono);background:var(--bg);padding:2px 10px;border-radius:4px;border:1px solid var(--border);position:relative;z-index:1}

/* ── API REFERENCE ── */
.api-sec{padding:130px 0;background:var(--bg)}
.api-table{margin-top:48px;border-radius:14px;overflow:hidden;border:1px solid var(--border)}
.api-thead{display:grid;grid-template-columns:80px 2fr 1fr;gap:0;background:rgba(245,158,11,.08);border-bottom:1px solid var(--border);padding:12px 20px;font-size:.72rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.api-row{display:grid;grid-template-columns:80px 2fr 1fr;gap:0;padding:14px 20px;border-bottom:1px solid var(--border);transition:background .2s;align-items:center}
.api-row:last-child{border-bottom:none}
.api-row:hover{background:rgba(255,255,255,.02)}
.method{font-family:var(--fMono);font-size:.72rem;font-weight:600;padding:3px 8px;border-radius:5px;text-align:center;width:fit-content}
.ep{font-family:var(--fMono);font-size:.8rem;color:var(--cyan)}
.ep-star{color:var(--amber)}
.ep-desc{font-size:.82rem;color:var(--muted)}

/* ── CALC ENGINE ── */
.engine-sec{padding:130px 0;background:radial-gradient(ellipse 80% 60% at 50% 50%,rgba(245,158,11,.08) 0%,transparent 65%),var(--surface)}
.engine-grid{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:start;margin-top:64px}
.code-block{border-radius:14px;overflow:hidden;border:1px solid var(--border);background:#06060e;box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 40px rgba(34,211,238,.06)}
.code-topbar{display:flex;align-items:center;gap:8px;padding:10px 16px;background:rgba(255,255,255,.03);border-bottom:1px solid var(--border)}
.code-tabs{display:flex;flex:1;gap:0;margin-left:16px}
.code-tab{padding:4px 14px;font-size:.72rem;color:var(--muted);border-right:1px solid var(--border);cursor:pointer;transition:background .2s,color .2s}
.code-tab.active{color:var(--text);background:rgba(255,255,255,.05)}
.code-body{padding:18px 16px;font-size:.73rem;font-family:var(--fMono);line-height:1.85;overflow-x:auto}
.cl{display:flex;gap:16px}
.ln{color:#2d2d42;user-select:none;min-width:18px;text-align:right}
.kw{color:#c792ea}.fn{color:#82aaff}.st{color:#c3e88d}.cm{color:#4a5568;font-style:italic}.nm{color:#f78c6c}.op{color:#89ddff}.ty{color:#ffcb6b}.tc2{color:var(--cyan)}
.cursor-blink{display:inline-block;width:2px;height:.85em;background:var(--cyan);margin-left:1px;animation:blink .8s step-end infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

/* formulas */
.formula-list{display:flex;flex-direction:column;gap:16px}
.formula-card{padding:18px 22px;border-radius:12px;border:1px solid var(--border);background:var(--surface);transition:border-color .3s,transform .3s}
.formula-card:hover{border-color:rgba(245,158,11,.3);transform:translateX(4px)}
.fc-label{font-size:.7rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--amber);margin-bottom:8px}
.fc-formula{font-family:var(--fMono);font-size:.85rem;color:var(--text);background:rgba(255,255,255,.03);padding:10px 14px;border-radius:7px;margin-bottom:8px;overflow-x:auto}
.fc-desc{font-size:.78rem;color:var(--muted);line-height:1.55}

/* ── DECISIONS ── */
.decisions-sec{padding:130px 0;background:var(--bg)}
.decisions-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:56px}
.dec-card{padding:22px 26px;border-radius:13px;border:1px solid var(--border);background:var(--surface);position:relative;overflow:hidden;transition:all .3s}
.dec-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,var(--amber),var(--orange));transform:scaleY(0);transform-origin:top;transition:transform .4s var(--expo)}
.dec-card:hover{border-color:rgba(245,158,11,.25);transform:translateX(4px);box-shadow:0 12px 40px rgba(0,0,0,.3)}
.dec-card:hover::before{transform:scaleY(1)}
.dc-q{font-family:var(--fHead);font-size:1rem;letter-spacing:.04em;margin-bottom:10px;padding-left:10px}
.dc-a{font-size:.82rem;color:var(--muted);line-height:1.65;padding-left:10px}

/* ── DEPLOYMENT ── */
.deploy-sec{padding:130px 0;background:linear-gradient(180deg,var(--bg) 0%,rgba(34,211,238,.03) 50%,var(--bg) 100%)}
.deploy-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:48px;align-items:start;margin-top:64px}
.deploy-cards{display:flex;flex-direction:column;gap:14px}
.deploy-card{padding:20px 24px;border-radius:12px;border:1px solid var(--border);background:var(--surface);display:flex;align-items:center;gap:16px;transition:all .3s}
.deploy-card:hover{border-color:rgba(34,211,238,.3);box-shadow:0 0 30px rgba(34,211,238,.06)}
.dc-icon{width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0}
.dc-name{font-family:var(--fHead);font-size:1rem;letter-spacing:.04em;margin-bottom:3px}
.dc-info{font-size:.8rem;color:var(--muted)}
.dc-platform{font-family:var(--fMono);font-size:.72rem;padding:2px 8px;border-radius:4px;background:rgba(34,211,238,.1);color:var(--cyan);margin-left:auto;flex-shrink:0}
.terminal{border-radius:14px;overflow:hidden;border:1px solid var(--border);background:#03030a;box-shadow:0 24px 60px rgba(0,0,0,.6)}
.term-bar{padding:10px 16px;background:rgba(255,255,255,.03);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px}
.term-title{font-size:.75rem;color:var(--muted);font-family:var(--fMono);margin-left:8px}
.term-body{padding:18px 20px;font-family:var(--fMono);font-size:.75rem;line-height:1.9}
.t-prompt{color:var(--green)}
.t-cmd{color:var(--text)}
.t-out{color:var(--muted)}
.t-success{color:var(--green)}
.t-url{color:var(--cyan)}

/* ── GLOSSARY ── */
.glossary-sec{padding:110px 0;background:var(--surface)}
.glos-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:52px}
.glos-card{padding:18px 22px;border-radius:11px;border:1px solid var(--border);background:var(--bg);transition:all .3s}
.glos-card:hover{border-color:rgba(245,158,11,.3);transform:translateY(-3px)}
.gc-term{font-family:var(--fHead);font-size:1.05rem;letter-spacing:.04em;color:var(--amber);margin-bottom:6px}
.gc-def{font-size:.78rem;color:var(--muted);line-height:1.6}

/* ── CTA ── */
.cta-sec{padding:160px 0;background:radial-gradient(ellipse 80% 80% at 50% 100%,rgba(245,158,11,.15) 0%,rgba(249,115,22,.05) 50%,transparent 70%),var(--bg);text-align:center;position:relative}
.cta-sun{position:absolute;bottom:-200px;left:50%;transform:translateX(-50%);width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(245,158,11,.3) 0%,rgba(249,115,22,.15) 40%,transparent 70%);filter:blur(80px);pointer-events:none;animation:ctaSun 6s ease-in-out infinite}
@keyframes ctaSun{0%,100%{transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(1.3)}}
.cta-title{font-family:var(--fHead);font-size:clamp(3rem,8vw,7rem);letter-spacing:.04em;line-height:.95;margin-bottom:24px}
.cta-sub{font-size:1.1rem;color:var(--muted);margin-bottom:48px;font-weight:300}
.cta-counts{display:flex;justify-content:center;gap:52px;margin-top:80px;position:relative;z-index:2}
.cc-item{text-align:center}
.cc-num{font-family:var(--fHead);font-size:2.8rem;letter-spacing:.04em;background:linear-gradient(135deg,var(--amber),var(--orange));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.cc-lbl{font-size:.75rem;color:var(--muted);margin-top:4px;font-weight:500;letter-spacing:.06em;text-transform:uppercase}

/* ── FOOTER ── */
footer{padding:36px 52px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;font-size:.8rem;color:var(--muted);position:relative;z-index:2}
.footer-stack{display:flex;flex-wrap:wrap;gap:10px}
.ft{font-family:var(--fMono);font-size:.65rem;padding:2px 8px;border-radius:4px;background:rgba(255,255,255,.04);border:1px solid var(--border);color:var(--muted)}

/* ── GRADIENT LINE ── */
.gline{height:1px;width:100%;background:linear-gradient(90deg,transparent,var(--amber),var(--orange),var(--cyan),transparent);opacity:.2;position:relative;z-index:2;animation:glineAnim 5s ease-in-out infinite;background-size:300%}
@keyframes glineAnim{0%{background-position:0%}100%{background-position:300%}}

/* ── FLOAT BADGES ── */
.float-badge{position:absolute;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 14px;font-size:.75rem;box-shadow:0 16px 48px rgba(0,0,0,.6);pointer-events:none;white-space:nowrap;animation:fbFloat 5s ease-in-out infinite}
.fb-1{top:-20px;right:-40px;animation-delay:0s}
.fb-2{bottom:-10px;left:-50px;animation-delay:1.8s}
@keyframes fbFloat{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-10px) rotate(1deg)}}

@keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes rayRot{from{transform:rotate(0deg) translateY(-100%)}to{transform:rotate(360deg) translateY(-100%)}}
`;

// ═══════════════════════════════════════════════════════════
//  PARTICLE ENGINE — solar-themed warm particles
// ═══════════════════════════════════════════════════════════
function useParticles(ref) {
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf, W, H, mouse = { x: -999, y: -999 };
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    class P {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * W; this.y = Math.random() * H;
        this.r = Math.random() * 1.4 + 0.3;
        this.vx = (Math.random() - .5) * .25; this.vy = (Math.random() - .5) * .25;
        this.alpha = 0; this.life = 0; this.maxLife = 250 + Math.random() * 350;
        const c = [[38, 190, 11], [240, 120, 30], [245, 160, 11], [34, 211, 238], [74, 222, 128]];
        const [r, g, b] = c[Math.floor(Math.random() * c.length)];
        this.col = `rgba(${r},${g},${b},`;
      }
      update() {
        const dx = mouse.x - this.x, dy = mouse.y - this.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 160) { this.vx -= dx / d * .018; this.vy -= dy / d * .018; }
        this.vx *= .99; this.vy *= .99;
        this.x += this.vx; this.y += this.vy; this.life++;
        const p = this.life / this.maxLife;
        this.alpha = p < .1 ? p * 4 : p > .9 ? (1 - p) * 10 : .38;
        if (this.life > this.maxLife || this.x < -10 || this.x > W + 10 || this.y < -10 || this.y > H + 10) this.reset();
      }
      draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.col + this.alpha + ")"; ctx.fill();
      }
    }
    const ps = Array.from({ length: 100 }, () => new P());
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
        const dx = ps[i].x - ps[j].x, dy = ps[i].y - ps[j].y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 80) { ctx.beginPath(); ctx.moveTo(ps[i].x, ps[i].y); ctx.lineTo(ps[j].x, ps[j].y); ctx.strokeStyle = `rgba(245,158,11,${(1 - d / 80) * .08})`; ctx.lineWidth = .5; ctx.stroke(); }
      }
      ps.forEach(p => { p.update(); p.draw(); });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const mv = e => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener("mousemove", mv);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("mousemove", mv); };
  }, []);
}

// ═══════════════════════════════════════════════════════════
//  CURSOR
// ═══════════════════════════════════════════════════════════
function useCursor() {
  useEffect(() => {
    const dot = document.getElementById("cs-dot"), ring = document.getElementById("cs-ring");
    if (!dot || !ring) return;
    let rx = 0, ry = 0, mx = 0, my = 0, raf2;
    const lerp = (a, b, t) => a + (b - a) * t;
    const mv = e => { mx = e.clientX; my = e.clientY; };
    const go = () => { rx = lerp(rx, mx, .12); ry = lerp(ry, my, .12); dot.style.left = mx + "px"; dot.style.top = my + "px"; ring.style.left = rx + "px"; ring.style.top = ry + "px"; raf2 = requestAnimationFrame(go); };
    go(); window.addEventListener("mousemove", mv);
    const on = () => document.body.classList.add("ch"), off = () => document.body.classList.remove("ch");
    document.querySelectorAll("button,a,.fb,.step-card,.tech-card,.dec-card,.glos-card,.deploy-card,.formula-card").forEach(el => { el.addEventListener("mouseenter", on); el.addEventListener("mouseleave", off); });
    return () => { cancelAnimationFrame(raf2); window.removeEventListener("mousemove", mv); };
  }, []);
}

// ═══════════════════════════════════════════════════════════
//  SCROLL REVEAL
// ═══════════════════════════════════════════════════════════
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".rv,.rvl,.rvr,.rvs,.stg");
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); } }), { threshold: .1 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ═══════════════════════════════════════════════════════════
//  COUNTER
// ═══════════════════════════════════════════════════════════
function Counter({ end, suffix = "" }) {
  const [val, setVal] = useState(0), ref = useRef();
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      let st = null;
      const step = ts => { if (!st) st = ts; const p = Math.min((ts - st) / 2200, 1), ease = 1 - Math.pow(1 - p, 4); setVal(Math.round(ease * end)); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }, { threshold: .5 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [end]);
  return <span ref={ref} className="cc-num">{val.toLocaleString()}{suffix}</span>;
}

// ═══════════════════════════════════════════════════════════
//  SVG SOLAR SCORE GAUGE
// ═══════════════════════════════════════════════════════════
function SolarGauge({ score = 82, size = 180 }) {
  const [anim, setAnim] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnim(score), 800); return () => clearTimeout(t); }, [score]);
  const R = 70, cx = 90, cy = 95, startAngle = -210, totalArc = 240;
  const toRad = deg => deg * Math.PI / 180;
  const arcPath = (pct) => {
    const endDeg = startAngle + totalArc * pct;
    const sx = cx + R * Math.cos(toRad(startAngle)), sy = cy + R * Math.sin(toRad(startAngle));
    const ex = cx + R * Math.cos(toRad(endDeg)), ey = cy + R * Math.sin(toRad(endDeg));
    const large = totalArc * pct > 180 ? 1 : 0;
    return `M ${sx} ${sy} A ${R} ${R} 0 ${large} 1 ${ex} ${ey}`;
  };
  const pct = anim / 100;
  const color = pct < .4 ? "#f87171" : pct < .65 ? "#f59e0b" : "#4ade80";
  return (
    <svg width={size} height={size} viewBox="0 0 180 180">
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="45%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
      </defs>
      <path d={arcPath(1)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />
      <path d={arcPath(pct)} fill="none" stroke="url(#gaugeGrad)" strokeWidth="10" strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.5s cubic-bezier(0.16,1,0.3,1)", filter: `drop-shadow(0 0 6px ${color})` }} />
      <text x="90" y="88" textAnchor="middle" fontFamily="'Bebas Neue'" fontSize="30" fill={color} style={{ transition: "fill 1s" }}>{anim}</text>
      <text x="90" y="104" textAnchor="middle" fontFamily="'IBM Plex Sans'" fontSize="8" fill="#6a6a82" fontWeight="500" letterSpacing="1">SOLAR SCORE</text>
      <text x="90" y="116" textAnchor="middle" fontFamily="'IBM Plex Sans'" fontSize="7" fill="#4ade80">EXCELLENT</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
//  TYPING EFFECT
// ═══════════════════════════════════════════════════════════
function useTyping(phrases, speed = 55) {
  const [txt, setTxt] = useState(""); const [idx, setIdx] = useState(0); const [del, setDel] = useState(false);
  useEffect(() => {
    const p = phrases[idx];
    const t = setTimeout(() => {
      if (!del) { setTxt(p.slice(0, txt.length + 1)); if (txt.length + 1 === p.length) setTimeout(() => setDel(true), 2000); }
      else { setTxt(p.slice(0, txt.length - 1)); if (txt.length - 1 === 0) { setDel(false); setIdx((idx + 1) % phrases.length); } }
    }, del ? speed / 2 : speed);
    return () => clearTimeout(t);
  }, [txt, del, idx, phrases, speed]);
  return txt;
}

// ═══════════════════════════════════════════════════════════
//  MAP TILE GENERATOR
// ═══════════════════════════════════════════════════════════
const MAP_TILES = Array.from({ length: 40 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  w: 4 + Math.random() * 12, h: 3 + Math.random() * 8,
}));

// ═══════════════════════════════════════════════════════════
//  TECH DATA
// ═══════════════════════════════════════════════════════════
const TECH = {
  Frontend: [
    { name: "React", version: "18", desc: "Core UI framework, single-page application with hooks-based architecture", tag: "UI", tagColor: "#38bdf8" },
    { name: "TypeScript", version: "5.x", desc: "Strongly typed JavaScript — prevents bugs at compile time", tag: "DX", tagColor: "#82aaff" },
    { name: "Leaflet.js", version: "Latest", desc: "Open-source interactive map with dark-theme tile layers", tag: "Maps", tagColor: "#4ade80" },
    { name: "Recharts", version: "Latest", desc: "React-native charting built on D3 for monthly energy charts", tag: "Charts", tagColor: "#f59e0b" },
    { name: "Zustand", version: "Latest", desc: "Lightweight global state — simpler and faster than Redux", tag: "State", tagColor: "#c792ea" },
    { name: "Vite", version: "5.x", desc: "Ultra-fast build tool with near-instant HMR", tag: "Build", tagColor: "#f97316" },
  ],
  Backend: [
    { name: "FastAPI", version: "Python", desc: "Async REST API framework — auto-generates Swagger docs", tag: "API", tagColor: "#4ade80" },
    { name: "PVLib", version: "Latest", desc: "Industry-standard photovoltaic simulation library", tag: "Physics", tagColor: "#f59e0b" },
    { name: "XGBoost", version: "Latest", desc: "Gradient boosting ML model for Solar Score computation", tag: "ML", tagColor: "#f87171" },
    { name: "SQLAlchemy", version: "asyncpg", desc: "Async ORM for non-blocking PostgreSQL operations", tag: "ORM", tagColor: "#82aaff" },
    { name: "ReportLab", version: "Latest", desc: "Server-side PDF generation for downloadable reports", tag: "PDF", tagColor: "#c792ea" },
    { name: "Uvicorn", version: "ASGI", desc: "Production-grade ASGI server for FastAPI", tag: "Server", tagColor: "#38bdf8" },
  ],
  Database: [
    { name: "PostgreSQL", version: "15", desc: "Primary relational database for analysis results", tag: "DB", tagColor: "#82aaff" },
    { name: "PostGIS", version: "Ext", desc: "Geospatial extension — stores polygons, runs spatial queries", tag: "GIS", tagColor: "#4ade80" },
    { name: "Redis", version: "Cache", desc: "In-memory cache for NASA API responses — rate-limit protection", tag: "Cache", tagColor: "#f87171" },
    { name: "Docker", version: "Compose", desc: "One-command reproducible setup for DB and Redis", tag: "DevOps", tagColor: "#38bdf8" },
    { name: "Supabase", version: "Prod", desc: "Managed PostgreSQL + PostGIS for cloud deployment", tag: "Cloud", tagColor: "#f59e0b" },
  ],
  APIs: [
    { name: "NASA POWER", version: "API", desc: "Satellite-derived solar irradiance: GHI, DNI, PVOUT, temperature", tag: "NASA", tagColor: "#f59e0b" },
    { name: "Overpass API", version: "OSM", desc: "Building footprint polygons from OpenStreetMap database", tag: "GIS", tagColor: "#4ade80" },
    { name: "Nominatim", version: "OSM", desc: "Address geocoding — converts text to lat/lon coordinates", tag: "Geo", tagColor: "#38bdf8" },
    { name: "CEA India", version: "2023", desc: "Carbon emission factor: 0.82 kg CO₂ per kWh", tag: "Data", tagColor: "#f87171" },
  ],
};

// ═══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function SolarScope() {
  const navigate = useNavigate();
  const canvasRef = useRef();
  const [scrolled, setScrolled] = useState(false);
  const [techTab, setTechTab] = useState("Frontend");
  const [toastMsg, setToastMsg] = useState("");
  const apiTyping = useTyping(["POST /api/v1/solar/calculate", "GET /api/v1/irradiance?lat=28.6&lon=77.2", "GET /api/v1/buildings/nearby?lat=19.07&lon=72.87", "POST /api/v1/solar/report"]);

  const GITHUB_URL = "https://github.com";
  const SECTION_IDS = { "How It Works": "sec-how", Features: "sec-features", "Tech Stack": "sec-tech", API: "sec-api", Deployment: "sec-deploy" };

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  }, []);

  useParticles(canvasRef);
  useCursor();
  useReveal();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn); return () => window.removeEventListener("scroll", fn);
  }, []);

  // Bento glow
  useEffect(() => {
    document.querySelectorAll(".fb").forEach(c => c.addEventListener("mousemove", e => {
      const r = c.getBoundingClientRect();
      c.querySelector(".fb-glow").style.background = `radial-gradient(circle at ${((e.clientX - r.left) / r.width * 100).toFixed(0)}% ${((e.clientY - r.top) / r.height * 100).toFixed(0)}%,rgba(245,158,11,.12) 0%,transparent 60%)`;
    }));
  }, []);

  const monthData = [38, 42, 55, 72, 88, 95, 98, 91, 76, 58, 41, 35];

  return (
    <div className="ss-root">
      <style>{CSS}</style>
      <div id="cs-dot" /><div id="cs-ring" />
      <div id="noise" />
      <canvas id="pc" ref={canvasRef} />

      {/* ══════════════ NAV ══════════════ */}
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-logo">
          <div className="logo-sun">
            <div className="logo-sun-core" />
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="ray" style={{ transform: `rotate(${i * 45}deg) translateY(-200%)`, animationDelay: `${i * .5}s` }} />
            ))}
          </div>
          <span style={{ color: "var(--amber)" }}>SOLAR</span><span>SCOPE</span>
        </div>
        <div className="nav-links">
          {["How It Works", "Features", "Tech Stack", "API", "Deployment"].map(l => (
            <a key={l} className="nl" style={{ cursor: "pointer" }} onClick={() => scrollTo(SECTION_IDS[l])}>{l}</a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a className="nl" href={GITHUB_URL} target="_blank" rel="noopener noreferrer" style={{ cursor: "pointer" }}>GitHub</a>
          <button className="nav-cta" onClick={() => navigate("/app")}>☀ Try it free</button>
        </div>
      </nav>

      {/* ══════════════ HERO (Three.js immersive) ══════════════ */}
      <HorizonHero onGetStarted={() => navigate("/app")} />

      {/* ══════════════ LEGACY HERO REMOVED — kept below sections ══════════════ */}
      {false && <section className="hero">
        <div className="hero-sunburst" />
        <div className="hr1 hero-ring" /><div className="hr2 hero-ring" />
        <div className="hr3 hero-ring" /><div className="hr4 hero-ring" />

        <div className="hero-badge">
          <span className="badge-live" />
          Live · NASA satellite data · OpenStreetMap · Global coverage
        </div>

        <h1 className="hero-title">
          <span className="ht-solar">SOLAR</span><br />
          <span>SCOPE</span>
        </h1>

        <p className="hero-sub">
          Click any rooftop anywhere on Earth. In under 10 seconds, get a complete solar feasibility report — panel count, kWh, savings, payback period, CO₂ offset, and AI-powered Solar Score.
        </p>

        <div className="hero-actions">
          <button className="btn-primary" onClick={() => navigate("/app")}>☀ Analyse a rooftop →</button>
          <button className="btn-ghost" onClick={() => window.open(GITHUB_URL, "_blank")}>View on GitHub</button>
          <button className="btn-ghost" onClick={() => window.open("http://localhost:8000/docs", "_blank")}>API Docs</button>
        </div>

        <div className="hero-stats">
          <div className="hs-item"><div className="hs-val">10s</div><div className="hs-lbl">Full analysis time</div></div>
          <div className="hs-div" />
          <div className="hs-item"><div className="hs-val">NASA</div><div className="hs-lbl">Satellite irradiance</div></div>
          <div className="hs-div" />
          <div className="hs-item"><div className="hs-val">0–100</div><div className="hs-lbl">ML solar score</div></div>
          <div className="hs-div" />
          <div className="hs-item"><div className="hs-val">6</div><div className="hs-lbl">Currencies supported</div></div>
          <div className="hs-div" />
          <div className="hs-item"><div className="hs-val">Global</div><div className="hs-lbl">Any rooftop, anywhere</div></div>
        </div>

        {/* MAP MOCKUP */}
        <div className="hero-map">
          <div className="float-badge fb-1">
            ☀ <span style={{ color: "var(--amber)", fontWeight: 600 }}>GHI: 1842 kWh/m²/yr</span> — Delhi, India
          </div>
          <div className="float-badge fb-2">
            📄 PDF report <span style={{ color: "var(--green)" }}>ready</span> · 2.4 MB
          </div>

          <div className="map-window">
            <div className="map-bar">
              <span className="map-dot" style={{ background: "#ff5f57" }} />
              <span className="map-dot" style={{ background: "#ffbd2e" }} />
              <span className="map-dot" style={{ background: "#28c840" }} />
              <div className="map-url">solarscope.app — Satellite Map View</div>
              <span style={{ fontSize: ".7rem", color: "var(--muted)", fontFamily: "var(--fMono)" }}>● LIVE</span>
            </div>
            <div className="map-body">
              <div className="map-tiles">
                <div className="map-grid" />
                {MAP_TILES.map(t => (
                  <div key={t.id} className="map-tile" style={{ left: `${t.x}%`, top: `${t.y}%`, width: `${t.w}%`, height: `${t.h}%` }} />
                ))}
                {/* Selected building */}
                <div className="building-poly" style={{ left: "38%", top: "28%", width: "18%", height: "22%" }}>
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: ".6rem", color: "var(--amber)", fontWeight: 600, fontFamily: "var(--fMono)", whiteSpace: "nowrap" }}>
                    OSM POLYGON
                  </div>
                </div>
                <div className="map-click-ring" style={{ left: "47%", top: "39%" }} />
                <div className="map-label" style={{ left: "58%", top: "24%" }}>📍 Connaught Place, New Delhi</div>
                <div className="map-label" style={{ left: "12%", top: "65%", animationDelay: "2.2s" }}>🏢 342 m² footprint</div>
              </div>

              <div className="panel-side">
                <div className="panel-header">
                  <span style={{ color: "var(--amber)" }}>☀</span>
                  Solar Analysis Results
                  <span style={{ marginLeft: "auto", fontSize: ".7rem", color: "var(--green)", fontFamily: "var(--fMono)" }}>✓ DONE</span>
                </div>
                <div className="panel-body">
                  <div className="score-row">
                    <SolarGauge score={82} size={140} />
                    <div>
                      <div style={{ fontSize: ".7rem", color: "var(--muted)", marginBottom: 4, fontWeight: 500 }}>LOCATION</div>
                      <div style={{ fontSize: ".82rem", marginBottom: 8 }}>Connaught Place, Delhi</div>
                      <div style={{ fontSize: ".7rem", color: "var(--muted)", marginBottom: 4, fontWeight: 500 }}>DATA SOURCE</div>
                      <div style={{ fontSize: ".72rem", fontFamily: "var(--fMono)", color: "var(--green)" }}>● NASA_POWER</div>
                    </div>
                  </div>

                  <div className="metric-grid">
                    {[
                      { v: "256 m²", l: "Usable Roof" },
                      { v: "150 panels", l: "Panel Count" },
                      { v: "60 kWp", l: "System Size" },
                      { v: "84,000 kWh", l: "Annual kWh" },
                      { v: "₹7,14,000", l: "Annual Savings" },
                      { v: "7.2 yrs", l: "Payback" },
                      { v: "68.9 t", l: "CO₂/yr offset" },
                      { v: "₹92L NPV", l: "25-yr NPV" },
                    ].map((m, i) => (
                      <div key={i} className="metric-card">
                        <div className="mc-val">{m.v}</div>
                        <div className="mc-lbl">{m.l}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: ".7rem", color: "var(--muted)", marginBottom: 4, fontWeight: 500, letterSpacing: ".06em" }}>MONTHLY GENERATION (kWh)</div>
                  <div className="mini-bars">
                    {monthData.map((v, i) => (
                      <div key={i} className="mb-bar" style={{ height: `${v}%`, animationDelay: `${i * .05}s` }} />
                    ))}
                  </div>

                  <button
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "linear-gradient(135deg,var(--amber),var(--orange))", border: "none", color: "#000", fontWeight: 600, fontSize: ".82rem", fontFamily: "var(--fBody)", cursor: "pointer" }}
                    onClick={() => showToast("PDF download available after running a real analysis in the app!")}
                  >
                    ⬇ Download PDF Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>}

      {/* ══════════════ MARQUEE ══════════════ */}
      <div className="mq-wrap">
        <div className="mq-track">
          {[...Array(2)].flatMap((_, r) => [
            "React 18", "FastAPI", "PVLib Physics", "XGBoost ML", "PostGIS", "NASA POWER", "OpenStreetMap", "Redis Cache", "TypeScript", "Leaflet.js", "Recharts", "Docker", "Supabase", "ReportLab PDF", "Zustand", "UTM Projection"
          ].map((item, i) => (
            <div key={`${r}-${i}`} className="mq-item">
              <span className="mq-dot" />
              {item}
            </div>
          )))}
        </div>
      </div>

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <section id="sec-how" className="pipeline-sec">
        <div className="container pipeline-header rv">
          <div className="sec-label" style={{ justifyContent: "center" }}>10-Step Pipeline</div>
          <h2 className="sec-title" style={{ textAlign: "center" }}>FROM CLICK TO REPORT</h2>
          <p className="sec-sub" style={{ margin: "14px auto 0", textAlign: "center" }}>
            Every rooftop click triggers an automated pipeline that transforms GPS coordinates into a bankable solar feasibility report.
          </p>
        </div>

        <div className="container pipeline-track">
          <StepsLine />


          <div className="steps-grid">
            {[
              { n: "01", title: "Capture Click Coordinates", desc: "Leaflet.js captures lat/lon from your map click. Sent to FastAPI via Axios POST in milliseconds.", color: "var(--amber)", badge: "Leaflet.js", badgeBg: "rgba(245,158,11,.1)" },
              { n: "02", title: "Fetch Building Polygon", desc: "Overpass API queries OpenStreetMap for the exact roof shape — actual polygon nodes, not an estimate.", color: "var(--orange)", badge: "OpenStreetMap", badgeBg: "rgba(249,115,22,.1)" },
              { n: "03", title: "UTM Projection + Area", desc: "Lat/lon reprojects to UTM (flat plane). Shoelace formula computes exact roof area in m². Professional GIS technique.", color: "var(--cyan)", badge: "PostGIS", badgeBg: "rgba(34,211,238,.1)" },
              { n: "04", title: "Apply Usability Factor", desc: "75% of total roof area is usable — accounting for chimneys, HVAC, shadows, and unusable edges.", color: "var(--green)", badge: "× 0.75", badgeBg: "rgba(74,222,128,.1)" },
              { n: "05", title: "NASA POWER Irradiance", desc: "Satellite-derived GHI, DNI, PVOUT, and temperature for the exact coordinates. Cached in Redis.", color: "var(--amber)", badge: "NASA API", badgeBg: "rgba(245,158,11,.1)" },
              { n: "06", title: "PVLib Simulation", desc: "Industry-standard PV physics: panel count → kWp capacity → annual kWh with 80% performance ratio.", color: "var(--orange)", badge: "PVLib", badgeBg: "rgba(249,115,22,.1)" },
              { n: "07", title: "Financial Model", desc: "Annual savings, installation cost, payback period, and 25-year NPV discounted cash flow analysis.", color: "var(--cyan)", badge: "NPV Model", badgeBg: "rgba(34,211,238,.1)" },
              { n: "08", title: "CO₂ Carbon Offset", desc: "0.82 kg CO₂/kWh × annual kWh. Based on CEA India 2023 grid emission factor.", color: "var(--green)", badge: "CEA 2023", badgeBg: "rgba(74,222,128,.1)" },
              { n: "09", title: "XGBoost Solar Score", desc: "ML model trained on irradiance, area, temperature, payback, and kWp. Outputs normalised 0–100 score.", color: "var(--amber)", badge: "XGBoost ML", badgeBg: "rgba(245,158,11,.1)" },
              { n: "10", title: "Result Delivery", desc: "Structured JSON → React renders ScoreGauge + MonthlyChart + financials. PDF available via ReportLab.", color: "var(--orange)", badge: "JSON + PDF", badgeBg: "rgba(249,115,22,.1)" },
            ].map((step, i) => (
              <div key={i} className="step-row">
                {i % 2 === 0 ? (
                  <>
                    <div className="step-card rv" style={{ transitionDelay: `${i * .06}s` }}
                      onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%"); e.currentTarget.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%"); }}>
                      <div className="step-num">STEP {step.n}</div>
                      <div className="step-title">{step.title}</div>
                      <div className="step-desc">{step.desc}</div>
                      <span className="step-badge" style={{ background: step.badgeBg, color: step.color }}>{step.badge}</span>
                    </div>
                    <div className="step-center">
                      <div className="step-node" style={{ borderColor: step.color, color: step.color }}>{step.n}</div>
                    </div>
                    <div />
                  </>
                ) : (
                  <>
                    <div />
                    <div className="step-center">
                      <div className="step-node" style={{ borderColor: step.color, color: step.color }}>{step.n}</div>
                    </div>
                    <div className="step-card rv" style={{ transitionDelay: `${i * .06}s` }}
                      onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%"); e.currentTarget.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%"); }}>
                      <div className="step-num">STEP {step.n}</div>
                      <div className="step-title">{step.title}</div>
                      <div className="step-desc">{step.desc}</div>
                      <span className="step-badge" style={{ background: step.badgeBg, color: step.color }}>{step.badge}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gline" />

      {/* ══════════════ FEATURES BENTO ══════════════ */}
      <section id="sec-features" className="features-sec">
        <div className="container">
          <div className="rv">
            <div className="sec-label">Core Features</div>
            <h2 className="sec-title">EVERYTHING YOU NEED<br />TO GO SOLAR</h2>
            <p className="sec-sub">From real satellite data to ML scoring — every feature built for accuracy, not estimates.</p>
          </div>

          <div className="features-bento stg">
            {/* Wide: Map + Click */}
            <div className="fb fb-wide">
              <div className="fb-glow" />
              <div className="fb-inner">
                <div className="fb-icon" style={{ background: "rgba(245,158,11,.12)" }}>🗺️</div>
                <div className="fb-title">Interactive Global Map</div>
                <div className="fb-desc">Dark-theme Leaflet.js map with OSM tiles. Click any rooftop anywhere on Earth to start analysis. Building polygon drawn automatically.</div>
                <div className="fb-visual" style={{ background: "#07070f", padding: "12px", display: "flex", gap: "8px", alignItems: "flex-end" }}>
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <div style={{ width: "100%", borderRadius: "2px 2px 0 0", background: `linear-gradient(to top,var(--amber),var(--orange))`, height: `${monthData[i] * 0.5}px`, opacity: .7, transition: "height .6s var(--expo)", transitionDelay: `${i * .05}s` }} />
                      <span style={{ fontSize: ".55rem", color: "var(--muted)" }}>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tall: Score Gauge */}
            <div className="fb fb-tall">
              <div className="fb-glow" />
              <div className="fb-inner">
                <div className="fb-icon" style={{ background: "rgba(74,222,128,.1)" }}>🎯</div>
                <div className="fb-title">XGBoost Solar Score</div>
                <div className="fb-desc">ML model trained on irradiance, roof area, temperature, payback, and kWp capacity. Non-linear 0–100 composite score.</div>
                <div className="gauge-wrap">
                  <SolarGauge score={82} size={160} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  {[{ l: "GHI Irradiance", v: 92 }, { l: "Roof Usability", v: 75 }, { l: "Payback Score", v: 84 }].map((f, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".7rem", color: "var(--muted)", marginBottom: 3 }}>
                        <span>{f.l}</span><span style={{ color: "var(--amber)" }}>{f.v}%</span>
                      </div>
                      <div style={{ height: 3, background: "rgba(255,255,255,.06)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${f.v}%`, background: "linear-gradient(90deg,var(--amber),var(--orange))", borderRadius: 2, animation: "progFill 1.5s var(--expo) both", animationDelay: `${i * .2}s` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* NASA Data */}
            <div className="fb">
              <div className="fb-glow" />
              <div className="fb-inner">
                <div className="fb-icon" style={{ background: "rgba(245,158,11,.12)" }}>🛸</div>
                <div className="fb-title">NASA POWER Data</div>
                <div className="fb-desc">Real satellite-derived irradiance. GHI, DNI, PVOUT, temperature. Redis-cached for speed.</div>
                <div style={{ marginTop: 14, background: "var(--bg)", borderRadius: 8, padding: "12px", fontFamily: "var(--fMono)", fontSize: ".7rem", border: "1px solid var(--border)" }}>
                  <div style={{ color: "var(--muted)", marginBottom: 6 }}>// NASA POWER response</div>
                  {[
                    ["GHI", "1842 kWh/m²/yr", true],
                    ["PVOUT", "1476 kWh/kWp/yr", true],
                    ["DNI", "1654 kWh/m²/yr", false],
                    ["TEMP_AVG", "25.4 °C", false],
                  ].map(([k, v, hi], i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                      <span style={{ color: "var(--muted)" }}>{k}:</span>
                      <span style={{ color: hi ? "var(--amber)" : "var(--text)" }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 6, color: "var(--green)", fontSize: ".65rem" }}>● source: NASA_POWER | cached: true</div>
                </div>
              </div>
            </div>

            {/* Financial */}
            <div className="fb">
              <div className="fb-glow" />
              <div className="fb-inner">
                <div className="fb-icon" style={{ background: "rgba(74,222,128,.1)" }}>💰</div>
                <div className="fb-title">Full Financial Model</div>
                <div className="fb-desc">Annual savings, installation cost, payback, and 25-year NPV. Multi-currency: INR, USD, GBP, EUR, AED, SGD.</div>
                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { v: "₹7.14L", l: "Annual Savings", c: "var(--green)" },
                    { v: "7.2 yrs", l: "Payback Period", c: "var(--amber)" },
                    { v: "₹92L", l: "25-yr NPV", c: "var(--cyan)" },
                    { v: "68.9 t", l: "CO₂/yr", c: "var(--green)" },
                  ].map((f, i) => (
                    <div key={i} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontFamily: "var(--fMono)", fontSize: "1rem", fontWeight: 500, color: f.c }}>{f.v}</div>
                      <div style={{ fontSize: ".65rem", color: "var(--muted)", marginTop: 2 }}>{f.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Wide: PostGIS */}
            <div className="fb fb-wide">
              <div className="fb-glow" />
              <div className="fb-inner">
                <div className="fb-icon" style={{ background: "rgba(34,211,238,.1)" }}>🗄️</div>
                <div className="fb-title">PostgreSQL + PostGIS Geospatial Database</div>
                <div className="fb-desc">Building footprints stored as native polygon types. ST_Area(), ST_Within(), ST_Distance(), ST_Intersects() — spatial queries impossible in plain SQL.</div>
                <div style={{ display: "flex", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
                  {["ST_Area()", "ST_Within()", "ST_Distance()", "ST_Intersects()", "WKB format", "SRID:4326", "UTM zone auto-detect"].map((f, i) => (
                    <span key={i} style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(34,211,238,.07)", border: "1px solid rgba(34,211,238,.15)", fontSize: ".72rem", fontFamily: "var(--fMono)", color: "var(--cyan)" }}>{f}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* PDF Report */}
            <div className="fb">
              <div className="fb-glow" />
              <div className="fb-inner">
                <div className="fb-icon" style={{ background: "rgba(249,115,22,.1)" }}>📄</div>
                <div className="fb-title">PDF Report</div>
                <div className="fb-desc">Server-side ReportLab generation. Professional downloadable report with all metrics, charts, and specs.</div>
                <div style={{ marginTop: 14, background: "var(--bg)", borderRadius: 8, padding: "10px 12px", border: "1px solid var(--border)" }}>
                  {["Executive Summary", "System Specifications", "Monthly Chart", "Financial Projections", "CO₂ Impact", "Disclaimers"].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: ".75rem", color: "var(--muted)", borderBottom: i < 5 ? "1px solid rgba(255,255,255,.04)" : "none" }}>
                      <span style={{ color: "var(--green)", fontSize: ".6rem" }}>✓</span>{item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Fallbacks */}
            <div className="fb">
              <div className="fb-glow" />
              <div className="fb-inner">
                <div className="fb-icon" style={{ background: "rgba(248,113,113,.1)" }}>🛡️</div>
                <div className="fb-title">Resilient Fallbacks</div>
                <div className="fb-desc">Never fails silently. OSM fallback → 80m² assumption. NASA fallback → regional estimator with ESTIMATED flag.</div>
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "OSM unavailable", action: "80m² default", c: "var(--orange)" },
                    { label: "NASA rate-limited", action: "Regional estimator", c: "var(--amber)" },
                    { label: "Redis miss", action: "Fresh API call", c: "var(--cyan)" },
                  ].map((f, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 7, fontSize: ".75rem" }}>
                      <span style={{ color: "var(--muted)" }}>{f.label}</span>
                      <span style={{ color: f.c, fontFamily: "var(--fMono)", fontSize: ".7rem" }}>{f.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="gline" />

      {/* ══════════════ CALC ENGINE ══════════════ */}
      <section className="engine-sec">
        <div className="container">
          <div className="rv">
            <div className="sec-label">Calculation Engine</div>
            <h2 className="sec-title">THE PHYSICS BEHIND<br />THE NUMBERS</h2>
            <p className="sec-sub">solar_service.py — the intellectual core. Real formulas used by professional solar engineers.</p>
          </div>

          <div className="engine-grid">
            <div className="code-block rvl">
              <div className="code-topbar">
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57", display: "inline-block" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e", display: "inline-block" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840", display: "inline-block" }} />
                <div className="code-tabs">
                  {["solar_service.py", "pvlib_sim.py", "financial.py"].map((t, i) => (
                    <div key={i} className={`code-tab ${i === 0 ? "active" : ""}`}>{t}</div>
                  ))}
                </div>
              </div>
              <div className="code-body">
                {[
                  [{ t: "cm", v: "# Step 3 — UTM Projection + Shoelace Area" }],
                  [{ t: "fn", v: "def" }, { t: "", v: " " }, { t: "fn", v: "calculate_roof_area" }, { t: "", v: "(polygon_nodes):" }],
                  [{ t: "", v: "  utm = " }, { t: "fn", v: "reproject_to_utm" }, { t: "", v: "(polygon_nodes)" }],
                  [{ t: "", v: "  area = " }, { t: "fn", v: "shoelace_formula" }, { t: "", v: "(utm)" }],
                  [{ t: "kw", v: "  return" }, { t: "", v: " area * " }, { t: "nm", v: "0.75" }, { t: "cm", v: "  # usability factor" }],
                  [],
                  [{ t: "cm", v: "# Step 6 — PVLib Core Simulation" }],
                  [{ t: "fn", v: "def" }, { t: "", v: " " }, { t: "fn", v: "run_pvlib_simulation" }, { t: "", v: "(area, pvout):" }],
                  [{ t: "", v: "  num_panels = " }, { t: "fn", v: "floor" }, { t: "", v: "(area / " }, { t: "nm", v: "1.7" }, { t: "", v: ")" }],
                  [{ t: "", v: "  kWp = num_panels * " }, { t: "nm", v: "0.4" }],
                  [{ t: "", v: "  annual_kWh = kWp * pvout * " }, { t: "nm", v: "0.80" }],
                  [{ t: "cm", v: "  # 80% performance ratio" }],
                  [{ t: "kw", v: "  return" }, { t: "", v: " {kWp, annual_kWh, num_panels}" }],
                  [],
                  [{ t: "cm", v: "# Step 7 — NPV Financial Model" }],
                  [{ t: "fn", v: "def" }, { t: "", v: " " }, { t: "fn", v: "npv_25yr" }, { t: "", v: "(annual_sav, rate=" }, { t: "nm", v: "0.08" }, { t: "", v: "):" }],
                  [{ t: "kw", v: "  return" }, { t: "", v: " " }, { t: "fn", v: "sum" }, { t: "", v: "(annual_sav / (" }],
                  [{ t: "", v: "    " }, { t: "nm", v: "1" }, { t: "", v: " + rate) ** yr" }],
                  [{ t: "kw", v: "    for" }, { t: "", v: " yr " }, { t: "kw", v: "in" }, { t: "", v: " " }, { t: "fn", v: "range" }, { t: "", v: "(" }, { t: "nm", v: "1" }, { t: "", v: ", " }, { t: "nm", v: "26" }, { t: "", v: "))" }],
                  [],
                  [{ t: "cm", v: "# Step 8 — CO₂ Carbon Offset" }],
                  [{ t: "", v: "  co2_kg_yr = annual_kWh * " }, { t: "nm", v: "0.82" }],
                  [{ t: "cm", v: "  # CEA India 2023 emission factor" }],
                  [],
                  [{ t: "cm", v: "# API live query ↓" }],
                  [{ t: "", v: "  " }, { t: "fn", v: "POST" }, { t: "", v: " " }, { t: "st", v: "/api/v1/solar/calculate" }, { t: "", v: " {" }, { t: "tc2", v: "" }, { t: "", v: "…" }, { t: "", v: "}" }],
                ].map((line, i) => (
                  <div key={i} className="cl">
                    <span className="ln">{i + 1}</span>
                    <span>
                      {line.length === 0 ? " " : line.map((tok, j) => (
                        tok.t === "tc2" ? <span key={j} className="cursor-blink" /> : <span key={j} className={tok.t}>{tok.v}</span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="formula-list rvr">
              {[
                { label: "Panel Count", formula: "num_panels = ⌊usable_area / 1.7⌋", desc: "Each panel occupies 1.7 m² of roof space at standard tilt." },
                { label: "System Capacity", formula: "kWp = num_panels × 0.4", desc: "400W per panel under standard test conditions (STC)." },
                { label: "Annual Energy", formula: "kWh/yr = kWp × PVOUT × 0.80", desc: "80% performance ratio accounts for inverter, cable, soiling, temperature, and mismatch losses." },
                { label: "Annual Savings", formula: "savings = kWh/yr × tariff", desc: "User-configurable tariff in any of 6 supported currencies." },
                { label: "Simple Payback", formula: "payback = CAPEX / savings", desc: "Installation cost per kWp × system kWp divided by annual savings." },
                { label: "25-Year NPV", formula: "NPV = Σ savings/(1+r)^yr  [yr=1..25]", desc: "Discounted cash flow at 8% rate — accounts for time value of money." },
                { label: "CO₂ Offset", formula: "CO₂ = kWh/yr × 0.82 kg", desc: "CEA India 2023 grid emission factor: 0.82 kg CO₂ per kWh of grid electricity displaced." },
                { label: "Solar Score", formula: "score = XGBoost(GHI, area, T, payback, kWp)", desc: "Gradient boosting ensemble — captures non-linear relationships between all 5 features." },
              ].map((f, i) => (
                <div key={i} className="formula-card rv" style={{ transitionDelay: `${i * .06}s` }}>
                  <div className="fc-label">{f.label}</div>
                  <div className="fc-formula">{f.formula}</div>
                  <div className="fc-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="gline" />

      {/* ══════════════ TECH STACK ══════════════ */}
      <section id="sec-tech" className="tech-sec">
        <div className="container">
          <div className="rv">
            <div className="sec-label">Technology Stack</div>
            <h2 className="sec-title">PRODUCTION-GRADE<br />FROM DAY ONE</h2>
            <p className="sec-sub">Every technology chosen deliberately — for performance, accuracy, and developer experience.</p>
          </div>
          <div className="tech-tabs">
            {Object.keys(TECH).map(tab => (
              <button key={tab} className={`tech-tab ${techTab === tab ? "active" : ""}`} onClick={() => setTechTab(tab)}>{tab}</button>
            ))}
          </div>
          <div className="tech-cards stg">
            {TECH[techTab].map((tc, i) => (
              <div key={i} className="tech-card">
                <div className="tc-name">{tc.name}</div>
                <div className="tc-version">{tc.version}</div>
                <div className="tc-desc">{tc.desc}</div>
                <span className="tc-tag" style={{ background: `${tc.tagColor}18`, color: tc.tagColor, border: `1px solid ${tc.tagColor}30` }}>{tc.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gline" />

      {/* ══════════════ ARCHITECTURE ══════════════ */}
      <section className="arch-sec">
        <div className="container">
          <div className="rv">
            <div className="sec-label">System Architecture</div>
            <h2 className="sec-title">CLEAN 4-LAYER<br />ARCHITECTURE</h2>
            <p className="sec-sub">Client-server separation with clear data flow. Every layer independently scalable.</p>
          </div>

          <div className="arch-diagram rv" style={{ marginTop: 60, maxWidth: 720, margin: "60px auto 0" }}>
            {[
              { icon: "🌐", name: "React Frontend", desc: "TypeScript + Leaflet + Recharts + Zustand", tags: ["MapView.tsx", "ScoreGauge.tsx", "AnalysisPanel.tsx", "MonthlyChart.tsx"], bg: "rgba(245,158,11,.08)", border: "rgba(245,158,11,.25)" },
              { icon: "⚡", name: "FastAPI Backend", desc: "Python async — solar_service.py orchestrates the full pipeline", tags: ["solar_service", "irradiance_service", "building_service", "report_service"], bg: "rgba(249,115,22,.08)", border: "rgba(249,115,22,.25)" },
              { icon: "🗄️", name: "Database Layer", desc: "PostgreSQL/PostGIS for persistence + Redis for caching", tags: ["PostGIS polygons", "Redis TTL cache", "Async SQLAlchemy", "Supabase cloud"], bg: "rgba(34,211,238,.07)", border: "rgba(34,211,238,.2)" },
              { icon: "🛸", name: "External APIs", desc: "NASA POWER satellite data + OpenStreetMap building footprints", tags: ["NASA POWER", "Overpass API", "Nominatim", "CEA India 2023"], bg: "rgba(74,222,128,.07)", border: "rgba(74,222,128,.2)" },
            ].map((layer, i) => (
              <div key={i}>
                <div className="arch-layer rvs" style={{ background: layer.bg, borderColor: layer.border, transitionDelay: `${i * .1}s` }}>
                  <div className="al-icon" style={{ background: layer.bg }}>{layer.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div className="al-name">{layer.name}</div>
                    <div className="al-desc">{layer.desc}</div>
                    <div className="al-tags">
                      {layer.tags.map((t, j) => (
                        <span key={j} className="al-tag" style={{ background: "rgba(255,255,255,.04)", border: "1px solid var(--border)", color: "var(--muted)" }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                {i < 3 && (
                  <div className="arch-arrow rv" style={{ transitionDelay: `${i * .1 + .05}s` }}>
                    <span className="arrow-label">
                      {["HTTP POST /api/v1/solar/calculate → Axios", "Calls Overpass API + NASA POWER + PVLib + Redis", "PostGIS spatial queries + Redis cache TTL"][i]}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gline" />

      {/* ══════════════ API REFERENCE ══════════════ */}
      <section id="sec-api" className="api-sec">
        <div className="container">
          <div className="rv">
            <div className="sec-label">REST API</div>
            <h2 className="sec-title">CLEAN API REFERENCE</h2>
            <p className="sec-sub">7 endpoints. Auto-documented Swagger UI at /docs. Every endpoint tested and production-ready.</p>
          </div>

          <div style={{ marginTop: 32, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 20px", fontFamily: "var(--fMono)", fontSize: ".75rem", display: "flex", alignItems: "center", gap: 12, color: "var(--muted)" }} className="rv">
            <span style={{ color: "var(--green)" }}>$</span>
            <span style={{ color: "var(--cyan)" }}>{apiTyping}</span>
            <span className="cursor-blink" />
          </div>

          <div className="api-table rv" style={{ marginTop: 24 }}>
            <div className="api-thead">
              <div>Method</div><div>Endpoint</div><div>Description</div>
            </div>
            {[
              { method: "GET", methodColor: "#4ade80", bg: "rgba(74,222,128,.1)", ep: "/api/v1/health", desc: "Health check — DB connected" },
              { method: "GET", methodColor: "#4ade80", bg: "rgba(74,222,128,.1)", ep: "/api/v1/geocode?address=…", desc: "Address → lat/lon (Nominatim)" },
              { method: "GET", methodColor: "#4ade80", bg: "rgba(74,222,128,.1)", ep: "/api/v1/buildings/nearby?lat=&lon=", desc: "OSM building footprint polygon" },
              { method: "GET", methodColor: "#4ade80", bg: "rgba(74,222,128,.1)", ep: "/api/v1/irradiance?lat=&lon=", desc: "NASA POWER solar data" },
              { method: "POST", methodColor: "#f59e0b", bg: "rgba(245,158,11,.1)", ep: "/api/v1/solar/calculate ⭐", desc: "Full pipeline — polygon + irradiance + PVLib + XGBoost", star: true },
              { method: "POST", methodColor: "#f59e0b", bg: "rgba(245,158,11,.1)", ep: "/api/v1/solar/report", desc: "Generate + stream PDF report" },
              { method: "GET", methodColor: "#4ade80", bg: "rgba(74,222,128,.1)", ep: "/api/v1/cities", desc: "Demo cities for quick access" },
            ].map((r, i) => (
              <div key={i} className="api-row">
                <div><span className="method" style={{ background: r.bg, color: r.methodColor }}>{r.method}</span></div>
                <div className="ep" style={{ color: r.star ? "var(--amber)" : "var(--cyan)" }}>{r.ep}</div>
                <div className="ep-desc">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gline" />

      {/* ══════════════ KEY DECISIONS ══════════════ */}
      <section className="decisions-sec">
        <div className="container">
          <div className="rv">
            <div className="sec-label">Technical Decisions</div>
            <h2 className="sec-title">WHY EVERY CHOICE<br />WAS MADE</h2>
            <p className="sec-sub">Every technology selected for a specific reason. No cargo-culting.</p>
          </div>

          <div className="decisions-grid stg">
            {[
              { q: "FastAPI over Flask/Django", a: "Async-native handles many simultaneous requests without blocking. Auto-generates Swagger docs. Pydantic validation. Benchmarks significantly faster for API workloads." },
              { q: "OpenStreetMap over Google Maps", a: "Google Maps charges per call and doesn't expose building footprint polygons. OSM is free, open, and Overpass provides full GIS spatial query capability. Data quality in cities is comparable." },
              { q: "PVLib for simulation", a: "Not a custom formula — PVLib is the open-source photovoltaic library used by real solar engineers and researchers worldwide. Industry-validated physics." },
              { q: "XGBoost for Solar Score", a: "A composite score based on multiple factors is better computed by a trained ML model than a fixed formula. Non-linear relationships between irradiance, area, temperature, and payback cannot be captured by weighted sums." },
              { q: "UTM projection for area", a: "Lat/lon are spherical coordinates on a curved surface. Direct area calculation gives wrong results — error grows with distance from the equator. UTM projects to a flat plane for accurate m² calculations." },
              { q: "PostGIS over plain PostgreSQL", a: "Building footprints are polygons. PostGIS natively stores and queries geographic data types with ST_Area, ST_Within, ST_Intersects — impossible to replicate correctly in a plain relational database." },
              { q: "Redis caching", a: "NASA POWER is free with rate limits. Without caching, two users querying the same block trigger duplicate calls. Redis adds virtually no complexity (one docker-compose entry) while preventing rate-limit failures." },
              { q: "Zustand over Redux", a: "Equivalent global state management with dramatically less boilerplate and excellent TypeScript support. Appropriate for this application's complexity level — Redux would be over-engineering." },
            ].map((d, i) => (
              <div key={i} className="dec-card">
                <div className="dc-q">{d.q}</div>
                <div className="dc-a">{d.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gline" />

      {/* ══════════════ DEPLOYMENT ══════════════ */}
      <section id="sec-deploy" className="deploy-sec">
        <div className="container">
          <div className="rv">
            <div className="sec-label">Deployment</div>
            <h2 className="sec-title">RUNNING IN MINUTES,<br />SCALING TO MILLIONS</h2>
            <p className="sec-sub">Local setup with one command. Production on Vercel + Render + Supabase.</p>
          </div>

          <div className="deploy-grid">
            <div>
              <div style={{ fontSize: ".8rem", color: "var(--muted)", marginBottom: 16, fontWeight: 500, letterSpacing: ".06em", textTransform: "uppercase" }}>Production Services</div>
              <div className="deploy-cards stg">
                {[
                  { icon: "⚛️", name: "React Frontend", info: "Auto CI/CD from GitHub", platform: "Vercel", bg: "rgba(245,158,11,.08)" },
                  { icon: "🐍", name: "FastAPI Backend", info: "Web service, env vars configured", platform: "Render.com", bg: "rgba(249,115,22,.08)" },
                  { icon: "🐘", name: "PostgreSQL + PostGIS", info: "Managed DB with connection string", platform: "Supabase", bg: "rgba(34,211,238,.07)" },
                  { icon: "⚡", name: "Redis Cache", info: "REDIS_URL environment variable", platform: "Render Redis", bg: "rgba(74,222,128,.07)" },
                ].map((d, i) => (
                  <div key={i} className="deploy-card">
                    <div className="dc-icon" style={{ background: d.bg }}>{d.icon}</div>
                    <div>
                      <div className="dc-name">{d.name}</div>
                      <div className="dc-info">{d.info}</div>
                    </div>
                    <span className="dc-platform">{d.platform}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="terminal rvr">
              <div className="term-bar">
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57", display: "inline-block" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e", display: "inline-block" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840", display: "inline-block" }} />
                <span className="term-title">Terminal — ~/solarscope</span>
              </div>
              <div className="term-body">
                {[
                  { type: "prompt", text: "# One-command local setup" },
                  { type: "cmd", text: "chmod +x setup.sh && ./setup.sh" },
                  { type: "out", text: "" },
                  { type: "out", text: "[1/4] Starting Docker containers..." },
                  { type: "success", text: "✓  postgres:15-postgis started on :5432" },
                  { type: "success", text: "✓  redis:7 started on :6379" },
                  { type: "out", text: "" },
                  { type: "out", text: "[2/4] Installing Python dependencies..." },
                  { type: "success", text: "✓  venv created, pip install complete" },
                  { type: "out", text: "" },
                  { type: "out", text: "[3/4] Starting FastAPI backend..." },
                  { type: "url", text: "✓  API running → http://localhost:8000" },
                  { type: "url", text: "✓  Swagger UI → http://localhost:8000/docs" },
                  { type: "out", text: "" },
                  { type: "out", text: "[4/4] Starting React frontend..." },
                  { type: "url", text: "✓  App running → http://localhost:5173" },
                  { type: "out", text: "" },
                  { type: "success", text: "🚀 SolarScope ready in 4m 38s" },
                ].map((line, i) => (
                  <div key={i} style={{ animation: `fadeUp .3s ease ${i * .08}s both` }}>
                    {line.type === "prompt" && <span className="t-out">{line.text}</span>}
                    {line.type === "cmd" && <span><span className="t-prompt">$ </span><span className="t-cmd">{line.text}</span></span>}
                    {line.type === "out" && <span className="t-out">{line.text}</span>}
                    {line.type === "success" && <span className="t-success">{line.text}</span>}
                    {line.type === "url" && <span className="t-url">{line.text}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="gline" />

      {/* ══════════════ GLOSSARY ══════════════ */}
      <section className="glossary-sec">
        <div className="container">
          <div className="rv">
            <div className="sec-label">Technical Glossary</div>
            <h2 className="sec-title">KNOW THE TERMS</h2>
            <p className="sec-sub">Every technical concept used in SolarScope, clearly explained.</p>
          </div>
          <div className="glos-grid stg">
            {[
              { term: "GHI", def: "Global Horizontal Irradiance — total solar radiation on a flat horizontal surface, kWh/m²/year. Primary irradiance input." },
              { term: "DNI", def: "Direct Normal Irradiance — direct beam solar radiation measured perpendicular to the sun's rays." },
              { term: "PVOUT", def: "Photovoltaic Output — expected annual electricity generation (kWh) for a 1 kWp solar system at a given location." },
              { term: "kWp", def: "Kilowatt-peak — rated power output of a solar system under standard test conditions (1000 W/m² at 25°C)." },
              { term: "Performance Ratio", def: "Ratio of actual output to theoretical maximum. 0.80 = 80% efficiency accounting for all real-world losses." },
              { term: "UTM Projection", def: "Universal Transverse Mercator — projects curved Earth to a flat plane for accurate area calculations in m²." },
              { term: "PostGIS", def: "Spatial extension for PostgreSQL — adds geographic objects (points, polygons) and spatial query functions." },
              { term: "Overpass API", def: "Query API for OpenStreetMap — retrieves specific geographic data (buildings, roads) by location and type." },
              { term: "NPV", def: "Net Present Value — present value of all future cash flows discounted at a given rate. Measures long-term investment value." },
              { term: "PVLib", def: "Open-source Python library for PV energy system modelling. Used by solar researchers and engineers worldwide." },
              { term: "XGBoost", def: "Extreme Gradient Boosting — ensemble ML algorithm using sequential decision trees trained to minimise prediction error." },
              { term: "ASGI", def: "Asynchronous Server Gateway Interface — protocol Uvicorn uses to run FastAPI with concurrent async request handling." },
            ].map((g, i) => (
              <div key={i} className="glos-card">
                <div className="gc-term">{g.term}</div>
                <div className="gc-def">{g.def}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CTA ══════════════ */}
      <section className="cta-sec">
        <div className="cta-sun" />
        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <div className="rv">
            <div className="sec-label" style={{ justifyContent: "center", display: "flex", color: "var(--orange)" }}>
              <span style={{ background: "var(--orange)", width: 6, height: 6, borderRadius: "50%", display: "inline-block", marginRight: 10, boxShadow: "0 0 12px var(--orange)" }} />
              Open Source · MIT License
            </div>
            <h2 className="cta-title">
              <span className="ht-solar">SOLAR</span><br />
              STARTS HERE.
            </h2>
            <p className="cta-sub">One click. Real data. Professional report. No consultant needed.</p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn-primary" style={{ fontSize: "1.1rem", padding: "16px 40px" }} onClick={() => navigate("/app")}>☀ Analyse your rooftop →</button>
              <button className="btn-ghost" style={{ fontSize: "1.1rem", padding: "16px 40px" }} onClick={() => window.open(GITHUB_URL, "_blank")}>⭐ Star on GitHub</button>
            </div>
          </div>

          <div className="cta-counts rv" style={{ transitionDelay: ".2s" }}>
            <div className="cc-item"><Counter end={10} suffix="s" /><div className="cc-lbl">Analysis time</div></div>
            <div className="cc-item"><Counter end={400} suffix="W" /><div className="cc-lbl">Per panel STC</div></div>
            <div className="cc-item"><Counter end={82} suffix="%" /><div className="cc-lbl">Performance ratio</div></div>
            <div className="cc-item"><Counter end={25} suffix=" yrs" /><div className="cc-lbl">NPV horizon</div></div>
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer>
        <div style={{ fontFamily: "var(--fHead)", fontSize: "1.2rem", letterSpacing: ".06em", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "var(--amber)" }}>☀</span>
          <span style={{ color: "var(--amber)" }}>SOLAR</span>SCOPE
        </div>
        <div className="footer-stack">
          {["React 18", "FastAPI", "PVLib", "XGBoost", "PostGIS", "NASA POWER", "Redis", "Docker", "MIT License", "v1.0"].map(t => (
            <span key={t} className="ft">{t}</span>
          ))}
        </div>
        <div>Built with Python + React · © 2025</div>
      </footer>

      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", background: "rgba(245,158,11,0.95)", color: "#000", fontWeight: 600, fontSize: ".9rem", fontFamily: "var(--fBody)", padding: "12px 24px", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 9999, animation: "fadeUp .3s var(--expo)", backdropFilter: "blur(8px)", maxWidth: "90vw", textAlign: "center" }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
