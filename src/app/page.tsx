"use client";

import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";

export default function DatOS() {
  const [activeSection, setActiveSection] = useState("home");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const typingRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState("");

  // Dữ liệu Supabase
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [blogsList, setBlogsList] = useState<any[]>([]);
  const [galleryList, setGalleryList] = useState<any[]>([]);
  
  // Form Contact
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [isSending, setIsSending] = useState(false);

  // Terminal State
  const [termInput, setTermInput] = useState("");
  const [termHistory, setTermHistory] = useState<React.ReactNode[]>([]);
  const endOfTermRef = useRef<HTMLDivElement>(null);

  // --- GOD MODE STATES (Theme, Ngôn ngữ, Thời tiết, Nhạc) ---
  const [lang, setLang] = useState<"EN" | "VN">("EN");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [temp, setTemp] = useState("Loading...");
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audioSrc, setAudioSrc] = useState("");
  const [trackName, setTrackName] = useState("No_Track_Selected");
  const [isPlaying, setIsPlaying] = useState(false);

  // Từ điển đa ngôn ngữ
  const dict = {
    EN: { sys: "SYS_ADMIN", home: "Home", skills: "Skills", projects: "Projects", media: "Media Vault", bio: "Biography", gaming: "Gaming Profile", certs: "Certificates", blog: "Blog", term: "Terminal", contact: "Contact", donate: "Donate" },
    VN: { sys: "QUẢN TRỊ VIÊN", home: "Trang Chủ", skills: "Kỹ Năng", projects: "Dự Án", media: "Thư Viện Ảnh", bio: "Tiểu Sử", gaming: "Hồ Sơ Game", certs: "Chứng Chỉ", blog: "Nhật Ký", term: "Dòng Lệnh", contact: "Liên Hệ", donate: "Ủng Hộ" }
  };
  const t = dict[lang];

  // 1. KÉO DỮ LIỆU TỪ SUPABASE
  useEffect(() => {
    const fetchData = async () => {
      const { data: pData } = await supabase.from("projects").select("*").order("id", { ascending: false });
      if (pData) setProjectsList(pData);
      const { data: bData } = await supabase.from("blogs").select("*").order("id", { ascending: false });
      if (bData) setBlogsList(bData);
      const { data: gData } = await supabase.from("gallery").select("*").order("id", { ascending: false });
      if (gData) setGalleryList(gData);
    };
    fetchData();
  }, []);

  // 2. KÉO THỜI TIẾT ĐÀ NẴNG (REAL-TIME)
  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=16.0678&longitude=108.2208&current_weather=true")
      .then(res => res.json())
      .then(data => setTemp(`${Math.round(data.current_weather.temperature)}°C`))
      .catch(() => setTemp("28°C"));
  }, []);

  // 3. GỬI TIN NHẮN (CONTACT)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    const { error } = await supabase.from("messages").insert([
      { sender_name: contactForm.name, sender_email: contactForm.email, content: contactForm.message }
    ]);
    setIsSending(false);
    if (error) alert("LỖI ĐƯỜNG TRUYỀN!");
    else {
      alert("DATA TRANSMITTED SUCCESSFULLY!");
      setContactForm({ name: "", email: "", message: "" });
    }
  };

  // 4. CHỨC NĂNG BẬT/TẮT THEME TRẮNG ĐEN
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.body.classList.toggle("light-mode", newTheme === "light");
  };

  // 5. CHỨC NĂNG LOAD VÀ PHÁT NHẠC
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioSrc(URL.createObjectURL(file));
      setTrackName(file.name.substring(0, 15) + "...");
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  // 6. MATRIX BACKGROUND & CLOCK
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString("vi-VN")), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%""\'#&_(),.;:?!\\|{}<>[]^~';
    const drops = Array(Math.floor(canvas.width / 14)).fill(1);
    const drawMatrix = () => {
      ctx.fillStyle = "rgba(5, 5, 5, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0f0";
      ctx.font = "14px monospace";
      for (let i = 0; i < drops.length; i++) {
        ctx.fillText(letters[Math.floor(Math.random() * letters.length)], i * 14, drops[i] * 14);
        if (drops[i] * 14 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };
    const interval = setInterval(drawMatrix, 33);
    return () => clearInterval(interval);
  }, []);

  // 7. HIỆU ỨNG TYPING (HERO SECTION)
  useEffect(() => {
    if (activeSection === "home" && typingRef.current) {
      const container = typingRef.current;
      container.innerHTML = "";
      const lines = [
        "> Welcome To DatOS v1.0",
        "> Establishing connection to secure server...",
        "> Fetching user profile: TRẦN CÔNG ĐẠT",
        "> Loading UI Modules...",
        "> Access Granted. Welcome."
      ];
      let lineIdx = 0;
      let isTyping = true; 

      const typeLine = () => {
        if (!isTyping || lineIdx >= lines.length) return;
        const p = document.createElement("p");
        container.appendChild(p);
        let charIdx = 0;
        const text = lines[lineIdx];
        const interval = setInterval(() => {
          if (!isTyping) { clearInterval(interval); return; }
          p.textContent += text[charIdx];
          charIdx++;
          if (charIdx >= text.length) {
            clearInterval(interval);
            lineIdx++;
            setTimeout(typeLine, 300);
          }
        }, 30);
      };
      typeLine();
      return () => { isTyping = false; };
    }
  }, [activeSection]);

  // 8. XỬ LÝ TERMINAL
  const handleTerminalSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const cmd = termInput.trim().toLowerCase();
      let response: React.ReactNode = "";
      
      switch(cmd) {
        case 'help': response = <div style={{color: '#0ff'}}>Commands: about, projects, clear</div>; break;
        case 'about': response = <div>User: Trần Công Đạt<br/>SysAdmin of DatOS.</div>; break;
        case 'projects': setActiveSection('projects'); response = <div>[SYSTEM] Navigating...</div>; break;
        case 'clear': setTermHistory([]); setTermInput(""); return;
        case '': break;
        default: response = <div style={{color: 'red'}}>Command not found: {cmd}. Type 'help'.</div>;
      }

      setTermHistory(prev => [
        ...prev, 
        <div key={prev.length}><span className="prompt">guest@datos:~$</span> {cmd}</div>,
        <div key={prev.length + "res"}>{response}</div>
      ]);
      setTermInput("");
    }
  };

  useEffect(() => {
    endOfTermRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [termHistory]);

  const copySTK = (stk: string) => navigator.clipboard.writeText(stk).then(() => alert("COPIED: " + stk));

  return (
    <>
      <Head>
        <title>DatOS | Trần Công Đạt</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <canvas ref={canvasRef} id="matrix-canvas"></canvas>
      <div className="crt-overlay"></div>

      <header className="os-topbar glass-panel flex items-center justify-between">
        <div className="topbar-left">
          <span className="os-logo glitch-hover" data-text="[DatOS v1.0]">[DatOS v1.0]</span>
          <span className="breadcrumb">C:\Home\{">"} <span id="current-path">{activeSection.toUpperCase()}</span></span>
        </div>
        <div className="topbar-right">
          {/* Audio Elements */}
          <input type="file" accept="audio/*" ref={fileInputRef} onChange={handleFileUpload} style={{display: 'none'}} />
          {audioSrc && <audio ref={audioRef} src={audioSrc} onEnded={() => setIsPlaying(false)} autoPlay loop />}
          
          <span id="music-player" className="cursor-pointer" onClick={() => audioSrc ? togglePlay() : fileInputRef.current?.click()}>
            <i className={`fas ${isPlaying ? 'fa-pause-circle' : 'fa-music'}`}></i> <span className="track-name" style={{marginLeft: "5px"}}>{trackName}</span>
          </span>
          
          <span id="weather-widget" style={{marginLeft: "15px"}}>
            <i className="fas fa-cloud-sun"></i> {temp}
          </span>
          <span id="clock-widget" style={{marginLeft: "15px"}}>{currentTime}</span>
          
          {/* Toggles */}
          <button onClick={() => setLang(lang === "EN" ? "VN" : "EN")} className="btn-icon" style={{marginLeft: "15px", fontWeight: "bold", fontSize: "0.85rem"}}>
            {lang === "EN" ? "VN" : "EN"}
          </button>
          <button onClick={toggleTheme} className="btn-icon" style={{marginLeft: "10px"}}>
            <i className={`fas ${theme === "dark" ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
        </div>
      </header>

      <main className="app-container">
        <nav className="sidebar glass-panel">
          <div className="user-profile">
            <div className="avatar-container">
              <img src="/images/avatar.jpg" onError={(e) => e.currentTarget.src = "https://via.placeholder.com/100"} alt="Avatar" className="avatar-img" />
              <div className="status-dot"></div>
            </div>
            <h3 className="user-name glow-text">TRẦN CÔNG ĐẠT</h3>
            <p className="user-role">{t.sys}</p>
          </div>
          <ul className="nav-links">
            <li><a className={activeSection === "home" ? "active" : ""} onClick={() => setActiveSection("home")}><i className="fas fa-home"></i> {t.home}</a></li>
            <li><a className={activeSection === "skills" ? "active" : ""} onClick={() => setActiveSection("skills")}><i className="fas fa-code"></i> {t.skills}</a></li>
            <li><a className={activeSection === "projects" ? "active" : ""} onClick={() => setActiveSection("projects")}><i className="fas fa-folder-open"></i> {t.projects}</a></li>
            <li><a className={activeSection === "media" ? "active" : ""} onClick={() => setActiveSection("media")}><i className="fas fa-photo-video"></i> {t.media}</a></li>
            <li><a className={activeSection === "biography" ? "active" : ""} onClick={() => setActiveSection("biography")}><i className="fas fa-book"></i> {t.bio}</a></li>
            <li><a className={activeSection === "gaming" ? "active" : ""} onClick={() => setActiveSection("gaming")}><i className="fas fa-gamepad"></i> {t.gaming}</a></li>
            <li><a className={activeSection === "certificates" ? "active" : ""} onClick={() => setActiveSection("certificates")}><i className="fas fa-certificate"></i> {t.certs}</a></li>
            <li><a className={activeSection === "blog" ? "active" : ""} onClick={() => setActiveSection("blog")}><i className="fas fa-newspaper"></i> {t.blog}</a></li>
            <li><a className={activeSection === "terminal" ? "active" : ""} onClick={() => setActiveSection("terminal")}><i className="fas fa-terminal"></i> {t.term}</a></li>
            <li><a className={activeSection === "contact" ? "active" : ""} onClick={() => setActiveSection("contact")}><i className="fas fa-envelope"></i> {t.contact}</a></li>
            <li><a className={activeSection === "donate" ? "active" : ""} onClick={() => setActiveSection("donate")}><i className="fas fa-qrcode"></i> {t.donate}</a></li>
          </ul>
        </nav>

        <section className="content-area">
          
          {/* HOME SECTION */}
          {activeSection === "home" && (
            <div className="section active">
              <div className="hero-container">
                <div className="terminal-window">
                    <div className="terminal-header">
                        <span className="btn red"></span><span className="btn yellow"></span><span className="btn green"></span>
                        <span className="title">sys_boot.exe</span>
                    </div>
                    <div className="terminal-body" ref={typingRef}></div>
                </div>
                <div className="holographic-card mt-2">
                  <h1 className="glitch-text text-xl" data-text="TRẦN CÔNG ĐẠT">TRẦN CÔNG ĐẠT</h1>
                  <div className="roles">
                    <span className="badge">Software Developer</span>
                    <span className="badge">Karate Athlete</span>
                    <span className="badge">VKU Student</span>
                  </div>
                  <div className="action-buttons mt-2">
                    <button className="cyber-btn" onClick={() => setActiveSection("projects")}><span>[ EXPLORE ]</span></button>
                    <button className="cyber-btn secondary" style={{marginLeft: "10px"}} onClick={() => setActiveSection("donate")}><span>[ DONATE ]</span></button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SKILLS SECTION */}
          {activeSection === "skills" && (
            <div className="section active">
              <h2 className="section-title glitch-text" data-text="SYSTEM_CAPABILITIES">SYSTEM_CAPABILITIES</h2>
              <div className="holographic-card mt-2">
                  <h3 className="neon-text mb-2"><i className="fas fa-code"></i> Technical Skills</h3>
                  <div className="skill-container">
                      <div className="skill-box">
                          <span className="skill-name">Java / Spring Boot</span>
                          <div className="skill-bar"><div className="skill-level" style={{width: "85%"}}>85%</div></div>
                      </div>
                      <div className="skill-box">
                          <span className="skill-name">Web Frontend (HTML/CSS/JS)</span>
                          <div className="skill-bar"><div className="skill-level" style={{width: "90%"}}>90%</div></div>
                      </div>
                      <div className="skill-box">
                          <span className="skill-name">Database (MySQL/SQL Server)</span>
                          <div className="skill-bar"><div className="skill-level" style={{width: "80%"}}>80%</div></div>
                      </div>
                  </div>
                  <h3 className="neon-text mb-2 mt-2"><i className="fas fa-user-ninja"></i> Soft & Other Skills</h3>
                  <div className="skill-container">
                      <div className="skill-box">
                          <span className="skill-name">Karate (Black Belt)</span>
                          <div className="skill-bar"><div className="skill-level" style={{width: "95%"}}>95%</div></div>
                      </div>
                      <div className="skill-box">
                          <span className="skill-name">English (TOEIC/IELTS)</span>
                          <div className="skill-bar"><div className="skill-level" style={{width: "80%"}}>80%</div></div>
                      </div>
                  </div>
              </div>
            </div>
          )}

          {/* PROJECTS SECTION */}
          {activeSection === "projects" && (
            <div className="section active">
              <h2 className="section-title glitch-text" data-text="DATABASE_OF_PROJECTS">DATABASE_OF_PROJECTS</h2>
              <div className="project-grid mt-2">
                {projectsList.length === 0 && <p>Loading data...</p>}
                {projectsList.map((p) => (
                  <div key={p.id} className="project-card holographic-card">
                    <div className="project-img-wrapper">
                      <img src={p.image_url} alt={p.title} />
                    </div>
                    <div className="project-info">
                      <h3 style={{color: "var(--neon-cyan)"}}>{p.title}</h3>
                      <p className="mb-2">{p.description}</p>
                      <div style={{ display: "flex", gap: "10px" }}>
                        {p.github && <a href={p.github} target="_blank" className="cyber-btn" style={{padding: "5px 10px", fontSize: "0.8rem"}}><span>[ GITHUB ]</span></a>}
                        {p.demo && p.demo !== '#' && <a href={p.demo} target="_blank" className="cyber-btn secondary" style={{padding: "5px 10px", fontSize: "0.8rem"}}><span>[ DEMO ]</span></a>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MEDIA VAULT SECTION */}
          {activeSection === "media" && (
            <div className="section active">
              <h2 className="section-title glitch-text" data-text="SECURE_MEDIA_VAULT">SECURE_MEDIA_VAULT</h2>
              <div className="media-grid mt-2">
                {galleryList.length === 0 && <p>Loading media...</p>}
                {galleryList.map((item) => (
                  <div key={item.id} className="media-item">
                    <img src={item.image_url} alt={item.title} />
                    <div className="media-overlay">
                      <h4 style={{marginBottom: "5px"}}>{item.title}</h4>
                      <p style={{fontSize: "0.8rem", color: "#ccc"}}>{item.description}</p>
                      <span className="badge mt-2" style={{fontSize: "0.7rem"}}>{item.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BIOGRAPHY SECTION */}
          {activeSection === "biography" && (
            <div className="section active">
                <h2 className="section-title glitch-text" data-text="DATA_TIMELINE">DATA_TIMELINE</h2>
                <div className="timeline-container mt-2">
                    <div className="timeline-item glass-panel">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                            <h3 className="neon-text">Present - IT Student at VKU</h3>
                            <p>Đang nghiên cứu và xây dựng các hệ thống phần mềm chuyên sâu (Java, Database, Web) tại ĐH CNTT & TT Việt - Hàn.</p>
                        </div>
                    </div>
                    <div className="timeline-item glass-panel">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                            <h3 className="neon-text">202x - Karatedo Practitioner</h3>
                            <p>Theo đuổi con đường võ thuật, rèn luyện tính kỷ luật, ý chí thép và sức khỏe thể chất bền bỉ.</p>
                        </div>
                    </div>
                    <div className="timeline-item glass-panel">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                            <h3 className="neon-text">200x - System Init</h3>
                            <p>Quá trình khởi chạy hệ thống tư duy và bắt đầu hành trình khám phá thế giới công nghệ.</p>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {/* GAMING SECTION */}
          {activeSection === "gaming" && (
            <div className="section active">
                <h2 className="section-title glitch-text" data-text="GAMING_STATISTICS">GAMING_STATISTICS</h2>
                <div className="gaming-grid mt-2">
                    <div className="game-card holographic-card">
                        <div className="game-header">
                            <img src="https://via.placeholder.com/80" alt="LoL" className="game-avatar" />
                            <div>
                                <h3 className="neon-text">League of Legends</h3>
                                <p>IGN: FakerFake</p>
                            </div>
                        </div>
                        <div className="game-stats">
                            <p><strong>Rank:</strong> Diamond</p>
                            <p><strong>Server:</strong> Vietnam</p>
                            <p><strong>Role:</strong> Mid / Jungle</p>
                        </div>
                    </div>
                    <div className="game-card holographic-card">
                        <div className="game-header">
                            <img src="https://via.placeholder.com/80" alt="Valorant" className="game-avatar" />
                            <div>
                                <h3 className="neon-text" style={{color: "var(--neon-pink)"}}>Valorant</h3>
                                <p>IGN: Headhunter#VN</p>
                            </div>
                        </div>
                        <div className="game-stats">
                            <p><strong>Rank:</strong> Ascendant</p>
                            <p><strong>Server:</strong> AP / SG</p>
                            <p><strong>Main:</strong> Jett</p>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {/* CERTIFICATES SECTION */}
          {activeSection === "certificates" && (
            <div className="section active">
                <h2 className="section-title glitch-text" data-text="VERIFIED_CREDENTIALS">VERIFIED_CREDENTIALS</h2>
                <div className="cert-grid mt-2">
                    <div className="cert-card glass-panel">
                        <i className="fas fa-award cert-icon"></i>
                        <h3>TOEIC / IELTS</h3>
                        <p>English Proficiency</p>
                    </div>
                    <div className="cert-card glass-panel">
                        <i className="fas fa-award cert-icon" style={{color: "var(--neon-pink)"}}></i>
                        <h3>Karatedo</h3>
                        <p>Black Belt Certification</p>
                    </div>
                </div>
            </div>
          )}

          {/* BLOG SECTION */}
          {activeSection === "blog" && (
            <div className="section active">
                <h2 className="section-title glitch-text" data-text="PERSONAL_LOGS">PERSONAL_LOGS</h2>
                <div className="blog-list mt-2">
                    {blogsList.length === 0 && <p>Decrypting logs...</p>}
                    {blogsList.map((blog) => (
                        <article key={blog.id} className="blog-post glass-panel" style={{display: "flex", gap: "20px", flexWrap: "wrap"}}>
                            {blog.cover_image && (
                              <img src={blog.cover_image} alt="cover" style={{width: "150px", height: "150px", objectFit: "cover", border: "1px solid var(--neon-cyan)"}} />
                            )}
                            <div style={{flex: 1}}>
                              <div className="blog-meta">
                                  <span className="date"><i className="fas fa-calendar"></i> {new Date(blog.created_at).toLocaleDateString('vi-VN')}</span>
                              </div>
                              <h3 className="neon-text">{blog.title}</h3>
                              <p>{blog.content}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
          )}

          {/* TERMINAL SECTION */}
          {activeSection === "terminal" && (
            <div className="section active">
                <h2 className="section-title glitch-text" data-text="SYSTEM_TERMINAL">SYSTEM_TERMINAL</h2>
                <div className="terminal-container glass-panel mt-2">
                    <div id="terminal-output">
                        {termHistory.map((item, i) => <div key={i}>{item}</div>)}
                        <div ref={endOfTermRef} />
                    </div>
                    <div className="terminal-input-line">
                        <span className="prompt">guest@datos:~$ </span>
                        <input type="text" id="terminal-input" autoComplete="off" autoFocus 
                               value={termInput} 
                               onChange={e => setTermInput(e.target.value)} 
                               onKeyDown={handleTerminalSubmit} />
                    </div>
                </div>
            </div>
          )}

          {/* CONTACT SECTION */}
          {activeSection === "contact" && (
            <div className="section active">
              <h2 className="section-title glitch-text" data-text="INITIATE_CONTACT">INITIATE_CONTACT</h2>
              <div className="contact-container mt-2">
                  <div className="contact-info glass-panel">
                      <h3 className="neon-text mb-2">Social Network_</h3>
                      <ul className="social-list">
                          <li><a href="#" className="cyber-link"><i className="fab fa-facebook"></i> Facebook</a></li>
                          <li><a href="#" className="cyber-link"><i className="fab fa-github"></i> GitHub</a></li>
                          <li><a href="#" className="cyber-link"><i className="fab fa-linkedin"></i> LinkedIn</a></li>
                      </ul>
                  </div>
                  <form className="contact-form holographic-card" onSubmit={handleSendMessage}>
                      <h3 className="neon-text mb-2">Send_Encrypted_Message</h3>
                      <input type="text" className="cyber-input mb-2" placeholder="ID / Name" required value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} />
                      <input type="email" className="cyber-input mb-2" placeholder="Email Address" required value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} />
                      <textarea className="cyber-input mb-2" rows={5} placeholder="Payload..." required value={contactForm.message} onChange={e => setContactForm({...contactForm, message: e.target.value})}></textarea>
                      <button type="submit" className="cyber-btn" disabled={isSending}>
                          <span>{isSending ? "[ TRANSMITTING... ]" : "[ TRANSMIT DATA ]"}</span>
                      </button>
                  </form>
              </div>
            </div>
          )}

          {/* DONATE SECTION */}
          {activeSection === "donate" && (
            <div className="section active">
                <h2 className="section-title glitch-text" data-text="FUNDING_PROTOCOL">FUNDING_PROTOCOL</h2>
                <div className="donate-grid mt-2">
                    <div className="donate-card glass-panel">
                        <h3 className="neon-text text-center mb-2">Vietcombank</h3>
                        <div className="qr-box"><img src="/images/vcb-qr.jpg" onError={(e) => e.currentTarget.src = "https://via.placeholder.com/200"} alt="VCB QR" /></div>
                        <div className="acc-info mt-2 text-center">
                            <p>TRẦN CÔNG ĐẠT</p>
                            <h4 id="vcb-stk" className="mt-2" style={{color: "var(--neon-green)"}}>1234567890</h4>
                        </div>
                        <button className="cyber-btn mt-2" style={{width: "100%"}} onClick={() => copySTK('1234567890')}><span>[ COPY STK ]</span></button>
                    </div>
                    <div className="donate-card glass-panel" style={{borderColor: "#a50064"}}>
                        <h3 className="text-center mb-2" style={{color: "#ff0099", textShadow: "0 0 5px #ff0099"}}>Momo Wallet</h3>
                        <div className="qr-box"><img src="/images/momo-qr.jpg" onError={(e) => e.currentTarget.src = "https://via.placeholder.com/200"} alt="Momo QR" /></div>
                        <div className="acc-info mt-2 text-center">
                            <p>TRẦN CÔNG ĐẠT</p>
                            <h4 id="momo-stk" className="mt-2" style={{color: "#ff0099"}}>0987654321</h4>
                        </div>
                        <button className="cyber-btn mt-2" style={{width: "100%", borderColor: "#ff0099", color: "#ff0099"}} onClick={() => copySTK('0987654321')}><span>[ COPY MOMO ]</span></button>
                    </div>
                </div>
            </div>
          )}

        </section>
      </main>
    </>
  );
}