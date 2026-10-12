import { useState, useRef, useEffect } from 'react';
import html2pdf from 'html2pdf.js';

/* ─── Constants ──────────────────────────────────────────────── */
const ANALISTAS_LIST=['Analista 1','Analista 2','Analista 3','Analista 4','Analista 5','Analista 6','Analista 7','Analista 8'];
const CLIENTES=['Cliente 1','Cliente 2','Cliente 3','Cliente 4','Cliente 5','Cliente 6','Cliente 7'];
const CLIENTE_COLORS={'Cliente 3':{color:'#7B8FD4',bg:'#1A1E35',border:'#404E93'},'Cliente 1':{color:'#009EE2',bg:'#001F30',border:'#009EE2'},'Cliente 2':{color:'#00C4CC',bg:'#001E20',border:'#00585F'},'Cliente 4':{color:'#9B6BA8',bg:'#1C0E1C',border:'#53284F'},'Cliente 6':{color:'#75C11F',bg:'#0F1F00',border:'#75C11F'},'Cliente 5':{color:'#F87171',bg:'#2D0A0A',border:'#F87171'},'Cliente 7':{color:'#EE6F29',bg:'#2A1200',border:'#EE6F29'}};
const TURNOS=[{label:'Matutino',hora:'07:00 – 15:00',saludo:'Buenos días',codigo:'TM'},{label:'Vespertino',hora:'15:00 – 22:00',saludo:'Buenas tardes',codigo:'TV'},{label:'Nocturno',hora:'22:00 – 07:00',saludo:'Buenas noches',codigo:'TN'}];
const URGENCIAS=['Alta','Media','Baja'];
const IMPACTOS=['Informativo','Administrativo','Operativo','Seguridad'];
const RESPONSABLES_BASE=['Cliente','CTI','SOC','Otro'];
const RECOMENDACIONES=['Tuning','Excluir','Ajustar severidad','Documentar'];
const CORREOS_PRINCIPALES=[{email:'destinatario1@ejemplo.com',nombre:'Destinatario 1'},{email:'destinatario2@ejemplo.com',nombre:'Destinatario 2'},{email:'destinatario3@ejemplo.com',nombre:'Destinatario 3'},{email:'destinatario4@ejemplo.com',nombre:'Destinatario 4'}];
const emptyPend=()=>({pendiente:'',impacto:'',urgencia:'Baja',responsable:'SOC',responsableOtro:'',fechaHora:'',estatus:'',comentarios:''});
const emptyFT=()=>({cliente:'',regla:'',descripcion:'',recomendacion:'Tuning',accion:'',notas:''});
const esc=(s:any)=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

/* ─── Palette ────────────────────────────────────────────────── */
const C={bg:'#1F1F1F',surface:'#262626',card:'#2B2B2B',cardBorder:'#3A3A3A',accent:'#F24C00',accentDim:'#E04600',accentBg:'#3A1D0F',text:'#F5F5F5',textMuted:'#A6A6A6',textDim:'#6B6B6B',success:'#22A06B',successBg:'#0E2A1E',danger:'#EF4444',dangerBg:'#2D0F0F',warn:'#E5A50A',warnBg:'#2D2304',inputBg:'#1A1A1A',inputBorder:'#3A3A3A',calRed:'#F24C00',calRedDark:'#5C2208',calRedBright:'#FF6B26',dropBg:'#1C1C1C',dropHover:'#333333'};
const IPT={width:'100%',boxSizing:'border-box',padding:'7px 10px',border:`1px solid ${C.inputBorder}`,borderRadius:6,background:C.inputBg,color:C.text,fontSize:13,outline:'none'};
const LBL={fontSize:11,color:C.textMuted,display:'block',marginBottom:3,textTransform:'uppercase',letterSpacing:'0.04em'};
const CARD={background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:10,padding:'1rem 1.25rem',marginBottom:12};
const H2S={fontSize:14,fontWeight:500,color:C.text,marginBottom:12,display:'flex',alignItems:'center',gap:8};
const pill=(active,col=C.accent,bg=C.accentBg)=>({padding:'4px 12px',borderRadius:20,fontSize:12,border:`1px solid ${active?col:C.inputBorder}`,background:active?bg:C.inputBg,color:active?col:C.textMuted,cursor:'pointer',fontWeight:active?500:400});
const urgColor=(u)=>u==='Alta'?C.danger:u==='Media'?C.warn:C.success;
const urgBg=(u)=>u==='Alta'?C.dangerBg:u==='Media'?C.warnBg:C.successBg;
const cliStyle=(c)=>CLIENTE_COLORS[c]||{color:C.accent,bg:C.accentBg,border:C.accent};
const LOGO_URL='';
const LOGO_APP_URL='';

/* ─── Calendar helpers ───────────────────────────────────────── */
const DIAS_SEMANA=['Do','Lu','Ma','Mi','Ju','Vi','Sá'];
const MESES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const isoToDate=(iso)=>{if(!iso)return null;const d=new Date(iso);return isNaN(d)?null:d;};
const dateToIso=(d,h,m)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
const displayDT=(iso)=>{if(!iso)return'';const d=new Date(iso);if(isNaN(d))return iso;return`${d.getDate()} ${MESES[d.getMonth()].slice(0,3)} ${d.getFullYear()}  ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;};

/* ═══════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function ScrollColumn({items,selected,onSelect,width=52}){
  const ref=useRef(null);const ITEM_H=36;
  useEffect(()=>{const i=items.indexOf(selected);if(ref.current&&i>=0)ref.current.scrollTop=i*ITEM_H;},[selected,items]);
  return(
    <div style={{position:'relative',width}}>
      <div onClick={()=>{const i=items.indexOf(selected);if(i>0)onSelect(items[i-1]);}} style={{display:'flex',justifyContent:'center',alignItems:'center',height:22,cursor:'pointer',color:C.calRedBright,fontSize:14,background:'#161616',userSelect:'none'}}>▲</div>
      <div ref={ref} className="cal-scroll" style={{height:ITEM_H*4,overflowY:'scroll',scrollBehavior:'smooth'}}>
        <div style={{height:ITEM_H}}/>
        {items.map(item=>{const sel=item===selected;return(<div key={item} onClick={()=>onSelect(item)} style={{height:ITEM_H,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:13,fontWeight:sel?700:400,background:sel?C.calRed:'transparent',color:sel?'#fff':C.text,borderRadius:6,margin:'0 4px',transition:'background 0.12s'}}>{item}</div>);})}
        <div style={{height:ITEM_H*3}}/>
      </div>
      <div onClick={()=>{const i=items.indexOf(selected);if(i<items.length-1)onSelect(items[i+1]);}} style={{display:'flex',justifyContent:'center',alignItems:'center',height:22,cursor:'pointer',color:C.calRedBright,fontSize:14,background:'#161616',userSelect:'none'}}>▼</div>
    </div>
  );
}

function CustomDateTimePicker({value,onChange,label,required,timeOnly=false,minIso=null}){
  const [open,setOpen]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h);},[]);
  const now=new Date();const minDate=minIso?isoToDate(minIso):null;
  const getSelH=()=>{if(timeOnly&&value){const parts=value.split(':');return parseInt(parts[0])||0;}const p=isoToDate(value);return p?p.getHours():now.getHours();};
  const getSelM=()=>{if(timeOnly&&value){const parts=value.split(':');return parseInt(parts[1])||0;}const p=isoToDate(value);return p?p.getMinutes():0;};
  const selH=getSelH(),selM=getSelM();
  const parsed=timeOnly?null:isoToDate(value);const selDate=parsed||now;
  const [vy,setVy]=useState(selDate.getFullYear());const [vm,setVm]=useState(selDate.getMonth());
  const HOURS=Array.from({length:24},(_,i)=>String(i).padStart(2,'0'));
  const MINS=Array.from({length:60},(_,i)=>String(i).padStart(2,'0'));
  const selHStr=String(selH).padStart(2,'0'),selMStr=String(selM).padStart(2,'0');
  const emit=(d,h,m)=>{if(timeOnly){onChange(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);return;}onChange(dateToIso(d,h,m));};
  const pickDay=(day)=>{const nd=new Date(vy,vm,day);if(minDate){const mm=new Date(minDate.getFullYear(),minDate.getMonth(),minDate.getDate());if(nd<mm)return;}emit(nd,selH,selM);};
  const pickH=(hStr)=>{const h=parseInt(hStr);let m=selM;if(minDate&&!timeOnly){const t=new Date(selDate.getFullYear(),selDate.getMonth(),selDate.getDate(),h,m);if(t<minDate){if(h<minDate.getHours())return;m=minDate.getMinutes();}}emit(selDate,h,m);};
  const pickM=(mStr)=>emit(selDate,selH,parseInt(mStr));
  const firstDay=new Date(vy,vm,1).getDay(),dim=new Date(vy,vm+1,0).getDate();
  const isDis=(day)=>{if(!minDate)return false;const d=new Date(vy,vm,day),mm=new Date(minDate.getFullYear(),minDate.getMonth(),minDate.getDate());return d<mm;};
  return(
    <div ref={ref} style={{position:'relative'}}>
      {label&&<label style={LBL}>{label}{required?' *':''}</label>}
      <div onClick={()=>setOpen(o=>!o)} style={{...IPT,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',border:`1px solid ${open?C.calRed:C.inputBorder}`}}>
        <span style={{color:value?C.text:C.textDim}}>{timeOnly?(value||'HH:MM'):(displayDT(value)||'Seleccionar fecha y hora')}</span>
        <span style={{fontSize:12,color:C.calRed,marginLeft:6}}>📅</span>
      </div>
      {open&&(
        <div style={{position:'absolute',zIndex:9999,top:'100%',left:0,marginTop:4,background:'#1A1A1A',border:`1px solid ${C.calRedDark}`,borderRadius:12,boxShadow:'0 12px 40px rgba(0,0,0,0.85)',display:'flex',overflow:'hidden',minWidth:timeOnly?180:430}}>
          {!timeOnly&&(
            <div style={{padding:'14px 12px 10px',borderRight:`1px solid ${C.calRedDark}`}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <button onClick={()=>{const d=new Date(vy,vm-1,1);setVm(d.getMonth());setVy(d.getFullYear());}} style={{background:'none',border:'none',color:C.calRedBright,cursor:'pointer',fontSize:18,padding:'0 6px',lineHeight:1}}>‹</button>
                <span style={{color:C.text,fontWeight:600,fontSize:13}}>{MESES[vm]} {vy}</span>
                <button onClick={()=>{const d=new Date(vy,vm+1,1);setVm(d.getMonth());setVy(d.getFullYear());}} style={{background:'none',border:'none',color:C.calRedBright,cursor:'pointer',fontSize:18,padding:'0 6px',lineHeight:1}}>›</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,32px)',gap:2,marginBottom:4}}>{DIAS_SEMANA.map(d=><div key={d} style={{textAlign:'center',fontSize:10,color:'#7A7A7A',fontWeight:700,padding:'2px 0'}}>{d}</div>)}</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,32px)',gap:2}}>
                {Array(firstDay).fill(null).map((_,i)=><div key={'e'+i}/>)}
                {Array(dim).fill(null).map((_,i)=>{const day=i+1,iT=day===now.getDate()&&vm===now.getMonth()&&vy===now.getFullYear(),iS=parsed&&day===parsed.getDate()&&vm===parsed.getMonth()&&vy===parsed.getFullYear()&&value,dis=isDis(day);return(<div key={day} onClick={()=>!dis&&pickDay(day)} style={{width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:6,cursor:dis?'not-allowed':'pointer',fontSize:12,fontWeight:iS?700:400,background:iS?C.calRed:iT?'#2E1508':'transparent',color:dis?'#3A3A3A':iS?'#fff':iT?C.calRedBright:C.text,border:iT&&!iS?`1px solid ${C.calRedDark}`:'1px solid transparent',opacity:dis?0.35:1}} onMouseEnter={e=>{if(!iS&&!dis)e.currentTarget.style.background=C.calRedDark;}} onMouseLeave={e=>{if(!iS&&!dis)e.currentTarget.style.background=iT?'#2E1508':'transparent';}}>{day}</div>);})}
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
                <button onClick={()=>onChange('')} style={{background:'none',border:'none',color:C.calRedBright,cursor:'pointer',fontSize:12}}>Borrar</button>
                <button onClick={()=>{const t=new Date();setVm(t.getMonth());setVy(t.getFullYear());pickDay(t.getDate());}} style={{background:'none',border:'none',color:C.calRedBright,cursor:'pointer',fontSize:12}}>Hoy</button>
              </div>
            </div>
          )}
          <div style={{display:'flex',background:'#161616',padding:'8px 4px'}}>
            <div><div style={{textAlign:'center',fontSize:10,color:'#7A7A7A',fontWeight:700,marginBottom:4,paddingTop:2}}>HH</div><ScrollColumn items={HOURS} selected={selHStr} onSelect={pickH} width={52}/></div>
            <div style={{width:1,background:C.calRedDark,margin:'0 4px'}}/>
            <div><div style={{textAlign:'center',fontSize:10,color:'#7A7A7A',fontWeight:700,marginBottom:4,paddingTop:2}}>MM</div><ScrollColumn items={MINS} selected={selMStr} onSelect={pickM} width={52}/></div>
            <div style={{display:'flex',alignItems:'flex-end',paddingBottom:22,paddingLeft:6}}>
              <button onClick={()=>setOpen(false)} style={{background:C.calRed,border:'none',color:'#fff',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:12,fontWeight:700,boxShadow:'0 2px 10px rgba(242,76,0,0.45)'}}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function CustomTimePicker({value,onChange,label,required}){return <CustomDateTimePicker value={value} onChange={onChange} label={label} required={required} timeOnly/>;}

function CustomDatePicker({value,onChange,label,required}){
  const [open,setOpen]=useState(false);const ref=useRef(null);
  useEffect(()=>{const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h);},[]);
  const now=new Date();const parsed=value?new Date(value+'T00:00:00'):now;
  const [vy,setVy]=useState(parsed.getFullYear());const [vm,setVm]=useState(parsed.getMonth());
  const firstDay=new Date(vy,vm,1).getDay(),dim=new Date(vy,vm+1,0).getDate();
  const selY=value?parseInt(value.slice(0,4)):-1,selMo=value?parseInt(value.slice(5,7))-1:-1,selD=value?parseInt(value.slice(8,10)):-1;
  const pickDay=(day)=>{onChange(`${vy}-${String(vm+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`);setOpen(false);};
  const displayVal=()=>{if(!value)return'';const d=new Date(value+'T00:00:00');return`${d.getDate()} ${MESES[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;};
  return(
    <div ref={ref} style={{position:'relative'}}>
      {label&&<label style={LBL}>{label}{required?' *':''}</label>}
      <div onClick={()=>setOpen(o=>!o)} style={{...IPT,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',border:`1px solid ${open?C.calRed:C.inputBorder}`}}>
        <span style={{color:value?C.text:C.textDim}}>{displayVal()||'Seleccionar fecha'}</span>
        <span style={{fontSize:12,color:C.calRed}}>📅</span>
      </div>
      {open&&(
        <div style={{position:'absolute',zIndex:9999,top:'100%',left:0,marginTop:4,background:'#1A1A1A',border:`1px solid ${C.calRedDark}`,borderRadius:12,boxShadow:'0 12px 40px rgba(0,0,0,0.85)',padding:'14px 12px 10px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <button onClick={()=>{const d=new Date(vy,vm-1,1);setVm(d.getMonth());setVy(d.getFullYear());}} style={{background:'none',border:'none',color:C.calRedBright,cursor:'pointer',fontSize:18,padding:'0 6px',lineHeight:1}}>‹</button>
            <span style={{color:C.text,fontWeight:600,fontSize:13}}>{MESES[vm]} {vy}</span>
            <button onClick={()=>{const d=new Date(vy,vm+1,1);setVm(d.getMonth());setVy(d.getFullYear());}} style={{background:'none',border:'none',color:C.calRedBright,cursor:'pointer',fontSize:18,padding:'0 6px',lineHeight:1}}>›</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,32px)',gap:2,marginBottom:4}}>{DIAS_SEMANA.map(d=><div key={d} style={{textAlign:'center',fontSize:10,color:'#7A7A7A',fontWeight:700}}>{d}</div>)}</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,32px)',gap:2}}>
            {Array(firstDay).fill(null).map((_,i)=><div key={'e'+i}/>)}
            {Array(dim).fill(null).map((_,i)=>{const day=i+1,iT=day===now.getDate()&&vm===now.getMonth()&&vy===now.getFullYear(),iS=day===selD&&vm===selMo&&vy===selY;return(<div key={day} onClick={()=>pickDay(day)} style={{width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:iS?700:400,background:iS?C.calRed:iT?'#2E1508':'transparent',color:iS?'#fff':iT?C.calRedBright:C.text,border:iT&&!iS?`1px solid ${C.calRedDark}`:'1px solid transparent'}} onMouseEnter={e=>{if(!iS)e.currentTarget.style.background=C.calRedDark;}} onMouseLeave={e=>{if(!iS)e.currentTarget.style.background=iT?'#2E1508':'transparent';}}>{day}</div>);})}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
            <button onClick={()=>{onChange('');setOpen(false);}} style={{background:'none',border:'none',color:C.calRedBright,cursor:'pointer',fontSize:12}}>Borrar</button>
            <button onClick={()=>{const t=new Date();setVm(t.getMonth());setVy(t.getFullYear());pickDay(t.getDate());}} style={{background:'none',border:'none',color:C.calRedBright,cursor:'pointer',fontSize:12}}>Hoy</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CSelect({value,onChange,options,label,required,placeholder='— Seleccionar —',accentColor=C.accent}){
  const [open,setOpen]=useState(false);const ref=useRef(null);
  useEffect(()=>{const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h);},[]);
  const norm=(o)=>typeof o==='string'?{value:o,label:o}:o;
  const normed=options.map(norm);
  const displayLabel=normed.find(o=>o.value===value)?.label||(value||'');
  return(
    <div ref={ref} style={{position:'relative',width:'100%'}}>
      {label&&<label style={LBL}>{label}{required?' *':''}</label>}
      <div onClick={()=>setOpen(o=>!o)} style={{...IPT,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',background:C.dropBg,border:`1px solid ${open?accentColor:C.inputBorder}`,transition:'border-color 0.2s'}}>
        <span style={{color:value?C.text:C.textDim,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{displayLabel||placeholder}</span>
        <span style={{color:accentColor,fontSize:10,marginLeft:8,transform:open?'rotate(180deg)':'rotate(0)',transition:'transform 0.2s',flexShrink:0}}>▼</span>
      </div>
      {open&&(
        <div style={{position:'absolute',zIndex:9999,top:'100%',left:0,right:0,marginTop:3,background:C.dropBg,border:`1px solid ${accentColor}`,borderRadius:8,boxShadow:'0 8px 28px rgba(0,0,0,0.7)',overflow:'hidden',maxHeight:260,overflowY:'auto'}} className="cal-scroll">
          <div onClick={()=>{onChange('');setOpen(false);}} style={{padding:'9px 14px',fontSize:13,cursor:'pointer',color:!value?C.calRedBright:C.textDim,background:!value?'rgba(242,76,0,0.12)':'transparent',borderBottom:`1px solid ${C.inputBorder}`}} onMouseEnter={e=>{if(value)e.currentTarget.style.background=C.dropHover;}} onMouseLeave={e=>{if(value)e.currentTarget.style.background='transparent';}}>{placeholder}</div>
          {normed.map(o=>{const sel=o.value===value;return(<div key={o.value} onClick={()=>{onChange(o.value);setOpen(false);}} style={{padding:'9px 14px',fontSize:13,cursor:'pointer',color:sel?'#fff':C.text,background:sel?C.calRed:'transparent',borderBottom:`1px solid ${C.inputBorder}`,fontWeight:sel?600:400,transition:'background 0.12s'}} onMouseEnter={e=>{if(!sel)e.currentTarget.style.background=C.dropHover;}} onMouseLeave={e=>{if(!sel)e.currentTarget.style.background='transparent';}}>{o.label}</div>);})}
        </div>
      )}
    </div>
  );
}

/* ── Notas con múltiples entradas retráctiles ────────────────── */
// Recibe: notas (string con separador |||), setNotas, notasExpanded, setNotasExpanded
function NotasBlock({notas,setNotas,notasExpanded,setNotasExpanded}){
  const arr=notas?notas.split('|||'):[''];
  return(
    <div>
      {arr.map((nota,i)=>(
        <div key={i} style={{marginBottom:8,border:`1px solid ${C.inputBorder}`,borderRadius:8,overflow:'hidden'}}>
          <div onClick={()=>setNotasExpanded((p:any)=>({...p,[i]:!p[i]}))}
            style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',background:C.inputBg,cursor:'pointer',userSelect:'none'}}>
            <span style={{fontSize:12,color:C.textMuted}}>
              Nota #{i+1}{nota.trim()?` — ${nota.trim().slice(0,40)}${nota.trim().length>40?'...':''}` : ''}
            </span>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {arr.length>1&&(
                <span onClick={e=>{e.stopPropagation();const a=[...arr];a.splice(i,1);setNotas(a.join('|||'));setNotasExpanded((p:any)=>{const n:any={};Object.keys(p).forEach(k=>{if(+k<i)n[k]=p[k];else if(+k>i)n[+k-1]=p[k];});return n;});}}
                  style={{fontSize:11,color:C.danger,cursor:'pointer',fontWeight:700}}>✕</span>
              )}
              <span style={{fontSize:11,color:C.textDim,display:'inline-block',transform:notasExpanded[i]!==false?'rotate(180deg)':'rotate(0)',transition:'transform 0.2s'}}>▼</span>
            </div>
          </div>
          {notasExpanded[i]!==false&&(
            <textarea value={nota} onChange={e=>{const a=[...arr];a[i]=e.target.value;setNotas(a.join('|||'));}} rows={3}
              style={{...IPT,resize:'vertical',borderRadius:0,border:'none',borderTop:`1px solid ${C.inputBorder}`}}
              placeholder="Observaciones del turno..."/>
          )}
        </div>
      ))}
      <button onClick={()=>{setNotas(notas?notas+'|||':'');setNotasExpanded((p:any)=>({...p,[arr.length]:true}));}}
        style={{padding:'5px 12px',cursor:'pointer',fontSize:12,color:C.accent,border:`1px solid ${C.accent}`,background:'transparent',borderRadius:6}}>
        + Nueva nota
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REPORTE PREVIEW
   ═══════════════════════════════════════════════════════════════ */
function ReportePreview(p){
  const pends=p.pendientes.filter((pd:any)=>pd.pendiente.trim());
  const fts=p.fineTuning.filter((ft:any)=>ft.regla.trim());
  const notasArr=p.notas?p.notas.split('|||').filter((n:string)=>n.trim()):[];
  return(
    <div style={{width:'100%',boxSizing:'border-box',overflow:'hidden'}}>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14,alignItems:'center'}}>
        <button onClick={p.enviarTodo} disabled={p.enviando}
          style={{padding:'8px 22px',cursor:p.enviando?'not-allowed':'pointer',background:p.correoExito?C.success:p.enviando?'#555555':C.accentDim,border:'none',color:'#fff',fontWeight:600,borderRadius:6,fontSize:13,opacity:p.enviando?0.75:1}}>
          {p.enviando?'⏳ Enviando...':p.correoExito?'✓ Enviada':'🚀 Enviar bitácora'}
        </button>
        <button onClick={p.descargarPDF} style={{padding:'8px 14px',cursor:'pointer',background:'transparent',border:`1px solid ${C.inputBorder}`,color:C.textMuted,borderRadius:6,fontSize:13}}>Vista PDF</button>
        <button onClick={()=>p.setSeccion('entrega')} style={{padding:'8px 14px',cursor:'pointer',background:'transparent',border:`1px solid ${C.inputBorder}`,color:C.textMuted,borderRadius:6,fontSize:13}}>← Editar</button>
        <button onClick={p.nuevaBitacora} style={{padding:'8px 14px',cursor:'pointer',background:'transparent',border:`1px solid ${C.inputBorder}`,color:C.textMuted,borderRadius:6,fontSize:13}}>Nueva bitácora</button>
      </div>
      {p.correoExito&&<div style={{background:C.successBg,border:`1px solid ${C.success}`,borderRadius:8,padding:'8px 14px',marginBottom:8,fontSize:12,color:C.success}}>✓ Bitácora enviada por correo.</div>}
      {p.correoError&&<div style={{background:C.dangerBg,border:`1px solid ${C.danger}`,borderRadius:8,padding:'8px 14px',marginBottom:8,fontSize:12,color:C.danger}}>⚠ {p.correoError}</div>}

      <div className="rep-grid" style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 300px',gap:14,alignItems:'start'}}>
        <div style={{minWidth:0}}>
          <div style={CARD}>
            <p style={{...H2S,color:C.accent}}>📌 Pendientes</p>
            {pends.length===0?<span style={{fontSize:12,color:C.textMuted,fontStyle:'italic'}}>Sin pendientes para el siguiente turno.</span>:pends.map((pd:any,i:number)=>(
              <div key={i} style={{marginBottom:8,padding:'10px 12px',background:C.inputBg,borderRadius:8,borderLeft:`3px solid ${urgColor(pd.urgencia)}`}}>
                <div style={{display:'flex',justifyContent:'space-between',gap:8,marginBottom:4}}>
                  <span style={{fontSize:13,fontWeight:500,color:C.text,textAlign:'left'}}>{pd.pendiente}</span>
                  <span style={{fontSize:11,padding:'1px 8px',borderRadius:10,background:urgBg(pd.urgencia),color:urgColor(pd.urgencia),height:'fit-content'}}>{pd.urgencia}</span>
                </div>
                <div style={{fontSize:11,color:C.textMuted,display:'flex',gap:12,flexWrap:'wrap'}}>
                  {pd.impacto&&<span>Impacto: <strong style={{color:C.text}}>{pd.impacto}</strong></span>}
                  <span>Responsable: <strong style={{color:C.text}}>{pd.responsable==='Otro'?(pd.responsableOtro||'Otro'):pd.responsable}</strong></span>
                  {pd.fechaHora&&<span>Compromiso: <strong style={{color:C.text}}>{displayDT(pd.fechaHora)}</strong></span>}
                  {pd.estatus&&<span>Estatus: <strong style={{color:C.text}}>{pd.estatus}</strong></span>}
                </div>
                {pd.comentarios&&<div style={{fontSize:11,color:C.textMuted,marginTop:4,textAlign:'left'}}>{pd.comentarios}</div>}
              </div>
            ))}
          </div>

          {fts.length>0&&(
            <div style={CARD}>
              <p style={{...H2S,color:C.accent}}>🔧 Fine Tuning</p>
              {fts.map((ft:any,i:number)=>{const cl=cliStyle(ft.cliente);return(
                <div key={i} style={{marginBottom:8,padding:'10px 12px',background:C.inputBg,borderRadius:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',gap:8,marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:500,color:C.text,textAlign:'left'}}>{ft.regla}</span>
                    {ft.cliente&&<span style={{fontSize:11,padding:'1px 8px',borderRadius:10,background:cl.bg,color:cl.color,border:`1px solid ${cl.border}`,height:'fit-content',whiteSpace:'nowrap'}}>{ft.cliente}</span>}
                  </div>
                  <div style={{fontSize:11,color:C.textMuted,display:'flex',gap:12,flexWrap:'wrap'}}>
                    {ft.descripcion&&<span>{ft.descripcion}</span>}
                    <span>Recomendación: <strong style={{color:C.text}}>{ft.recomendacion}</strong></span>
                    {ft.accion&&<span>Acción: <strong style={{color:C.text}}>{ft.accion}</strong></span>}
                    {ft.notas&&<span>Notas: <strong style={{color:C.text}}>{ft.notas}</strong></span>}
                  </div>
                </div>
              );})}
            </div>
          )}

          {notasArr.length>0&&(
            <div style={CARD}>
              <p style={{...H2S,color:C.accent}}>📝 Notas generales</p>
              {notasArr.map((n:string,i:number)=>(<p key={i} style={{fontSize:12,color:C.text,marginBottom:6,textAlign:'left',whiteSpace:'pre-wrap'}}><strong style={{color:C.textMuted}}>Nota {i+1}:</strong> {n.trim()}</p>))}
            </div>
          )}

          <div style={CARD}>
            <p style={{...H2S,color:C.accent}}>📧 Correo</p>
            <div style={{fontSize:12,color:C.textMuted,marginBottom:6,textAlign:'left'}}>Para: <span style={{color:C.text}}>{p.toFinal||'—'}</span></div>
            <div style={{fontSize:12,color:C.textMuted,marginBottom:8,textAlign:'left'}}>Asunto: <span style={{color:C.text}}>{p.asunto}</span></div>
            <textarea value={p.cuerpoCorreo} onChange={e=>p.setCuerpoCorreo(e.target.value)} rows={6} style={{...IPT,resize:'vertical',fontFamily:'monospace',fontSize:12,lineHeight:1.7}}/>
            <button onClick={p.copiarTexto} style={{marginTop:8,fontSize:12,padding:'4px 12px',borderRadius:6,border:`1px solid ${p.copiado?C.success:C.inputBorder}`,background:p.copiado?C.successBg:C.inputBg,color:p.copiado?C.success:C.textMuted,cursor:'pointer'}}>{p.copiado?'✓ Copiado':'Copiar texto'}</button>
          </div>
        </div>

        <div style={{position:'sticky',top:12,minWidth:0}}>
          <div style={{...CARD,border:`1px solid ${C.accent}`}}>
            <p style={{...H2S,color:C.accent}}>🤝 Entrega de turno</p>
            <div style={{display:'flex',flexDirection:'column',gap:6,fontSize:12}}>
              {[['Fecha',p.fecha],['Turno',`${TURNOS[p.turno].label} · ${TURNOS[p.turno].hora}`],['Hora de entrega',p.horaEntrega||'—'],['Saliente',p.saliente||'—'],['Entrante',p.entrante||'—'],['Pendientes',pends.length],['Reglas FT',fts.length]].map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',gap:8,padding:'4px 0',borderBottom:`1px solid ${C.cardBorder}`}}>
                  <span style={{color:C.textMuted}}>{k}</span><span style={{color:C.text,fontWeight:500,textAlign:'right'}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════ */
export default function App(){
  const [seccion,setSeccion]=useState('pendientes');
  // Entrega de turno
  const [fecha,setFecha]=useState(()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;});
  const [turno,setTurno]=useState(0);
  const [saliente,setSaliente]=useState('');
  const [entrante,setEntrante]=useState('');
  const [notas,setNotas]=useState('');
  const [notasExpanded,setNotasExpanded]=useState<Record<number,boolean>>({0:true});
  const [horaEntrega,setHoraEntrega]=useState('');
  const [cuerpoCorreo,setCuerpoCorreo]=useState('');
  const [destinosSel,setDestinosSel]=useState<string[]>(()=>CORREOS_PRINCIPALES.filter(c=>c.email!=='destinatario4@ejemplo.com').map(c=>c.email));
  const [correoExtraTo,setCorreoExtraTo]=useState('');
  const [correosExtraTo,setCorreosExtraTo]=useState<string[]>([]);
  // Pendientes
  const [pendientes,setPendientes]=useState([emptyPend()]);
  const [expandedPends,setExpandedPends]=useState<Record<number,boolean>>({0:true});
  // Fine tuning
  const [fineTuning,setFineTuning]=useState([emptyFT()]);
  const [expandedFTs,setExpandedFTs]=useState<Record<number,boolean>>({0:true});
  // Reporte / envío
  const [errores,setErrores]=useState<string[]>([]);
  const [reporte,setReporte]=useState(false);
  const [enviando,setEnviando]=useState(false);
  const [correoExito,setCorreoExito]=useState(false);
  const [correoError,setCorreoError]=useState('');
  const [copiado,setCopiado]=useState(false);

  const toggleExpandPend=(i:number)=>setExpandedPends(p=>({...p,[i]:!(p[i]!==false)}));
  const toggleExpandFT=(i:number)=>setExpandedFTs(p=>({...p,[i]:!(p[i]!==false)}));
  const pendCompleto=(p:any)=>!!(p.pendiente.trim()&&p.impacto&&p.urgencia&&p.responsable&&(p.responsable!=='Otro'||p.responsableOtro.trim())&&p.fechaHora&&p.estatus.trim());
  const updPend=(i,f,v)=>setPendientes(p=>p.map((x,idx)=>idx===i?{...x,[f]:v}:x));
  const updFT=(i,f,v)=>setFineTuning(p=>p.map((x,idx)=>idx===i?{...x,[f]:v}:x));
  const toggleDest=(e)=>setDestinosSel(p=>p.includes(e)?p.filter(x=>x!==e):[...p,e]);
  const addExtraTo=()=>{const v=correoExtraTo.trim();if(v&&!correosExtraTo.includes(v)){setCorreosExtraTo(p=>[...p,v]);setDestinosSel(p=>[...p,v]);}setCorreoExtraTo('');};
  const allDestinosOpts=[...CORREOS_PRINCIPALES,...correosExtraTo.map(e=>({email:e,nombre:e.split('@')[0]}))];
  const toFinal=destinosSel.join('; ');

  const genCuerpo=(t=turno,ent=entrante,sal=saliente)=>{const to=TURNOS[t];return`${to.saludo},\n\nSe comparte la bitácora de cambio de turno ${to.label.toLowerCase()} al analista ${ent||'[Analista]'}.\n\nQuedando atento/a a cualquier aclaración que pudiera surgir.\n\nSaludos,\n${sal||'[Analista saliente]'}`;};
  const cuerpoFinal=cuerpoCorreo||genCuerpo();
  const buildAsunto=()=>`BITÁCORA CAMBIO DE TURNO - ${TURNOS[turno].label.toUpperCase()} ${fecha}`;
  const pendLimpios=()=>pendientes.filter(p=>p.pendiente.trim()).map(p=>({...p,responsableFinal:p.responsable==='Otro'?(p.responsableOtro||'Otro'):p.responsable}));
  const ftLimpios=()=>fineTuning.filter(f=>f.regla.trim()).map(f=>({...f}));

  const validar=()=>{
    const errs:string[]=[];
    if(!fecha)errs.push('Entrega de turno: falta la fecha.');
    if(!saliente)errs.push('Entrega de turno: falta el analista saliente.');
    if(!entrante)errs.push('Entrega de turno: falta el analista entrante.');
    if(!horaEntrega)errs.push('Entrega de turno: falta la hora de entrega.');
    if(destinosSel.length===0)errs.push('Entrega de turno: selecciona al menos un destinatario en "Para".');
    pendientes.forEach((p,i)=>{if(p.pendiente.trim()&&!pendCompleto(p))errs.push(`Pendiente #${i+1}: completa los campos obligatorios (*).`);});
    fineTuning.forEach((f,i)=>{if(f.regla.trim()&&!f.cliente)errs.push(`Fine Tuning #${i+1}: falta el cliente.`);});
    return errs;
  };

  const generarReporte=()=>{
    const errs=validar();
    if(errs.length>0){setErrores(errs);setSeccion('errores');return;}
    setErrores([]);
    if(!cuerpoCorreo)setCuerpoCorreo(genCuerpo());
    setReporte(true);
    setSeccion('reporte');
  };

  const buildBitacoraBody=()=>{
    const t=TURNOS[turno];
    const pends=pendLimpios(),fts=ftLimpios();
    const notasArr=notas.split('|||').filter(n=>n.trim());
    const H2='display:block;font-size:12px;font-weight:bold;color:#fff;background:#232323;padding:6px 10px;margin:14px 0 6px;border-radius:4px';
    const TH='background:#232323;color:#fff;padding:5px 8px;text-align:left;font-size:10px;font-weight:bold';
    const TD='padding:4px 8px;border-bottom:1px solid #ececec;font-size:10px;color:#1a1a2e;vertical-align:top';
    const LB='font-size:9px;color:#555;text-transform:uppercase;margin-bottom:2px';
    const VAL='font-weight:bold;font-size:10px;color:#1a1a2e';
    return `
<table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:3px solid #F24C00;padding-bottom:12px;margin-bottom:16px">
  <tr>
    <td>${LOGO_URL?`<img src="${LOGO_URL}" style="height:50px" crossorigin="anonymous"/>`:''}</td>
    <td style="text-align:right;vertical-align:middle">
      <div style="font-size:14px;font-weight:bold">Bitácora de Cambio de Turno – SOC</div>
      <div style="font-size:10px;color:#555">${t.label} | ${t.hora} | ${esc(fecha)}</div>
    </td>
  </tr>
</table>
<span style="${H2}">Entrega de turno</span>
<table width="100%" cellpadding="0" cellspacing="4" style="margin-bottom:10px">
  <tr>
    <td width="50%" style="padding:3px 4px"><div style="${LB}">Analista saliente</div><div style="${VAL}">${esc(saliente)||'—'}</div></td>
    <td width="50%" style="padding:3px 4px"><div style="${LB}">Analista entrante</div><div style="${VAL}">${esc(entrante)||'—'}</div></td>
  </tr>
  <tr>
    <td width="50%" style="padding:3px 4px"><div style="${LB}">Hora de entrega</div><div style="${VAL}">${esc(horaEntrega)||'—'}</div></td>
    <td width="50%"></td>
  </tr>
</table>
<span style="${H2}">Pendientes</span>
${pends.length===0?'<p style="font-style:italic;color:#555;border-left:3px solid #F24C00;padding-left:8px;font-size:10px">Sin pendientes para el siguiente turno.</p>':`
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:10px">
  <thead><tr><th style="${TH}">#</th><th style="${TH}">Descripción</th><th style="${TH}">Impacto</th><th style="${TH}">Urgencia</th><th style="${TH}">Responsable</th><th style="${TH}">Compromiso</th><th style="${TH}">Estatus</th><th style="${TH}">Comentarios</th></tr></thead>
  <tbody>${pends.map((p,i)=>`<tr><td style="${TD}">${i+1}</td><td style="${TD}">${esc(p.pendiente)}</td><td style="${TD}">${esc(p.impacto)||'—'}</td><td style="${TD}">${esc(p.urgencia)}</td><td style="${TD}">${esc(p.responsableFinal)}</td><td style="${TD}">${p.fechaHora?esc(displayDT(p.fechaHora)):'—'}</td><td style="${TD}">${esc(p.estatus)||'—'}</td><td style="${TD}">${esc(p.comentarios)||'—'}</td></tr>`).join('')}</tbody>
</table>`}
${fts.length>0?`
<span style="${H2}">Fine Tuning</span>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:10px">
  <thead><tr><th style="${TH}">#</th><th style="${TH}">Cliente</th><th style="${TH}">Regla</th><th style="${TH}">Descripción</th><th style="${TH}">Recomendación</th><th style="${TH}">Acción</th><th style="${TH}">Notas</th></tr></thead>
  <tbody>${fts.map((f,i)=>`<tr><td style="${TD}">${i+1}</td><td style="${TD}">${esc(f.cliente)||'—'}</td><td style="${TD}">${esc(f.regla)}</td><td style="${TD}">${esc(f.descripcion)||'—'}</td><td style="${TD}">${esc(f.recomendacion)}</td><td style="${TD}">${esc(f.accion)||'—'}</td><td style="${TD}">${esc(f.notas)||'—'}</td></tr>`).join('')}</tbody>
</table>`:''}
${notasArr.length>0?`<span style="${H2}">Notas generales</span><p style="font-size:10px;line-height:1.6;padding:0 4px">${notasArr.map((n,i)=>`<strong>Nota ${i+1}:</strong> ${esc(n.trim())}`).join('<br/><br/>')}</p>`:''}
<div style="margin-top:20px;padding-top:10px;border-top:1px solid #ccc;font-size:9px;color:#888;text-align:center">Bitácora SOC | ${new Date().toLocaleString('es-MX')}</div>`;
  };

  const buildBitacoraHTML=()=>`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Bitácora SOC</title><style>body{font-family:Arial,sans-serif;color:#1a1a2e;font-size:11px;margin:0;padding:0;background:#fff}</style></head><body style="margin:0;padding:0;background:#fff"><div id="bpdf-root" style="background:#fff;padding:20px;font-family:Arial,sans-serif;font-size:11px;color:#1a1a2e">${buildBitacoraBody()}</div></body></html>`;

  const descargarPDF=()=>{const w=window.open('','_blank');if(!w)return;w.document.write(buildBitacoraHTML());w.document.close();w.focus();setTimeout(()=>w.print(),600);};

  const enviarTodo=async()=>{
    if(!toFinal){setCorreoError('Selecciona al menos un destinatario.');return;}
    setCorreoExito(false);setCorreoError('');setEnviando(true);
    await new Promise(r=>setTimeout(r,50));
    // El PDF se arma en un iframe aislado para que el tema oscuro de la app no se cuele.
    const pdfIframe=document.createElement('iframe');
    pdfIframe.style.cssText='position:absolute;left:-9999px;top:0;width:794px;height:1px;border:none';
    document.body.appendChild(pdfIframe);
    pdfIframe.contentDocument!.open();
    pdfIframe.contentDocument!.write(buildBitacoraHTML());
    pdfIframe.contentDocument!.close();
    await new Promise(r=>setTimeout(r,500));
    const pdfRoot=pdfIframe.contentDocument!.getElementById('bpdf-root')||pdfIframe.contentDocument!.body;
    pdfIframe.style.height=pdfRoot.scrollHeight+'px';
    await new Promise(r=>setTimeout(r,100));
    let pdfBase64='';let pdfError='';
    try{
      const blob:Blob=await html2pdf().set({margin:10,filename:'Bitacora_SOC.pdf',image:{type:'jpeg',quality:0.95},html2canvas:{scale:2,logging:false,useCORS:true,windowWidth:794},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}}).from(pdfRoot).output('blob');
      if(!blob||blob.size<500)throw new Error('PDF generado está vacío o corrupto');
      pdfBase64=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve((reader.result as string).split(',')[1]);reader.onerror=()=>reject(new Error('Error al leer el PDF'));reader.readAsDataURL(blob);});
    }catch(e:any){pdfError=e?.message||'Error generando PDF';}
    finally{document.body.removeChild(pdfIframe);}
    try{
      if(pdfError)throw new Error('No se pudo generar el PDF: '+pdfError);
      const r=await fetch('/.netlify/functions/enviar-bitacora',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to:toFinal,subject:buildAsunto(),text:cuerpoFinal,pdfBase64})});
      if(!r.ok)throw new Error('Falló el servidor al enviar el correo');
      setCorreoExito(true);
    }catch(e:any){setCorreoError('Error correo: '+(e?.message||'Error desconocido'));}
    setEnviando(false);
  };

  const copiarTexto=()=>navigator.clipboard.writeText(cuerpoFinal).then(()=>{setCopiado(true);setTimeout(()=>setCopiado(false),2000);});
  const nuevaBitacora=()=>{
    setReporte(false);setErrores([]);setCorreoExito(false);setCorreoError('');
    setPendientes([emptyPend()]);setExpandedPends({0:true});setFineTuning([emptyFT()]);setExpandedFTs({0:true});
    setNotas('');setNotasExpanded({0:true});setHoraEntrega('');setCuerpoCorreo('');
    setSeccion('pendientes');
  };

  const SECCIONES=['pendientes','finetuning','entrega','reporte'];
  const LABELS={pendientes:'Pendientes',finetuning:'Fine Tuning',entrega:'Entrega de turno',reporte:'Reporte'};
  const BTN_SEC={padding:'7px 16px',cursor:'pointer',background:'transparent',border:`1px solid ${C.inputBorder}`,color:C.textMuted,borderRadius:6,fontSize:13};
  const BTN_PRI={padding:'7px 20px',cursor:'pointer',background:C.accentDim,border:'none',color:'#fff',fontWeight:500,borderRadius:6,fontSize:13};
  const BTN_ADD={padding:'6px 14px',marginBottom:12,cursor:'pointer',fontSize:13,color:C.accent,border:`1px solid ${C.accent}`,background:'transparent',borderRadius:6};
  const Nav=({from,to})=>(<div style={{display:'flex',gap:8,marginTop:4}}>{from&&<button onClick={()=>setSeccion(from)} style={BTN_SEC}>← Atrás</button>}{to&&<button onClick={()=>setSeccion(to)} style={BTN_PRI}>Siguiente →</button>}</div>);

  return(
    <>
      <style>{`button,input,textarea,select{font-family:inherit}::selection{background:#F24C00;color:#fff}.cal-scroll::-webkit-scrollbar{display:none}.cal-scroll{-ms-overflow-style:none;scrollbar-width:none}
@media (max-width:760px){.g2{grid-template-columns:1fr!important}.g2>*{grid-column:auto!important}.rep-grid{grid-template-columns:1fr!important}}`}</style>
      <div style={{fontFamily:"'Montserrat',system-ui,sans-serif",background:C.bg,minHeight:'100vh',padding:'0 0 2rem',textAlign:'left'}}>
        {/* Header */}
        <div style={{background:C.surface,borderBottom:`1px solid ${C.cardBorder}`,padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{fontSize:20,fontWeight:500,color:C.text}}>Bitácora SOC</div>
            <button onClick={()=>{localStorage.removeItem('bitacora_token');localStorage.removeItem('bitacora_user');window.location.reload();}} style={{fontSize:11,padding:'4px 10px',borderRadius:6,border:`1px solid ${C.inputBorder}`,background:'transparent',color:C.textMuted,cursor:'pointer',transition:'all 0.2s'}} onMouseOver={e=>{e.currentTarget.style.borderColor='#EF4444';e.currentTarget.style.color='#EF4444';}} onMouseOut={e=>{e.currentTarget.style.borderColor=C.inputBorder;e.currentTarget.style.color=C.textMuted;}}>⏻ Cerrar sesión</button>
          </div>
          {LOGO_APP_URL&&<img src={LOGO_APP_URL} alt="" style={{height:44,width:'auto',objectFit:'contain'}}/>}
        </div>

        <div style={{padding:'0 16px'}}>
          {/* Pestañas */}
          <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:16}}>
            {SECCIONES.map(s=>{
              if(s==='reporte'&&!reporte)return null;
              const activa=seccion===s;
              return(<button key={s} onClick={()=>setSeccion(s)} style={{fontSize:11,padding:'4px 10px',borderRadius:20,border:`1px solid ${activa?C.accent:C.inputBorder}`,background:activa?C.accentBg:C.inputBg,color:activa?C.accent:C.textMuted,cursor:'pointer',fontWeight:activa?500:400,textTransform:'uppercase',letterSpacing:'0.04em'}}>{LABELS[s]}</button>);
            })}
          </div>

          {/* ERRORES */}
          {seccion==='errores'&&(<div><div style={{...CARD,borderLeft:`3px solid ${C.danger}`}}><p style={{...H2S,color:C.danger}}>⚠️ Campos requeridos incompletos</p>{errores.map((e,i)=>(<div key={i} style={{display:'flex',gap:8,padding:'6px 0',borderBottom:`1px solid ${C.cardBorder}`}}><span style={{color:C.danger}}>✕</span><span style={{fontSize:13,color:C.text}}>{e}</span></div>))}</div><button onClick={()=>setSeccion(errores.some(e=>e.startsWith('Pendiente'))?'pendientes':errores.some(e=>e.startsWith('Fine'))?'finetuning':'entrega')} style={BTN_SEC}>← Volver al formulario</button></div>)}

          {/* PENDIENTES */}
          {seccion==='pendientes'&&(
            <div>
              <p style={{fontSize:12,color:C.textMuted,marginBottom:12,fontStyle:'italic'}}>Lo que queda abierto para el siguiente turno. Si no hay pendientes, deja la descripción vacía.</p>
              {pendientes.map((p,i)=>{
                const completo=pendCompleto(p);const isOpen=expandedPends[i]!==false;
                return(
                  <div key={i} style={{...CARD,padding:isOpen?'1rem 1.25rem':'0.6rem 1rem',borderLeft:`3px solid ${urgColor(p.urgencia)}`}}>
                    <div onClick={()=>toggleExpandPend(i)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer',userSelect:'none',marginBottom:isOpen?10:0,gap:8,flexWrap:'wrap'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0}}>
                        <span style={{fontSize:12,color:C.textDim,display:'inline-block',transform:isOpen?'rotate(90deg)':'rotate(0deg)',transition:'transform 0.2s'}}>▶</span>
                        <span style={{fontSize:13,fontWeight:500,color:C.text,whiteSpace:'nowrap'}}>Pendiente #{i+1}</span>
                        {p.pendiente&&<span style={{fontSize:11,color:C.textMuted,maxWidth:240,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.pendiente}</span>}
                        {!isOpen&&completo&&<span style={{fontSize:10,padding:'1px 7px',borderRadius:10,background:C.successBg,color:C.success,border:`1px solid ${C.success}40`}}>✓ completo</span>}
                      </div>
                      <div style={{display:'flex',gap:6}}>
                        <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:urgBg(p.urgencia),color:urgColor(p.urgencia),border:`1px solid ${urgColor(p.urgencia)}40`,fontWeight:500}}>{p.urgencia}</span>
                        <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:C.accentBg,color:C.accent,border:`1px solid ${C.accent}40`}}>{p.responsable==='Otro'?(p.responsableOtro||'Otro'):p.responsable}</span>
                      </div>
                    </div>
                    {isOpen&&(
                      <div className="g2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                        <div style={{gridColumn:'1/-1'}}><label style={LBL}>Descripción *</label><input value={p.pendiente} onChange={e=>updPend(i,'pendiente',e.target.value)} style={{...IPT}} placeholder="¿Qué queda pendiente?"/></div>
                        <CSelect value={p.impacto} onChange={v=>updPend(i,'impacto',v)} label="Impacto *" options={IMPACTOS}/>
                        <CSelect value={p.urgencia} onChange={v=>updPend(i,'urgencia',v||'Baja')} label="Urgencia *" options={URGENCIAS}/>
                        <CSelect value={p.responsable} onChange={v=>updPend(i,'responsable',v||'SOC')} label="Responsable *" options={RESPONSABLES_BASE}/>
                        <CustomDateTimePicker value={p.fechaHora} onChange={v=>updPend(i,'fechaHora',v)} label="Fecha y hora compromiso" required/>
                        {p.responsable==='Otro'&&(<div style={{gridColumn:'1/-1'}}><label style={LBL}>Especificar responsable *</label><input value={p.responsableOtro} onChange={e=>updPend(i,'responsableOtro',e.target.value)} style={{...IPT}} placeholder="Nombre o área"/></div>)}
                        <div><label style={LBL}>Estatus *</label><input value={p.estatus} onChange={e=>updPend(i,'estatus',e.target.value)} style={{...IPT}} placeholder="En espera, en proceso..."/></div>
                        <div><label style={LBL}>Comentarios</label><input value={p.comentarios} onChange={e=>updPend(i,'comentarios',e.target.value)} style={{...IPT}} placeholder="Información adicional..."/></div>
                        {pendientes.length>1&&<div style={{gridColumn:'1/-1',display:'flex',justifyContent:'flex-end'}}><button onClick={()=>setPendientes(prev=>prev.filter((_,idx)=>idx!==i))} style={{fontSize:12,color:C.danger,background:'none',border:'none',cursor:'pointer',padding:0}}>Eliminar pendiente</button></div>}
                      </div>
                    )}
                  </div>
                );
              })}
              <button onClick={()=>{setPendientes(p=>[...p,emptyPend()]);setExpandedPends(p=>({...Object.fromEntries(Object.keys(p).map(k=>[k,false])),[pendientes.length]:true}));}} style={BTN_ADD}>+ Agregar pendiente</button>
              <Nav from={null} to="finetuning"/>
            </div>
          )}

          {/* FINE TUNING */}
          {seccion==='finetuning'&&(
            <div>
              <p style={{fontSize:12,color:C.textMuted,marginBottom:12,fontStyle:'italic'}}>Sección opcional. Puedes dejarla vacía si no hay ruido que reportar.</p>
              {fineTuning.map((f,i)=>{
                const ftOpen=expandedFTs[i]!==false;const cl=cliStyle(f.cliente);
                return(
                  <div key={i} style={{...CARD,padding:ftOpen?'1rem 1.25rem':'0.6rem 1rem'}}>
                    <div onClick={()=>toggleExpandFT(i)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer',userSelect:'none',marginBottom:ftOpen?10:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:12,color:C.textDim,display:'inline-block',transform:ftOpen?'rotate(90deg)':'rotate(0deg)',transition:'transform 0.2s'}}>▶</span>
                        <p style={{fontSize:13,fontWeight:500,color:C.text,margin:0}}>{f.regla||`Regla #${i+1}`}</p>
                        {f.cliente&&<span style={{fontSize:11,padding:'1px 8px',borderRadius:12,background:cl.bg,color:cl.color,border:`1px solid ${cl.border}`,fontWeight:600}}>{f.cliente}</span>}
                      </div>
                      {fineTuning.length>1&&<button onClick={e=>{e.stopPropagation();setFineTuning(p=>p.filter((_,idx)=>idx!==i));}} style={{fontSize:12,color:C.danger,background:'none',border:'none',cursor:'pointer',padding:0}}>Eliminar</button>}
                    </div>
                    {ftOpen&&(
                      <div className="g2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                        <CSelect value={f.cliente} onChange={v=>updFT(i,'cliente',v)} label="Cliente *" options={CLIENTES}/>
                        <div><label style={LBL}>Regla</label><input value={f.regla} onChange={e=>updFT(i,'regla',e.target.value)} style={{...IPT}} placeholder="Nombre de la regla"/></div>
                        <div style={{gridColumn:'1/-1'}}><label style={LBL}>Descripción</label><input value={f.descripcion} onChange={e=>updFT(i,'descripcion',e.target.value)} style={{...IPT}} placeholder="¿Qué genera el ruido?"/></div>
                        <CSelect value={f.recomendacion} onChange={v=>updFT(i,'recomendacion',v||'Tuning')} label="Recomendación" options={RECOMENDACIONES}/>
                        <div><label style={LBL}>Acción realizada</label><input value={f.accion} onChange={e=>updFT(i,'accion',e.target.value)} style={{...IPT}} placeholder="Acción ejecutada"/></div>
                        <div style={{gridColumn:'1/-1'}}><label style={LBL}>Notas</label><input value={f.notas} onChange={e=>updFT(i,'notas',e.target.value)} style={{...IPT}} placeholder="Observaciones"/></div>
                      </div>
                    )}
                  </div>
                );
              })}
              <button onClick={()=>{setFineTuning(p=>[...p,emptyFT()]);setExpandedFTs(p=>({...Object.fromEntries(Object.keys(p).map(k=>[k,false])),[fineTuning.length]:true}));}} style={BTN_ADD}>+ Agregar regla</button>
              <Nav from="pendientes" to="entrega"/>
            </div>
          )}

          {/* ENTREGA DE TURNO */}
          {seccion==='entrega'&&(
            <div>
              <div style={CARD}>
                <p style={H2S}>🛡️ Datos del turno</p>
                <div className="g2" style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10}}>
                  <div style={{gridColumn:'span 2'}}><CustomDatePicker value={fecha} onChange={setFecha} label="Fecha" required/></div>
                  <div style={{gridColumn:'span 2'}}><CSelect value={String(turno)} onChange={v=>{if(v==='')return;const t=+v;setTurno(t);if(cuerpoCorreo)setCuerpoCorreo(genCuerpo(t));}} label="Turno *" options={TURNOS.map((t,i)=>({value:String(i),label:`${t.label} — ${t.hora}`}))}/></div>
                  <div style={{gridColumn:'span 2'}}><CustomTimePicker value={horaEntrega} onChange={setHoraEntrega} label="Hora de entrega" required/></div>
                  <div style={{gridColumn:'span 3'}}><CSelect value={saliente} onChange={v=>{setSaliente(v);if(cuerpoCorreo)setCuerpoCorreo(genCuerpo(turno,entrante,v));}} label="Analista saliente *" options={ANALISTAS_LIST}/></div>
                  <div style={{gridColumn:'span 3'}}><CSelect value={entrante} onChange={v=>{setEntrante(v);if(cuerpoCorreo)setCuerpoCorreo(genCuerpo(turno,v));}} label="Analista entrante *" options={ANALISTAS_LIST}/></div>
                </div>
              </div>

              <div style={CARD}>
                <p style={H2S}>📝 Notas generales</p>
                <NotasBlock notas={notas} setNotas={setNotas} notasExpanded={notasExpanded} setNotasExpanded={setNotasExpanded}/>
              </div>

              <div style={CARD}>
                <p style={H2S}>📧 Correo</p>
                <label style={LBL}>Para *</label>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:4,marginBottom:6}}>{allDestinosOpts.map(({email,nombre})=>(<button key={email} onClick={()=>toggleDest(email)} style={{...pill(destinosSel.includes(email),C.accent,C.accentBg),fontSize:11}}>{nombre}{correosExtraTo.includes(email)&&<span onClick={e=>{e.stopPropagation();setCorreosExtraTo(p=>p.filter(x=>x!==email));setDestinosSel(p=>p.filter(x=>x!==email));}} style={{marginLeft:6,color:C.danger,fontWeight:700}}>×</span>}</button>))}</div>
                <div style={{display:'flex',gap:6}}><input value={correoExtraTo} onChange={e=>setCorreoExtraTo(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addExtraTo()} style={{...IPT,flex:1}} placeholder="Agregar otro correo"/><button onClick={addExtraTo} style={{padding:'6px 12px',cursor:'pointer',color:C.accent,border:`1px solid ${C.accent}`,background:'transparent',borderRadius:6,whiteSpace:'nowrap'}}>+ Agregar</button></div>
                {destinosSel.length>0&&<div style={{marginTop:6,fontSize:11,color:C.textDim}}>Seleccionados: {destinosSel.join(', ')}</div>}
                <label style={{...LBL,marginTop:14}}>Cuerpo del correo</label>
                <textarea value={cuerpoFinal} onChange={e=>setCuerpoCorreo(e.target.value)} rows={7} style={{...IPT,resize:'vertical',fontFamily:'ui-monospace,Consolas,monospace',fontSize:12,lineHeight:1.7}}/>
                <p style={{fontSize:11,color:C.textDim,marginTop:6}}>Se ajusta automáticamente según el turno y los analistas.</p>
              </div>

              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button onClick={()=>setSeccion('finetuning')} style={BTN_SEC}>← Atrás</button>
                <button onClick={generarReporte} style={{...BTN_PRI,padding:'8px 24px',fontWeight:600,fontSize:14}}>🚀 Generar reporte</button>
              </div>
            </div>
          )}

          {/* REPORTE */}
          {seccion==='reporte'&&reporte&&ReportePreview({
            fecha,turno,saliente,entrante,horaEntrega,notas,pendientes,fineTuning,
            cuerpoCorreo:cuerpoFinal,setCuerpoCorreo,toFinal,asunto:buildAsunto(),
            enviarTodo,enviando,correoExito,correoError,
            copiado,copiarTexto,descargarPDF,nuevaBitacora,setSeccion,
          })}
        </div>
      </div>
    </>
  );
}
