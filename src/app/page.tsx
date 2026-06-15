"use client";
import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";
import Cropper from 'react-easy-crop';
// Hàm xử lý ảnh chuyên sâu
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image(); image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error)); image.setAttribute('crossOrigin', 'anonymous'); image.src = url;
  });

async function getCroppedImgBase64(imageSrc: string, pixelCrop: any): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  canvas.width = pixelCrop.width; canvas.height = pixelCrop.height;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return canvas.toDataURL('image/jpeg', 0.8); // Cắt xong nén thành chuỗi siêu nhẹ để lưu thẳng vào Database
}
export default function DatOS() {
  const [activeSection, setActiveSection] = useState("home");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const typingRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState("");

  // Dữ liệu Động 100% từ Supabase
  const [profile, setProfile] = useState<any>({ full_name: "LOADING...", roles: "", avatar_url: "https://via.placeholder.com/100" });
  const [skillsTech, setSkillsTech] = useState<any[]>([]);
  const [skillsSoft, setSkillsSoft] = useState<any[]>([]);
  const [timelineList, setTimelineList] = useState<any[]>([]);
  const [gamingList, setGamingList] = useState<any[]>([]);
  const [certList, setCertList] = useState<any[]>([]);
  const [donateList, setDonateList] = useState<any[]>([]);
  
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [blogsList, setBlogsList] = useState<any[]>([]);
  const [galleryList, setGalleryList] = useState<any[]>([]);
  
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [isSending, setIsSending] = useState(false);
  const [termInput, setTermInput] = useState("");
  const [termHistory, setTermHistory] = useState<React.ReactNode[]>([]);
  const endOfTermRef = useRef<HTMLDivElement>(null);

  // God Mode States
  const [lang, setLang] = useState<"EN" | "VN">("EN");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [temp, setTemp] = useState("Loading...");
  
  // --- STATE NHẠC NỀN TỰ ĐỘNG ---
  const audioRef = useRef<HTMLAudioElement>(null);
  // TRỎ THẲNG TÊN FILE NHẠC TRONG THƯ MỤC PUBLIC
  const [audioSrc, setAudioSrc] = useState("/cyberpunk2077 light.mp3"); 
  const [trackName, setTrackName] = useState("Cyberpunk_Theme.mp3");
  const [isPlaying, setIsPlaying] = useState(false);
  
  // --- STATE QUYỀN ADMIN (Giấu kín) ---
  const [isAdmin, setIsAdmin] = useState(false);
  // State quản lý việc phóng to ảnh
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const dict = {
    EN: { sys: "SYS_ADMIN", home: "Home", skills: "Skills", projects: "Projects", media: "Media Vault", bio: "Biography", gaming: "Gaming Profile", certs: "Certificates", blog: "Blog", term: "Terminal", contact: "Contact", donate: "Donate" },
    VN: { sys: "QUẢN TRỊ VIÊN", home: "Trang Chủ", skills: "Kỹ Năng", projects: "Dự Án", media: "Thư Viện Ảnh", bio: "Tiểu Sử", gaming: "Hồ Sơ Game", certs: "Chứng Chỉ", blog: "Nhật Ký", term: "Dòng Lệnh", contact: "Liên Hệ", donate: "Ủng Hộ" }
  };
  // --- STATE CỦA HỆ THỐNG CẮT ẢNH ---
  const [avatarFileUrl, setAvatarFileUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => setCroppedAreaPixels(croppedAreaPixels);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatarFileUrl(URL.createObjectURL(file)); // Mở Modal Cắt ảnh
  };

  const handleSaveAvatar = async () => {
    if (!avatarFileUrl || !croppedAreaPixels) return;
    setIsUploadingAvatar(true);
    try {
      const base64Image = await getCroppedImgBase64(avatarFileUrl, croppedAreaPixels);
      
      // Update thẳng ảnh mới vào Supabase Profile
      await supabase.from("profile").update({ avatar_url: base64Image }).eq("id", profile.id);

      // Cập nhật giao diện lập tức
      setProfile({ ...profile, avatar_url: base64Image });
      setAvatarFileUrl(null); // Đóng Modal
    } catch (error: any) { alert("Lỗi cập nhật ảnh: " + error.message); }
    setIsUploadingAvatar(false);
  };
  const t = dict[lang];

  // KÉO TOÀN BỘ DỮ LIỆU TỪ SUPABASE
  useEffect(() => {
    const fetchAllData = async () => {
      const { data: prof } = await supabase.from("profile").select("*").single();
      if (prof) setProfile(prof);
      const { data: sk } = await supabase.from("skills").select("*").order("percentage", { ascending: false });
      if (sk) {
        setSkillsTech(sk.filter((s:any) => s.category === 'tech'));
        setSkillsSoft(sk.filter((s:any) => s.category === 'soft'));
      }
      const { data: tl } = await supabase.from("timeline").select("*").order("id", { ascending: true });
      if (tl) setTimelineList(tl);
      const { data: gm } = await supabase.from("gaming").select("*").order("id", { ascending: true });
      if (gm) setGamingList(gm);
      const { data: ct } = await supabase.from("certificates").select("*").order("id", { ascending: true });
      if (ct) setCertList(ct);
      const { data: dn } = await supabase.from("donate").select("*").order("id", { ascending: true });
      if (dn) setDonateList(dn);
      const { data: pj } = await supabase.from("projects").select("*").order("id", { ascending: false });
      if (pj) setProjectsList(pj);
      const { data: bl } = await supabase.from("blogs").select("*").order("id", { ascending: false });
      if (bl) setBlogsList(bl);
      const { data: gl } = await supabase.from("gallery").select("*").order("id", { ascending: false });
      if (gl) setGalleryList(gl);
    };
    fetchAllData();
  }, []);

  // BẮT BUỘC PHÁT NHẠC KHI CLICK LẦN ĐẦU
  useEffect(() => {
    const startMusic = () => {
      if (audioRef.current && !isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
      // Click xong 1 lần là xóa sự kiện đi
      document.removeEventListener("click", startMusic);
    };
    document.addEventListener("click", startMusic);
    return () => document.removeEventListener("click", startMusic);
  }, [isPlaying]);

  const togglePlay = () => { 
    if (audioRef.current) { 
      if (isPlaying) audioRef.current.pause(); else audioRef.current.play(); 
      setIsPlaying(!isPlaying); 
    } 
  };
  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=16.0678&longitude=108.2208&current_weather=true")
      .then(res => res.json())
      .then(data => setTemp(`${Math.round(data.current_weather.temperature)}°C`))
      .catch(() => setTemp("28°C"));
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    const { error } = await supabase.from("messages").insert([{ sender_name: contactForm.name, sender_email: contactForm.email, content: contactForm.message }]);
    setIsSending(false);
    if (error) alert("LỖI ĐƯỜNG TRUYỀN!");
    else { alert("DATA TRANSMITTED SUCCESSFULLY!"); setContactForm({ name: "", email: "", message: "" }); }
  };

  const toggleTheme = () => { const newTheme = theme === "dark" ? "light" : "dark"; setTheme(newTheme); document.body.classList.toggle("light-mode", newTheme === "light"); };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { setAudioSrc(URL.createObjectURL(file)); setTrackName(file.name.substring(0, 15) + "..."); setIsPlaying(true); } };
  const togglePlay = () => { if (audioRef.current) { if (isPlaying) audioRef.current.pause(); else audioRef.current.play(); setIsPlaying(!isPlaying); } };

  useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString("vi-VN")), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext("2d"); if (!ctx) return;
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%""\'#&_(),.;:?!\\|{}<>[]^~';
    const drops = Array(Math.floor(canvas.width / 14)).fill(1);
    const drawMatrix = () => { ctx.fillStyle = "rgba(5, 5, 5, 0.05)"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = "#0f0"; ctx.font = "14px monospace";
      for (let i = 0; i < drops.length; i++) { ctx.fillText(letters[Math.floor(Math.random() * letters.length)], i * 14, drops[i] * 14); if (drops[i] * 14 > canvas.height && Math.random() > 0.975) drops[i] = 0; drops[i]++; }
    };
    const interval = setInterval(drawMatrix, 33); return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeSection === "home" && typingRef.current) {
      const container = typingRef.current; container.innerHTML = "";
      const lines = [ "> Welcome To DatOS v1.0", "> Establishing connection to secure server...", `> Fetching user profile: ${profile.full_name}`, "> Loading UI Modules...", "> Access Granted. Welcome." ];
      let lineIdx = 0; let isTyping = true; 
      const typeLine = () => {
        if (!isTyping || lineIdx >= lines.length) return;
        const p = document.createElement("p"); container.appendChild(p);
        let charIdx = 0; const text = lines[lineIdx];
        const interval = setInterval(() => {
          if (!isTyping) { clearInterval(interval); return; } p.textContent += text[charIdx]; charIdx++;
          if (charIdx >= text.length) { clearInterval(interval); lineIdx++; setTimeout(typeLine, 300); }
        }, 30);
      }; typeLine(); return () => { isTyping = false; };
    }
  }, [activeSection, profile.full_name]);

const handleTerminalSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const cmd = termInput.trim();
      const cmdLower = cmd.toLowerCase(); 
      let response: React.ReactNode = "";

      // HỆ THỐNG ĐĂNG NHẬP BÍ MẬT
      if (cmdLower.startsWith('login ')) {
        const parts = cmd.split(' ');
        if (parts.length === 3) {
            response = <div style={{color: 'yellow'}}>[SYSTEM] Authenticating...</div>;
            setTermHistory(prev => [...prev, <div key={prev.length}><span className="prompt">guest@datos:~$</span> {cmd}</div>, <div key={prev.length + "res"}>{response}</div>]);
            setTermInput("");
            
            // Gửi email và pass lên Supabase để check
            const { data, error } = await supabase.auth.signInWithPassword({
                email: parts[1],
                password: parts[2]
            });
            
            if (error) {
                setTermHistory(prev => [...prev, <div key={Date.now()} style={{color: 'red'}}>Access Denied: Sai tài khoản hoặc mật khẩu!</div>]);
            } else {
                setIsAdmin(true); // BẬT GOD MODE
                setTermHistory(prev => [...prev, <div key={Date.now()} style={{color: '#0f0'}}>[SUCCESS] ADMIN PRIVILEGES GRANTED. Đã mở khóa quyền thay đổi Avatar!</div>]);
            }
            return;
        } else {
            response = <div style={{color: 'red'}}>Sai cú pháp. Dùng lệnh: login &lt;email&gt; &lt;mật_khẩu&gt;</div>;
        }
      } 
      else if (cmdLower === 'logout') {
        await supabase.auth.signOut();
        setIsAdmin(false);
        response = <div style={{color: '#0ff'}}>[SYSTEM] Admin logged out. Trở về trạng thái khách.</div>;
      }
      else {
        // CÁC LỆNH BÌNH THƯỜNG
        switch(cmdLower) { 
          case 'help': response = <div style={{color: '#0ff'}}>Commands: about, projects, clear, login, logout</div>; break; 
          case 'about': response = <div>User: {profile.full_name}<br/>SysAdmin of DatOS.</div>; break; 
          case 'projects': setActiveSection('projects'); response = <div>[SYSTEM] Navigating...</div>; break; 
          case 'clear': setTermHistory([]); setTermInput(""); return; 
          case '': break; 
          default: response = <div style={{color: 'red'}}>Command not found: {cmd}. Type 'help'.</div>; 
        }
      }
      setTermHistory(prev => [ ...prev, <div key={prev.length}><span className="prompt">{isAdmin ? "root" : "guest"}@datos:~$</span> {cmd}</div>, <div key={prev.length + "res"}>{response}</div> ]); 
      setTermInput("");
    }
  };
  useEffect(() => { endOfTermRef.current?.scrollIntoView({ behavior: "smooth" }); }, [termHistory]);
  const copySTK = (stk: string) => navigator.clipboard.writeText(stk).then(() => alert("COPIED: " + stk));

  return (
    <>
      <Head><title>DatOS | {profile.full_name}</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" /></Head>
      <canvas ref={canvasRef} id="matrix-canvas"></canvas><div className="crt-overlay"></div>
      <header className="os-topbar glass-panel flex items-center justify-between">
        <div className="topbar-left">
          <span className="os-logo glitch-hover" data-text="[DatOS v1.0]">[DatOS v1.0]</span><span className="breadcrumb">C:\Home\{">"} <span id="current-path">{activeSection.toUpperCase()}</span></span>
        </div>
        <div className="topbar-right">
          {audioSrc && <audio ref={audioRef} src={audioSrc} onEnded={() => setIsPlaying(false)} autoPlay loop />}
          <span id="music-player" className="cursor-pointer" onClick={() => audioSrc ? togglePlay() : fileInputRef.current?.click()}>
            <i className={`fas ${isPlaying ? 'fa-pause-circle' : 'fa-music'}`}></i> <span className="track-name" style={{marginLeft: "5px"}}>{trackName}</span>
          </span>
          <span id="weather-widget" style={{marginLeft: "15px"}}><i className="fas fa-cloud-sun"></i> {temp}</span>
          <span id="clock-widget" style={{marginLeft: "15px"}}>{currentTime}</span>
          <button onClick={() => setLang(lang === "EN" ? "VN" : "EN")} className="btn-icon" style={{marginLeft: "15px", fontWeight: "bold", fontSize: "0.85rem"}}>{lang === "EN" ? "VN" : "EN"}</button>
          <button onClick={toggleTheme} className="btn-icon" style={{marginLeft: "10px"}}><i className={`fas ${theme === "dark" ? 'fa-sun' : 'fa-moon'}`}></i></button>
        </div>
      </header>

      <main className="app-container">
        <nav className="sidebar glass-panel">
          <div className="user-profile">
<div className="user-profile">
            {/* THÊM ĐIỀU KIỆN TỪ CHỐI CLICK NẾU KHÔNG PHẢI ADMIN */}
            <div className="avatar-container" onClick={() => isAdmin ? avatarInputRef.current?.click() : null} title={isAdmin ? "Thay đổi Avatar" : "Chỉ Admin mới được thay đổi"}>
              {isAdmin && <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarSelect} style={{display: 'none'}} />}
              <img src={profile.avatar_url} alt="Avatar" className="avatar-img" />
              <div className="status-dot"></div>
              {/* CHỈ HIỆN ICON CAMERA KHI ĐÃ LOGIN */}
              {isAdmin && <div className="avatar-hover-overlay"><i className="fas fa-camera"></i></div>}
            </div>            
            <h3 className="user-name glow-text">{profile.full_name}</h3><p className="user-role">{t.sys}</p>
          </div>              <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarSelect} style={{display: 'none'}} />
              <img src={profile.avatar_url} alt="Avatar" className="avatar-img" />
              <div className="status-dot"></div>
              <div className="avatar-hover-overlay"><i className="fas fa-camera"></i></div>
            </div>            <h3 className="user-name glow-text">{profile.full_name}</h3><p className="user-role">{t.sys}</p>
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
                    <div className="terminal-header"><span className="btn red"></span><span className="btn yellow"></span><span className="btn green"></span><span className="title">sys_boot.exe</span></div>
                    <div className="terminal-body" ref={typingRef}></div>
                </div>
                <div className="holographic-card mt-2">
                  <h1 className="glitch-text text-xl" data-text={profile.full_name}>{profile.full_name}</h1>
                  <div className="roles">
                    {profile.roles.split(',').map((role: string, index: number) => (
                      <span key={index} className="badge">{role.trim()}</span>
                    ))}
                  </div>
                  <div className="action-buttons mt-2"><button className="cyber-btn" onClick={() => setActiveSection("projects")}><span>[ EXPLORE ]</span></button><button className="cyber-btn secondary" style={{marginLeft: "10px"}} onClick={() => setActiveSection("donate")}><span>[ DONATE ]</span></button></div>
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
                      {skillsTech.map((s) => (
                        <div key={s.id} className="skill-box"><span className="skill-name">{s.name}</span><div className="skill-bar"><div className="skill-level" style={{width: `${s.percentage}%`}}>{s.percentage}%</div></div></div>
                      ))}
                  </div>
                  <h3 className="neon-text mb-2 mt-2"><i className="fas fa-user-ninja"></i> Soft & Other Skills</h3>
                  <div className="skill-container">
                      {skillsSoft.map((s) => (
                        <div key={s.id} className="skill-box"><span className="skill-name">{s.name}</span><div className="skill-bar"><div className="skill-level" style={{width: `${s.percentage}%`}}>{s.percentage}%</div></div></div>
                      ))}
                  </div>
              </div>
            </div>
          )}

          {/* BIOGRAPHY SECTION */}
          {activeSection === "biography" && (
            <div className="section active">
                <h2 className="section-title glitch-text" data-text="DATA_TIMELINE">DATA_TIMELINE</h2>
                <div className="timeline-container mt-2">
                    {timelineList.map((t) => (
                      <div key={t.id} className="timeline-item glass-panel"><div className="timeline-dot"></div><div className="timeline-content"><h3 className="neon-text">{t.year} - {t.title}</h3><p>{t.description}</p></div></div>
                    ))}
                </div>
            </div>
          )}

          {/* GAMING SECTION */}
          {activeSection === "gaming" && (
            <div className="section active">
                <h2 className="section-title glitch-text" data-text="GAMING_STATISTICS">GAMING_STATISTICS</h2>
                <div className="gaming-grid mt-2">
                    {gamingList.map((g) => (
                      <div key={g.id} className="game-card holographic-card">
                          <div className="game-header">
                              <img 
                                src={g.avatar_url} 
                                alt={g.game_name} 
                                className="game-avatar cursor-pointer" 
                                onClick={() => setSelectedImage(g.avatar_url)} 
                              />
                              <div><h3 className="neon-text" style={{color: g.color_theme}}>{g.game_name}</h3><p>IGN: {g.ign}</p></div>
                          </div>
                          <div className="game-stats"><p><strong>Rank:</strong> {g.rank}</p><p><strong>Server:</strong> {g.server}</p><p><strong>Role:</strong> {g.role_main}</p></div>
                      </div>
                    ))}
                </div>
            </div>
          )}

          {/* CERTIFICATES SECTION */}
          {activeSection === "certificates" && (
            <div className="section active">
                <h2 className="section-title glitch-text" data-text="VERIFIED_CREDENTIALS">VERIFIED_CREDENTIALS</h2>
                
                {/* THUẬT TOÁN GOM NHÓM TỰ ĐỘNG BẰNG CỘT 'name' */}
                {Object.entries(
                  certList.reduce((acc, curr) => {
                    if (!acc[curr.name]) acc[curr.name] = [];
                    acc[curr.name].push(curr);
                    return acc;
                  }, {})
                ).map(([groupName, items]: [string, any]) => (
                  <div key={groupName} className="cert-category-group" style={{ marginTop: "30px" }}>
                    
                    {/* Tên Nhóm (Lấy từ cột 'name') */}
                    <h3 className="neon-text mb-2" style={{ fontSize: "1.5rem", borderBottom: "1px dashed var(--glass-border)", paddingBottom: "10px", textTransform: "uppercase" }}>
                      <i className="fas fa-folder-open" style={{ marginRight: "10px" }}></i> {groupName}
                    </h3>
                    
                    {/* Danh sách các thành tích trong nhóm đó */}
                    <div className="cert-grid mt-2">
                        {items.map((c: any) => (
                          <div key={c.id} className="cert-card glass-panel">
                              <i className={`fas ${c.icon} cert-icon`} style={{color: c.color_theme, fontSize: "2.5rem"}}></i>
                              <div style={{ marginTop: "15px" }}>
                                  {/* In nội dung chi tiết từ cột 'issuer' */}
                                  <p style={{ color: "#fff", fontSize: "1.1rem", lineHeight: "1.6", fontWeight: "bold" }}>
                                      {c.issuer}
                                  </p>
                              </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* DONATE SECTION */}
          {activeSection === "donate" && (
            <div className="section active">
                <h2 className="section-title glitch-text" data-text="FUNDING_PROTOCOL">FUNDING_PROTOCOL</h2>
                <div className="donate-grid mt-2">
                    {donateList.map((d) => (
                      <div key={d.id} className="donate-card glass-panel" style={{borderColor: d.color_theme}}>
                          <h3 className="text-center mb-2" style={{color: d.color_theme, textShadow: `0 0 5px ${d.color_theme}`}}>{d.bank_name}</h3>
                          <div className="qr-box"><img src={d.qr_image_url} alt="QR" /></div>
                          <div className="acc-info mt-2 text-center"><p>{d.account_name}</p><h4 className="mt-2" style={{color: d.color_theme}}>{d.account_number}</h4></div>
                          <button className="cyber-btn mt-2" style={{width: "100%", borderColor: d.color_theme, color: d.color_theme}} onClick={() => copySTK(d.account_number)}><span>[ COPY ]</span></button>
                      </div>
                    ))}
                </div>
            </div>
          )}

          {/* PROJECTS, MEDIA, BLOGS, TERMINAL, CONTACT - GIỮ NGUYÊN (Dynamic có sẵn) */}
          {activeSection === "projects" && (
            <div className="section active"><h2 className="section-title glitch-text" data-text="DATABASE_OF_PROJECTS">DATABASE_OF_PROJECTS</h2><div className="project-grid mt-2">{projectsList.map((p) => (<div key={p.id} className="project-card holographic-card"><div className="project-img-wrapper"><img src={p.image_url} alt={p.title} /></div><div className="project-info"><h3 style={{color: "var(--neon-cyan)"}}>{p.title}</h3><p className="mb-2">{p.description}</p><div style={{ display: "flex", gap: "10px" }}>{p.github && <a href={p.github} target="_blank" className="cyber-btn" style={{padding: "5px 10px", fontSize: "0.8rem"}}><span>[ GITHUB ]</span></a>}{p.demo && p.demo !== '#' && <a href={p.demo} target="_blank" className="cyber-btn secondary" style={{padding: "5px 10px", fontSize: "0.8rem"}}><span>[ DEMO ]</span></a>}</div></div></div>))}</div></div>
          )}
          {activeSection === "media" && (
            <div className="section active"><h2 className="section-title glitch-text" data-text="SECURE_MEDIA_VAULT">SECURE_MEDIA_VAULT</h2><div className="media-grid mt-2">{galleryList.map((item) => (<div key={item.id} className="media-item"><img src={item.image_url} alt={item.title} /><div className="media-overlay"><h4 style={{marginBottom: "5px"}}>{item.title}</h4><p style={{fontSize: "0.8rem", color: "#ccc"}}>{item.description}</p><span className="badge mt-2" style={{fontSize: "0.7rem"}}>{item.category}</span></div></div>))}</div></div>
          )}
          {activeSection === "blog" && (
            <div className="section active"><h2 className="section-title glitch-text" data-text="PERSONAL_LOGS">PERSONAL_LOGS</h2><div className="blog-list mt-2">{blogsList.map((blog) => (<article key={blog.id} className="blog-post glass-panel" style={{display: "flex", gap: "20px", flexWrap: "wrap"}}>{blog.cover_image && (<img src={blog.cover_image} alt="cover" style={{width: "150px", height: "150px", objectFit: "cover", border: "1px solid var(--neon-cyan)"}} />)}<div style={{flex: 1}}><div className="blog-meta"><span className="date"><i className="fas fa-calendar"></i> {new Date(blog.created_at).toLocaleDateString('vi-VN')}</span></div><h3 className="neon-text">{blog.title}</h3><p>{blog.content}</p></div></article>))}</div></div>
          )}
          {activeSection === "terminal" && (
            <div className="section active"><h2 className="section-title glitch-text" data-text="SYSTEM_TERMINAL">SYSTEM_TERMINAL</h2><div className="terminal-container glass-panel mt-2"><div id="terminal-output">{termHistory.map((item, i) => <div key={i}>{item}</div>)}<div ref={endOfTermRef} /></div><div className="terminal-input-line"><span className="prompt">guest@datos:~$ </span><input type="text" id="terminal-input" autoComplete="off" autoFocus value={termInput} onChange={e => setTermInput(e.target.value)} onKeyDown={handleTerminalSubmit} /></div></div></div>
          )}
          {/* CONTACT SECTION */}
          {activeSection === "contact" && (
            <div className="section active">
              <h2 className="section-title glitch-text" data-text="INITIATE_CONTACT">INITIATE_CONTACT</h2>
              <div className="contact-container mt-2">
                <div className="contact-info glass-panel">
                  <h3 className="neon-text mb-2">Social Network_</h3>
                  <ul className="social-list">
                    <li><a href="https://www.facebook.com/eiudungkhok" target="_blank" className="cyber-link"><i className="fab fa-facebook"></i> Facebook</a></li>
                    <li><a href="https://github.com/eiudungkhok" target="_blank" className="cyber-link"><i className="fab fa-github"></i> GitHub</a></li>
                    <li><a href="https://www.instagram.com/eiudungkhok" target="_blank" className="cyber-link"><i className="fab fa-instagram"></i> Instagram</a></li>
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
        </section>
        {/* --- MODAL PHÓNG TO ẢNH --- */}
        {selectedImage && (
          <div className="image-modal-overlay" onClick={() => setSelectedImage(null)}>
            <div className="image-modal-content" onClick={e => e.stopPropagation()}>
              <span className="close-modal" onClick={() => setSelectedImage(null)}>
                <i className="fas fa-times"></i>
              </span>
              <img src={selectedImage} alt="Full screen" />
            </div>
          </div>
        )}
        {/* --- MODAL CẮT ẢNH AVATAR --- */}
        {avatarFileUrl && (
          <div className="cropper-modal-overlay">
            <div className="cropper-modal-content" onClick={e => e.stopPropagation()}>
              <h3 className="neon-text text-center">ĐIỀU CHỈNH AVATAR</h3>
              <div className="crop-container">
                <Cropper
                  image={avatarFileUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}          // Ép cắt theo tỉ lệ hình vuông 1:1
                  cropShape="round"   // Hiển thị khung cắt hình tròn bo viền
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px'}}>
                <label style={{color: '#ccc', fontSize: '0.9rem'}}>Thu phóng (Zoom):</label>
                <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} style={{width: '100%'}} />
              </div>
              <div style={{display: 'flex', gap: '10px'}}>
                <button className="cyber-btn secondary" style={{flex: 1}} onClick={() => setAvatarFileUrl(null)} disabled={isUploadingAvatar}>[ HỦY ]</button>
                <button className="cyber-btn" style={{flex: 1}} onClick={handleSaveAvatar} disabled={isUploadingAvatar}>
                  {isUploadingAvatar ? "[ ĐANG XỬ LÝ... ]" : "[ XÁC NHẬN ]"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}