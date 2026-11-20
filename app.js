const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const CM={Purples:["fcfbfd","efedf5","dadaeb","bcbddc","9e9ac8","807dba","6a51a3","54278f","3f007d"],Greens:["f7fcf5","e5f5e0","c7e9c0","a1d99b","74c476","41ab5d","238b45","006d2c","00441b"],Blues:["f7fbff","deebf7","c6dbef","9ecae1","6baed6","4292c6","2171b5","08519c","08306b"],plasma:["0d0887","47039f","7301a8","9c179e","bd3786","d8576b","ed7953","fb9f3a","fdca26","f0f921"]};
function cmap(n,t){const s=CM[n],p=Math.min(1,Math.max(0,t))*(s.length-1),i=Math.min(s.length-2,Math.floor(p)),f=p-i;
  const a=s[i],b=s[i+1];return [0,2,4].map(k=>Math.round(parseInt(a.substr(k,2),16)*(1-f)+parseInt(b.substr(k,2),16)*f));}
const lum=c=>{const v=c.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return .2126*v[0]+.7152*v[1]+.0722*v[2]};
const fmt=n=>n.toLocaleString("en-US");
let D=null,tag="sample",Xn=[],byName=new Map(),genres=[],plats=[],y0=0,y1=0;
const cache={};
async function load(t){
  if(!cache[t])cache[t]=await (await fetch(`data/${t}.json`)).json();
  tag=t;D=cache[t];
  Xn=[];const cols=[10,11,12,4,5,6,7,8,9],mn=[],mx=[];
  cols.forEach(c=>{let a=Infinity,b=-Infinity;for(const r of D){if(r[c]<a)a=r[c];if(r[c]>b)b=r[c]}mn.push(a);mx.push(b)});
  Xn=D.map(r=>{const v=Float64Array.from(cols,(c,k)=>(r[c]-mn[k])/((mx[k]-mn[k])||1));let s=0;for(const x of v)s+=x*x;s=Math.sqrt(s)||1;return v.map(x=>x/s)});
  byName=new Map();D.forEach((r,i)=>{const k=r[0].toLowerCase();if(!byName.has(k))byName.set(k,i)});
  genres=[...new Set(D.map(r=>r[2]))].sort();plats=[...new Set(D.map(r=>r[1]))].sort();
  y0=Math.min(...D.map(r=>r[4]));y1=Math.max(...D.map(r=>r[4]));
  render();
}
function render(){
  $("#note").innerHTML=tag==="sample"?'<div class="msg info">⚠️ Menggunakan sample data untuk demo. Upload vgsales.csv untuk hasil penuh.</div>':"";
  $("#mets").innerHTML=[["🎮 Total Games",fmt(D.length)],["🎭 Genre Tersedia",genres.length],["🖥️ Platform Tersedia",plats.length],["📅 Rentang Tahun",y0+" – "+y1]].map(([a,b])=>`<div class="met c1"><small>${a}</small><b>${b}</b></div>`).join("");
  $("#g2").innerHTML=genres.map(g=>`<option>${g}</option>`).join("");
  $("#g3").innerHTML=["Semua",...genres].map(g=>`<option>${g}</option>`).join("");
  $("#p3").innerHTML=["Semua",...plats].map(g=>`<option>${g}</option>`).join("");
  ["ya","yb"].forEach(id=>{$("#"+id).min=y0;$("#"+id).max=y1});$("#ya").value=Math.max(2000,y0);$("#yb").value=y1;
  $("#e1").textContent=y0;$("#e2").textContent=y1;slide();
  ["o1","o2","o3"].forEach(i=>$("#"+i).innerHTML="");$("#sug").textContent="";
  eda();
}
// ---------- komponen
function df(idx,cm,withIdx,cols){
  cols=cols||["Name","Platform","Genre","Publisher","Year","Global_Sales"];
  const ci={Name:0,Platform:1,Genre:2,Publisher:3,Year:4,NA_Sales:5,EU_Sales:6,JP_Sales:7,Other_Sales:8,Global_Sales:9};
  let lo=0,hi=0;if(cm){const v=idx.map(i=>D[i][9]);lo=Math.min(...v);hi=Math.max(...v)}
  const num=c=>c>=4;
  let h="<div class='wrapdf'><table><tr>"+(withIdx?"<th></th>":"")+cols.map(c=>`<th class="${num(ci[c])?"r":""}">${c}</th>`).join("")+"</tr>";
  idx.forEach((i,k)=>{h+="<tr>"+(withIdx?`<td style="color:var(--dim)">${k}</td>`:"")+cols.map(c=>{const v=D[i][ci[c]],n=ci[c];
    let s=n===9&&cm?v.toFixed(6):(n>=5?String(+v.toFixed(4)):esc(v)),st="";
    if(cm&&n===9){const rgb=cmap(cm,hi>lo?(v-lo)/(hi-lo):0);st=`background:rgb(${rgb});color:${lum(rgb)<.408?"#f1f1f1":"#000"}`}
    return `<td class="${num(n)?"r":""}" style="${st}">${s}</td>`}).join("")+"</tr>"});
  return h+"</table></div>";
}
const msg=(t,h)=>`<div class="msg ${t}">${h}</div>`;
const cl=(v,a,b)=>Math.min(b,Math.max(a,Math.round(+v)||a));
const topN=(f,n)=>D.map((_,i)=>i).filter(f).sort((a,b)=>D[b][9]-D[a][9]).slice(0,n);
function find(q){q=q.toLowerCase().trim();if(byName.has(q))return byName.get(q);for(const [k,i] of byName)if(k.includes(q))return i;return -1}
// ---------- tab 1
$("#title").addEventListener("change",()=>{const q=$("#title").value.toLowerCase();
  const s=q.length>=3?D.filter(r=>r[0].toLowerCase().includes(q)).slice(0,5).map(r=>r[0]):[];
  $("#sug").textContent=s.length?"💡 Saran: "+s.join(" | "):""});
$("#b1").onclick=()=>{
  const q=$("#title").value,o=$("#o1");
  if(!q){o.innerHTML=msg("warn","⚠️ Masukkan judul game terlebih dahulu!");return}
  const i=find(q);let h="";
  if(i>=0){const r=D[i];h+=`<details open><summary>📋 Info Game yang Dicari</summary><div><div class="cols" style="margin:0">`+
    [["🎮 Platform",r[1]],["🎭 Genre",r[2]],["📅 Tahun",r[4]],["💰 Global Sales",r[9].toFixed(2)+"M"]].map(([a,b])=>`<div class="met c1"><small>${a}</small><b>${esc(b)}</b></div>`).join("")+"</div></div></details>"}
  else{o.innerHTML=msg("error",`Game '${esc(q)}' tidak ditemukan.`);return}
  const n=cl($("#n1").value,5,20),arr=Xn.map((x,j)=>{let d=0;const y=Xn[i];for(let k=0;k<9;k++)d+=y[k]*x[k];return [j,d]});
  arr.sort((a,b)=>b[1]-a[1]);const top=arr.slice(1,n+1).map(a=>a[0]);
  o.innerHTML=h+msg("success",`✅ Ditemukan ${top.length} rekomendasi untuk <strong>'${esc(q)}'</strong>`)+df(top,"Purples");
};
// ---------- tab 2 (pie)
$("#b2").onclick=()=>{
  const g=$("#g2").value,n=cl($("#n2").value,5,20),idx=topN(i=>D[i][2]===g,n);
  $("#o2").innerHTML=msg("success",`✅ Top ${idx.length} game genre <strong>${esc(g)}</strong>`)+`<div class="cols"><div class="c3">${df(idx,"Greens")}</div><div class="c2">${pie(idx,g)}</div></div>`;
};
const SET2=["#66c2a5","#fc8d62","#8da0cb","#e78ac3","#a6d854","#ffd92f","#e5c494","#b3b3b3"];
function pie(idx,g){
  const m=new Map();idx.forEach(i=>m.set(D[i][1],(m.get(D[i][1])||0)+1));
  const e=[...m].sort((a,b)=>b[1]-a[1]),tot=idx.length,cx=240,cy=250,R=165;let a=90,s="";
  e.forEach(([k,v],j)=>{const f=v/tot,a2=a+f*360,rad=x=>x*Math.PI/180,P=(ang,r)=>[cx+r*Math.cos(rad(ang)),cy-r*Math.sin(rad(ang))];
    const [x1,y1]=P(a,R),[x2,y2]=P(a2,R),mid=(a+a2)/2,[lx,ly]=P(mid,R*1.1),[px,py]=P(mid,R*.6);
    s+=f>=.9999?`<circle cx="${cx}" cy="${cy}" r="${R}" fill="${SET2[j%8]}"/>`:`<path d="M${cx} ${cy}L${x1} ${y1}A${R} ${R} 0 ${f>.5?1:0} 0 ${x2} ${y2}Z" fill="${SET2[j%8]}"/>`;
    s+=`<text x="${lx}" y="${ly}" text-anchor="${lx>=cx?"start":"end"}" dominant-baseline="middle" fill="#000">${esc(k)}</text><text x="${px}" y="${py}" text-anchor="middle" dominant-baseline="middle" fill="#000">${Math.round(f*100)}%</text>`;a=a2});
  return `<svg viewBox="0 0 480 480" font-family="DejaVu Sans,Verdana,Arial,sans-serif" font-size="13.9"><rect width="480" height="480" fill="#0e1117"/><g fill="#fff" font-size="16.7" text-anchor="middle"><text x="240" y="26">Distribusi Platform</text><text x="240" y="46">Genre ${esc(g)}</text></g>${s}</svg>`;
}
// ---------- tab 3 (slider + scatter)
function slide(){let a=+$("#ya").value,b=+$("#yb").value;if(a>b){[a,b]=[b,a]}const p=v=>(v-y0)/((y1-y0)||1)*100;
  $(".fl").style.left=p(a)+"%";$(".fl").style.width=(p(b)-p(a))+"%";$("#va").style.left=p(a)+"%";$("#vb").style.left=p(b)+"%";$("#va").textContent=a;$("#vb").textContent=b;
  $("#e1").style.visibility=p(a)<8?"hidden":"visible";$("#e2").style.visibility=p(b)>92?"hidden":"visible"}
["ya","yb"].forEach(id=>$("#"+id).addEventListener("input",slide));
$("#b3").onclick=()=>{
  const g=$("#g3").value,p=$("#p3").value,a=Math.min(+$("#ya").value,+$("#yb").value),b=Math.max(+$("#ya").value,+$("#yb").value),n=cl($("#n3").value,5,30);
  const idx=topN(i=>(g==="Semua"||D[i][2]===g)&&(p==="Semua"||D[i][1]===p)&&D[i][4]>=a&&D[i][4]<=b,n);
  if(!idx.length){$("#o3").innerHTML=msg("warn","Tidak ada game yang cocok dengan preferensi.");return}
  $("#o3").innerHTML=msg("success",`✅ Ditemukan <strong>${idx.length}</strong> game sesuai preferensi`)+df(idx,"Blues")+(idx.length>3?scatter(idx):"");
};
function nice(lo,hi,n){const raw=(hi-lo)/n,mag=10**Math.floor(Math.log10(raw)),f=raw/mag,st=(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*mag,o=[];for(let v=Math.ceil(lo/st-1e-9)*st;v<=hi+1e-9;v+=st)o.push(+v.toFixed(6));return o}
function scatter(idx){
  const X=idx.map(i=>D[i][4]),Y=idx.map(i=>D[i][9]),W=1000,H=400,L=70,Rr=985,T=40,B=345;
  const rg=v=>{let lo=Math.min(...v),hi=Math.max(...v);if(lo===hi){lo-=1;hi+=1}const m=(hi-lo)*.05;return[lo-m,hi+m]};
  const [xa,xb]=rg(X),[ya,yb]=rg(Y),sx=v=>L+(v-xa)/(xb-xa)*(Rr-L),sy=v=>B-(v-ya)/(yb-ya)*(B-T);
  const gl=Math.min(...Y),gh=Math.max(...Y);let s="";
  nice(xa,xb,9).forEach(t=>s+=`<line x1="${sx(t)}" x2="${sx(t)}" y1="${B}" y2="${B+5}" stroke="#fff"/><text x="${sx(t)}" y="${B+22}" text-anchor="middle">${t}</text>`);
  nice(ya,yb,6).forEach(t=>s+=`<line x1="${L-5}" x2="${L}" y1="${sy(t)}" y2="${sy(t)}" stroke="#fff"/><text x="${L-9}" y="${sy(t)}" text-anchor="end" dominant-baseline="middle">${t}</text>`);
  idx.forEach(i=>{const r=D[i],c=cmap("plasma",gh>gl?(r[9]-gl)/(gh-gl):0);s+=`<circle cx="${sx(r[4])}" cy="${sy(r[9])}" r="6.9" fill="rgb(${c})" fill-opacity=".8"/>`});
  idx.forEach(i=>{const r=D[i];s+=`<text x="${sx(r[4])+4}" y="${sy(r[9])-4}" font-size="9.7" fill="#ccc">${esc(r[0].slice(0,15))}</text>`});
  return `<svg viewBox="0 0 ${W} ${H}" font-family="DejaVu Sans,Verdana,Arial,sans-serif" font-size="13.9" fill="#fff"><rect width="${W}" height="${H}" fill="#0e1117"/>
  <path d="M${L} ${T}V${B}H${Rr}" fill="none" stroke="#444"/><text x="${(L+Rr)/2}" y="26" text-anchor="middle" font-size="16.7">Distribusi Sales per Tahun</text>
  <text x="${(L+Rr)/2}" y="${B+46}" text-anchor="middle">Tahun Rilis</text><text transform="translate(18 ${(T+B)/2}) rotate(-90)" text-anchor="middle">Global Sales (Juta)</text>${s}</svg>`;
}
// ---------- tab 4 (grafik asli matplotlib, sudah dirender)
function eda(){
  const im=n=>`<img class="ch" src="img/${tag}_${n}.png" alt="${n}">`,c=(t,n)=>`<div class="c1"><p><strong>${t}</strong></p>${im(n)}</div>`;
  $("#t4").innerHTML=`<h2 class="sub">📊 Exploratory Data Analysis</h2>
  <div class="cols">${c("🏆 Top 10 Game by Total Global Sales","top10")}${c("🎭 Total Sales per Genre","genre")}</div>
  <div class="cols">${c("📅 Total Sales per Tahun untuk Semua Games","year")}${c("🏢 Top 10 Publisher by Sales","pub")}</div>
  <p><strong>🌍 Perbandingan Penjualan per Region</strong></p>${im("region")}
  <details><summary>🗂️ Lihat Sample Data</summary><div>${df(D.slice(0,50).map((_,i)=>i),null,true,["Name","Platform","Genre","Publisher","Year","NA_Sales","EU_Sales","JP_Sales","Global_Sales"])}</div></details>`;
}
// ---------- UI umum
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".tabs button").forEach(x=>x.setAttribute("aria-selected",x===b));
  document.querySelectorAll(".panel").forEach(p=>p.hidden=p.id!==b.dataset.t)});
document.querySelectorAll(".num").forEach(w=>{const i=w.querySelector("input");w.insertAdjacentHTML("beforeend","<span><button type='button'>−</button><button type='button'>+</button></span>");
  const [m,p]=w.querySelectorAll("button");m.onclick=()=>i.value=Math.max(+i.min,(+i.value||0)-1);p.onclick=()=>i.value=Math.min(+i.max,(+i.value||0)+1)});
const side=$("#side"),mainEl=$("#main");
function shut(v){side.classList.toggle("shut",v);mainEl.classList.toggle("full",v)}
$("#tg").onclick=()=>shut(!side.classList.contains("shut"));
if(innerWidth<900)shut(true);
load("full");