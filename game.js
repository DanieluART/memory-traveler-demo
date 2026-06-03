
const CARD_ASSETS = {
  memory_slash: 'assets/memory_slash.png',
  paper_map: 'assets/paper_map.png',
  koro_guide: 'assets/koro_guide.png',
  daini_courage: 'assets/daini_courage.png',
  ink_line: 'assets/ink_line.png',
  local_memory: 'assets/local_memory.png',
  red_shard: 'assets/red_shard.png',
  tea_rest: 'assets/tea_rest.png'
};

const SPRITE_ASSETS = {
  boy: { idle:'assets/sprites/hero_boy_idle.png', attack:'assets/sprites/hero_boy_attack.png' },
  girl:{ idle:'assets/sprites/hero_girl_idle.png', action:'assets/sprites/hero_girl_action.png' },
  koro:{ idle:'assets/sprites/koro_idle.png', skill:'assets/sprites/koro_skill.png' },
  bear:{ idle:'assets/sprites/bear_idle.png', skill:'assets/sprites/bear_skill.png' },
  enemy:{ idle:'assets/sprites/enemy_idle.png', attack:'assets/sprites/enemy_attack.png', roar:'assets/sprites/enemy_roar.png' }
};

const CARDS = [
  { id:'memory_slash', name:'記憶斬擊', cost:1, kind:'attack', art:CARD_ASSETS.memory_slash, desc:'造成 12 點傷害，抽 1 張牌。', effect:(g)=>{ g.damageEnemy(12); g.drawCards(1, false); } },
  { id:'paper_map', name:'紙本地圖', cost:1, kind:'skill', art:CARD_ASSETS.paper_map, desc:'獲得 5 點格擋。', effect:(g)=>{ g.gainBlock(5); } },
  { id:'koro_guide', name:'KORO 導覽', cost:1, kind:'skill', art:CARD_ASSETS.koro_guide, desc:'抽 2 張牌並獲得 1 靈感。', effect:(g)=>{ g.drawCards(2, false); g.gainInspiration(1, 'KORO 帶來導覽支援。'); } },
  { id:'daini_courage', name:'呆尼熊的勇氣', cost:1, kind:'support', art:CARD_ASSETS.daini_courage, desc:'獲得 6 點格擋。', effect:(g)=>{ g.gainBlock(6); } },
  { id:'ink_line', name:'手繪墨線', cost:1, kind:'skill', art:CARD_ASSETS.ink_line, desc:'獲得 4 點格擋，下次敵人攻擊 -3。', effect:(g)=>{ g.gainBlock(4); g.enemyWeak = Math.max(g.enemyWeak, 3); } },
  { id:'local_memory', name:'地方記憶', cost:1, kind:'skill', art:CARD_ASSETS.local_memory, desc:'獲得 4 點格擋並抽 1 張牌。', effect:(g)=>{ g.gainBlock(4); g.drawCards(1, false); } },
  { id:'red_shard', name:'記憶石碎光', cost:2, kind:'attack', art:CARD_ASSETS.red_shard, desc:'造成 18 點傷害；若有侵蝕額外 +6。', effect:(g)=>{ g.damageEnemy(18 + (g.corruption>0?6:0)); } },
  { id:'tea_rest', name:'奉茶休息', cost:2, kind:'support', art:CARD_ASSETS.tea_rest, desc:'回復 8 點生命並抽 2 張牌。', effect:(g)=>{ g.heal(8); g.drawCards(2, false); } },
  { id:'inspiration_slash', name:'靈感斬擊', cost:1, kind:'attack', art:CARD_ASSETS.memory_slash, desc:'造成 9 點傷害；消耗 1 靈感，額外 +10。', effect:(g)=>{ let bonus = g.consumeInspiration('靈感斬擊額外傷害') ? 10 : 0; g.damageEnemy(9 + bonus); } },
  { id:'idea_burst', name:'靈感爆發', cost:1, kind:'skill', art:CARD_ASSETS.local_memory, desc:'若有靈感，消耗 1：抽 2 張並回復 1 能量；否則獲得 1 靈感。', effect:(g)=>{ if(g.consumeInspiration('靈感爆發')){ g.drawCards(2, false); g.gainEnergy(1); } else { g.gainInspiration(1, '靈感尚未累積，轉為收集靈感。'); } } },
];

const INTENTS = [
  { label:'撲擊 10', type:'pounce', act:(g)=>g.enemyAttack(10, 'pounce') },
  { label:'記憶吞噬 15', type:'devour', act:(g)=>g.enemyAttack(15, 'devour') },
  { label:'紅色記憶石凝聚', type:'charge', act:(g)=>{ g.corruption += 1; g.showEnemySkillEffect('charge'); g.log(`噬憶獸凝聚紅色記憶石，侵蝕 +1；目前侵蝕 ${g.corruption} 層，敵方攻擊 +${g.corruption}。`, false); } },
  { label:'黑霧硬殼 +8', type:'armor', act:(g)=>{ g.enemyBlock += 8; g.showEnemySkillEffect('armor'); g.log('噬憶獸生成黑霧硬殼，獲得 8 點格擋。', false); } },
];

const $ = (id)=>document.getElementById(id);
function setText(id, value){ const el = $(id); if (el) el.textContent = value; }
function uid(p){ return `${p}_${Math.random().toString(36).slice(2)}_${Date.now()}`; }
function randomInt(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }

let audioCtx = null;
function getAudioCtx(){
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if(!AudioCtor) return null;
  if(!audioCtx) audioCtx = new AudioCtor();
  if(audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
  return audioCtx;
}
function playTone(ctx, freq, duration=0.08, type='sine', gainValue=0.045, delay=0){
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(gainValue, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.025);
}
function playNoise(ctx, duration=0.14, gainValue=0.035, delay=0){
  const t0 = ctx.currentTime + delay;
  const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for(let i=0;i<data.length;i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainValue, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.buffer = buffer;
  src.connect(gain).connect(ctx.destination);
  src.start(t0);
  src.stop(t0 + duration + 0.02);
}
function playSfx(kind='tap'){
  try{
    const ctx = getAudioCtx();
    if(!ctx) return;
    if(kind === 'tap'){
      playTone(ctx, 620, 0.055, 'triangle', 0.026, 0);
      playTone(ctx, 880, 0.045, 'triangle', 0.018, 0.045);
    } else if(kind === 'card'){
      playTone(ctx, 420, 0.07, 'triangle', 0.032, 0);
      playTone(ctx, 720, 0.09, 'triangle', 0.026, 0.055);
    } else if(kind === 'enemy'){
      playTone(ctx, 118, 0.18, 'sawtooth', 0.04, 0);
      playNoise(ctx, 0.18, 0.035, 0.02);
    } else if(kind === 'enemyHeavy'){
      playTone(ctx, 88, 0.24, 'sawtooth', 0.05, 0);
      playTone(ctx, 132, 0.18, 'square', 0.026, 0.05);
      playNoise(ctx, 0.24, 0.045, 0.02);
    } else if(kind === 'enemySkill'){
      playTone(ctx, 180, 0.12, 'sine', 0.035, 0);
      playTone(ctx, 250, 0.16, 'triangle', 0.025, 0.08);
    } else if(kind === 'win'){
      playTone(ctx, 523.25, 0.10, 'triangle', 0.035, 0);
      playTone(ctx, 659.25, 0.12, 'triangle', 0.032, 0.10);
      playTone(ctx, 783.99, 0.16, 'triangle', 0.034, 0.22);
    } else if(kind === 'lose'){
      playTone(ctx, 220, 0.18, 'sawtooth', 0.035, 0);
      playTone(ctx, 164.81, 0.24, 'sawtooth', 0.03, 0.18);
    }
  }catch(err){ /* audio is optional */ }
}

function bindPress(id, handler){
  const el = $(id);
  if(!el || el.dataset.bound === '1') return;
  el.dataset.bound = '1';
  let lastFire = 0;
  const fire = (e) => {
    if(e){ e.preventDefault?.(); }
    const now = Date.now();
    if(now - lastFire < 320) return;
    lastFire = now;
    playSfx('tap');
    handler(e);
  };
  el.addEventListener('click', fire);
  el.addEventListener('touchend', fire, { passive:false });
}

function bindPressElement(el, handler){
  if(!el || el.dataset.bound === '1') return;
  el.dataset.bound = '1';
  let lastFire = 0;
  const fire = (e) => {
    if(e){ e.preventDefault?.(); }
    const now = Date.now();
    if(now - lastFire < 260) return;
    lastFire = now;
    playSfx('card');
    handler(e);
  };
  el.addEventListener('click', fire);
  el.addEventListener('touchend', fire, { passive:false });
}

class DemoGame {
  constructor(){
    this.maxPlayerHp = 110;
    this.maxEnemyHp = 80;
    this.maxEnergy = 3;
    this.stageHpRanges = [{min:60,max:80},{min:150,max:180},{min:250,max:250}];
    this.reset();
  }

  reset(){
    this.playerHp = 96;
    this.maxPlayerHp = 110;
    this.stage = 1;
    this.permanentAttack = 0;
    this.permanentInspiration = 0;
    this.permanentBlock = 0;
    this.partnerCooldownReduction = 0;
    this.attackBoostCharges = 0;
    this.lastCompanionTurnUsed = null;
    this.pendingReward = null;
    this.processingReward = false;
    this.gameOver = false;
    this.processingTurn = false;
    this.effectTimer = null;
    this.sceneTimer = null;
    this.logs = [];
    this.startStageBattle(true);
  }

  startStageBattle(isFirst=false){
    const range = this.stageHpRanges[this.stage - 1] || this.stageHpRanges[2];
    this.maxEnemyHp = randomInt(range.min, range.max);
    this.enemyHp = this.maxEnemyHp;
    this.playerBlock = this.permanentBlock;
    this.enemyBlock = 0;
    this.energy = this.maxEnergy;
    this.turn = 1;
    this.corruption = 0;
    this.inspiration = this.permanentInspiration;
    this.enemyWeak = 0;
    this.discard = [];
    this.hand = [];
    this.deck = this.shuffle(this.buildDeck());
    this.intent = this.pickIntent();
    this.resetSpriteState();
    this.drawCards(5, false);
    if(isFirst) this.log('三階段戰鬥開始。', false);
    this.log(`第 ${this.stage} 階段開始，噬憶獸 HP ${this.enemyHp}。`, false);
    if(this.permanentAttack || this.permanentInspiration || this.permanentBlock){
      this.log(`永久能力生效：攻擊 +${this.permanentAttack}／靈感 +${this.permanentInspiration}／格擋 +${this.permanentBlock}。`, false);
    }
    this.render();
    this.setTurnBusy(false);
  }

  buildDeck(){
    const list = [];
    const copies = { memory_slash:3, paper_map:2, koro_guide:2, daini_courage:2, ink_line:2, local_memory:2, red_shard:2, tea_rest:1, inspiration_slash:2, idea_burst:2 };
    for (const c of CARDS){
      for(let i=0;i<(copies[c.id]||1);i++) list.push({ ...c, uid: uid(c.id) });
    }
    return list;
  }

  shuffle(arr){
    const a=[...arr];
    for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  }

  pickIntent(){ return INTENTS[Math.floor(Math.random()*INTENTS.length)]; }
  delay(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }

  setTurnBusy(isBusy){
    this.processingTurn = !!isBusy;
    const btn = $('endTurnButton');
    if(btn){
      btn.disabled = !!isBusy;
      btn.classList.toggle('busy', !!isBusy);
      btn.textContent = isBusy ? '敵方行動中…' : '結束回合';
    }
    if(!isBusy) this.renderHand();
  }

  drawCards(n, render=true){
    for(let i=0;i<n;i++){
      if(!this.deck.length){
        if(!this.discard.length) break;
        this.deck = this.shuffle(this.discard);
        this.discard = [];
        this.log('棄牌堆重新洗入牌庫。', false);
      }
      const c = this.deck.shift();
      if(c) this.hand.push(c);
    }
    if(render) this.render();
  }

  playLayerEffect(effectClass, effectHtml, duration=1200){
    const layer = $('effectLayer');
    if(!layer) return;
    clearTimeout(this.effectTimer);
    layer.className = 'effect-layer';
    layer.innerHTML = '';
    void layer.offsetWidth;
    requestAnimationFrame(()=>{
      layer.className = `effect-layer ${effectClass}`;
      layer.innerHTML = effectHtml;
      this.effectTimer = setTimeout(()=>{
        layer.className = 'effect-layer';
        layer.innerHTML = '';
      }, duration);
    });
  }

  animateSceneHit(type='hit'){
    const scene = document.querySelector('.battle-scene-shell');
    if(!scene) return;
    scene.classList.remove('scene-hit','scene-hit-heavy','scene-blocked');
    void scene.offsetWidth;
    if(type === 'blocked') scene.classList.add('scene-blocked');
    else if(type === 'heavy') scene.classList.add('scene-hit','scene-hit-heavy');
    else scene.classList.add('scene-hit');
    clearTimeout(this.sceneTimer);
    this.sceneTimer = setTimeout(()=>scene.classList.remove('scene-hit','scene-hit-heavy','scene-blocked'), 560);
  }

  showCardEffect(card){
    this.handleCardSpriteAction(card);
    const flashType = card.kind === 'attack' ? 'attack' : (card.kind === 'support' ? 'support' : 'skill');
    let effectHtml = '';
    if (flashType === 'attack') {
      effectHtml = `<div class="battle-effect attack"><div class="effect-burst"></div><div class="effect-spark effect-spark-r"></div><div class="effect-label attack-label">${card.name}</div></div>`;
    } else if (flashType === 'support') {
      effectHtml = `<div class="battle-effect support"><div class="effect-pulse"></div><div class="effect-heal"></div><div class="effect-label support-label">${card.name}</div></div>`;
    } else {
      effectHtml = `<div class="battle-effect skill"><div class="effect-ring"></div><div class="effect-shield"></div><div class="effect-label skill-label">${card.name}</div></div>`;
    }
    this.playLayerEffect(`${flashType}-flash`, effectHtml, 1250);
  }

  showEnemyAttackEffect(mode='pounce', total=0, damage=0, blocked=0){
    this.animateActor('enemy', mode === 'devour' ? 'roar' : 'attack');
    playSfx(mode === 'devour' ? 'enemyHeavy' : 'enemy');
    const defendText = blocked > 0 ? `｜格擋 ${blocked}` : '';
    let effectClass = 'enemy-flash';
    let effectHtml = '';
    if(mode === 'devour'){
      effectClass = 'devour-flash';
      effectHtml = `<div class="battle-effect enemy-devour"><div class="devour-vortex vortex-a"></div><div class="devour-vortex vortex-b"></div><div class="devour-trail"></div><div class="effect-label enemy-label">記憶吞噬 - ${damage}${defendText}</div></div>`;
    } else {
      effectHtml = `<div class="battle-effect enemy-attack"><div class="enemy-claw enemy-claw-a"></div><div class="enemy-claw enemy-claw-b"></div><div class="enemy-impact"></div><div class="effect-label enemy-label">噬憶獸攻擊 - ${damage}${defendText}</div></div>`;
    }
    this.playLayerEffect(effectClass, effectHtml, 1250);
  }

  showEnemySkillEffect(type='charge'){
    this.animateActor('enemy','roar');
    playSfx('enemySkill');
    let effectHtml = '';
    if(type === 'armor'){
      effectHtml = `<div class="battle-effect enemy-skill armor-skill"><div class="armor-ring"></div><div class="armor-ring ring-b"></div><div class="armor-smoke"></div><div class="effect-label enemy-skill-label">黑霧硬殼 +8</div></div>`;
    } else {
      effectHtml = `<div class="battle-effect enemy-skill charge-skill"><div class="charge-crystal crystal-main"></div><div class="charge-crystal crystal-s1"></div><div class="charge-crystal crystal-s2"></div><div class="effect-label enemy-skill-label">紅色記憶石凝聚</div></div>`;
    }
    this.playLayerEffect('enemy-skill-flash', effectHtml, 1180);
  }


  resetSpriteState(){
    this.spriteTimers = this.spriteTimers || {};
    this.setActorSprite('Boy', SPRITE_ASSETS.boy.idle);
    this.setActorSprite('Girl', SPRITE_ASSETS.girl.idle);
    this.setActorSprite('Koro', SPRITE_ASSETS.koro.idle);
    this.setActorSprite('Bear', SPRITE_ASSETS.bear.idle);
    this.setActorSprite('Enemy', SPRITE_ASSETS.enemy.idle);
    ['actorBoy','actorGirl','actorKoro','actorBear','actorEnemy'].forEach(id=>{
      const el=$(id);
      if(!el) return;
      el.className = el.className.split(' ').filter(c=>!c.startsWith('anim-')).join(' ');
      el.classList.add('anim-idle');
    });
  }

  setActorSprite(key, src){
    const img = $(`actor${key}Img`);
    if(img) img.src = src;
  }

  pulseActor(actorId, animClass, duration=700){
    const el = $(actorId);
    if(!el) return;
    el.classList.remove('anim-idle','anim-attack','anim-skill','anim-support','anim-hit','anim-roar');
    void el.offsetWidth;
    el.classList.add(animClass);
    clearTimeout(this.spriteTimers[actorId]);
    this.spriteTimers[actorId] = setTimeout(()=>{
      el.classList.remove('anim-attack','anim-skill','anim-support','anim-hit','anim-roar');
      el.classList.add('anim-idle');
    }, duration);
  }

  animateActor(actorKey, pose='idle'){
    const map = {
      boy:{id:'actorBoy', idle:SPRITE_ASSETS.boy.idle, attack:SPRITE_ASSETS.boy.attack, cls:'anim-attack', ms:620},
      girl:{id:'actorGirl', idle:SPRITE_ASSETS.girl.idle, action:SPRITE_ASSETS.girl.action, cls:'anim-skill', ms:720},
      koro:{id:'actorKoro', idle:SPRITE_ASSETS.koro.idle, skill:SPRITE_ASSETS.koro.skill, cls:'anim-skill', ms:760},
      bear:{id:'actorBear', idle:SPRITE_ASSETS.bear.idle, skill:SPRITE_ASSETS.bear.skill, cls:'anim-support', ms:760},
      enemy:{id:'actorEnemy', idle:SPRITE_ASSETS.enemy.idle, attack:SPRITE_ASSETS.enemy.attack, roar:SPRITE_ASSETS.enemy.roar, cls:'anim-roar', ms:820},
    };
    const conf = map[actorKey];
    if(!conf) return;
    const src = conf[pose] || conf.idle;
    this.setActorSprite(actorKey.charAt(0).toUpperCase()+actorKey.slice(1), src);
    const cls = actorKey === 'boy' ? 'anim-attack' : actorKey === 'girl' ? 'anim-skill' : actorKey === 'koro' ? 'anim-skill' : actorKey === 'bear' ? 'anim-support' : (pose==='attack' ? 'anim-attack' : 'anim-roar');
    this.pulseActor(conf.id, cls, conf.ms);
    clearTimeout(this.spriteTimers[conf.id+'_img']);
    this.spriteTimers[conf.id+'_img'] = setTimeout(()=>this.setActorSprite(actorKey.charAt(0).toUpperCase()+actorKey.slice(1), conf.idle), conf.ms);
  }

  reactPartyHit(){
    ['actorBoy','actorGirl','actorKoro','actorBear'].forEach(id=>this.pulseActor(id,'anim-hit',450));
  }

  handleCardSpriteAction(card){
    if(!card) return;
    const id = card.id || '';
    if(['memory_slash','red_shard','inspiration_slash'].includes(id)){
      this.animateActor('boy','attack');
    } else if(['paper_map','ink_line','local_memory','idea_burst'].includes(id)){
      this.animateActor('girl','action');
    } else if(id === 'koro_guide'){
      this.animateActor('koro','skill');
    } else if(['daini_courage','tea_rest'].includes(id)){
      this.animateActor('bear','skill');
    } else {
      if(card.kind === 'attack') this.animateActor('boy','attack');
      else if(card.kind === 'support') this.animateActor('bear','skill');
      else this.animateActor('girl','action');
    }
  }

  gainInspiration(n=1, source=''){
    this.inspiration += n;
    this.log(`${source ? source + '，' : ''}獲得 ${n} 點靈感。`, false);
  }

  consumeInspiration(reason=''){
    if(this.inspiration <= 0) return false;
    this.inspiration -= 1;
    this.log(`${reason ? reason + '：' : ''}消耗 1 點靈感。`, false);
    return true;
  }

  gainEnergy(n=1){
    const before = this.energy;
    this.energy = Math.min(this.maxEnergy, this.energy + n);
    this.log(`回復 ${this.energy - before} 點能量。`, false);
  }

  getCompanionInterval(){
    return Math.max(2, 5 - this.partnerCooldownReduction);
  }

  isCompanionReady(){
    const interval = this.getCompanionInterval();
    return this.turn > 0 && this.turn % interval === 0 && this.lastCompanionTurnUsed !== this.turn && !this.processingTurn && !this.gameOver;
  }

  useCompanion(type){
    if(!this.isCompanionReady()){
      this.log('夥伴技尚未準備完成。');
      return;
    }
    if(type === 'koro'){
      const baseBlock = 10;
      const inspirationBonus = this.inspiration > 0 ? 8 : 0;
      this.gainBlock(baseBlock + inspirationBonus);
      this.lastCompanionTurnUsed = this.turn;
      this.showCardEffect({id:'koro_guide', name:'KORO 夥伴技', kind:'skill'});
      this.animateActor('koro','skill');
      this.log(`KORO 發動導覽護盾，格擋 +${baseBlock}${inspirationBonus ? '，靈感狀態額外 +8' : ''}。`, false);
    } else if(type === 'daini'){
      this.attackBoostCharges += 2;
      this.lastCompanionTurnUsed = this.turn;
      this.showCardEffect({id:'daini_courage', name:'呆尼熊 夥伴技', kind:'support'});
      this.animateActor('bear','skill');
      this.log('呆尼熊發動勇氣應援，接下來 2 次攻擊各 +4。', false);
    }
    this.render();
  }

  playCard(id){
    if(this.gameOver || this.processingTurn) return;
    const idx = this.hand.findIndex(c=>c.uid===id);
    if(idx < 0) return;
    const card = this.hand[idx];
    if(card.cost > this.energy){ this.log(`能量不足，無法使用「${card.name}」。`); return; }
    this.energy -= card.cost;
    this.hand.splice(idx,1);
    this.log(`使用「${card.name}」。`);
    this.showCardEffect(card);
    card.effect(this);
    this.discard.push(card);
    if(card.kind === 'attack' && this.inspiration > 0){
      this.inspiration -= 1;
      this.log('消耗 1 點靈感，使攻擊更集中。', false);
    }
    this.check();
    this.render();
  }

  damageEnemy(n){
    let amount = n + this.permanentAttack;
    if(this.permanentAttack > 0) this.log(`永久能力：本次攻擊 +${this.permanentAttack}。`, false);
    if(this.attackBoostCharges > 0){
      amount += 4;
      this.attackBoostCharges -= 1;
      this.log('呆尼熊勇氣應援：本次攻擊 +4。', false);
    }
    const blocked = Math.min(this.enemyBlock, amount);
    this.enemyBlock -= blocked;
    const damage = amount - blocked;
    this.enemyHp = Math.max(0, this.enemyHp - damage);
    this.log(`對噬憶獸造成 ${damage} 點傷害。`, false);
  }

  gainBlock(n){ this.playerBlock += n; this.log(`獲得 ${n} 點格擋。`, false); }
  heal(n){ const before = this.playerHp; this.playerHp = Math.min(this.maxPlayerHp, this.playerHp + n); this.log(`回復 ${this.playerHp-before} 點生命。`, false); }

  enemyAttack(n, mode='pounce'){
    const weakened = Math.max(0, n - this.enemyWeak);
    const total = weakened + this.corruption;
    const blocked = Math.min(this.playerBlock, total);
    this.playerBlock -= blocked;
    const damage = total - blocked;
    this.playerHp = Math.max(0, this.playerHp - damage);
    this.showEnemyAttackEffect(mode, total, damage, blocked);
    this.reactPartyHit();
    this.animateSceneHit(damage > 0 ? (mode === 'devour' ? 'heavy' : 'hit') : 'blocked');
    this.log(`噬憶獸造成 ${damage} 點傷害（侵蝕加成 +${this.corruption}）。`, false);
    this.enemyWeak = 0;
  }

  async endTurn(){
    if(this.gameOver || this.processingTurn) return;
    this.setTurnBusy(true);
    this.log(`第 ${this.turn} 回合結束。`);
    this.hand.forEach(c => this.discard.push(c));
    this.hand = [];
    this.render();
    await this.delay(80);

    try {
      this.intent.act(this);
    } catch(err) {
      console.error('Enemy action error:', err);
      this.log('敵方行動特效修復中，已完成本次行動。', false);
    }

    this.check();
    this.render();
    await this.delay(900);
    if(this.gameOver){
      this.setTurnBusy(false);
      return;
    }

    this.turn += 1;
    this.energy = this.maxEnergy;
    this.playerBlock = 0;
    this.intent = this.pickIntent();
    this.drawCards(5, false);
    this.log(`第 ${this.turn} 回合開始，抽 5 張牌。`, false);
    this.setTurnBusy(false);
    this.render();
  }

  check(){
    if(this.enemyHp <= 0){
      if(this.stage < 3){
        this.handleStageClear();
      } else {
        this.gameOver = true;
        this.showResult(true);
      }
    } else if(this.playerHp <= 0){
      this.gameOver = true;
      this.showResult(false);
    }
  }

  handleStageClear(){
    if(this.processingReward) return;
    this.processingReward = true;
    this.gameOver = false;
    this.setTurnBusy(true);
    this.hand.forEach(c => this.discard.push(c));
    this.hand = [];
    this.log(`第 ${this.stage} 階段通過。`, false);
    this.render();
    this.openRewardChoice();
  }

  randomAbilityChoice(){
    const list = [
      { id:'atk', title:'記憶銳化', desc:'每場戰鬥開始保持：攻擊力 +1。', apply:(g)=>{ g.permanentAttack += 1; g.log('獲得能力：每場戰鬥攻擊力 +1。', false); } },
      { id:'ins', title:'靈感核心', desc:'每場戰鬥開始保持：靈感 +1。', apply:(g)=>{ g.permanentInspiration += 1; g.log('獲得能力：每場戰鬥靈感 +1。', false); } },
      { id:'blk', title:'記憶護膜', desc:'每場戰鬥開始保持：格擋 +1。', apply:(g)=>{ g.permanentBlock += 1; g.log('獲得能力：每場戰鬥格擋 +1。', false); } },
    ];
    return list[randomInt(0, list.length - 1)];
  }

  randomRewardChoice(){
    const list = [
      { id:'heal', title:'HP 回復', desc:'立即回復 40 點 HP。', apply:(g)=>{ const before = g.playerHp; g.playerHp = Math.min(g.maxPlayerHp, g.playerHp + 40); g.log(`獲得獎勵：HP 回復 ${g.playerHp - before}。`, false); } },
      { id:'maxhp', title:'最大 HP +50', desc:'最大 HP 增加 50，並回復 50 HP。', apply:(g)=>{ g.maxPlayerHp += 50; g.playerHp = Math.min(g.maxPlayerHp, g.playerHp + 50); g.log('獲得獎勵：最大 HP +50。', false); } },
      { id:'partner', title:'夥伴技冷卻 -1', desc:'夥伴技發動間隔減少 1 回合。', apply:(g)=>{ g.partnerCooldownReduction = Math.min(3, g.partnerCooldownReduction + 1); g.log(`獲得獎勵：夥伴技間隔縮短，目前每 ${g.getCompanionInterval()} 回合可用。`, false); } },
    ];
    return list[randomInt(0, list.length - 1)];
  }

  openRewardChoice(){
    this.pendingReward = {
      ability: this.randomAbilityChoice(),
      reward: this.randomRewardChoice()
    };
    setText('rewardTitle', `第 ${this.stage} 階段通過`);
    setText('rewardIntro', '選擇一項能力或獎勵，進入下一階段。');
    setText('abilityChoiceTitle', this.pendingReward.ability.title);
    setText('abilityChoiceDesc', this.pendingReward.ability.desc);
    setText('rewardChoiceTitle', this.pendingReward.reward.title);
    setText('rewardChoiceDesc', this.pendingReward.reward.desc);
    $('rewardDialog')?.showModal();
  }

  chooseReward(type){
    if(!this.pendingReward) return;
    const selected = this.pendingReward[type];
    if(!selected) return;
    selected.apply(this);
    this.pendingReward = null;
    $('rewardDialog')?.close();
    this.processingReward = false;
    this.stage += 1;
    this.startStageBattle(false);
  }

  showResult(win){
    playSfx(win ? 'win' : 'lose');
    $('gameScreen')?.classList.add('hidden');
    $('resultScreen')?.classList.remove('hidden');
    setText('resultBadge', win ? 'DEMO 勝利' : 'DEMO 失敗');
    setText('resultTitle', win ? '記憶守住了' : '記憶被吞噬');
    setText('resultText', win ? `你在第 ${this.turn} 回合擊退了噬憶獸，並完成本次戰鬥展示。` : '旅人小隊暫時失利，可以重新安排出牌節奏再挑戰。');
    const resultImage = $('resultImage');
    if(resultImage) resultImage.src = win ? 'assets/victory_result.jpg' : 'assets/defeat_result.jpg';
    const card = $('resultCard');
    if(card){
      card.classList.toggle('win-state', !!win);
      card.classList.toggle('lose-state', !win);
    }
    document.querySelectorAll('.result-win-art').forEach(el => el.classList.toggle('hidden', !win));
    document.querySelectorAll('.result-lose-art').forEach(el => el.classList.toggle('hidden', !!win));
  }

  log(t, render=true){
    this.logs.unshift(t);
    this.logs = this.logs.slice(0, 12);
    if(render) this.renderLog();
  }

  render(){
    setText('playerHpText', `${this.playerHp} / ${this.maxPlayerHp}`);
    setText('playerHpMini', `${this.playerHp}/${this.maxPlayerHp}`);
    setText('enemyHpText', `${this.enemyHp} / ${this.maxEnemyHp}`);
    setText('enemyHpMini', `${this.enemyHp}/${this.maxEnemyHp}`);
    setText('stageText', `${this.stage} / 3`);
    setText('passiveText', `攻+${this.permanentAttack} 靈+${this.permanentInspiration} 格+${this.permanentBlock}`);
    setText('energyText', `${this.energy} / ${this.maxEnergy}`);
    setText('energyTextBottom', `${this.energy} / ${this.maxEnergy}`);
    setText('turnText', this.turn);
    setText('turnTextMirror', this.turn);
    setText('playerBlockText', this.playerBlock);
    setText('enemyBlockText', this.enemyBlock);
    setText('deckCount', this.deck.length);
    setText('discardCount', this.discard.length);
    setText('inspirationText', this.inspiration);
    setText('attackBoostText', this.attackBoostCharges);
    this.renderCompanionSkills();
    setText('intentText', this.intent.label);
    setText('corruptionText', this.corruption);
    setText('corruptionStatusText', this.corruption);
    setText('corruptionEffectText', `敵方攻擊 +${this.corruption}`);
    this.renderCorruptionState();
    this.renderHand();
    this.renderLog();
  }

  renderCorruptionState(){
    const scene = document.querySelector('.battle-scene-shell');
    if(scene){
      scene.classList.toggle('corruption-active', this.corruption > 0);
      scene.dataset.corruption = String(this.corruption);
    }
    document.querySelectorAll('.corruption-status-panel, .corruption-mobile-chip').forEach(el => {
      el.classList.toggle('active', this.corruption > 0);
      el.classList.toggle('danger', this.corruption >= 3);
    });
  }

  renderCompanionSkills(){
    const ready = this.isCompanionReady();
    const koroBtn = $('koroSkillButton');
    const dainiBtn = $('dainiSkillButton');
    const hint = $('companionHintText');
    if(koroBtn) koroBtn.disabled = !ready;
    if(dainiBtn) dainiBtn.disabled = !ready;
    if(koroBtn) koroBtn.classList.toggle('ready', ready);
    if(dainiBtn) dainiBtn.classList.toggle('ready', ready);
    if(hint){
      if(ready) hint.textContent = '夥伴技已準備：本回合可選擇 1 位發動。';
      else {
        const interval = this.getCompanionInterval();
        const next = Math.ceil((this.turn + 1) / interval) * interval;
        hint.textContent = this.lastCompanionTurnUsed === this.turn ? '本回合已使用夥伴技。' : `第 ${next} 回合可發動。`;
      }
    }
  }

  renderHand(){
    const box = $('handContainer');
    if(!box) return;
    box.innerHTML = '';
    this.hand.forEach(card => {
      const btn = document.createElement('button');
      btn.className = 'card-btn' + (card.cost > this.energy || this.processingTurn ? ' disabled' : '');
      btn.disabled = card.cost > this.energy || this.processingTurn;
      btn.innerHTML = `<div class="card-image-wrap"><img src="${card.art}" alt="${card.name}" loading="eager" /><div class="card-meta"><strong>${card.name}</strong><span>消耗 ${card.cost}｜${card.desc}</span></div></div>`;
      bindPressElement(btn, ()=>this.playCard(card.uid));
      box.appendChild(btn);
    });
  }

  renderLog(){
    const box = $('logBox');
    if(!box) return;
    box.innerHTML = this.logs.map(x => `<p>・${x}</p>`).join('');
  }
}

let game = null;
function startGame(){
  $('startScreen')?.classList.add('hidden');
  $('resultScreen')?.classList.add('hidden');
  $('gameScreen')?.classList.remove('hidden');
  game = new DemoGame();
  window.scrollTo({ top:0, behavior:'smooth' });
}
function openSettings(){ $('settingsDialog')?.showModal(); }
function closeSettings(){ $('settingsDialog')?.close(); }

bindPress('startButton', startGame);
bindPress('continueButton', startGame);
bindPress('restartTopButton', startGame);
bindPress('restartButton', startGame);
bindPress('endTurnButton', ()=>game?.endTurn());
bindPress('helpButton', ()=>$('helpDialog')?.showModal());
bindPress('closeHelpButton', ()=>$('helpDialog')?.close());
bindPress('artButton', ()=>$('artDialog')?.showModal());
bindPress('openArtButton', ()=>$('artDialog')?.showModal());
bindPress('closeArtButton', ()=>$('artDialog')?.close());
bindPress('settingsButton', openSettings);
bindPress('closeSettingsButton', closeSettings);
bindPress('koroSkillButton', ()=>game?.useCompanion('koro'));
bindPress('dainiSkillButton', ()=>game?.useCompanion('daini'));
bindPress('abilityChoiceButton', ()=>game?.chooseReward('ability'));
bindPress('rewardChoiceButton', ()=>game?.chooseReward('reward'));
