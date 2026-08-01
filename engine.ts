import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Pause, Play, RefreshCcw, Sparkles } from 'lucide-react';
import { analyze, ARCHITECTURES, colors, createGeometry, Finish, Geometry, svgFromGeometry } from './engine';

function drawGeometry(canvas:HTMLCanvasElement,g:Geometry,finish:Finish,progress=1,fabrication=false,intensity=.8){
  const dpr=Math.min(2,window.devicePixelRatio||1); const css=canvas.clientWidth||600; canvas.width=css*dpr;canvas.height=css*dpr;
  const ctx=canvas.getContext('2d')!;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,css,css);ctx.scale(css/900,css/900);
  const c=colors[finish]; if(!fabrication){ctx.fillStyle=c.bg;ctx.fillRect(0,0,900,900);} 
  const list=g.segments.filter(s=>!fabrication||['seal','architecture','core','route'].includes(s.role)); const visible=Math.ceil(list.length*progress);
  const stroke=(s:any,glow:boolean)=>{ctx.strokeStyle=s.role==='guide'?c.glow:c.line;ctx.globalAlpha=fabrication?1:(s.alpha??1);ctx.lineWidth=(fabrication?2.2:(s.width??(s.role==='seal'?1.3:1.05)))*(glow?3.2:1);ctx.shadowBlur=glow?12*intensity:0;ctx.shadowColor=c.glow;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
    if(s.kind==='circle')ctx.arc(s.pts[0].x,s.pts[0].y,s.pts[1].x,0,Math.PI*2);
    else if(s.kind==='poly'){s.pts.forEach((q:any,i:number)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();}
    else if(s.kind==='line'){s.pts.forEach((q:any,i:number)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));}
    else if(s.pts.length===3){ctx.moveTo(s.pts[0].x,s.pts[0].y);ctx.quadraticCurveTo(s.pts[1].x,s.pts[1].y,s.pts[2].x,s.pts[2].y);} else {s.pts.forEach((q:any,i:number)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));}
    ctx.stroke();ctx.globalAlpha=1;ctx.shadowBlur=0;};
  list.slice(0,visible).forEach(s=>{if(!fabrication)stroke(s,true);stroke(s,false)});
}

const slug=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ñ/g,'n').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function download(text:string,name:string,type:string){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}

function CanvasView({g,finish,progress=1,fabrication=false,intensity=.8,className=''}:{g:Geometry;finish:Finish;progress?:number;fabrication?:boolean;intensity?:number;className?:string}){
  const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{if(ref.current)drawGeometry(ref.current,g,finish,progress,fabrication,intensity)},[g,finish,progress,fabrication,intensity]);return <canvas ref={ref} className={className}/>;
}

export default function App(){
  const [input,setInput]=useState('SALVADOR'); const [name,setName]=useState('SALVADOR'); const [finish,setFinish]=useState<Finish>('gold'); const [detail,setDetail]=useState(.66);const [intensity,setIntensity]=useState(.8);const [duration,setDuration]=useState(9);const [progress,setProgress]=useState(1);const [playing,setPlaying]=useState(false);const [manualArch,setManualArch]=useState<number|null>(null);
  const metrics=useMemo(()=>{const m=analyze(name);return manualArch===null?m:{...m,architecture:manualArch}},[name,manualArch]); const g=useMemo(()=>createGeometry(metrics,900,detail),[metrics,detail]);
  useEffect(()=>{if(!playing)return;let start=performance.now();let raf=0;const loop=(t:number)=>{const p=Math.min(1,(t-start)/(duration*1000));setProgress(p);if(p<1)raf=requestAnimationFrame(loop);else setPlaying(false)};raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf)},[playing,duration,g]);
  const create=()=>{setName(input);setManualArch(null);setProgress(0);setPlaying(true)};
  const exportPng=(fabrication=false)=>{const c=document.createElement('canvas');c.style.width='900px';drawGeometry(c,g,finish,1,fabrication,intensity);c.toBlob(b=>{if(!b)return;const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`${slug(metrics.display)}-${fabrication?'fabricacion':'firma'}-${finish}.png`;a.click();URL.revokeObjectURL(a.href)},'image/png')};
  const exportSvg=()=>download(svgFromGeometry(g,finish,false),`${slug(metrics.display)}-firma.svg`,'image/svg+xml');
  const exportJson=()=>download(JSON.stringify({...metrics,architectureName:g.architecture.name,finish},null,2),`${slug(metrics.display)}-codigo.json`,'application/json');
  const examples=['ANA','ALEJANDRO','MARÍA','SALVADOR SING','IXCHEL'];
  return <main>
    <header className="hero"><div className="brand"><div className="logo">HN</div><div><h1>HARMONIA NOMEN</h1><p>LENGUAJE GEOMÉTRICO · 27 LETRAS · 14 ARQUITECTURAS</p></div></div><div className="author">SALVADOR SING VÁZQUEZ · NEXUS ZERO</div></header>
    <section className="intro panel"><div><span className="eyebrow">EL NOMBRE NO SE ESCRIBE. SE CONSTRUYE.</span><h2>Una firma geométrica personal, reproducible y fabricable.</h2><p>Cada nombre activa una arquitectura maestra y la transforma sin destruir su silueta. El resultado combina proporción, secuencia, repetición y orden.</p></div><div className="examples">{examples.map(x=>{const ex=createGeometry(analyze(x),900,.6);return <button key={x} onClick={()=>{setInput(x);setName(x);setManualArch(null)}}><CanvasView g={ex} finish="gold"/><span>{x}</span></button>})}</div></section>
    <section className="creator-grid">
      <aside className="panel architecture-bank"><div className="panel-title">14 ARQUITECTURAS MAESTRAS</div>{ARCHITECTURES.map(a=><button className={metrics.architecture===a.id?'active':''} key={a.id} onClick={()=>setManualArch(a.id)}><b>{String(a.id+1).padStart(2,'0')}</b><span>{a.name}<small>{a.description}</small></span></button>)}</aside>
      <section className="panel studio"><div className="input-row"><label>NOMBRE COMPLETO<input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&create()} aria-label="Nombre completo"/></label><button className="primary" onClick={create}><Sparkles size={18}/> CREAR MI FIRMA</button></div>
        <div className="metrics">{[['LETRAS',metrics.length],['SUMA',metrics.sum],['RAÍZ',metrics.root],['VOCALES',metrics.vowels],['ÚNICAS',metrics.unique],['EJES',metrics.axes]].map(([k,v])=><div key={k}><span>{k}</span><b>{v}</b></div>)}</div>
        <div className="canvas-head"><div><span className="eyebrow">FIRMA CEREMONIAL</span><h3>{g.architecture.name}</h3></div><code>{metrics.id}</code></div>
        <CanvasView g={g} finish={finish} progress={progress} intensity={intensity} className="main-canvas"/>
        <div className="playbar"><button onClick={()=>setPlaying(!playing)}>{playing?<Pause size={18}/>:<Play size={18}/>} {playing?'PAUSAR':'REPRODUCIR'}</button><button onClick={()=>{setProgress(0);setPlaying(true)}}><RefreshCcw size={18}/> REINICIAR</button><span>{duration}s</span></div>
      </section>
      <aside className="panel pendant-card"><div className="panel-title">ASÍ SE VE TU FIRMA EN TU COLGANTE</div><div className="pendant-scene"><div className="chain"></div><div className="bail"></div><div className="pendant"><div className="pendant-inner"><CanvasView g={g} finish={finish} fabrication intensity={.25}/></div></div></div><p>Versión simplificada con líneas principales, núcleo y ruta esencial. Preparada para grabado o esmalte.</p><button className="primary wide" onClick={()=>exportPng(true)}><Download size={18}/> DESCARGAR DISEÑO DE FABRICACIÓN</button></aside>
    </section>
    <section className="lower-grid"><div className="panel reading"><div className="panel-title">LECTURA MATEMÁTICA DEL PATRÓN</div><div className="reading-grid"><div><span>ARQUITECTURA</span><b>{g.architecture.name}</b><p>{g.architecture.description}</p></div><div><span>ADN NOMINAL</span><code>{metrics.dna}</code><p>{metrics.initialFamily===metrics.finalFamily?'Firma cerrada: inicio y final comparten familia.':'Firma evolutiva: inicia y termina en familias distintas.'}</p></div><div><span>BALANCE</span><b>{metrics.ratio>.5?'ORGÁNICO':metrics.ratio>.38?'MIXTO':'ESTRUCTURAL'}</b><p>{metrics.vowels} vocales y {metrics.consonants} consonantes.</p></div><div><span>REPETICIONES</span><b>{Object.values(metrics.repeats).filter(v=>v>1).length}</b><p>Las repeticiones generan órbitas discretas.</p></div></div></div>
      <div className="panel controls"><div className="panel-title">CONTROLES ARTÍSTICOS</div><label>DETALLE<input type="range" min=".4" max=".82" step=".01" value={detail} onChange={e=>setDetail(+e.target.value)}/></label><label>INTENSIDAD<input type="range" min=".2" max="1" step=".01" value={intensity} onChange={e=>setIntensity(+e.target.value)}/></label><label>DURACIÓN<select value={duration} onChange={e=>setDuration(+e.target.value)}><option>6</option><option>9</option><option>14</option></select></label><div className="swatches">{(['gold','cyan','green','black'] as Finish[]).map(f=><button key={f} aria-label={`Color ${f}`} onClick={()=>setFinish(f)} className={finish===f?'selected':''} style={{background:colors[f].line}}/>)}</div></div>
      <div className="panel exports"><div className="panel-title">EXPORTAR</div><button onClick={()=>exportPng(false)}>PNG CEREMONIAL</button><button onClick={()=>exportPng(true)}>PNG FABRICACIÓN</button><button onClick={exportSvg}>SVG VECTORIAL</button><button onClick={exportJson}>JSON TÉCNICO</button></div></section>
    <footer><div className="logo small">HN</div><div><b>HARMONIA NOMEN</b><span>La geometría se convierte en identidad.</span></div><small>© 2026 SALVADOR SING VÁZQUEZ · NEXUS ZERO</small></footer>
  </main>
}
