import {createClient} from 'genlayer-js';
import {ensureNetwork} from './wallet.js';
import {studionet} from 'genlayer-js/chains';
import {TransactionStatus, TransactionHashVariant} from 'genlayer-js/types';

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=s=>s.toLowerCase().replaceAll(' ','-');
const safeUrl=s=>{try{const u=new URL(s);return u.protocol==='https:'?u.href:'#'}catch{return '#'}};
const link=(url,label)=>`<a href="${esc(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${esc(label||url)}</a>`;
const samples=[
 {id:'sample-sdk',project:'Atlas Protocol',title:'Ship a public developer SDK',deadline:'2026-09-30',criteria:['Publish a tagged SDK release.','Include an installation guide and working examples.'],status:'Fulfilled',description:'A public release, documentation, and examples support both criteria.',evidence:[{url:'https://github.com',note:'Illustrative release evidence; this is not an actual project assessment.'}],history:[{status:'Fulfilled',evaluated:'2026-10-01',checks:[{state:'met',reason:'Illustrative: a dated release supports the SDK requirement.'},{state:'met',reason:'Illustrative: setup instructions and examples support the documentation requirement.'}]}],sample:true},
 {id:'sample-grant',project:'OpenGrid Collective',title:'Launch the community grants portal',deadline:'2026-09-25',criteria:['Publish a public application portal.','Publish the selection rubric.'],status:'Partially fulfilled',description:'The sample portal is available; evidence for the selection rubric is missing.',evidence:[],history:[{status:'Partially fulfilled',evaluated:'2026-09-26',checks:[{state:'met',reason:'Illustrative: the portal is publicly accessible.'},{state:'unknown',reason:'Illustrative: no dated selection rubric was provided.'}]}],sample:true},
 {id:'sample-audit',project:'Lumen Network',title:'Publish an independent security audit',deadline:'2026-10-31',criteria:['Publish the complete report.','Identify the independent auditor.'],status:'Pending',description:'Awaiting the deadline and public supporting evidence.',evidence:[],history:[],sample:true},
 {id:'sample-docs',project:'Relay Labs',title:'Open-source the indexing service',deadline:'2026-09-20',criteria:['Publish the source code under an open-source license.'],status:'Insufficient evidence',description:'An announcement alone does not establish a public, licensed release.',evidence:[],history:[{status:'Insufficient evidence',evaluated:'2026-09-21',checks:[{state:'unknown',reason:'Illustrative: an announcement does not prove the code was released by the deadline.'}]}],sample:true}
];
const DEFAULT_CONTRACT='0x29cbdD5c5266693170Ad0920c92776dC45BF3c00';
const INTEGRATION_ID='promiselens-integration-20261009';
let items=[],address=DEFAULT_CONTRACT,walletAddress='',writer=null,busy=false,activeId=null;
try{items=JSON.parse(localStorage.getItem('pl-items-v1')||'[]');address=localStorage.getItem('pl-contract')||DEFAULT_CONTRACT;if(!Array.isArray(items))items=[]}catch{items=[]}
const reader=createClient({chain:studionet});
let toastTimer;
function toast(message){$('toast').textContent=message;$('toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').style.display='none',9000)}
function save(){try{localStorage.setItem('pl-items-v1',JSON.stringify(items))}catch{toast('Browser storage is unavailable. Keep this tab open to retain your work.')}}
function visible(){return address?items.filter(p=>p.contract===address):[...items.filter(p=>!p.contract),...samples]}
function render(){
 const all=visible(),q=$('search').value.toLowerCase(),f=$('filter').value;
 $('modePill').textContent=address?'STUDIONET':'LOCAL WORKSPACE';
 $('modeText').textContent=address?'Connected to GenLayer Studio’s development network. Verdicts load from finalized contract state.':'Saved in this browser. Sample verdicts are illustrative; no live evaluation has run.';
 $('connectTop').textContent=address?'◎ Studionet connected':'◎ Connect GenLayer';
 $('createSubmit').textContent=address?'Record on GenLayer':'Save in local workspace';
 $('totalBadge').textContent=all.length;
 const stats=[['Tracked promises',all.length,address?'Loaded from this contract':'Includes 4 illustrative samples'],['Fulfilled',all.filter(p=>p.status==='Fulfilled').length,'All criteria supported'],['Awaiting evaluation',all.filter(p=>p.status==='Pending').length,'No finalized verdict yet'],['Needs more evidence',all.filter(p=>p.status==='Insufficient evidence').length,'Uncertainty stays visible']];
 $('stats').innerHTML=stats.map(([label,n,foot])=>`<div class="stat"><div class="stat-label">${label}</div><div class="stat-value">${n.toString().padStart(2,'0')}</div><div class="stat-foot">${foot}</div></div>`).join('');
 const filtered=all.filter(p=>(f==='all'||p.status===f)&&`${p.title} ${p.project}`.toLowerCase().includes(q));
 $('cards').innerHTML=filtered.map(p=>`<button class="card" data-id="${esc(p.id)}"><div class="card-top"><span class="project"><span class="avatar">${esc(p.project.slice(0,1))}</span>${esc(p.project)}</span><span class="status ${slug(p.status)}">${esc(p.status)}</span></div><h3>${esc(p.title)}</h3><p>${esc(p.description||`${p.criteria.length} fixed acceptance criteria. ${(p.evidence||[]).length} evidence sources submitted.`)}</p><div class="card-bottom"><span>Due ${esc(p.deadline)} · UTC</span><span>${p.sample?'<span class="sample">SAMPLE</span>':`${(p.evidence||[]).length} sources · ${p.contract?'GenLayer':'Local'}`}</span></div></button>`).join('')||'<div class="empty">No promises here yet. Record a promise or load one from your contract.</div>';
 $('cards').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>showDetail(b.dataset.id));
}
function showPage(network){$('board').hidden=network;$('network').hidden=!network;$('breadcrumb').textContent=network?'GenLayer connection':'Promise board';$('boardNav').classList.toggle('active',!network);$('networkNav').classList.toggle('active',network)}
async function perform(fn){if(busy)return;busy=true;document.querySelectorAll('button').forEach(b=>b.disabled=true);try{await fn()}catch(e){toast(e.shortMessage||e.message||'The request failed. Please try again.')}finally{busy=false;document.querySelectorAll('button').forEach(b=>b.disabled=false)}}
async function write(functionName,args){
 if(!writer||!walletAddress)throw Error('Connect your wallet in GenLayer connection first.');
 if(!address)throw Error('Choose a deployed contract first.');
 await ensureNetwork(window.ethereum,studionet);
 const hash=await writer.writeContract({address,functionName,args,value:0n});
 // Retain the hash before waiting so a timeout never hides a submitted write.
 localStorage.setItem('pl-last-transaction',JSON.stringify({hash,functionName,args,contract:address}));
 toast(`Transaction submitted: ${hash}. Waiting for finalization; keep this tab open.`);
 const tx=await writer.waitForTransactionReceipt({hash,status:TransactionStatus.FINALIZED,retries:120,interval:5000});
 const execution=tx.txExecutionResultName??tx.consensus_data?.leader_receipt?.[0]?.execution_result;
 if(execution&&execution!=='FINISHED_WITH_RETURN'&&execution!=='SUCCESS')throw Error(`Contract execution failed (${execution}). Transaction: ${hash}`);
 return hash;
}
async function fetchPromise(id){
 async function read(functionName){let last;for(let attempt=0;attempt<3;attempt++){try{return JSON.parse(await reader.readContract({address,functionName,args:[id],transactionHashVariant:TransactionHashVariant.LATEST_FINAL}))}catch(e){last=e}}throw last}
 const p=await read('get_promise');
 const history=await read('get_history');
 if(!p.id||!Array.isArray(p.criteria)||!Array.isArray(history))throw Error('This contract returned an incompatible PromiseLens record.');
 const entry={...p,history,contract:address};const idx=items.findIndex(x=>x.id===p.id&&x.contract===address);if(idx<0)items.unshift(entry);else items[idx]=entry;save();render();return entry;
}
function showDetail(id){
 activeId=id;const p=visible().find(p=>p.id===id);if(!p)return;
 const history=p.history||[];
 $('detail').innerHTML=`<div class="dialog-top"><span class="eyebrow">${esc(p.project)} ${p.sample?' / ILLUSTRATIVE SAMPLE':''}</span><button class="close" aria-label="Close">×</button></div><span class="status ${slug(p.status)}">${esc(p.status)}</span><h2 class="detail-title">${esc(p.title)}</h2><div class="detail-meta">Deadline: ${esc(p.deadline)} · end of day UTC<br>ID: <span class="mono">${esc(p.id)}</span></div>${p.sample?'<div class="notice small">Fictional example to explain the workflow. No GenLayer evaluation was performed.</div>':`<div class="muted">Original promise: ${link(p.source,'View source')}<br>${p.contract?'Recorder: '+esc(p.owner):'Local draft — not recorded on GenLayer.'}</div>`}<div class="section-label">FIXED ACCEPTANCE CRITERIA</div><ol class="criteria">${p.criteria.map(c=>`<li>${esc(c)}</li>`).join('')}</ol><div class="section-label">PUBLIC EVIDENCE / ${(p.evidence||[]).length}</div>${(p.evidence||[]).map(e=>`<div class="evidence">${link(e.url)}<p>${esc(e.note)}</p></div>`).join('')||'<p class="muted">No supporting sources submitted.</p>'}${!p.sample?`<form id="evidenceForm"><label>Evidence URL<input name="url" type="url" required maxlength="1000" placeholder="https://github.com/…"></label><label>Context (not proof)<textarea name="note" rows="2" maxlength="2000" placeholder="What does this source establish?"></textarea></label><button class="subtle" type="submit">Add evidence</button></form>`:''}<div class="section-label">EVALUATION HISTORY / ${history.length}</div>${history.map(h=>`<div class="history-entry"><span class="status ${slug(h.status)}">${esc(h.status)}</span><p class="muted">${esc(h.evaluated)}</p>${h.checks.map((c,i)=>`<div class="check"><strong>${i+1}. ${esc(c.state.toUpperCase())}</strong> · ${esc(p.criteria[i])}<br>${esc(c.reason)}${c.quote?`<blockquote>${esc(c.quote)}</blockquote>`:''}${c.source>=0&&h.evidence?.[c.source]?link(h.evidence[c.source].url,'Supporting source'):''}</div>`).join('')}</div>`).join('')||'<p class="muted">No evaluation has run. Evidence must be assessed before a verdict is recorded.</p>'}${!p.sample?(p.contract?'<button id="evaluate" class="primary full">Request GenLayer evaluation</button><p class="small muted">Available after the deadline day ends in UTC. Each evaluation is preserved.</p>':'<div class="notice small">Live evaluation requires a deployed contract. Connect GenLayer, then record this promise on Studionet.</div>'):''}`;
 const meta=$('detail').querySelector('.detail-meta');
 if(p.created)meta.insertAdjacentHTML('beforeend',`<br>Recorded: ${esc(p.created)}${p.created.slice(0,10)>p.deadline?' · recorded after the deadline':''}`);
 if(p.contract)meta.insertAdjacentHTML('beforeend',`<br>${link('https://explorer-studio.genlayer.com/address/'+p.contract,'Inspect contract on GenLayer Explorer')} · ${link('https://studio.genlayer.com/run-debug','Open GenLayer Studio')}`);
 if(p.id===INTEGRATION_ID&&p.contract===DEFAULT_CONTRACT)meta.insertAdjacentHTML('beforeend','<br><a href="verification.json" target="_blank" rel="noopener">View finalized transaction verification</a>');
 $('detail').querySelector('.close').onclick=()=>$('detailDialog').close();
 if(!p.sample){$('evidenceForm').onsubmit=e=>{e.preventDefault();const data=new FormData(e.target),url=data.get('url'),note=data.get('note');perform(async()=>{
  const u=new URL(url);if(u.protocol!=='https:'||!['github.com','raw.githubusercontent.com','docs.genlayer.com'].includes(u.hostname)||u.username||u.password||u.port)throw Error('Use an HTTPS URL on github.com, raw.githubusercontent.com, or docs.genlayer.com.');
  if(p.evidence.length>=5)throw Error('Maximum five evidence sources per promise.');
  if(p.evidence.some(e=>e.url===url))throw Error('This URL has already been submitted.');
  if(p.contract){await write('submit_evidence',[p.id,url,note]);await fetchPromise(p.id)}else{p.evidence.push({url,note,submitted:new Date().toISOString()});save();render()}
  showDetail(p.id);toast('Evidence saved. It has not been evaluated yet.');
 })};if(p.contract)$('evaluate').onclick=()=>perform(async()=>{if(new Date().toISOString().slice(0,10)<=p.deadline)throw Error('Evaluation opens after the deadline day ends in UTC.');await write('evaluate',[p.id]);await fetchPromise(p.id);showDetail(p.id);toast('Finalized evaluation loaded from GenLayer.');})}
 if(!$('detailDialog').open)$('detailDialog').showModal();
}
$('newPromise').onclick=()=>{$('createForm').reset();$('createDialog').showModal()};
document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d)d.close()});d.querySelector('.close')?.addEventListener('click',()=>d.close())});
$('search').oninput=render;$('filter').onchange=render;
$('boardNav').onclick=()=>showPage(false);$('networkNav').onclick=$('connectTop').onclick=()=>showPage(true);
$('wallet').onclick=()=>perform(async()=>{if(!window.ethereum)throw Error('Open this site in a browser with an Ethereum-compatible wallet extension.');const accounts=await window.ethereum.request({method:'eth_requestAccounts'});if(!accounts[0])throw Error('Your wallet did not provide an account. Unlock it and try again.');await ensureNetwork(window.ethereum,studionet);walletAddress=accounts[0];writer=createClient({chain:studionet,account:walletAddress,provider:window.ethereum});await ensureNetwork(window.ethereum,studionet);$('account').textContent=walletAddress;$('wallet').textContent='Wallet connected';toast('Connected to GenLayer Studionet.');});
window.ethereum?.on?.('accountsChanged',()=>{writer=null;walletAddress='';$('account').textContent='Account changed. Reconnect your wallet.';$('wallet').textContent='Connect wallet'});
$('address').value=address;
$('saveAddress').onclick=()=>perform(async()=>{const candidate=$('address').value.trim();if(!/^0x[a-fA-F0-9]{40}$/.test(candidate))throw Error('Enter a valid contract address.');const schema=await reader.getContractSchema(candidate);const schemaText=JSON.stringify(schema);if(!['create_promise','submit_evidence','evaluate','get_promise','get_history'].every(s=>schemaText.includes(s)))throw Error('The selected address does not expose the PromiseLens contract methods.');address=candidate;localStorage.setItem('pl-contract',address);render();toast('Studionet contract selected.');showPage(false)});
$('importPromise').onclick=()=>perform(async()=>{if(!address)throw Error('Choose a contract first.');const p=await fetchPromise($('importId').value.trim());showPage(false);showDetail(p.id)});
$('createForm').onsubmit=e=>{e.preventDefault();const data=new FormData(e.target);perform(async()=>{
 const criteria=data.get('criteria').split('\n').map(s=>s.trim()).filter(Boolean),deadline=data.get('deadline');
 if(criteria.length<1||criteria.length>8||criteria.some(c=>c.length>500))throw Error('Provide 1 to 8 criteria, each at most 500 characters.');
 if(!data.get('source').startsWith('https://'))throw Error('The original promise source must use HTTPS.');
 const p={id:crypto.randomUUID(),project:data.get('project').trim(),title:data.get('title').trim(),deadline,criteria,source:data.get('source'),status:'Pending',evidence:[],history:[]};
 if(!p.project||!p.title)throw Error('Enter a project name and promise.');
 if(address){await write('create_promise',[p.id,p.project,p.title,p.source,p.deadline,JSON.stringify(criteria)]);await fetchPromise(p.id)}else{items.unshift(p);save();render()}
 $('createDialog').close();showDetail(p.id);toast(address?'Promise finalized on GenLayer.':'Promise saved locally. Criteria are now fixed.');
 })};
render();
if(address){
 $('modeText').textContent='Loading finalized records from GenLayer Studio’s development network…';
 const ids=[...new Set([...(address===DEFAULT_CONTRACT?[INTEGRATION_ID]:[]),...items.filter(p=>p.contract===address).map(p=>p.id)])];
 Promise.allSettled(ids.map(fetchPromise)).then(results=>{render();if(results.some(r=>r.status==='rejected')){toast('Some live records could not be refreshed. Previously loaded records may be stale. Try loading the promise again in GenLayer connection.');$('modeText').textContent='GenLayer refresh incomplete. Cached records may be stale; no new verdict has been inferred.'}});
}
try{const last=JSON.parse(localStorage.getItem('pl-last-transaction'));if(last)toast(`Previous submitted transaction: ${last.hash}. Check finalization in Studio before resubmitting.`)}catch{}
