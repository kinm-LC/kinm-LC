import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
await fs.mkdir(root+'assets', {recursive:true});
const user = 'kinm-LC';
const offline = process.argv.includes('--snapshot');
const token = process.env.GH_TOKEN;
const headers = {Accept:'application/vnd.github+json', 'User-Agent':'kinm-LC-profile', ...(token ? {Authorization:`Bearer ${token}`} : {})};
async function api(path, body) {
  const r = await fetch(`https://api.github.com/${path}`, {headers, ...(body ? {method:'POST', body:JSON.stringify(body)} : {})});
  if (!r.ok) throw new Error(`GitHub API: ${r.status} (${path})`);
  return r.json();
}
const read = async name => JSON.parse((await fs.readFile(root+'assets/'+name,'utf8')).replace(/^\uFEFF/,''));
let profile, repos=[];
if (offline) {profile=await read('profile-source.json'); repos=await read('repos-source.json');}
else {
  profile=await api(`users/${user}`);
  for(let page=1;;page++) {const batch=await api(`users/${user}/repos?per_page=100&page=${page}`); repos.push(...batch); if(batch.length<100) break;}
}
let calendar=null, calendarStatus='Aguardando sincronização autenticada';
if(token && !offline) {
  try {
    const result=await api('graphql',{query:'query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel weekday}}}}}}',variables:{login:user}});
    if(result.errors || !result.data?.user) throw new Error('Calendário indisponível');
    calendar=result.data.user.contributionsCollection.contributionCalendar;
    calendarStatus='Contribuições retornadas pelo GitHub • últimos 12 meses';
  } catch {calendarStatus='Calendário indisponível nesta sincronização'; console.warn(calendarStatus);}
}
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const text=(x,y,s,size=14,color='#97a6c8',extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${e(s)}</text>`;
const selected=repos.filter(r=>!r.fork && !r.archived && r.name.toLowerCase()!==user.toLowerCase()).sort((a,b)=>b.stargazers_count-a.stargazers_count || b.pushed_at.localeCompare(a.pushed_at)).slice(0,3);
const langs={}; for(const r of repos.filter(r=>!r.fork && r.name.toLowerCase()!==user.toLowerCase())) if(r.language) langs[r.language]=(langs[r.language]||0)+1;
const languageNames=Object.keys(langs).sort((a,b)=>langs[b]-langs[a]).slice(0,6);
const stars=repos.filter(r=>!r.fork).reduce((n,r)=>n+r.stargazers_count,0);
const date=offline?(await read('snapshot-metadata.json')).checkedAt:new Date().toISOString();
const starscape=Array.from({length:100},(_,i)=>`<circle cx="${(i*137+31)%1200}" cy="${(i*83+17)%1500}" r="${i%5===0?1.5:0.7}" fill="#c2d6ff" opacity="${.2+(i%4)*.15}"/>`).join('');
const defs=`<defs><radialGradient id="space"><stop stop-color="#181944"/><stop offset="1" stop-color="#070b19"/></radialGradient><linearGradient id="planet" x2="1" y2="1"><stop stop-color="#65e5ff"/><stop offset=".45" stop-color="#6c59ed"/><stop offset="1" stop-color="#191c46"/></linearGradient><linearGradient id="tail"><stop stop-color="#ab7bff" stop-opacity="0"/><stop offset="1" stop-color="#90f6ff"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="5"/></filter></defs>`;
function svg(h,body,title) {return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${h}" viewBox="0 0 1200 ${h}" role="img" aria-label="${e(title)}"><title>${e(title)}</title>${defs}<rect width="1200" height="${h}" rx="20" fill="url(#space)"/><g font-family="Segoe UI,Arial,sans-serif">${body}</g></svg>`;}
const hero=svg(440,`${starscape}<ellipse cx="967" cy="258" rx="207" ry="66" fill="none" stroke="#7464db" opacity=".5" transform="rotate(-26 967 258)"/><circle cx="967" cy="258" r="116" fill="url(#planet)"/><path d="M848 289 Q968 238 1085 215" fill="none" stroke="#b0b4ff" stroke-width="16" opacity=".18"/>${text(48,57,'✦  ORBITAL / PERSONAL EXPLORATION',15,'#71dbff','letter-spacing="3"')}${text(48,155,'kinm-LC',76,'#f1f5ff','font-weight="700"')}${text(51,201,'Construindo meu universo, um commit de cada vez.',21,'#b9c6e8')}<path d="M48 233 H593 L615 211" fill="none" stroke="#7b63dc"/>${text(50,273,'MISSÃO 001',13,'#7cdfff','letter-spacing="3"')}${text(50,307,'Explorar. Criar. Evoluir.',27,'#e5eaff')}${text(50,393,'GITHUB.COM / KINM-LC',12,'#7f92bc','letter-spacing="3"')}<g transform="translate(730 149) rotate(-28)"><path d="M0 0 L80 30 L0 60 L17 30Z" fill="#e2edff" stroke="#65deff" stroke-width="2"/><path d="M14 24 L-49 30 L14 36" fill="url(#tail)"><animate attributeName="opacity" values=".4;1;.4" dur="2s" repeatCount="indefinite"/></path><path d="M28 23 L53 30 L28 37Z" fill="#5546b7"/></g>`, 'kinm-LC — nave em órbita de um planeta azul e roxo');
const panel=(x,label,value)=>`<rect x="${x}" y="65" width="260" height="112" rx="12" fill="#10192f" stroke="#2b395b"/>${text(x+22,95,label,12,'#95a9d3')}${text(x+22,151,value,40,'#e2f1ff','font-weight="600"')}`;
const metrics=svg(215,`${text(32,35,'01 / TELEMETRIA PÚBLICA',14,'#7de4ff','letter-spacing="2"')}${panel(32,'REPOSITÓRIOS PÚBLICOS',profile.public_repos)}${panel(324,'SEGUIDORES',profile.followers)}${panel(616,'ESTRELAS • REPOS PRÓPRIOS',stars)}${text(910,105,'SINAL VERIFICADO',13,'#b7a0ff')}${text(910,133,date.slice(0,10),16,'#e0eaff')}${text(910,160,'Fonte: API GitHub',12)}`, 'Métricas públicas verificadas');
let planets='';
for(let i=0;i<3;i++) {const x=205+i*395,r=selected[i]; planets+=`<ellipse cx="${x}" cy="163" rx="155" ry="48" fill="none" stroke="#394372" transform="rotate(-20 ${x} 163)"/><circle cx="${x}" cy="163" r="61" fill="${r?'url(#planet)':'#131b35'}" stroke="${r?'#a896ff':'#36446b'}" stroke-dasharray="${r?'0':'5 8'}"/>${text(x,168,r?String(i+1).padStart(2,'0'):'?',24,r?'#fff':'#69799e','text-anchor="middle"')}${text(x,269,r?r.name.slice(0,30):'Órbita livre',19,r?'#e7edff':'#8798bc','text-anchor="middle"')}${text(x,300,r?`${r.language||'Linguagem não informada'} · ${r.stargazers_count} estrelas`:'Aguardando projeto público',13,'#8fa2cc','text-anchor="middle"')}`;}
const projects=svg(355,`${text(32,38,'02 / SISTEMA DE PROJETOS',14,'#7de4ff','letter-spacing="2"')}${planets}`, 'Projetos públicos como planetas; órbitas livres não representam projetos');
let grid='';
if(calendar) {
const levels=['NONE','FIRST_QUARTILE','SECOND_QUARTILE','THIRD_QUARTILE','FOURTH_QUARTILE'], colors=['#19223b','#333465','#5751a6','#8576e9','#77e4ff'];
calendar.weeks.forEach((w,i)=>w.contributionDays.forEach(d=>{grid+=`<rect x="${65+i*20}" y="${83+d.weekday*20}" width="15" height="15" rx="3" fill="${colors[Math.max(0,levels.indexOf(d.contributionLevel))]}"><title>${e(d.date)}: ${d.contributionCount} contribuições</title></rect>`;}));
} else grid=text(600,156,calendarStatus,22,'#b2c1e3','text-anchor="middle"')+text(600,189,'Nenhuma atividade foi simulada.',14,'#8598c0','text-anchor="middle"');
const comet=`<g transform="translate(100 250)"><g><path d="M-70 0 H0" stroke="url(#tail)" stroke-width="4"/><circle r="5" fill="#bafaff"/><animateMotion dur="9s" repeatCount="indefinite" path="M0 0 Q480 40 1010 -7"/></g></g>`;
const contributions=svg(310,`${text(32,36,'03 / RASTRO DE CONTRIBUIÇÕES',14,'#7de4ff','letter-spacing="2"')}${calendar?text(32,61,`${calendar.totalContributions} contribuições • últimos 12 meses`,13):''}${grid}${comet}${text(32,293,'Cometa decorativo • não representa commits ou intensidade de atividade',12)}`, 'Calendário de contribuições reais e cometa decorativo animado');
const tech=svg(150,`${text(32,36,'04 / TECNOLOGIAS DETECTADAS',14,'#7de4ff','letter-spacing="2"')}${text(32,89,languageNames.length?languageNames.join('   /   '):'Aguardando linguagens em repositórios públicos próprios.',21,'#c9c6f2')}${text(32,124,'Linguagens principais informadas pela API; não são uma declaração de domínio técnico.',12)}`, 'Tecnologias detectadas em repositórios públicos');
const images={hero,metrics,projects,contributions,technologies:tech};
for(const [name,value] of Object.entries(images)) await fs.writeFile(root+`assets/${name}.svg`,value);
const links=selected.map(r=>`- [${r.name}](https://github.com/${user}/${encodeURIComponent(r.name)})`).join('\n');
const readme=`<!-- Gerado por scripts/update.mjs; edite o gerador para personalizar. -->\n# kinm-LC · Orbital\n\n![Nave e planeta em órbita](assets/hero.svg)\n\n![Telemetria pública](assets/metrics.svg)\n\n![Sistema de projetos](assets/projects.svg)\n\n${links||'Ainda não há projetos públicos próprios para exibir.'}\n\n[Explorar repositórios](https://github.com/${user}?tab=repositories)\n\n![Rastro de contribuições](assets/contributions.svg)\n\n![Tecnologias detectadas](assets/technologies.svg)\n\nDados consultados em **${date}**. Repositórios e seguidores: API pública. Estrelas: soma dos repositórios próprios, sem forks. Projetos: até três repositórios próprios não arquivados, excluindo este perfil, por estrelas e último push.\n\nCalendário: ${calendarStatus}. O cometa é uma animação decorativa; não altera os dados. Animações SVG dependem do visualizador; os painéis permanecem legíveis sem movimento.\n`;
await fs.writeFile(root+'README.md',readme);
await fs.writeFile(root+'assets/data.json',JSON.stringify({checkedAt:date,profile:{login:profile.login,publicRepos:profile.public_repos,followers:profile.followers},stars,projects:selected.map(r=>({name:r.name,url:r.html_url,language:r.language,stars:r.stargazers_count})),languages:languageNames,calendar,calendarStatus},null,2));
if(!offline) {await fs.writeFile(root+'assets/profile-source.json',JSON.stringify(profile,null,2)); await fs.writeFile(root+'assets/repos-source.json',JSON.stringify(repos,null,2)); await fs.writeFile(root+'assets/snapshot-metadata.json',JSON.stringify({checkedAt:date},null,2));}
await fs.writeFile(root+'preview.html',`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>kinm-LC · Prévia do README</title><style>body{margin:0;background:#0d1117;color:#c9d1d9;font:15px system-ui}main{max-width:1000px;margin:40px auto;padding:24px;border:1px solid #30363d;border-radius:12px}img{width:100%;display:block;margin:18px 0}a{color:#79dfff}p{line-height:1.7}small{color:#8b949e}</style><main><small>PRÉVIA LOCAL · NADA PUBLICADO · ${e(date)}</small><h1>kinm-LC · Orbital</h1>${Object.keys(images).map(n=>`<img src="assets/${n}.svg" alt="${n}">`).join('')}<p>${selected.map(r=>`<a href="${e(r.html_url)}">${e(r.name)}</a>`).join(' · ')||'Ainda não há projetos públicos próprios para exibir.'}</p><p><a href="https://github.com/${user}?tab=repositories">Explorar repositórios</a></p><small>Mesmos SVGs do README. A interface do GitHub pode alterar largura, cache e reprodução de animações. O cometa é decorativo.</small></main></html>`);
console.log(`Gerados ${Object.keys(images).length} painéis, README e preview. Projetos: ${selected.length}. Calendário: ${calendar?'real':'indisponível'}.`);
