/* ============================================================
   BLOOM BABY KIDS — LÓGICA DO PAINEL DE CONTROLE (painel.js)
   ============================================================ */

/* ================================================================
   Painel da Bloom — catálogo real exportado do Siscom
   ================================================================ */
const favicon=document.createElement('link');
favicon.rel='icon'; favicon.type='image/png'; favicon.href='logo.png'; document.head.appendChild(favicon);
const DADOS={"loja":"Bloom baby kids","origem":"Siscom · PRODUTOS BLOOM.xls","gerado_em":"2026-08-29T11:14:11","categorias":{"calcados":"Calçados","maternidade":"Saída de maternidade","enxoval":"Enxoval e cama","banho":"Banho e higiene","alimentacao":"Chupeta e alimentação","brinquedos":"Brinquedos e livros","praia":"Praia","pijamas":"Pijamas","macacoes":"Macacões","body":"Body","vestidos":"Vestidos","saias":"Saias","casacos":"Casacos e jaquetas","calcas":"Calças e shorts","blusas":"Blusas e camisas","conjuntos":"Conjuntos","acessorios":"Acessórios"},"ordem_tamanhos":["PR","RN","P","M","G","GG","XG","U","1","2","3","4","6","8","10","12","14","19/20","21/22","23/24","25/26","27/28","29/30","31/32"],"produtos":[]};
const CAT=DADOS.categorias;
const ORDEM_TAM=DADOS.ordem_tamanhos;
const API_URL='api/catalogo.php';
const UPLOAD_URL='api/upload.php';
const API_TOKEN='4a101b70f48d54e39fa4f26e1e41325607322bdea4d3d60e';
const COLECAO_PADRAO='Coleção Verão 2027';
const TAMANHO_OUTRO='__outro';
function construirCatalogo(produtos,origem='Painel administrativo'){
  return {loja:'Bloom baby kids',origem,gerado_em:new Date().toISOString(),
    colecao:DADOS.colecao||COLECAO_PADRAO,banner:DADOS.banner||'',
    categorias:CAT,ordem_tamanhos:ORDEM_TAM,excluidos:[...EXCLUIDOS],produtos};
}
let EXCLUIDOS=new Set((DADOS.excluidos||[]).map(Number));
let P=DADOS.produtos.map((p,i)=>({...p,i}));
let proxCod=Math.max(...P.map(p=>p.c),0)+1;

const $=i=>document.getElementById(i);
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const rs=v=>'R$ '+Number(v||0).toFixed(2).replace('.',',');
const nrs=s=>{const t=String(s).replace(/[^\d,.-]/g,'').replace(/\.(?=\d{3}\b)/g,'').replace(',','.');
  const n=parseFloat(t); return isNaN(n)?NaN:n;};

/* ---------- busca tolerante a erro (mesmo motor da vitrine) ---------- */
function norm(s){return (s||'').toString().normalize('NFD').replace(/[̀-ͯ]/g,'')
  .toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();}
function lev(a,b){
  if(a===b)return 0;
  const n=a.length,m=b.length;
  if(!n)return m; if(!m)return n;
  if(Math.abs(n-m)>3)return 9;
  let ant=Array.from({length:m+1},(_,j)=>j);
  for(let i=1;i<=n;i++){const cur=[i];
    for(let j=1;j<=m;j++)cur[j]=Math.min(ant[j]+1,cur[j-1]+1,ant[j-1]+(a[i-1]===b[j-1]?0:1));
    ant=cur;}
  return ant[m];
}
const folga=n=>n<=3?0:n<=8?1:2;
const APELIDOS={bikini:'biquini',biquine:'biquini',maio:'biquini',nenem:'bebe',recem:'bebe',
  short:'shorts',calca:'calcas',jaqueta:'casaco',moletom:'casaco',macaquinho:'macacao',
  bodi:'body',bodie:'body',tam:'tamanho',fralda:'mijao'};
const fatiar=q=>norm(q).split(' ').filter(Boolean).map(t=>APELIDOS[t]||t);
function inferirCategoria(texto){
  const t=norm(texto);
  const regras=[
    ['maternidade',['saida de maternidade','maternidade']],
    ['alimentacao',['chupeta','mamadeira','alimentacao']],
    ['brinquedos',['brinquedo','livro infantil']],
    ['calcados',['sapato','tenis','sandalia','rasteira','bota','sapatilha','chinelo']],
    ['praia',['biquini','bikini','sunga','maio','praia']],
    ['banho',['toalha','banho','shampoo','sabonete']],
    ['enxoval',['manta','cobertor','lencol','ninho','kit berco','berco']],
    ['pijamas',['pijama','dormir']],
    ['macacoes',['macacao','macaquinho','jardineira']],
    ['body',['body']],
    ['vestidos',['vestido']],
    ['saias',['saia']],
    ['casacos',['casaco','jaqueta','moletom','blusao','agasalho']],
    ['calcas',['calca','short','bermuda']],
    ['blusas',['blusa','camisa','camiseta']],
    ['conjuntos',['conjunto']]
  ];
  return regras.find(([,palavras])=>palavras.some(p=>t.includes(norm(p))))?.[0]||'acessorios';
}
function indexarProduto(p){
  if(Number(p.promocao)>0){
    p.v.forEach(v=>{if(Number(v.promocao)<=0)v.promocao=Number(p.promocao);});
    delete p.promocao;
  }
  if(!p.cat||p.cat==='acessorios')p.cat=inferirCategoria([p.n,p.bruto].join(' '));
  p.tk=[...new Set(norm([p.n,p.bruto,CAT[p.cat]||'',p.cor,p.v.map(v=>v.t).join(' '),'tamanho tam']
    .join(' ')).split(' '))].filter(Boolean);
  return p;
}
P.forEach(indexarProduto);
function bate(t,tk){
  for(const w of tk) if(w===t)return 3;
  for(const w of tk) if(w.startsWith(t))return 2;
  if(t.length>=4) for(const w of tk) if(w.includes(t))return 2;
  const f=folga(t.length);
  if(f>0){
    for(const w of tk) if(Math.abs(w.length-t.length)<=f&&lev(t,w)<=f)return 1;
    if(t.length>=4) for(const w of tk)
      if(w.length>t.length&&lev(t,w.slice(0,t.length+1))<=f)return 1;
  }
  return 0;
}
function pontos(p,ts){
  let s=0;
  for(const t of ts){const m=bate(t,p.tk); if(!m)return 0; s+=m;}
  if(norm(p.n).startsWith(ts[0]))s+=4;
  return s;
}

/* ---------- estado ---------- */
const S={q:'',cat:'all',sit:'all',pagina:1};
const PORPAG=30;
const sit=p=>{const on=p.v.filter(v=>v.on).length;
  return on===0?'zero':on<p.v.length?'parcial':'ok';};
const totalEst=p=>p.v.reduce((a,v)=>a+(v.on?v.q:0),0);

let tAviso;
function aviso(m,desfazer){
  $('avisoTx').innerHTML=m;
  const b=$('avisoAcao');
  if(desfazer){b.style.display='';b.onclick=()=>{desfazer();$('aviso').classList.remove('on');};}
  else b.style.display='none';
  $('aviso').classList.add('on');
  clearTimeout(tAviso);
  tAviso=setTimeout(()=>$('aviso').classList.remove('on'),desfazer?6000:2600);
}

/* ---------- filtro ---------- */
function filtrar(){
  let l=P.filter(p=>{
    if(S.cat!=='all'&&p.cat!==S.cat)return false;
    if(S.sit!=='all'&&sit(p)!==S.sit)return false;
    return true;
  });
  const ts=fatiar(S.q);
  if(ts.length)l=l.map(p=>({p,s:pontos(p,ts)})).filter(r=>r.s>0).sort((a,b)=>b.s-a.s).map(r=>r.p);
  return l;
}

/* ---------- números ---------- */
function pintarKpis(){
  const nOk=P.filter(p=>sit(p)==='ok').length;
  const nPar=P.filter(p=>sit(p)==='parcial').length;
  const nZero=P.filter(p=>sit(p)==='zero').length;
  const valor=P.reduce((a,p)=>a+p.v.reduce((b,v)=>b+(v.on?v.q*v.p:0),0),0);
  $('kpis').innerHTML=`
    <button class="kpi${S.sit==='all'?' on':''}" data-s="all"><div class="r"><i style="background:var(--tinta)"></i>Peças</div><div class="v">${P.length}</div></button>
    <button class="kpi${S.sit==='ok'?' on':''}" data-s="ok"><div class="r"><i style="background:var(--ok)"></i>À venda</div><div class="v">${nOk}</div></button>
    <button class="kpi${S.sit==='parcial'?' on':''}" data-s="parcial"><div class="r"><i style="background:var(--alerta)"></i>Tam. esgotado</div><div class="v">${nPar}</div></button>
    <button class="kpi${S.sit==='zero'?' on':''}" data-s="zero"><div class="r"><i style="background:var(--ruim)"></i>Fora do site</div><div class="v">${nZero}</div></button>`;
  document.querySelectorAll('.kpi').forEach(k=>k.onclick=()=>{
    S.sit=k.dataset.s; $('fSit').value=S.sit; S.pagina=1; pintar();
  });
}

/* ---------- lista ---------- */
function cartao(p){
  const st=sit(p);
  const selo=st==='ok'?'<span class="selo ok">no site</span>'
    :st==='parcial'?'<span class="selo parcial">falta tamanho</span>'
    :'<span class="selo zero">fora do site</span>';
  const pmin=Math.min(...p.v.map(v=>v.p)), pmax=Math.max(...p.v.map(v=>v.p));
  const precoNormal=pmin===pmax?rs(pmin):rs(pmin)+' a '+rs(pmax);
  const nPromocoes=p.v.filter(v=>Number(v.promocao)>0).length;
  const preco=nPromocoes?`${precoNormal} <small>promoção em ${nPromocoes} tam.</small>`:precoNormal;
  const fotoHtml=p.foto?`<img src="${esc(p.foto)}" alt="${esc(p.n)}">`:`sem<br>foto`;
  return `<article class="peca${st==='zero'?' esgotada':''}" data-p="${p.i}">
    <div class="ph">
      <div class="mini">${fotoHtml}</div>
      <div class="pinfo">
        <h3>${esc(p.n)}</h3>
        <p class="meta">${esc(CAT[p.cat]||'—')}${p.cor?' · '+esc(p.cor):''} · cód. ${esc(p.c)}</p>
        <p class="preco">${preco}</p>
      </div>
      <div class="pmais">
        <button class="icone" data-menu="${p.i}"><svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></svg></button>
        <div class="menu" data-lista="${p.i}">
          <button data-editar="${p.i}"><svg viewBox="0 0 24 24"><path d="M4 20h4L19 9a2.5 2.5 0 0 0-3.5-3.5L4 16v4z"/></svg>Editar peça</button>
          <button data-todos="${p.i}"><svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 7"/></svg>${st==='zero'?'Devolver ao site':'Tirar do site'}</button>
          <div class="div"></div>
          <button data-excluir="${p.i}" style="color:var(--ruim)"><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>Excluir</button>
        </div>
      </div>
    </div>
    <div class="tams">
      <span class="rot">${selo}</span>
      ${p.v.map((v,j)=>`<button class="tam${v.on?'':' off'}" data-t="${p.i}|${j}">
      ${esc(v.t)}<small>${esc(v.q)} un</small></button>`).join('')}
    </div>
  </article>`;
}
function pintar(){
  const l=filtrar();
  $('conta').textContent=l.length===P.length
    ? `${l.length} peças no catálogo`
    : `${l.length} de ${P.length} peças`;
  const fim=S.pagina*PORPAG;
  $('lista').innerHTML=l.length?l.slice(0,fim).map(cartao).join('')
    :`<div class="vazio"><h3>Nenhuma peça assim</h3><p>Tente outro termo ou limpe os filtros.</p></div>`;
  $('mais').innerHTML=l.length>fim
    ? `<button class="bt bt-linha" id="btMais">Mostrar mais ${Math.min(PORPAG,l.length-fim)} de ${l.length-fim}</button>`
    : '';
  const bm=$('btMais'); if(bm)bm.onclick=()=>{S.pagina++;pintar();};
  pintarKpis();
}

/* ---------- toque no tamanho ---------- */
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-t]');
  if(t){
    const [pi,vj]=t.dataset.t.split('|').map(Number);
    const p=P[pi], v=p.v[vj], antes=v.on;
    v.on=!v.on;
    pintar();
    const saiu=sit(p)==='zero';
    const msg=v.on?`<b>${esc(p.n)}</b> · tamanho ${esc(v.t)} voltou ao site`
      :saiu?`<b>${esc(p.n)}</b> saiu da vitrine — todos os tamanhos esgotados`
           :`<b>${esc(p.n)}</b> · tamanho ${esc(v.t)} saiu do site`;
    const dados=construirCatalogo(P.map(({tk,...produto})=>produto));
    salvarCatalogo(dados).then(()=>{
      aviso(msg,()=>{
        v.on=antes; pintar();
        const desfeito=construirCatalogo(P.map(({tk,...produto})=>produto));
        salvarCatalogo(desfeito).then(()=>aviso('Desfeito')).catch(erro=>{v.on=!antes;pintar();aviso(erro.message);});
      });
    }).catch(erro=>{
      v.on=antes; pintar(); aviso(erro.message);
    });
    return;
  }
  const m=e.target.closest('[data-menu]');
  document.querySelectorAll('.menu.on').forEach(x=>{if(!m||x.dataset.lista!==m.dataset.menu)x.classList.remove('on');});
  if(m){document.querySelector(`[data-lista="${m.dataset.menu}"]`).classList.toggle('on');return;}
  const ed=e.target.closest('[data-editar]'); if(ed){abrirEditor(+ed.dataset.editar);return;}
  const td=e.target.closest('[data-todos]'); if(td){
    const p=P[+td.dataset.todos], antes=p.v.map(v=>v.on), ligar=sit(p)==='zero';
    p.v.forEach(v=>v.on=ligar); pintar();
    const produtos=P.map(({tk,...produto})=>produto);
    const dados=construirCatalogo(produtos);
    salvarCatalogo(dados).then(()=>{
      aviso(ligar?`<b>${esc(p.n)}</b> voltou ao site`:`<b>${esc(p.n)}</b> saiu da vitrine`,
        ()=>{p.v.forEach((v,j)=>v.on=antes[j]);pintar();aviso('Desfeito');});
    }).catch(erro=>{
      p.v.forEach((v,j)=>v.on=antes[j]); pintar(); aviso(erro.message);
    });
    return;
  }
  const ex=e.target.closest('[data-excluir]'); if(ex){excluir(+ex.dataset.excluir);return;}
});

async function excluir(i){
  const p=P[i], pos=P.indexOf(p);
  if(!window.confirm(`Excluir "${p.n}"? Esta ação poderá ser desfeita apenas agora.`))return;
  P.splice(pos,1); P.forEach((x,k)=>x.i=k); S.pagina=1; EXCLUIDOS.add(p.c); pintar();
  const dados=construirCatalogo(P.map(({tk,...produto})=>produto));
  try{
    await salvarCatalogo(dados);
    aviso(`<b>${esc(p.n)}</b> excluída`,async()=>{
      P.splice(pos,0,p); P.forEach((x,k)=>x.i=k); EXCLUIDOS.delete(p.c); pintar();
      try{
        const restaurado={...dados,excluidos:[...EXCLUIDOS],gerado_em:new Date().toISOString(),produtos:P.map(({tk,...produto})=>produto)};
        await salvarCatalogo(restaurado);
        aviso('Exclusão desfeita');
      }catch(erro){
        P.splice(pos,1); P.forEach((x,k)=>x.i=k); EXCLUIDOS.add(p.c); pintar(); aviso(erro.message);
      }
    });
  }catch(erro){
    P.splice(pos,0,p); P.forEach((x,k)=>x.i=k); EXCLUIDOS.delete(p.c); pintar(); aviso(erro.message);
  }
}

/* ---------- editor ---------- */
let editando=null, rascunho=null;
function abrirEditor(i){
  editando=i;
  const p=i===null?{c:proxCod,n:'',cat:'macacoes',cor:'',v:[]}:P[i];
  rascunho=JSON.parse(JSON.stringify(p));
  $('edTitulo').textContent=i===null?'Nova peça':'Editar peça';
  $('edNome').value=rascunho.n;
  $('edCat').value=rascunho.cat||'macacoes';
  $('edCor').value=rascunho.cor||'';
  $('edCod').value=rascunho.c||'';
  fotoUploader.estado.pendente=null;
  fotoUploader.atualizarPrevia(rascunho.foto||'');
  $('edExcluir').style.display=i===null?'none':'';
  $('msgNome').classList.remove('on'); $('msgVar').classList.remove('on');
  $('edNome').classList.remove('erro');
  pintarGrade();
  $('telaEd').classList.add('on'); document.body.classList.add('trava');
}
function comprimirImagem(file,maxDim=800,qualidade=0.85){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    const url=URL.createObjectURL(file);
    img.onload=()=>{
      URL.revokeObjectURL(url);
      let w=img.width, h=img.height;
      if(w>maxDim||h>maxDim){
        if(w>h){ h=Math.round((h*maxDim)/w); w=maxDim; }
        else{ w=Math.round((w*maxDim)/h); h=maxDim; }
      }
      const canvas=document.createElement('canvas');
      canvas.width=w; canvas.height=h;
      const ctx=canvas.getContext('2d');
      ctx.imageSmoothingEnabled=true;
      ctx.imageSmoothingQuality='high';
      ctx.drawImage(img,0,0,w,h);
      resolve(canvas.toDataURL('image/jpeg',qualidade));
    };
    img.onerror=()=>reject(new Error('Erro na imagem'));
    img.src=url;
  });
}
async function enviarImagem(dataUrl,pasta){
  const resposta=await fetch(UPLOAD_URL,{
    method:'POST',
    headers:{'Content-Type':'application/json','X-Bloom-Token':API_TOKEN},
    body:JSON.stringify({imagem:dataUrl,pasta})
  });
  const resultado=await resposta.json().catch(()=>null);
  if(!resposta.ok||!resultado||resultado.ok!==true){
    throw new Error(resultado&&resultado.erro||'Não foi possível enviar a foto.');
  }
  return resultado.url;
}
async function lerComoDataUrl(f){
  return new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=ev=>resolve(ev.target.result);
    r.onerror=()=>reject(new Error('Não foi possível ler o arquivo.'));
    r.readAsDataURL(f);
  });
}
/* Liga uma caixa de foto (clique/arraste/remover) ao upload — usado pela foto da peça e pelo banner. */
function configurarUploadImagem({box,previa,img,upload,arquivo,btEscolher,btRemover,pasta,maxDim=800,qualidade=0.85,aoDefinir}){
  const estado={pendente:null};
  function atualizarPrevia(src){
    aoDefinir(src||'');
    if(src){
      img.src=src; previa.classList.add('on'); upload.style.display='none';
    }else{
      img.src=''; previa.classList.remove('on'); upload.style.display='flex';
    }
  }
  async function processar(f){
    let dataUrl;
    try{ dataUrl=await comprimirImagem(f,maxDim,qualidade); }
    catch(err){ dataUrl=await lerComoDataUrl(f); }
    atualizarPrevia(dataUrl);
    const promessa=enviarImagem(dataUrl,pasta).then(url=>{
      if(estado.pendente===promessa)aoDefinir(url);
      return url;
    });
    estado.pendente=promessa;
    promessa.catch(()=>{});
  }
  upload.onclick=()=>arquivo.click();
  if(btEscolher)btEscolher.onclick=()=>arquivo.click();
  arquivo.onchange=async e=>{const f=e.target.files[0]; if(f)await processar(f);};
  ['dragenter','dragover'].forEach(t=>box.addEventListener(t,e=>{e.preventDefault();box.classList.add('sobre');}));
  ['dragleave','drop'].forEach(t=>box.addEventListener(t,e=>{e.preventDefault();box.classList.remove('sobre');}));
  box.addEventListener('drop',async e=>{
    if(e.dataTransfer.files[0]){
      const f=e.dataTransfer.files[0];
      if(f.type.startsWith('image/'))await processar(f);
    }
  });
  if(btRemover)btRemover.onclick=e=>{
    e.stopPropagation();
    arquivo.value='';
    estado.pendente=null;
    atualizarPrevia('');
  };
  return {estado,atualizarPrevia};
}
const fotoUploader=configurarUploadImagem({
  box:$('edFotoBox'),previa:$('edFotoPrevia'),img:$('edFotoImg'),upload:$('edFotoUpload'),
  arquivo:$('edFotoArq'),btEscolher:$('btEscolherFoto'),btRemover:$('btRemFoto'),
  pasta:'produtos',aoDefinir:src=>{if(rascunho)rascunho.foto=src;}
});
function prepararTamanhos(){
  $('novoTam').innerHTML='<option value="">Selecione o tamanho</option>'
    +ORDEM_TAM.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('')
    +'<option value="__outro">Outro tamanho...</option>';
  $('novoTam').onchange=()=>{
    const outro=$('novoTam').value===TAMANHO_OUTRO;
    $('novoTamOutro').style.display=outro?'':'none';
    if(outro)$('novoTamOutro').focus();
  };
}
prepararTamanhos();
function pintarGrade(){
  rascunho.v.sort((a,b)=>(ORDEM_TAM.indexOf(a.t)+99*(ORDEM_TAM.indexOf(a.t)<0))-(ORDEM_TAM.indexOf(b.t)+99*(ORDEM_TAM.indexOf(b.t)<0)));
  $('edGrade').innerHTML=`<div class="linhaV cab"><span>Tamanho</span><span>Preço / promoção</span><span>No site</span></div>`
    + (rascunho.v.length?rascunho.v.map((v,j)=>`
      <div class="linhaV">
        <b>${v.t}</b>
        <div>
          <div class="prefixo"><span>R$</span><input type="text" value="${v.p.toFixed(2).replace('.',',')}" data-preco="${j}" inputmode="decimal" style="padding:8px 10px 8px 34px;border-radius:9px"></div>
          <div class="prefixo" style="margin-top:4px"><span>R$</span><input type="text" value="${v.promocao?Number(v.promocao).toFixed(2).replace('.',','):''}" data-promocao="${j}" inputmode="decimal" placeholder="promoção" style="padding:6px 10px 6px 34px;border-radius:9px;font-size:12px"></div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;justify-content:flex-end">
          <button class="chave${v.on?' on':''}" data-chave="${j}"><i></i></button>
          <button class="icone" data-tirar="${j}" style="width:34px;height:34px"><svg viewBox="0 0 24 24" style="width:15px;height:15px"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        </div>
      </div>`).join('')
      : `<div class="linhaV" style="grid-template-columns:1fr;color:var(--tenue);font-size:12.5px">Nenhum tamanho cadastrado ainda.</div>`);
  $('edGrade').querySelectorAll('[data-chave]').forEach(b=>b.onclick=()=>{
    rascunho.v[+b.dataset.chave].on=!rascunho.v[+b.dataset.chave].on; pintarGrade();});
  $('edGrade').querySelectorAll('[data-tirar]').forEach(b=>b.onclick=()=>{
    rascunho.v.splice(+b.dataset.tirar,1); pintarGrade();});
  $('edGrade').querySelectorAll('[data-preco]').forEach(inp=>inp.onchange=()=>{
    const n=nrs(inp.value); if(!isNaN(n)&&n>0)rascunho.v[+inp.dataset.preco].p=n; pintarGrade();});
  $('edGrade').querySelectorAll('[data-promocao]').forEach(inp=>inp.onchange=()=>{
    const n=nrs(inp.value), v=rascunho.v[+inp.dataset.promocao];
    if(!isNaN(n)&&n>0)v.promocao=n; else delete v.promocao;
    pintarGrade();});
}
$('addTam').onclick=()=>{
  const valorTamanho=$('novoTam').value===TAMANHO_OUTRO?$('novoTamOutro').value:$('novoTam').value;
  const t=valorTamanho.trim().toUpperCase(), p=nrs($('novoPreco').value);
  if(!t){aviso('Informe o tamanho');return;}
  if(isNaN(p)||p<=0){aviso('Informe o preço');return;}
  if(rascunho.v.some(v=>v.t===t)){aviso('Esse tamanho já está na lista');return;}
  rascunho.v.push({t,q:1,p,e:'',on:true});
  $('novoTam').value=''; $('novoTamOutro').value=''; $('novoTamOutro').style.display='none'; $('novoPreco').value=''; pintarGrade();
};
$('edSalvar').onclick=async()=>{
  let ok=true;
  rascunho.n=$('edNome').value.trim();
  rascunho.cat=$('edCat').value;
  rascunho.cor=$('edCor').value.trim();
  const cod=parseInt($('edCod').value); if(!isNaN(cod))rascunho.c=cod;
  if(!rascunho.n){$('edNome').classList.add('erro');$('msgNome').classList.add('on');ok=false;}
  if(!rascunho.v.length){$('msgVar').classList.add('on');ok=false;}
  if(!ok){aviso('Faltou preencher algo');return;}
  rascunho.bruto=rascunho.bruto||rascunho.n.toUpperCase();
  rascunho.tk=[...new Set(norm([rascunho.n,CAT[rascunho.cat]||'',rascunho.cor,
    rascunho.v.map(v=>v.t).join(' '),'tamanho tam'].join(' ')).split(' '))].filter(Boolean);
  const listaAnterior=P.slice();
  if(editando===null){
    rascunho.i=P.length; if(rascunho.c>=proxCod)proxCod=rascunho.c+1;
    P.unshift(rascunho); P.forEach((x,k)=>x.i=k);
  }else{
    rascunho.i=editando; P[editando]=rascunho;
  }
  const botao=$('edSalvar');
  const textoBotao=botao.textContent;
  botao.disabled=true;
  try{
    if(fotoUploader.estado.pendente){
      botao.textContent='Enviando foto…';
      try{ await fotoUploader.estado.pendente; }
      catch(erro){ throw new Error('Não foi possível enviar a foto: '+erro.message); }
      fotoUploader.estado.pendente=null;
    }
    botao.textContent=textoBotao;
    const produtos=P.map(({tk,...produto})=>produto);
    const dados=construirCatalogo(produtos);
    await salvarCatalogo(dados);
    fecharEditor(); S.pagina=1; pintar();
    aviso(`<b>${esc(rascunho.n)}</b> ${editando===null?'cadastrada':'atualizada'}`);
  }catch(erro){
    P=listaAnterior; P.forEach((produto,i)=>produto.i=i);
    pintar();
    aviso(erro.message);
  }finally{botao.disabled=false;botao.textContent=textoBotao;}
};
function fecharEditor(){$('telaEd').classList.remove('on');document.body.classList.remove('trava');}
$('edFechar').onclick=fecharEditor; $('edCancelar').onclick=fecharEditor;
$('edExcluir').onclick=()=>{const i=editando;fecharEditor();if(i!==null)excluir(i);};
$('btNova').onclick=()=>abrirEditor(null);

/* ---------- importar ---------- */
$('btImportar').onclick=()=>{$('telaImp').classList.add('on');document.body.classList.add('trava');};
$('btExportar').onclick=()=>{
  const produtos=P.map(({tk,...produto})=>produto);
  const dados=construirCatalogo(produtos,'Backup local');
  const arquivo=new Blob([JSON.stringify(dados,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(arquivo), link=document.createElement('a');
  link.href=url; link.download=`bloom-catalogo-${new Date().toISOString().slice(0,10)}.json`;
  link.click(); URL.revokeObjectURL(url); aviso('Backup baixado');
};
$('btLimpar').onclick=async()=>{
  const quantidade=P.length;
  if(!quantidade){aviso('A lista de produtos já está vazia');return;}
  if(!window.confirm(`Limpar os ${quantidade} produtos do painel? Faça um backup antes. Esta ação não pode ser desfeita.`))return;
  const botao=$('btLimpar');
  const excluidosAnterior=new Set(EXCLUIDOS);
  EXCLUIDOS=new Set();
  const dados=construirCatalogo([]);
  botao.disabled=true;
  try{
    await salvarCatalogo(dados);
    P=[]; DADOS.produtos=[]; proxCod=1; S.pagina=1; pintar(); aviso('Lista de produtos limpa');
  }catch(erro){EXCLUIDOS=excluidosAnterior; aviso(erro.message);}
  finally{botao.disabled=false;}
};
function fecharImp(){$('telaImp').classList.remove('on');document.body.classList.remove('trava');$('impResultado').innerHTML='';}
$('impFechar').onclick=fecharImp; $('impCancelar').onclick=fecharImp;
$('telaImp').onclick=e=>{if(e.target===$('telaImp'))fecharImp();};
let bannerRascunho='';
const bannerUploader=configurarUploadImagem({
  box:$('txtBannerBox'),previa:$('txtBannerPrevia'),img:$('txtBannerImg'),upload:$('txtBannerUpload'),
  arquivo:$('txtBannerArq'),btEscolher:$('btEscolherBanner'),btRemover:$('btRemBanner'),
  pasta:'banner',maxDim:1000,aoDefinir:src=>{bannerRascunho=src;}
});
$('btTextos').onclick=()=>{
  $('txtColecao').value=DADOS.colecao||COLECAO_PADRAO;
  bannerUploader.estado.pendente=null;
  bannerUploader.atualizarPrevia(DADOS.banner||'');
  fetch(API_URL,{cache:'no-store'}).then(r=>r.ok?r.json():null).then(atual=>{
    if(atual&&typeof atual.colecao==='string'){
      DADOS.colecao=atual.colecao; $('txtColecao').value=atual.colecao||COLECAO_PADRAO;
    }
    if(atual&&typeof atual.banner==='string'){
      DADOS.banner=atual.banner; bannerUploader.atualizarPrevia(atual.banner);
    }
  }).catch(()=>{});
  $('telaTextos').classList.add('on'); document.body.classList.add('trava');
};
function fecharTextos(){$('telaTextos').classList.remove('on');document.body.classList.remove('trava');}
$('txtFechar').onclick=fecharTextos; $('txtCancelar').onclick=fecharTextos;
$('telaTextos').onclick=e=>{if(e.target===$('telaTextos'))fecharTextos();};
$('txtSalvar').onclick=async()=>{
  const colecao=$('txtColecao').value.trim()||COLECAO_PADRAO;
  const botao=$('txtSalvar');
  const textoBotao=botao.textContent;
  botao.disabled=true;
  try{
    if(bannerUploader.estado.pendente){
      botao.textContent='Enviando banner…';
      try{ await bannerUploader.estado.pendente; }
      catch(erro){ throw new Error('Não foi possível enviar o banner: '+erro.message); }
      bannerUploader.estado.pendente=null;
      botao.textContent=textoBotao;
    }
    const banner=bannerRascunho;
    let produtos=P.map(({tk,...produto})=>produto);
    const dados={...construirCatalogo(produtos),colecao,banner};
    if(!produtos.length){
      const resposta=await fetch(API_URL,{cache:'no-store'});
      const atual=await resposta.json();
      if(Array.isArray(atual.produtos)){
        produtos=atual.produtos;
        dados.produtos=produtos;
      }
    }
    await salvarCatalogo(dados); DADOS.colecao=colecao; DADOS.banner=banner; fecharTextos(); aviso('Texto e foto da vitrine atualizados');
  }catch(erro){ aviso(erro.message); }
  finally{botao.disabled=false;botao.textContent=textoBotao;}
};
$('solta').onclick=()=>$('arq').click();
['dragenter','dragover'].forEach(t=>$('solta').addEventListener(t,e=>{e.preventDefault();$('solta').classList.add('sobre');}));
['dragleave','drop'].forEach(t=>$('solta').addEventListener(t,e=>{e.preventDefault();$('solta').classList.remove('sobre');}));
$('solta').addEventListener('drop',e=>{if(e.dataTransfer.files[0])simular(e.dataTransfer.files[0]);});
$('arq').onchange=e=>{if(e.target.files[0])simular(e.target.files[0]);};
function cabecalho(v){return String(v||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');}
function valorLinha(linha,nomes){
  const chave=Object.keys(linha).find(k=>nomes.includes(cabecalho(k)));
  return chave===undefined?'':linha[chave];
}
function codigoNumerico(valor){
  const n=String(valor||'').replace(/\D/g,'');
  return n?parseInt(n,10):NaN;
}
function linhasXml(texto){
  const documento=new DOMParser().parseFromString(texto,'application/xml');
  if(documento.querySelector('parsererror'))throw new Error('XML inválido ou incompleto.');
  const linhas=[];
  documento.querySelectorAll('*').forEach(elemento=>{
    const linha={};
    Array.from(elemento.attributes).forEach(atributo=>{linha[atributo.name]=atributo.value;});
    Array.from(elemento.children).forEach(campo=>{
      if(campo.children.length===0)linha[campo.tagName]=campo.textContent.trim();
    });
    if(Object.keys(linha).length)linhas.push(linha);
  });
  return linhas;
}
function importarPlanilha(f){
  return new Promise((resolve,reject)=>{
    const leitor=new FileReader();
    leitor.onload=e=>{
      try{
        const linhas=/\.xml$/i.test(f.name)
          ? linhasXml(new TextDecoder('utf-8').decode(e.target.result))
          : (()=>{const livro=XLSX.read(e.target.result,{type:'array',cellDates:false});return XLSX.utils.sheet_to_json(livro.Sheets[livro.SheetNames[0]],{defval:''});})();
        const agrupado=new Map();
        linhas.forEach(linha=>{
          const c=codigoNumerico(valorLinha(linha,['CODPRODUTO','CODIGO','COD']));
          const t=String(valorLinha(linha,['TAMANHO','TAM'])).trim().toUpperCase();
          if(!c||!t)return;
          const anterior=agrupado.get(c)||{c,n:String(valorLinha(linha,['DESCRICAO','PRODUTO','NOME'])).trim(),v:[]};
          const preco=nrs(valorLinha(linha,['PRECO','VALOR','PREÇ']));
          const qtd=Number(String(valorLinha(linha,['QTDE','QUANTIDADE','ESTOQUE'])).replace(',','.'))||0;
          const existente=anterior.v.find(v=>v.t===t);
          const variante={t,q:qtd,p:isNaN(preco)?0:preco,e:String(valorLinha(linha,['CODBARRAS','EAN','BARRAS'])).trim(),on:qtd>0};
          if(existente)Object.assign(existente,variante);else anterior.v.push(variante);
          agrupado.set(c,anterior);
        });
        if(!agrupado.size)throw new Error('Nenhuma linha válida. Confira os cabeçalhos CODPRODUTO, DESCRICAO, TAMANHO, QTDE e PREÇO.');
        const antigos=new Map(P.map(p=>[p.c,p]));
        const produtosPorCodigo=new Map(antigos);
        agrupado.forEach(novo=>{
          if(EXCLUIDOS.has(novo.c))return;
          const antigo=antigos.get(novo.c)||{};
          const v=novo.v.filter(v=>v.p>0);
          if(!v.length)return;
          produtosPorCodigo.set(novo.c,{...antigo,...novo,n:novo.n||antigo.n||`Peça ${novo.c}`,cat:antigo.cat&&antigo.cat!=='acessorios'?antigo.cat:inferirCategoria(novo.n),cor:antigo.cor||'',bruto:antigo.bruto||novo.n.toUpperCase(),v,pmin:Math.min(...v.map(x=>x.p)),pmax:Math.max(...v.map(x=>x.p)),est:v.reduce((s,x)=>s+x.q,0)});
        });
        const produtos=[...produtosPorCodigo.values()];
        resolve(construirCatalogo(produtos,`Siscom · ${f.name}`));
      }catch(erro){reject(erro);}
    };
    leitor.onerror=()=>reject(new Error('Não foi possível ler o arquivo.'));
    leitor.readAsArrayBuffer(f);
  });
}
async function salvarCatalogo(dados){
  const resposta=await fetch(API_URL,{
    method:'POST',
    headers:{'Content-Type':'application/json','X-Bloom-Token':API_TOKEN},
    body:JSON.stringify(dados)
  });
  const resultado=await resposta.json().catch(()=>null);
  if(!resposta.ok||!resultado||resultado.ok!==true){
    throw new Error(resultado&&resultado.erro||'Não foi possível salvar o catálogo.');
  }
  return resultado;
}
async function simular(f){
  $('impResultado').innerHTML='<div class="nota">Lendo a planilha e preparando o catálogo…</div>';
  try{
    const dados=await importarPlanilha(f);
    await salvarCatalogo(dados);
    P=dados.produtos.map((p,i)=>indexarProduto({...p,i})); proxCod=Math.max(...P.map(p=>p.c),0)+1; S.pagina=1; pintar();
    $('impResultado').innerHTML=`<div class="nota" style="background:var(--ok-bg)"><svg viewBox="0 0 24 24" style="stroke:var(--ok)"><path d="M4 12l5 5L20 7"/></svg><div><b>${f.name}</b> importado com sucesso.<br>${P.length} peças foram salvas.</div></div>`;
  }catch(erro){$('impResultado').innerHTML=`<div class="nota" style="background:#fff0ed;color:var(--ruim)">${erro.message}</div>`;}
}

/* ---------- filtros e busca ---------- */
$('fCat').innerHTML='<option value="all">Todas as categorias</option>'
  + Object.keys(CAT).map(k=>`<option value="${k}">${CAT[k]}</option>`).join('');
$('edCat').innerHTML=Object.keys(CAT).map(k=>`<option value="${k}">${CAT[k]}</option>`).join('');
$('fCat').onchange=e=>{S.cat=e.target.value;S.pagina=1;pintar();};
$('fSit').onchange=e=>{S.sit=e.target.value;S.pagina=1;pintar();};
$('busca').oninput=e=>{S.q=e.target.value;S.pagina=1;
  $('limpaBusca').style.display=e.target.value?'grid':'none';pintar();};
$('limpaBusca').onclick=()=>{$('busca').value='';S.q='';$('limpaBusca').style.display='none';pintar();};
addEventListener('keydown',e=>{
  const digitando=/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
  if(e.key==='Escape'){fecharEditor();fecharImp();document.querySelectorAll('.menu.on').forEach(x=>x.classList.remove('on'));}
  if(e.key==='/'&&!digitando){e.preventDefault();$('busca').focus();}
  if((e.key==='n'||e.key==='N')&&!digitando){e.preventDefault();abrirEditor(null);}
});

async function carregarCatalogo(){
  try{
    const resposta=await fetch(API_URL,{cache:'no-store'});
    if(!resposta.ok)return;
    const dados=await resposta.json();
    if(!Array.isArray(dados.produtos))return;
    if(typeof dados.colecao==='string')DADOS.colecao=dados.colecao;
    if(typeof dados.banner==='string')DADOS.banner=dados.banner;
    if(Array.isArray(dados.excluidos))EXCLUIDOS=new Set(dados.excluidos.map(Number));
    P=dados.produtos.map((p,i)=>indexarProduto({...p,i}));
    proxCod=Math.max(...P.map(p=>p.c),0)+1;
    pintar();
  }catch(erro){ /* mantém o painel utilizável mesmo sem API disponível */ }
}

pintar();
carregarCatalogo();
