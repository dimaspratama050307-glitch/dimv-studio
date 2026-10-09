import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowDownRight, ArrowRight, Box, Check, ChevronDown, Code2, ExternalLink, Globe2, ImagePlus, Layers3, LockKeyhole, LogOut, Menu, Package, Plus, Settings, ShieldCheck, Sparkles, Trash2, Upload, X } from 'lucide-react'
import { isSupabaseConfigured, supabase } from './supabase'

type Portfolio = { id: string; title: string; category: string; description: string; image_url: string; is_published: boolean; completed_at?: string | null; created_at?: string }
type Product = { id: string; name: string; description: string; category: string; price: number; stock: number; image_url: string; is_published: boolean; created_at?: string; updated_at?: string }
type SiteSetting = { setting_key: string; setting_value: any; updated_at?: string }
type UserProfile = { user_id: string; email?: string | null; role: string }
const samplePortfolio: Portfolio[] = [
  {id:'sample-1',title:'Mountain & Expedition Map',category:'Map Gunung',description:'Map pendakian dengan checkpoint, basecamp, dan summit yang dirancang sesuai kebutuhan komunitas.',image_url:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85',is_published:true},
  {id:'sample-2',title:'Modern DJ Experience',category:'Map Club',description:'Pengalaman map DJ dengan pencahayaan, dekorasi, dan ambience malam yang imersif.',image_url:'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=85',is_published:true},
  {id:'sample-3',title:'Custom Obstacle Course',category:'Obstacle',description:'Rintangan dan checkpoint khusus dengan alur permainan yang menantang.',image_url:'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=85',is_published:true}
]
const sampleProducts: Product[] = [
  {id:'demo-1',name:'Summit Kit',description:'Paket sistem summit dan leaderboard untuk map Roblox.',category:'Kit',price:300000,stock:100,image_url:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=700&q=80',is_published:true},
  {id:'demo-2',name:'Custom Map',description:'Pembuatan map sesuai konsep dan kebutuhan.',category:'Map',price:150000,stock:100,image_url:'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=700&q=80',is_published:true},
  {id:'demo-3',name:'Script & System',description:'Sistem Roblox yang disesuaikan dengan kebutuhan proyek.',category:'Script',price:10000,stock:100,image_url:'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=80',is_published:true}
]
const services = [
  ['Map Gunung','Map pendakian dengan jalur, checkpoint, basecamp, dan summit.'],['Map Club & DJ','Map club dengan lighting, panggung, dan ambience sesuai konsep.'],['Obstacle & Hangout','Map obstacle, hangout, dan area komunitas custom.'],['Script & System','Pembuatan sistem, UI, leaderboard, dan fitur gameplay.'],['Summit Kit & Bug Fix','Pemasangan kit, penyesuaian sistem, dan bantuan perbaikan bug.'],['Custom Request','Kebutuhan khusus dibahas sesuai konsep dan anggaran proyek.']
]
const money = (value:number) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(value)||0)

export default function App() {
  const [portfolio,setPortfolio] = useState<Portfolio[]>(samplePortfolio)
  const [products,setProducts] = useState<Product[]>(sampleProducts)
  const [settings,setSettings] = useState<Record<string,any>>({studio_name:'! DimV Studio',tagline:'Build • Create • Beyond',description:'Studio pengembangan Roblox yang membantu mengubah ide menjadi pengalaman bermain yang berkesan.',discord_url:'',contact_text:'Hubungi kami untuk konsultasi proyek.'})
  const [profile,setProfile] = useState<UserProfile|null>(null)
  const [sessionEmail,setSessionEmail] = useState('')
  const [loginOpen,setLoginOpen] = useState(false)
  const [dashboardOpen,setDashboardOpen] = useState(false)
  const [mobileMenu,setMobileMenu] = useState(false)
  const [language,setLanguage] = useState<'ID'|'EN'>('ID')
  const [notice,setNotice] = useState('')
  const [loginEmail,setLoginEmail] = useState('')
  const [loginPassword,setLoginPassword] = useState('')
  const [busy,setBusy] = useState(false)
  const [tab,setTab] = useState<'overview'|'portfolio'|'products'|'settings'>('overview')
  const [editPortfolio,setEditPortfolio] = useState<Portfolio|null>(null)
  const [editProduct,setEditProduct] = useState<Product|null>(null)
  const [settingKey,setSettingKey] = useState('')
  const [settingValue,setSettingValue] = useState('')
  const [uploading,setUploading] = useState(false)
  const [filter,setFilter] = useState('Semua')
  const [portfolioRowsFromDb,setPortfolioRowsFromDb] = useState(false)
  const [productRowsFromDb,setProductRowsFromDb] = useState(false)
  const isOwner = profile?.role === 'owner' || profile?.role === 'admin'
  const english = language === 'EN'

  async function loadPublicData() {
    if (!supabase) return
    const [p,r,s] = await Promise.all([
      supabase.from('portfolio').select('*').eq('is_published',true).order('created_at',{ascending:false}),
      supabase.from('products').select('*').eq('is_published',true).order('created_at',{ascending:false}),
      supabase.from('site_settings').select('*')
    ])
    if (!p.error && p.data) { setPortfolio(p.data as Portfolio[]); setPortfolioRowsFromDb(true) }
    if (!r.error && r.data) { setProducts(r.data as Product[]); setProductRowsFromDb(true) }
    if (!s.error && s.data) { setSettings(prev => ({...prev,...Object.fromEntries((s.data as SiteSetting[]).map(x=>[x.setting_key,x.setting_value]))})) }
  }
  async function loadProfile(userId:string,email:string) {
    if (!supabase) return
    const {data} = await supabase.from('user_profiles').select('user_id,email,role').eq('user_id',userId).maybeSingle()
    if (data) { setProfile(data as UserProfile); setSessionEmail(email); setDashboardOpen(data.role==='owner'||data.role==='admin') }
    else { setProfile(null); setNotice('Akun berhasil login, tetapi belum memiliki role pada user_profiles. Hubungi owner untuk mengatur akses.'); }
  }
  useEffect(()=>{
    void loadPublicData()
    if (!supabase) return
    supabase.auth.getSession().then(({data})=>{ if(data.session?.user) void loadProfile(data.session.user.id,data.session.user.email||'') })
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,session)=>{
      if (session?.user) { setTimeout(()=>void loadProfile(session.user.id,session.user.email||''),0) }
      else { setProfile(null); setSessionEmail(''); setDashboardOpen(false) }
    })
    return ()=>subscription.unsubscribe()
  },[])
  const categories = useMemo(()=>['Semua',...Array.from(new Set(portfolio.map(p=>p.category)))],[portfolio])
  const shownPortfolio = portfolio.filter(p=>filter==='Semua'||p.category===filter)

  async function login(e:FormEvent) {
    e.preventDefault(); if(!supabase){setNotice('Supabase belum dikonfigurasi. Isi file .env.local terlebih dahulu.');return}
    setBusy(true); setNotice('')
    const {error} = await supabase.auth.signInWithPassword({email:loginEmail.trim(),password:loginPassword})
    setBusy(false)
    if(error) setNotice('Login gagal: '+error.message)
    else {setLoginOpen(false);setLoginPassword('');setNotice('Login berhasil. Memeriksa role akun…')}
  }
  async function logout(){ if(supabase) await supabase.auth.signOut(); setProfile(null);setDashboardOpen(false);setNotice('Kamu telah logout.') }
  async function savePortfolio(e:FormEvent){
    e.preventDefault(); if(!supabase||!isOwner||!editPortfolio)return
    setBusy(true); const payload={title:editPortfolio.title,category:editPortfolio.category,description:editPortfolio.description,image_url:editPortfolio.image_url,is_published:editPortfolio.is_published,completed_at:editPortfolio.completed_at||null}
    const result=editPortfolio.id.startsWith('sample-')?await supabase.from('portfolio').insert(payload):await supabase.from('portfolio').update(payload).eq('id',editPortfolio.id)
    setBusy(false);if(result.error){setNotice('Gagal menyimpan portofolio: '+result.error.message);return}setEditPortfolio(null);await loadPublicData();setNotice('Portofolio berhasil disimpan.')
  }
  async function deletePortfolio(item:Portfolio){if(!supabase||!isOwner||!confirm(`Hapus portofolio “${item.title}”?`))return;const {error}=await supabase.from('portfolio').delete().eq('id',item.id);if(error)setNotice(error.message);else{await loadPublicData();setNotice('Portofolio dihapus.')}}
  async function saveProduct(e:FormEvent){
    e.preventDefault();if(!supabase||!isOwner||!editProduct)return
    setBusy(true);const payload={name:editProduct.name,description:editProduct.description,category:editProduct.category,price:Number(editProduct.price),stock:Number(editProduct.stock),image_url:editProduct.image_url,is_published:editProduct.is_published,updated_at:new Date().toISOString()}
    const result=editProduct.id.startsWith('demo-')?await supabase.from('products').insert(payload):await supabase.from('products').update(payload).eq('id',editProduct.id)
    setBusy(false);if(result.error){setNotice('Gagal menyimpan produk: '+result.error.message);return}setEditProduct(null);await loadPublicData();setNotice('Produk berhasil disimpan.')
  }
  async function deleteProduct(item:Product){if(!supabase||!isOwner||!confirm(`Hapus produk “${item.name}”?`))return;const {error}=await supabase.from('products').delete().eq('id',item.id);if(error)setNotice(error.message);else{await loadPublicData();setNotice('Produk dihapus.')}}
  async function uploadImage(file:File,kind:'portfolio'|'products'){
    if(!supabase||!isOwner){setNotice('Login sebagai owner/admin untuk mengunggah gambar.');return}
    setUploading(true);const safe=file.name.toLowerCase().replace(/[^a-z0-9.-]/g,'-');const path=`${kind}/${Date.now()}-${safe}`
    const {error}=await supabase.storage.from('dimv-asset').upload(path,file,{upsert:false,contentType:file.type})
    if(error){setNotice('Upload gagal: '+error.message+' Pastikan bucket dimv-asset dan policy Storage sudah dibuat.');setUploading(false);return}
    const {data}=supabase.storage.from('dimv-asset').getPublicUrl(path)
    if(kind==='portfolio'&&editPortfolio)setEditPortfolio({...editPortfolio,image_url:data.publicUrl})
    if(kind==='products'&&editProduct)setEditProduct({...editProduct,image_url:data.publicUrl})
    setUploading(false);setNotice('Gambar berhasil diunggah.')
  }
  async function saveSetting(e:FormEvent){e.preventDefault();if(!supabase||!isOwner)return;let parsed:any=settingValue;try{parsed=JSON.parse(settingValue)}catch{};const {error}=await supabase.from('site_settings').upsert({setting_key:settingKey.trim(),setting_value:parsed,updated_at:new Date().toISOString()},{onConflict:'setting_key'});if(error)setNotice('Gagal menyimpan pengaturan: '+error.message);else{setSettings(prev=>({...prev,[settingKey.trim()]:parsed}));setSettingKey('');setSettingValue('');setNotice('Pengaturan disimpan.')}}
  const openNewPortfolio=()=>setEditPortfolio({id:'sample-new',title:'',category:'Map Gunung',description:'',image_url:'',is_published:true})
  const openNewProduct=()=>setEditProduct({id:'demo-new',name:'',description:'',category:'Kit',price:0,stock:1,image_url:'',is_published:true})
  const startEditPortfolio=(p:Portfolio)=>setEditPortfolio({...p})
  const startEditProduct=(p:Product)=>setEditProduct({...p})

  return <div className="site-shell">
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <header className="topbar wrap">
      <a className="brand" href="#home" aria-label="DimV Studio home"><img src="/gift-avatar.gif" alt="DimV Studio profile"/><span><b>! DimV Studio</b><small>BUILD · CREATE · BEYOND</small></span></a>
      <button className="mobile-toggle icon-button" onClick={()=>setMobileMenu(!mobileMenu)} aria-label="Menu">{mobileMenu?<X/>:<Menu/>}</button>
      <nav className={mobileMenu?'nav-links nav-open':'nav-links'}>
        <a onClick={()=>setMobileMenu(false)} href="#home">{english?'Home':'Beranda'}</a><a onClick={()=>setMobileMenu(false)} href="#about">{english?'About':'Tentang'}</a><a onClick={()=>setMobileMenu(false)} href="#services">{english?'Services':'Layanan'}</a><a onClick={()=>setMobileMenu(false)} href="#portfolio">Portfolio</a><a onClick={()=>setMobileMenu(false)} href="#products">Products</a><a onClick={()=>setMobileMenu(false)} href="#contact">Contact</a>
      </nav>
      <div className="top-actions"><button className="language" onClick={()=>setLanguage(english?'ID':'EN')}><Globe2 size={15}/>{language}<ChevronDown size={13}/></button><button className="owner-button" onClick={()=>isOwner?setDashboardOpen(true):setLoginOpen(true)}>{isOwner?<ShieldCheck size={15}/>:<LockKeyhole size={15}/>} {isOwner?'Dashboard':'Login Owner'}</button></div>
    </header>

    {!isSupabaseConfigured&&<div className="config-warning wrap"><span className="warning-dot"/> Mode preview aktif — masukkan URL dan Publishable Key Supabase di environment variables untuk mengaktifkan login, database, dan dashboard.</div>}
    <main>
      <section id="home" className="hero wrap">
        <div className="hero-copy"><div className="eyebrow"><span className="live-dot"/>{english?'ROBLOX DEVELOPMENT STUDIO':'STUDIO PENGEMBANGAN ROBLOX'}</div><h1>Ideas into<br/><span>Reality.</span></h1><p>{english?'We build Roblox maps, systems, and custom experiences designed around your vision.':'Kami membangun map, sistem, dan pengalaman Roblox yang dirancang sesuai ide dan kebutuhanmu.'}</p><div className="hero-buttons"><a className="button-primary" href="#portfolio">{english?'Explore Our Work':'Lihat Karya Kami'} <ArrowRight size={17}/></a><a className="button-secondary" href="#contact">{english?'Start a Project':'Mulai Proyek'} <ArrowDownRight size={17}/></a></div><div className="hero-proof"><div className="avatar-stack"><img src="/gift-avatar.gif" alt=""/><span>DV</span><span>+</span></div><div><strong>Made for creators</strong><small>Custom · Detail · Community</small></div></div></div>
        <div className="hero-art"><div className="art-grid"/><div className="art-glow"/><div className="art-frame"><img src="/gift-avatar.gif" alt="DimV Studio animated gift artwork"/><div className="art-corner top-left"/><div className="art-corner bottom-right"/><span className="art-tag">FIG. 001 / DIMV STUDIO</span><span className="art-vertical">ROBLOX · DIGITAL WORLDS</span></div><div className="floating-chip chip-top"><Sparkles size={15}/> Creative engineering</div><div className="floating-chip chip-bottom"><Code2 size={15}/> Studio / 2026</div><div className="orbit orbit-a"/><div className="orbit orbit-b"/></div>
        <div className="hero-index"><span>01</span><i/><span>04</span><small>SCROLL TO EXPLORE</small></div>
      </section>

      <section id="about" className="section wrap about-section"><div className="section-kicker">01 / {english?'ABOUT THE STUDIO':'TENTANG STUDIO'}</div><div className="about-grid"><div><h2>Built with purpose.<br/><em>Made to stand out.</em></h2></div><div className="about-copy"><p>{settings.description||'! DimV Studio adalah studio pengembangan Roblox yang fokus pada pembuatan map, sistem, dan pengalaman bermain yang unik.'}</p><p className="muted">{english?'From the first concept to the final details, every project is shaped around your goals.':'Dari konsep awal hingga detail akhir, setiap proyek disusun berdasarkan tujuan dan kebutuhanmu.'}</p><a className="text-link" href="#services">{english?'What we can build':'Yang bisa kami kerjakan'} <ArrowRight size={16}/></a></div></div><div className="stats-row"><div><b>01</b><span>Custom solutions</span></div><div><b>ROBLOX</b><span>Development focus</span></div><div><b>∞</b><span>Ideas to explore</span></div><div><b>DV.</b><span>Build · Create · Beyond</span></div></div></section>

      <section id="services" className="section wrap"><div className="section-head"><div><div className="section-kicker">02 / OUR CAPABILITIES</div><h2>{english?'Services designed for your vision':'Layanan untuk idemu.'}</h2></div><p>{english?'Flexible services for creators, communities, and Roblox experiences.':'Layanan fleksibel untuk kreator, komunitas, dan pengalaman Roblox.'}</p></div><div className="services-grid">{services.map(([title,desc],i)=><article className="service-card" key={title}><div className="service-top"><span>0{i+1}</span>{i%3===0?<Layers3/>:i%3===1?<Code2/>:<Box/>}</div><h3>{title}</h3><p>{desc}</p><a href="#contact" aria-label={`Tanya tentang ${title}`}><ArrowUpRightIcon/></a></article>)}</div></section>

      <section id="portfolio" className="section wrap"><div className="section-head"><div><div className="section-kicker">03 / SELECTED PROJECTS</div><h2>{english?'Work & projects':'Karya & proyek kami.'}</h2></div><p>{english?'A selection of projects, experiments, and custom builds.':'Pilihan proyek, eksperimen, dan karya custom.'}</p></div><div className="filter-row">{categories.map(c=><button key={c} className={filter===c?'filter-pill active':'filter-pill'} onClick={()=>setFilter(c)}>{c}</button>)}</div><div className="portfolio-grid">{shownPortfolio.map((p,i)=><article className="portfolio-card" key={p.id}><div className="portfolio-image">{p.image_url?<img src={p.image_url} alt={p.title} loading="lazy"/>:<div className="image-placeholder"><ImagePlus/></div>}<span className="project-number">PROJECT / {String(i+1).padStart(2,'0')}</span><span className="project-arrow"><ArrowUpRightIcon/></span></div><div className="portfolio-info"><div><span className="card-category">{p.category}</span><h3>{p.title}</h3><p>{p.description}</p></div><span className="mini-arrow"><ArrowRight size={16}/></span></div></article>)}</div>{shownPortfolio.length===0&&<div className="empty-state">Belum ada portofolio pada kategori ini.</div>}<div className="data-note">{portfolioRowsFromDb?'Live data · Supabase':'Preview projects · Ganti dengan portofolio milikmu melalui Dashboard Owner setelah Supabase aktif.'}</div></section>

      <section id="products" className="section wrap products-section"><div className="section-head"><div><div className="section-kicker">04 / PRODUCTS & STOCK</div><h2>{english?'Tools for your next build':'Produk & layanan.'}</h2></div><p>{english?'Explore available kits and services. Contact us to confirm scope and availability.':'Lihat kit dan layanan yang tersedia. Hubungi kami untuk memastikan detail dan ketersediaan.'}</p></div><div className="products-grid">{products.map((p)=><article className="product-card" key={p.id}><div className="product-image">{p.image_url?<img src={p.image_url} alt={p.name} loading="lazy"/>:<Package/>}<span className={p.stock>0?'stock-badge':'stock-badge sold'}>{p.stock>0?'Tersedia':'Habis'}</span></div><div className="product-details"><span className="card-category">{p.category}</span><h3>{p.name}</h3><p>{p.description}</p><div className="product-bottom"><strong>{money(p.price)}</strong><a href={settings.discord_url||'#contact'} target={settings.discord_url?'_blank':undefined} rel="noreferrer">Tanya <ArrowRight size={14}/></a></div></div></article>)}</div><div className="products-foot"><span><ShieldCheck size={16}/> Detail pesanan dikonfirmasi sebelum pengerjaan.</span><a href="#contact">Cara pemesanan <ArrowRight size={15}/></a></div><div className="data-note">{productRowsFromDb?'Live data · Supabase':'Preview products · Perbarui harga dan produk lewat Dashboard Owner.'}</div></section>

      <section id="contact" className="contact-section"><div className="wrap contact-wrap"><div><div className="section-kicker">05 / LET'S BUILD SOMETHING</div><h2>{english?'Have a project in mind?':'Punya ide untuk diwujudkan?'}</h2><p>{settings.contact_text||'Ceritakan kebutuhanmu. Kita bahas konsep, fitur, dan langkah pengerjaannya.'}</p></div><div className="contact-actions"><a className="button-primary" href="https://discord.com/users/1254015885425770587" target="_blank" rel="noopener noreferrer">DM Discord 1 <ExternalLink size={16}/></a><a className="button-primary" href="https://discord.com/users/565003063178559498" target="_blank" rel="noopener noreferrer">DM Discord 2 <ExternalLink size={16}/></a><a className="button-secondary" href="#home">Kembali ke atas <ArrowDownRight size={16}/></a></div></div></section>
    </main>
    <footer className="wrap footer"><a className="footer-brand" href="#home"><img src="/gift-avatar.gif" alt=""/> ! DimV Studio</a><span>© {new Date().getFullYear()} ! DimV Studio. All rights reserved.</span><span>BUILD · CREATE · BEYOND</span></footer>

    {notice&&<div className="toast" role="status"><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Tutup"><X size={16}/></button></div>}
    {loginOpen&&<div className="modal-backdrop" onClick={()=>setLoginOpen(false)}><div className="modal login-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setLoginOpen(false)}><X/></button><img className="modal-logo" src="/gift-avatar.gif" alt="DimV Studio"/><div className="section-kicker">PRIVATE ACCESS / OWNER</div><h2>Login Dashboard</h2><p className="muted">Masuk menggunakan akun yang sudah terdaftar di Supabase Auth dan memiliki role owner/admin.</p><form onSubmit={login} className="form-stack"><label>Email<input type="email" required autoComplete="username" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} placeholder="email@domain.com"/></label><label>Password<input type="password" required autoComplete="current-password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} placeholder="Password akun"/></label><button className="button-primary full-button" disabled={busy}>{busy?'Memeriksa…':'Login Owner'} <ArrowRight size={16}/></button></form><small className="form-help">Tidak ada pendaftaran publik. Buat akun melalui Supabase Auth terlebih dahulu.</small></div></div>}

    {dashboardOpen&&isOwner&&<div className="dashboard-backdrop"><aside className="dashboard"><div className="dash-head"><a className="brand" href="#home"><img src="/gift-avatar.gif" alt=""/><span><b>! DimV Studio</b><small>OWNER CONSOLE</small></span></a><button className="icon-button" onClick={()=>setDashboardOpen(false)}><X/></button></div><div className="dash-user"><span className="owner-avatar">DV</span><div><b>{profile?.role==='owner'?'Owner':'Admin'}</b><small>{sessionEmail}</small></div><ShieldCheck className="verified" size={17}/></div><nav className="dash-nav">{([['overview','Overview'],['portfolio','Portfolio'],['products','Products'],['settings','Settings']] as const).map(([id,label])=><button key={id} className={tab===id?'dash-nav-item selected':'dash-nav-item'} onClick={()=>setTab(id)}>{id==='overview'?<Layers3/>:id==='portfolio'?<ImagePlus/>:id==='products'?<Package/>:<Settings/>}{label}<ArrowRight className="dash-nav-arrow" size={14}/></button>)}</nav><div className="dash-content">
      {tab==='overview'&&<><div className="section-kicker">DASHBOARD / OVERVIEW</div><h2>Selamat datang.</h2><p className="muted">Kelola konten publik ! DimV Studio dari satu tempat.</p><div className="dash-stats"><div><span>Portofolio dimuat</span><b>{portfolio.length}</b></div><div><span>Produk dimuat</span><b>{products.length}</b></div><div><span>Role akun</span><b>{profile?.role}</b></div></div><div className="dash-callout"><Check/><div><b>Database connected</b><p>Pastikan Row Level Security (RLS) dan Storage policies mengikuti panduan README.</p></div></div><button className="button-secondary full-button" onClick={()=>{setDashboardOpen(false);void loadPublicData()}}>Refresh data <ArrowRight size={15}/></button></>}
      {tab==='portfolio'&&<><div className="dash-title-row"><div><div className="section-kicker">CONTENT / WORK</div><h2>Portfolio</h2></div><button className="small-primary" onClick={openNewPortfolio}><Plus size={15}/> Tambah</button></div>{portfolio.map(p=><div className="manage-row" key={p.id}><img src={p.image_url||'/gift-avatar.gif'} alt=""/><div><b>{p.title}</b><small>{p.category} · {p.is_published?'Published':'Draft'}</small></div><button onClick={()=>startEditPortfolio(p)} aria-label="Edit"><Settings size={16}/></button>{!p.id.startsWith('sample-')&&<button onClick={()=>void deletePortfolio(p)} aria-label="Hapus"><Trash2 size={16}/></button>}</div>)}<p className="form-help">Jika Supabase belum aktif, data contoh hanya untuk preview dan tidak dapat disimpan.</p></>}
      {tab==='products'&&<><div className="dash-title-row"><div><div className="section-kicker">STORE / INVENTORY</div><h2>Products</h2></div><button className="small-primary" onClick={openNewProduct}><Plus size={15}/> Tambah</button></div>{products.map(p=><div className="manage-row" key={p.id}><img src={p.image_url||'/gift-avatar.gif'} alt=""/><div><b>{p.name}</b><small>{money(p.price)} · Stok {p.stock}</small></div><button onClick={()=>startEditProduct(p)} aria-label="Edit"><Settings size={16}/></button>{!p.id.startsWith('demo-')&&<button onClick={()=>void deleteProduct(p)} aria-label="Hapus"><Trash2 size={16}/></button>}</div>)}<p className="form-help">Periksa kembali harga, stok, dan deskripsi sebelum menerbitkan produk.</p></>}
      {tab==='settings'&&<><div className="section-kicker">CONFIGURATION / SITE</div><h2>Site settings</h2><p className="muted">Nilai disimpan sebagai JSONB di tabel site_settings.</p><div className="settings-current">{Object.entries(settings).map(([k,v])=><div key={k}><span>{k}</span><b>{typeof v==='string'?v:JSON.stringify(v)}</b></div>)}</div><form className="form-stack" onSubmit={saveSetting}><label>Setting key<input required value={settingKey} onChange={e=>setSettingKey(e.target.value)} placeholder="contoh: discord_url"/></label><label>Setting value<input required value={settingValue} onChange={e=>setSettingValue(e.target.value)} placeholder="Teks, URL, atau JSON"/></label><button className="button-primary full-button">Simpan pengaturan <Check size={15}/></button></form></>}
      </div><button className="dash-logout" onClick={()=>void logout()}><LogOut size={17}/> Logout</button><div className="dash-foot">SECURE AREA · ! DIMV STUDIO</div></aside><button className="dashboard-dismiss" onClick={()=>setDashboardOpen(false)} aria-label="Tutup dashboard"/></div>}

    {editPortfolio&&<div className="modal-backdrop" onClick={()=>setEditPortfolio(null)}><div className="modal editor-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setEditPortfolio(null)}><X/></button><div className="section-kicker">CONTENT / PORTFOLIO</div><h2>{editPortfolio.id.startsWith('sample-')||editPortfolio.id==='sample-new'?'Tambah portofolio':'Edit portofolio'}</h2><form className="form-stack" onSubmit={savePortfolio}><label>Judul<input required value={editPortfolio.title} onChange={e=>setEditPortfolio({...editPortfolio,title:e.target.value})}/></label><label>Kategori<input required value={editPortfolio.category} onChange={e=>setEditPortfolio({...editPortfolio,category:e.target.value})}/></label><label>Deskripsi<textarea required rows={3} value={editPortfolio.description} onChange={e=>setEditPortfolio({...editPortfolio,description:e.target.value})}/></label><label>URL gambar<input required value={editPortfolio.image_url} onChange={e=>setEditPortfolio({...editPortfolio,image_url:e.target.value})} placeholder="https://…"/></label><label className="upload-control"><Upload size={16}/>{uploading?'Mengunggah…':'Unggah gambar ke Supabase Storage'}<input type="file" accept="image/*" disabled={uploading} onChange={e=>{const f=e.target.files?.[0];if(f)void uploadImage(f,'portfolio')}}/></label><label className="checkbox-line"><input type="checkbox" checked={editPortfolio.is_published} onChange={e=>setEditPortfolio({...editPortfolio,is_published:e.target.checked})}/> Tampilkan di website publik</label><button className="button-primary full-button" disabled={busy||uploading}>{busy?'Menyimpan…':'Simpan portofolio'} <Check size={16}/></button></form></div></div>}
    {editProduct&&<div className="modal-backdrop" onClick={()=>setEditProduct(null)}><div className="modal editor-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setEditProduct(null)}><X/></button><div className="section-kicker">STORE / PRODUCT</div><h2>{editProduct.id.startsWith('demo-')||editProduct.id==='demo-new'?'Tambah produk':'Edit produk'}</h2><form className="form-stack" onSubmit={saveProduct}><label>Nama produk<input required value={editProduct.name} onChange={e=>setEditProduct({...editProduct,name:e.target.value})}/></label><label>Kategori<input required value={editProduct.category} onChange={e=>setEditProduct({...editProduct,category:e.target.value})}/></label><label>Deskripsi<textarea required rows={3} value={editProduct.description} onChange={e=>setEditProduct({...editProduct,description:e.target.value})}/></label><div className="two-fields"><label>Harga (Rp)<input type="number" min="0" required value={editProduct.price} onChange={e=>setEditProduct({...editProduct,price:Number(e.target.value)})}/></label><label>Stok<input type="number" min="0" required value={editProduct.stock} onChange={e=>setEditProduct({...editProduct,stock:Number(e.target.value)})}/></label></div><label>URL gambar<input required value={editProduct.image_url} onChange={e=>setEditProduct({...editProduct,image_url:e.target.value})} placeholder="https://…"/></label><label className="upload-control"><Upload size={16}/>{uploading?'Mengunggah…':'Unggah gambar ke Supabase Storage'}<input type="file" accept="image/*" disabled={uploading} onChange={e=>{const f=e.target.files?.[0];if(f)void uploadImage(f,'products')}}/></label><label className="checkbox-line"><input type="checkbox" checked={editProduct.is_published} onChange={e=>setEditProduct({...editProduct,is_published:e.target.checked})}/> Tampilkan di website publik</label><button className="button-primary full-button" disabled={busy||uploading}>{busy?'Menyimpan…':'Simpan produk'} <Check size={16}/></button></form></div></div>}
  </div>
}
function ArrowUpRightIcon(){return <ArrowDownRight size={17} className="arrow-up-right"/>}
