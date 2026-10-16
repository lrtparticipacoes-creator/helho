(() => {
const $=id=>document.getElementById(id),KEY='ideia-mindmap-v1';
const uid=()=>Math.random().toString(36).slice(2,10);
const starter=()=>({title:'Meu mapa mental',root:{id:uid(),text:'Minha ideia central',children:[{id:uid(),text:'Primeira ideia',children:[{id:uid(),text:'Um detalhe importante',children:[]}]},{id:uid(),text:'Segunda ideia',children:[]},{id:uid(),text:'Próximos passos',children:[]}] }});
let map;try{map=JSON.parse(localStorage.getItem(KEY))}catch{}if(!map||!map.root)map=starter();
let selected=map.root.id,zoom=1,panX=0,panY=0,drag=null,positions=new Map(),saveTimer;
const viewport=$('canvasViewport'),world=$('canvasWorld'),layer=$('nodesLayer'),svg=$('connections');
function find(id,node=map.root,parent=null,depth=0){if(node.id===id)return{node,parent,depth};for(const c of node.children||[]){const r=find(id,c,node,depth+1);if(r)return r}return null}
function count(n=map.root){return 1+(n.children||[]).reduce((a,c)=>a+count(c),0)}
function leaves(n){return n.children.length?n.children.reduce((a,c)=>a+leaves(c),0):1}
function walk(n,fn){fn(n);(n.children||[]).forEach(c=>walk(c,fn))}
function save(){clearTimeout(saveTimer);$('saveStatus').innerHTML='<span class="status-dot" style="background:#e6ad5d"></span> Salvando…';saveTimer=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify(map));$('saveStatus').innerHTML='<span class="status-dot"></span> Salvo neste dispositivo'}catch{$('saveStatus').textContent='Não foi possível salvar'}},160)}
function layout(){positions.clear();let cursor=850;const cx=1300;function place(n,depth,branch,parent){let y;if(!n.children.length){y=cursor;cursor+=108}else{const start=cursor;n.children.forEach((c,i)=>place(c,depth+1,depth===0?i:branch,n));y=(start+cursor-108)/2}positions.set(n.id,{x:cx+depth*205,y,depth,branch:Math.max(0,branch),parent:parent&&parent.id});return y}place(map.root,0,0,null);const mid=positions.get(map.root.id).y;positions.forEach(p=>p.y=p.y-mid+850)}
function render(){layout();layer.replaceChildren();svg.replaceChildren();svg.setAttribute('viewBox','0 0 2600 1700');const ns='http://www.w3.org/2000/svg';
for(const [id,p] of positions){if(!p.parent)continue;const q=positions.get(p.parent),path=document.createElementNS(ns,'path');path.setAttribute('d',`M ${q.x+90} ${q.y} C ${q.x+145} ${q.y}, ${p.x-65} ${p.y}, ${p.x-65} ${p.y}`);path.setAttribute('class','connection');path.setAttribute('stroke',['#9588f1','#56b99f','#e6ad5d','#66a7dc'][p.branch%4]);svg.append(path)}
walk(map.root,n=>{const p=positions.get(n.id),el=document.createElement('button');el.type='button';el.className='mind-node'+(n.id===map.root.id?' root':' branch-'+(p.branch%4+1))+(n.id===selected?' selected':'');el.textContent=n.text;el.style.left=(p.x-(n.id===map.root.id?100:70))+'px';el.style.top=(p.y-(n.id===map.root.id?28:23))+'px';el.onclick=e=>{e.stopPropagation();selected=n.id;render()};el.ondblclick=e=>{e.stopPropagation();selected=n.id;rename()};layer.append(el)});
$('mapTitle').value=map.title||'Meu mapa mental';$('breadcrumbTitle').textContent=map.title||'Meu mapa mental';$('nodeCount').textContent=count()+(count()===1?' ideia':' ideias');$('emptyHelp').style.display=count()<=1?'block':'none';transform()}
function transform(){world.style.transform=`translate(calc(-50% + ${panX}px),calc(-50% + ${panY}px)) scale(${zoom})`;$('zoomLabel').textContent=Math.round(zoom*100)+'%'}
function rename(){const f=find(selected);if(!f)return;const v=prompt('Nome da ideia:',f.node.text);if(v===null)return;if(!v.trim())return alert('Digite um nome para a ideia.');f.node.text=v.trim();render();save()}
function addChild(){const f=find(selected),n={id:uid(),text:'Nova ideia',children:[]};f.node.children.push(n);selected=n.id;render();save();rename()}
function addSibling(){const f=find(selected);if(!f.parent)return addChild();const n={id:uid(),text:'Nova ideia',children:[]},i=f.parent.children.findIndex(c=>c.id===selected);f.parent.children.splice(i+1,0,n);selected=n.id;render();save();rename()}
function remove(){const f=find(selected);if(!f||!f.parent)return alert('A ideia central não pode ser excluída.');if(!confirm('Excluir esta ideia e todas as suas ramificações?'))return;f.parent.children=f.parent.children.filter(c=>c.id!==selected);selected=f.parent.id;render();save()}
$('addChildBtn').onclick=addChild;$('addSiblingBtn').onclick=addSibling;$('renameBtn').onclick=rename;$('deleteBtn').onclick=remove;
$('mapTitle').oninput=()=>{map.title=$('mapTitle').value;$('breadcrumbTitle').textContent=map.title||'Meu mapa mental';save()};
$('exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(map,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(map.title||'mapa-mental').toLowerCase().replace(/[^a-z0-9-]+/g,'-')+'.json';a.click();URL.revokeObjectURL(url)};
$('importBtn').onclick=()=>$('importFile').click();$('importFile').onchange=async e=>{try{const m=JSON.parse(await e.target.files[0].text());if(!m.root||!Array.isArray(m.root.children))throw 0;map=m;selected=map.root.id;panX=panY=0;zoom=1;render();save()}catch{alert('Arquivo inválido. Selecione um mapa exportado pelo Ideia.')}e.target.value=''};
$('zoomIn').onclick=()=>{zoom=Math.min(1.6,zoom+.1);transform()};$('zoomOut').onclick=()=>{zoom=Math.max(.5,zoom-.1);transform()};$('centerBtn').onclick=()=>{zoom=1;panX=panY=0;transform()};
$('helpBtn').onclick=()=>$('helpDialog').showModal();$('closeHelp').onclick=()=>$('helpDialog').close();$('gotIt').onclick=()=>$('helpDialog').close();
viewport.onpointerdown=e=>{if(e.target.closest('.mind-node'))return;drag={x:e.clientX,y:e.clientY,px:panX,py:panY};viewport.classList.add('dragging');viewport.setPointerCapture(e.pointerId)};
viewport.onpointermove=e=>{if(!drag)return;panX=drag.px+e.clientX-drag.x;panY=drag.py+e.clientY-drag.y;transform()};
function end(){drag=null;viewport.classList.remove('dragging')}viewport.onpointerup=end;viewport.onpointercancel=end;
viewport.onclick=e=>{if(!e.target.closest('.mind-node')){selected=map.root.id;render()}};
document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName)||$('helpDialog').open)return;if(e.key==='Tab'){e.preventDefault();addChild()}else if(e.key==='Enter'){e.preventDefault();addSibling()}else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();remove()}else if(e.key==='F2')rename();else if(e.key==='Escape'){selected=map.root.id;render()}});
render();if(!localStorage.getItem(KEY))save();
})();