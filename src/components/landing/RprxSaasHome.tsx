import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import rprxLogo from '@/assets/rprx-logo.png';

const FOUR_HORSEMEN_VIDEO = 'https://storage.googleapis.com/msgsndr/3JQXZeyGRlWoI7GauXaH/media/692b3e56aaad913a60baee2f.mp4';

export default function RprxSaasHome() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);

  const togglePause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  };

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted && video.paused) {
      void video.play();
      setPaused(false);
    }
  };

  const replay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play();
    setPaused(false);
  };

  return (
    <div className="rprx-ref-home">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap" rel="stylesheet" />

      <style>{styles}</style>

      <header className="topbar">
        <div className="topbar-in">
          <Link to="/" className="brand" aria-label="RPRx home">
            <img src={rprxLogo} alt="RPRx" />
            <span className="brand-tag">Financial &amp; Health Wellness</span>
          </Link>
          <div className="topbar-spacer" />
          <nav className="mainnav" aria-label="Main">
            <a className="on" href="#top">Home</a>
            <a href="#choose">Wealth</a>
            <a href="#choose">Health</a>
            <Link to="/old-home">Old Home</Link>
          </nav>
          <Link className="profile-link" to="/auth" title="My RPRx" aria-label="My RPRx profile">
            <span className="avatar">--</span>
            <span className="who-name">My RPRx</span>
          </Link>
        </div>
      </header>

      <main id="top">
        <section className="home-hero" aria-labelledby="hero-h">
          <div className="hero-copy">
            <span className="eyebrow">The Four Horsemen</span>
            <h1 id="hero-h">Four Horsemen are stealing your wealth — and the Lightning strikes at your health.</h1>
            <p className="lede">Interest. Taxes. Insurance. Education costs. RPRx exists to help you reduce all
              four while enhancing your lifestyle — and to bring the same plain-spoken approach to your
              health. Watch the video, then pick where you want to start.</p>
          </div>
          <div className="home-video-shell">
            <video
              ref={videoRef}
              id="fh-video"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="The Four Horsemen of Financial Apocalypse"
              onClick={togglePause}
            >
              <source src={FOUR_HORSEMEN_VIDEO} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="video-ctls">
              <button type="button" id="fh-pause" aria-pressed={!paused} onClick={togglePause}>{paused ? 'Play' : 'Pause'}</button>
              <button type="button" id="fh-sound" aria-pressed={!muted} onClick={toggleSound}>{muted ? 'Sound on' : 'Mute'}</button>
              <button type="button" id="fh-replay" onClick={replay}>Replay</button>
            </div>
          </div>
          <p className="scroll-cue">↓ Two paths. Pick where to start.</p>
        </section>

        <section className="wwh" aria-label="What RPRx is, why, and how it works">
          <div className="wrap-wide">
            <div className="wwh-row">
              <span className="wl">What</span>
              <p className="wb">RPRx is a new <b>wealth and health wellness program</b> for individuals, businesses,
                organizations, or schools — and their employees, customers, clients, members, or students.</p>
            </div>
            <div className="wwh-row">
              <span className="wl">Why</span>
              <p className="wb">RPRx gives protection from the <b>“Four Horsemen”</b> and the <b>“Lightning.”</b></p>
            </div>
            <div className="wwh-row">
              <span className="wl">How</span>
              <ol className="wwh-steps">
                <li><span><b>First,</b> take the assessments below to generate strategies and solutions to protect from the “Four Horsemen” and the “Lightning.”</span></li>
                <li><span><b>Next,</b> implement the strategies and solutions with the help of the RPRx Partners.</span></li>
                <li><span><b>Finally,</b> become a <a className="wwh-link" href="https://www.rprx.life" target="_blank" rel="noopener noreferrer">RPRx Member</a> for $97/ month. This will give the member access to the extensive RPRx Library of Resources to assist in implementation and daily new strategies and solutions to continually update and improve your RPRx wealth and health wellness program.</span></li>
              </ol>
            </div>
          </div>
        </section>

        <section className="fork" id="choose" aria-labelledby="fork-h">
          <div className="wrap-wide">
            <div className="sec-head">
              <span className="eyebrow">Choose your path</span>
              <h2 id="fork-h">Where do you want to start?</h2>
              <p>Both assessments are free — a few minutes of yes-or-no questions, no dollar figures, no medical records. Sign in with your name and email, and your top matched areas are open at no cost. Do one now and the other whenever you're ready; they live under the same RPRx profile.</p>
            </div>

            <div className="path-grid">
              <article className="path fin" aria-labelledby="fin-h">
                <span className="eyebrow">Wealth Assessment</span>
                <h3 id="fin-h">2 Clicks to take the Four Horsemen out of your life</h3>
                <p className="who">Answer the yes-or-no questions and RPRx will match your situation with 500+ strategies.</p>
                <div className="cta">
                  <Link className="btn btn-primary" to="/auth?next=/assessment">Wealth Assessment <span className="arr">→</span></Link>
                  <span className="time">Free · about 3 minutes · no financial data needed</span>
                </div>
              </article>

              <article className="path phys" aria-labelledby="phys-h">
                <span className="eyebrow">Health Assessment</span>
                <h3 id="phys-h">2 Clicks to take the Lightning out of your life</h3>
                <p className="who">Answer the yes-or-no questions and RPRx can support you in that area.</p>
                <div className="cta">
                  <Link className="btn btn-primary" to="/auth?next=/health-assessment">Health Assessment <span className="arr">→</span></Link>
                  <span className="time">Free · about 3 minutes · no health data collected</span>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap-wide">
          <p className="partner-line"><a href="mailto:matt@rprx.life?subject=Become%20an%20RPRx%20Partner">Become an RPRx Partner</a> — members are matched to you by what they actually need.</p>
          <p className="old-home-note"><Link to="/old-home">Old SaaS home page</Link> is preserved here for comparison while this new home becomes the production face.</p>
          <p className="disclaimer">RPRx is a financial and physical wellness education program — not financial, tax, legal, or investment advice, and not medical advice, diagnosis, or treatment. If you're in crisis, call or text 988 (US).</p>
        </div>
      </footer>
    </div>
  );
}

const styles = `
.rprx-ref-home{
  --navy:#0a192f; --navy-light:#172a45;
  --blue:#2a5d8f; --blue-hover:#204a74; --blue-light:#edf1f5;
  --green:#2e7d5c; --green-hover:#1f5c42; --green-light:#eaf1ec;
  --amber:#b7791f; --amber-light:#faf3e2;
  --bg:#fffdfa; --bg-subtle:#f5f3ed;
  --text:#3b4350; --muted:#68707c; --border:#e3ded3;
  --r:10px; --r-lg:14px; --r-pill:8px;
  --sh-sm:0 1px 2px rgba(28,25,18,.05);
  --t:.2s cubic-bezier(.4,0,.2,1);
  --font:'Public Sans',-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  --font-title:'Fraunces',Georgia,'Times New Roman',serif;
  min-height:100vh;
  font-family:var(--font);
  font-size:16px;
  line-height:1.6;
  color:var(--text);
  background:var(--bg-subtle);
  -webkit-font-smoothing:antialiased;
}
.rprx-ref-home *{box-sizing:border-box}
.rprx-ref-home h1,.rprx-ref-home h2,.rprx-ref-home h3{font-family:var(--font-title);color:var(--navy);font-weight:600;line-height:1.25;letter-spacing:0}
.rprx-ref-home button{font-family:inherit;font-size:inherit;cursor:pointer;border:none;background:none;color:inherit}
.rprx-ref-home a{color:var(--blue)}
.rprx-ref-home .wrap-wide{max-width:1080px;margin:0 auto;padding:0 20px}
.rprx-ref-home .eyebrow{display:block;font-size:11.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--green-hover)}
.rprx-ref-home .topbar{background:var(--bg);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:60}
.rprx-ref-home .topbar-in{max-width:1080px;margin:0 auto;padding:11px 20px;display:flex;align-items:center;gap:16px}
.rprx-ref-home .brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:inherit}
.rprx-ref-home .brand img{height:40px;width:auto;object-fit:contain;display:block}
.rprx-ref-home .brand-tag{font-family:var(--font-title);font-weight:600;font-size:13.5px;color:var(--muted);letter-spacing:.01em;border-left:1px solid var(--border);padding-left:11px;line-height:1.25;max-width:170px}
.rprx-ref-home .topbar-spacer{flex:1}
.rprx-ref-home .mainnav{display:flex;gap:2px;align-items:center}
.rprx-ref-home .mainnav a{font-size:15px;font-weight:600;color:var(--muted);padding:9px 15px;border-radius:10px;text-decoration:none;white-space:nowrap;transition:var(--t)}
.rprx-ref-home .mainnav a:hover{color:var(--navy);background:var(--bg-subtle)}
.rprx-ref-home .mainnav a.on{color:var(--blue);background:var(--blue-light)}
.rprx-ref-home .profile-link{display:flex;align-items:center;gap:8px;text-decoration:none;color:var(--muted);font-weight:600}
.rprx-ref-home .avatar{width:32px;height:32px;border-radius:50%;background:var(--navy);color:#fff;display:grid;place-items:center;font-size:11px;font-weight:700;letter-spacing:.05em}
.rprx-ref-home .who-name{font-size:13px;max-width:82px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rprx-ref-home .home-hero{background:var(--navy);color:#fff;padding:48px 0 56px}
.rprx-ref-home .home-hero .hero-copy{max-width:1080px;margin:0 auto;padding:0 20px 34px}
.rprx-ref-home .home-hero .eyebrow{color:#9fc6b1;border-bottom:1px solid rgba(255,255,255,.25);padding-bottom:8px}
.rprx-ref-home .home-hero h1{color:#fff;font-size:40px;margin:18px 0 14px;max-width:820px;padding-bottom:18px;border-bottom:1px solid rgba(255,255,255,.18)}
.rprx-ref-home .home-hero .lede{color:rgba(255,255,255,.78);max-width:660px;font-size:17px}
.rprx-ref-home .home-video-shell{position:relative;max-width:1080px;margin:0 auto;padding:0 20px;line-height:0}
.rprx-ref-home .home-video-shell video{width:100%;aspect-ratio:16/9;max-height:70vh;object-fit:cover;display:block;background:#000;border:1px solid rgba(255,255,255,.22);border-radius:var(--r-lg);cursor:pointer}
.rprx-ref-home .video-ctls{position:absolute;right:34px;bottom:16px;display:flex;gap:8px;line-height:1.4}
.rprx-ref-home .video-ctls button{background:rgba(10,25,47,.85);color:#fff;border:1px solid rgba(255,255,255,.35);border-radius:var(--r-pill);padding:7px 13px;font-size:12.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;transition:var(--t)}
.rprx-ref-home .video-ctls button:hover{background:#fff;color:var(--navy);border-color:#fff}
.rprx-ref-home .scroll-cue{max-width:1080px;margin:26px auto 0;padding:0 20px;color:rgba(255,255,255,.6);font-size:12.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
.rprx-ref-home .wwh{background:var(--bg);border-bottom:1px solid var(--border);padding:52px 0 54px}
.rprx-ref-home .wwh-row{display:grid;grid-template-columns:110px 1fr;gap:22px;padding:20px 0;border-bottom:1px dashed var(--border)}
.rprx-ref-home .wwh-row:last-child{border-bottom:none}
.rprx-ref-home .wwh-row .wl{font-family:var(--font-title);font-weight:600;font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:var(--green-hover);padding-top:3px}
.rprx-ref-home .wwh-row .wb{font-size:16px;color:var(--text);line-height:1.65;max-width:760px;margin:0}
.rprx-ref-home .wwh-row .wb b{color:var(--navy);font-weight:600}
.rprx-ref-home .wwh-steps{list-style:none;counter-reset:wwh;margin:0;padding:0}
.rprx-ref-home .wwh-steps li{counter-increment:wwh;display:grid;grid-template-columns:34px 1fr;gap:14px;padding:9px 0;font-size:15.5px;line-height:1.6;color:var(--text)}
.rprx-ref-home .wwh-steps li::before{content:counter(wwh);font-family:var(--font-title);font-weight:700;font-size:15px;color:var(--green);border:1.5px solid var(--border);border-radius:50%;width:28px;height:28px;display:grid;place-items:center;margin-top:2px;font-variant-numeric:tabular-nums}
.rprx-ref-home .wwh-steps b{color:var(--navy);font-weight:600}
.rprx-ref-home .wwh-link{font-weight:600;color:var(--green-hover);background:var(--green-light);padding:1px 5px;border-radius:4px;text-decoration:none;border-bottom:1.5px solid var(--green)}
.rprx-ref-home .wwh-link:hover{background:var(--green);color:#fff}
.rprx-ref-home .fork{padding:60px 0 64px}
.rprx-ref-home .fork .sec-head{margin-bottom:30px;max-width:720px}
.rprx-ref-home .fork .sec-head h2{font-size:30px;margin:10px 0 10px}
.rprx-ref-home .fork .sec-head p{color:var(--muted);font-size:15.5px;margin:0}
.rprx-ref-home .path-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.rprx-ref-home .path{background:var(--bg);border:1px solid var(--border);border-radius:var(--r-lg);padding:30px 32px 28px;display:flex;flex-direction:column;position:relative;transition:box-shadow var(--t)}
.rprx-ref-home .path:hover{box-shadow:var(--sh-sm)}
.rprx-ref-home .path.fin{border-top:3px solid var(--amber)}
.rprx-ref-home .path.phys{border-top:3px solid var(--blue)}
.rprx-ref-home .path .eyebrow{margin-bottom:14px}
.rprx-ref-home .path.fin .eyebrow{color:#8a5a18}
.rprx-ref-home .path.phys .eyebrow{color:var(--blue)}
.rprx-ref-home .path h3{font-size:26px;margin:0 0 10px}
.rprx-ref-home .path p.who{font-size:15px;color:var(--text);line-height:1.6;margin:0 0 20px}
.rprx-ref-home .path .cta{margin-top:auto;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.rprx-ref-home .btn{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:15px;padding:12px 22px;border-radius:var(--r-pill);text-decoration:none;transition:var(--t)}
.rprx-ref-home .btn-primary{border:1.5px solid var(--navy);color:var(--navy);background:transparent}
.rprx-ref-home .btn-primary:hover{background:var(--navy);color:#fff}
.rprx-ref-home .btn .arr{font-family:var(--font-title);font-weight:600}
.rprx-ref-home .path .time{font-size:12.5px;color:var(--muted)}
.rprx-ref-home .partner-line,.rprx-ref-home .old-home-note{font-size:13px;color:var(--muted);margin:0 0 16px}
.rprx-ref-home .partner-line a,.rprx-ref-home .old-home-note a{color:var(--blue);font-weight:600;text-decoration:none}
.rprx-ref-home .disclaimer{font-size:12.5px;color:var(--muted);line-height:1.55;margin:0}
.rprx-ref-home footer{padding:36px 0 44px;background:var(--bg-subtle)}
@media(max-width:820px){
  .rprx-ref-home .mainnav{display:none}
  .rprx-ref-home .who-name{display:none}
  .rprx-ref-home .home-hero h1{font-size:32px}
  .rprx-ref-home .path-grid{grid-template-columns:1fr}
}
@media(max-width:680px){
  .rprx-ref-home .wwh-row{grid-template-columns:1fr;gap:6px}
  .rprx-ref-home .video-ctls{position:static;margin:10px 20px 0;flex-wrap:wrap}
}
`;
