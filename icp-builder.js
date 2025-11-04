/* ========================================================================== *
 * Autophage ICP Builder â€” v4.0 FIXED
 * Combined single-file version with all bugs fixed
 * ========================================================================== */

(function(){
  'use strict';

  // Guard against double-binding
  const root = document.getElementById('autophageICP') || document.querySelector('.a-icp');
  if (!root || root.dataset.icpBound === 'true') return;
  root.dataset.icpBound = 'true';

  // ------- Helpers ----------------------------------------------------------
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const safeStr = (v) => (typeof v === 'string' ? v.normalize('NFKC').trim() : String(v||'').trim());

  const smoothScrollTo = (el) => {
    if (!el) return;
    try{
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }catch(e){ 
      el.scrollIntoView(true);
    }
  };

  const copyText = async (txt) => {
    try {
      await navigator.clipboard.writeText(txt);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = txt;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    }
  };

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, m=>(
      m==='&'?'&amp;':m==='<'?'&lt;':m==='>'?'&gt;':m==='"'?'&quot;':'&#039;'
    ));
  }

  // ------- Data (Tiles) -----------------------------------------------------
  const TILE_DEPARTMENTS = [
    { id:'marketing', label:'Marketing' },
    { id:'sales', label:'Sales' },
    { id:'revenue', label:'Revenue' },
    { id:'growth', label:'Growth' },
    { id:'product', label:'Product' },
    { id:'engineering', label:'Engineering' },
    { id:'success', label:'Customer Success' },
    { id:'ops', label:'Operations' },
  ];

  const TILE_SENIORITIES = [
    { id:'c_level', label:'C-Level' },
    { id:'vp', label:'VP' },
    { id:'director', label:'Director' },
    { id:'manager', label:'Manager' },
    { id:'lead', label:'Team Lead' },
  ];

  const TILE_TECH = [
    { id:'hubspot',   label:'HubSpot' },
    { id:'salesforce',label:'Salesforce' },
    { id:'segment',   label:'Segment' },
    { id:'clearbit',  label:'Clearbit' },
    { id:'shopify',   label:'Shopify' },
    { id:'klaviyo',   label:'Klaviyo' },
    { id:'pipedrive', label:'Pipedrive' },
    { id:'marketo',   label:'Marketo' },
    { id:'intercom',  label:'Intercom' },
    { id:'zendesk',   label:'Zendesk' },
  ];

  const TILE_REGIONS = [
    { id:'na', label:'North America' },
    { id:'eu', label:'Europe' },
    { id:'apac', label:'APAC' },
    { id:'latam', label:'LATAM' },
    { id:'mea', label:'Middle East & Africa' },
  ];

  // ------- State ------------------------------------------------------------
  const state = {
    offer: '',
    yourIndustry: '',
    presetIndustry: '',
    extraIndustries: [],
    keywords: [],
    companyType: '',
    companyKeywords: [],
    empRange: '11-50',
    revRange: '1m-5m',
    businessModel: '',
    marketType: 'B2B',
    salesCycle: 'Short (< 30 days)',
    dealSize: 5000,
    departments: new Set(),
    seniorities: new Set(),
    tech: new Set(),
    fundingStage: '',
    geoScope: 'local',
    zip: '',
    state: '',
    radius: 25,
    country: 'United States',
    regions: new Set(),
    countries: '',
    titles: [],
    verifiedEmails: false,
    confidence: 0,
    apolloUrl: '',
    apolloUrlRelaxed: '',
    dbgGroups: { person:true, org:true, kw:true, misc:true }
  };

  // ------- DOM refs ---------------------------------------------------------
  const el = {
    offer: $('#offer'),
    yourIndustry: $('#yourIndustry'),
    industryPreset: $('#industry'),
    industryInput: $('#industryInput'),
    industriesChips: $('#industriesChips'),
    keywordInput: $('#keywordInput'),
    keywordsChips: $('#keywordsChips'),
    keywordSuggest: $('#keywordSuggest'),
    companyType: $('#companyType'),
    companyKeywordInput: $('#companyKeywordInput'),
    companyKeywordsChips: $('#companyKeywordsChips'),
    empRange: $('#empRange'),
    revRange: $('#revRange'),
    businessModel: $('#businessModel'),
    marketTabs: $('#marketTabs'),
    salesCycle: $('#salesCycle'),
    dealSteps: $('#dealSteps'),
    dealSize: $('#dealSize'),
    departments: $('#departments'),
    seniorities: $('#seniorities'),
    techTags: $('#techTags'),
    fundingStage: $('#fundingStage'),
    scopeTabs: $('#scopeTabs'),
    zip: $('#zip'),
    state: $('#state'),
    radius: $('#radius'),
    radiusVal: $('#radiusVal'),
    country: $('#country'),
    regions: $('#regions'),
    countries: $('#countries'),
    titleInput: $('#titleInput'),
    titlesChips: $('#titlesChips'),
    verifiedEmails: $('#verifiedEmails'),
    btnGenerate: $('#btnGenerate'),
    btnReset: $('#btnReset'),
    inlineMsg: $('#inlineMsg'),
    output: $('#output'),
    summaryBar: $('#summaryBar'),
    confFill: $('#confFill'),
    confPct: $('#confPct'),
    volumeHint: $('#volumeHint'),
    confNote: $('#confNote'),
    apolloUrl: $('#apolloUrl'),
    btnOpenApollo: $('#btnOpenApollo'),
    btnOpenRelaxed: $('#btnOpenRelaxed'),
    btnCopyApollo: $('#btnCopyApollo'),
    btnExportTxt: $('#btnExportTxt'),
    btnExportPDF: $('#btnExportPDF'),
    btnExportJSON: $('#btnExportJSON'),
    dbgWrap: $('#debugWrap'),
    dbgToggle: $('#debugToggle'),
    dbgBody: $('#debugBody'),
    dbgPerson: $('#dbgPerson'),
    dbgOrg: $('#dbgOrg'),
    dbgKw: $('#dbgKw'),
    dbgMisc: $('#dbgMisc'),
    btnOpenWithGroups: $('#btnOpenWithGroups'),
    btnDownloadJSON: $('#btnDownloadJSON'),
    resultsTop: $('#resultsTop') || $('#outputCard')
  };

  // ------- Rendering: generic tile rows ------------------------------------
  function renderTileRow(container, items, selectedSet){
    if (!container) return;
    container.innerHTML = '';
    items.forEach(({id,label})=>{
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tile' + (selectedSet.has(id) ? ' selected' : '');
      b.textContent = label;
      b.setAttribute('data-id', id);
      b.setAttribute('aria-pressed', selectedSet.has(id) ? 'true' : 'false');
      b.addEventListener('click', ()=>{
        if (selectedSet.has(id)) {
          selectedSet.delete(id);
          b.classList.remove('selected');
          b.setAttribute('aria-pressed','false');
        } else {
          selectedSet.add(id);
          b.classList.add('selected');
          b.setAttribute('aria-pressed','true');
        }
        recalcConfidence();
      });
      container.appendChild(b);
    });
  }

  // ------- Chips input ------------------------------------------------------
  function attachChips(inputEl, chipsWrap, arrRef, opts = {}){
    if (!inputEl || !chipsWrap) return;
    
    const {normalize=true, dedupe=true, allowComma=true} = opts;
    
    const addChip = (raw) => {
      let s = safeStr(raw);
      if (!s) return;
      
      if (allowComma && s.includes(',')) {
        s.split(',').map(v=>v.trim()).filter(Boolean).forEach(addChip);
        return;
      }
      
      if (normalize) s = s.replace(/\s+/g,' ');
      
      if (dedupe) {
        const lower = s.toLowerCase();
        if (arrRef.some(v => String(v).toLowerCase() === lower)) return;
      }
      
      arrRef.push(s);
      draw();
    };
    
    const draw = () => {
      chipsWrap.innerHTML = '';
      arrRef.forEach((v, idx)=>{
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.innerHTML = `${escapeHtml(v)} <button type="button" class="remove" aria-label="Remove">\u00D7</button>`;
        chip.querySelector('button').addEventListener('click', ()=>{
          arrRef.splice(idx,1);
          draw();
          recalcConfidence();
        });
        chipsWrap.appendChild(chip);
      });
      recalcConfidence();
    };
    
    inputEl.addEventListener('keydown', (e)=>{
      if (e.key === 'Enter') {
        e.preventDefault();
        addChip(inputEl.value);
        inputEl.value = '';
      }
      if (e.key === 'Backspace' && !inputEl.value && arrRef.length){
        arrRef.pop();
        draw();
      }
    });
    
    inputEl.addEventListener('blur', ()=>{
      if (inputEl.value.trim()){
        addChip(inputEl.value);
        inputEl.value = '';
      }
    });
  }

  // ------- Tabs & Steps -----------------------------------------------------
  function bindTabs(tabsWrap, keyAttr, onSelect){
    if (!tabsWrap) return;
    const tabs = $$('.tab', tabsWrap);
    tabs.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        tabs.forEach(x=>{
          x.classList.remove('active');
          x.setAttribute('aria-selected','false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected','true');
        const v = btn.getAttribute(keyAttr);
        onSelect(v);
      });
    });
  }

  function bindSteps(stepsWrap, hiddenInput, onVal){
    if (!stepsWrap) return;
    const steps = $$('.step', stepsWrap);
    steps.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        steps.forEach(s=>{
          s.classList.remove('active');
          s.setAttribute('aria-checked','false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-checked','true');
        const v = Number(btn.getAttribute('data-val')) || 0;
        if (hiddenInput) hiddenInput.value = String(v);
        onVal(v);
      });
    });
  }

  // ------- Confidence -------------------------------------------------------
  function recalcConfidence(){
    let pts = 0;
    if (state.offer) pts += 3;
    if (state.presetIndustry) pts += 2;
    if (state.extraIndustries.length) pts += 1;
    if (state.companyType) pts += 1;
    if (state.companyKeywords.length) pts += 2;
    if (state.keywords.length) pts += 2;

    pts += clamp(state.seniorities.size, 0, 5);
    pts += clamp(state.departments.size, 0, 5);
    if (state.titles.length) pts += 2;

    if (state.empRange) pts += 2;
    if (state.revRange) pts += 2;
    if (state.businessModel) pts += 1;
    if (state.dealSize) pts += 2;

    pts += clamp(state.tech.size, 0, 5);

    if (state.geoScope === 'local') {
      if (state.zip || state.state) pts += 2;
      if (state.radius) pts += 1;
    } else if (state.geoScope === 'national') {
      if (state.country) pts += 3;
    } else {
      if (state.regions.size) pts += 2;
      if (state.countries) pts += 2;
    }

    if (state.fundingStage) pts += 1;
    if (state.verifiedEmails) pts += 2;

    const maxPts = 40;
    const pct = clamp(Math.round((pts / maxPts) * 100), 0, 100);
    state.confidence = pct;

    if (el.confFill) el.confFill.style.width = pct + '%';
    if (el.confPct) el.confPct.textContent = pct + '%';

    if (el.volumeHint){
      const hintText = el.volumeHint.querySelector('.muted');
      if (hintText) {
        hintText.textContent = 
          pct < 35 ? 'Add more filters to improve match quality and keep a usable lead volume.'
          : pct < 70 ? 'Nice! You have a solid ICP filter set; consider testing a few relaxed variants.'
          : 'Strong ICP. Consider a relaxed link variant for more volume.';
      }
    }
  }

  // ------- Initial Render ---------------------------------------------------
  function initialRender(){
    if (el.departments && !el.departments.dataset.ready){
      renderTileRow(el.departments, TILE_DEPARTMENTS, state.departments);
      el.departments.dataset.ready = 'true';
    }
    if (el.seniorities && !el.seniorities.dataset.ready){
      renderTileRow(el.seniorities, TILE_SENIORITIES, state.seniorities);
      el.seniorities.dataset.ready = 'true';
    }
    if (el.techTags && !el.techTags.dataset.ready){
      renderTileRow(el.techTags, TILE_TECH, state.tech);
      el.techTags.dataset.ready = 'true';
    }
    if (el.regions && !el.regions.dataset.ready){
      renderTileRow(el.regions, TILE_REGIONS, state.regions);
      el.regions.dataset.ready = 'true';
    }
  }

  // ------- Bind inputs ------------------------------------------------------
  function bindInputs(){
    if (el.offer) {
      el.offer.addEventListener('input', e=>{ 
        state.offer = safeStr(e.target.value); 
        recalcConfidence(); 
      });
    }

    if (el.yourIndustry) {
      el.yourIndustry.addEventListener('change', e=>{ 
        state.yourIndustry = safeStr(e.target.value); 
      });
    }
    
    if (el.industryPreset) {
      el.industryPreset.addEventListener('change', e=>{
        state.presetIndustry = safeStr(e.target.value);
        recalcConfidence();
      });
    }

    attachChips(el.industryInput, el.industriesChips, state.extraIndustries);
    attachChips(el.keywordInput, el.keywordsChips, state.keywords);
    attachChips(el.companyKeywordInput, el.companyKeywordsChips, state.companyKeywords);
    attachChips(el.titleInput, el.titlesChips, state.titles);

    if (el.companyType) {
      el.companyType.addEventListener('change', e=>{ 
        state.companyType = safeStr(e.target.value); 
        recalcConfidence(); 
      });
    }
    
    if (el.empRange) {
      el.empRange.addEventListener('change', e=>{ 
        state.empRange = safeStr(e.target.value); 
        recalcConfidence(); 
      });
    }
    
    if (el.revRange) {
      el.revRange.addEventListener('change', e=>{ 
        state.revRange = safeStr(e.target.value); 
        recalcConfidence(); 
      });
    }
    
    if (el.businessModel) {
      el.businessModel.addEventListener('change', e=>{ 
        state.businessModel = safeStr(e.target.value); 
        recalcConfidence(); 
      });
    }

    bindTabs(el.marketTabs, 'data-market', v=>{
      state.marketType = v || 'B2B';
      recalcConfidence();
    });

    if (el.salesCycle) {
      el.salesCycle.addEventListener('change', e=>{ 
        state.salesCycle = safeStr(e.target.value); 
        recalcConfidence(); 
      });
    }

    bindSteps(el.dealSteps, el.dealSize, (v)=>{
      state.dealSize = Number(v)||0;
      recalcConfidence();
    });

    if (el.fundingStage) {
      el.fundingStage.addEventListener('change', e=>{ 
        state.fundingStage = safeStr(e.target.value); 
        recalcConfidence(); 
      });
    }

    bindTabs(el.scopeTabs, 'data-scope', v=>{
      state.geoScope = v || 'local';
      
      // Show/hide geo sections
      const localSection = $('#scopeLocal');
      const nationalSection = $('#scopeNational');
      const intlSection = $('#scopeInternational');
      
      if (localSection) localSection.style.display = v === 'local' ? 'block' : 'none';
      if (nationalSection) nationalSection.style.display = v === 'national' ? 'block' : 'none';
      if (intlSection) intlSection.style.display = v === 'international' ? 'block' : 'none';
      
      recalcConfidence();
    });

    if (el.zip) {
      el.zip.addEventListener('input', e=>{ 
        state.zip = e.target.value.trim(); 
        recalcConfidence(); 
      });
    }
    
    if (el.state) {
      el.state.addEventListener('change', e=>{ 
        state.state = e.target.value.trim(); 
        recalcConfidence(); 
      });
    }
    
    if (el.radius) {
      el.radius.addEventListener('input', e=>{
        const val = Number(e.target.value)||25;
        state.radius = val;
        if (el.radiusVal) el.radiusVal.textContent = String(val);
        recalcConfidence();
      });
    }
    
    if (el.country) {
      el.country.addEventListener('change', e=>{ 
        state.country = e.target.value; 
        recalcConfidence(); 
      });
    }
    
    if (el.countries) {
      el.countries.addEventListener('input', e=>{ 
        state.countries = e.target.value; 
        recalcConfidence(); 
      });
    }

    if (el.verifiedEmails) {
      el.verifiedEmails.addEventListener('change', e=>{
        state.verifiedEmails = !!e.target.checked;
        recalcConfidence();
      });
    }
  }

  // ------- Apollo URL Build -------------------------------------------------
  function buildApolloParams(groups = {person:true, org:true, kw:true, misc:true}){
    const params = {};

    // Person filters
    if (groups.person){
      if (state.seniorities.size) {
        params.personSeniorities = Array.from(state.seniorities);
      }
      if (state.departments.size) {
        params.personDepartments = Array.from(state.departments);
      }
      if (state.titles.length) {
        params.personTitles = state.titles;
      }
      if (state.verifiedEmails){
        params.contactEmailStatus = 'verified';
      }
    }

    // Org filters
    if (groups.org){
      if (state.empRange) {
        const empMap = {
          '1-10': [1, 10],
          '11-50': [11, 50],
          '51-200': [51, 200],
          '201-500': [201, 500],
          '501-1000': [501, 1000],
          '1001-5000': [1001, 5000],
          '5001+': [5001, null]
        };
        const range = empMap[state.empRange];
        if (range) {
          params.organizationNumEmployeesMin = range[0];
          if (range[1]) params.organizationNumEmployeesMax = range[1];
        }
      }
      
      if (state.tech.size) {
        params.organizationTechnologies = Array.from(state.tech);
      }
      
      if (state.fundingStage) {
        params.fundingStage = state.fundingStage;
      }

      // Geography
      if (state.geoScope === 'local'){
        if (state.state) {
          params.personLocations = [state.state];
          params.organizationLocations = [state.state];
        }
      } else if (state.geoScope === 'national') {
        params.personLocations = [state.country];
        params.organizationLocations = [state.country];
      } else {
        const regions = Array.from(state.regions).map(id => {
          const map = {
            na:'North America', eu:'Europe', apac:'APAC', 
            latam:'LATAM', mea:'Middle East & Africa'
          };
          return map[id] || id;
        });
        const countries = (state.countries||'').split(',').map(s=>s.trim()).filter(Boolean);
        const merged = [...regions, ...countries];
        if (merged.length) {
          params.personLocations = merged;
          params.organizationLocations = merged;
        }
      }
    }

    // Keywords
    if (groups.kw){
      const tags = [];
      if (state.presetIndustry) tags.push(state.presetIndustry);
      state.extraIndustries.forEach(i => tags.push(i));
      state.keywords.forEach(k => tags.push(k));
      
      if (tags.length) {
        params.q_keywords = tags.join(' OR ');
      }
    }

    return params;
  }

  function buildApolloUrl(groups){
    const baseUrl = root.dataset.apolloBase || 'https://app.apollo.io/#/people';
    const params = buildApolloParams(groups);
    
    const queryParts = [];
    for (const [key, val] of Object.entries(params)) {
      const value = Array.isArray(val) ? JSON.stringify(val) : val;
      queryParts.push(`${key}=${encodeURIComponent(value)}`);
    }
    
    return baseUrl + (queryParts.length ? '?' + queryParts.join('&') : '');
  }

  function buildApolloUrlRelaxed(){
    // Relaxed: drop keywords to expand volume
    const groups = { person:true, org:true, kw:false, misc:false };
    return buildApolloUrl(groups);
  }

  // ------- Narrative Generation --------------------------------------------
  function labelForId(id, kind){
    let list = [];
    if (kind === 'tech') list = TILE_TECH;
    else if (kind === 'dept') list = TILE_DEPARTMENTS;
    else if (kind === 'seniority') list = TILE_SENIORITIES;
    
    const found = list.find(t => t.id === id);
    return found ? found.label : id;
  }

  function buildNarrative(){
    const market = state.marketType || 'B2B';
    const industry = state.presetIndustry || (state.keywords[0] || 'your target vertical');
    const ds = Number(state.dealSize)||0;
    const seniors = Array.from(state.seniorities).map(s=>labelForId(s, 'seniority')).join(', ') || 'mixed seniority';
    const depts = Array.from(state.departments).map(s=>labelForId(s, 'dept')).join(', ') || 'multiple departments';
    const techs = Array.from(state.tech).map(s=>labelForId(s, 'tech')).join(', ') || 'diverse tech stacks';
    const titles = state.titles.length ? state.titles.join(', ') : 'role-specific decision makers';
    
    let geo = 'Selected region';
    if (state.geoScope === 'local'){
      const parts = [];
      if (state.zip) parts.push(`ZIP ${state.zip}`);
      if (state.state) parts.push(state.state);
      if (state.radius) parts.push(`${state.radius}mi radius`);
      geo = parts.join(', ') || 'Local metro';
    } else if (state.geoScope === 'national'){
      geo = state.country || 'Selected country';
    } else {
      const r = Array.from(state.regions).map(id => labelForId(id, 'region'));
      const c = (state.countries||'').split(',').map(s=>s.trim()).filter(Boolean);
      geo = [...r, ...c].join(', ') || 'Selected regions/countries';
    }
    
    const pov = state.offer || 'AI Lead Generation';
    const bm = state.businessModel || '';
    const conf = state.confidence;
    
    // Build sections for structured output
    const sections = [];
    
    // Executive Summary
    sections.push({
      title: '\u{1F4CA} Executive Summary',
      content: `Your ideal customer profile targets ${market} ${industry} companies with ${state.empRange.replace('-', '\u2013')} employees and estimated ${state.revRange.replace('m', 'M').replace('-', '\u2013')} annual revenue. These organizations are in the market for ${pov} solutions, with typical deal values around ${ds ? `$${ds.toLocaleString()}` : 'your target range'}.`
    });
    
    // Decision Maker Profile
    sections.push({
      title: '\u{1F464} Decision Maker Profile',
      content: `Target personas include ${seniors} level stakeholders across ${depts} departments. Key titles to engage: ${titles}. These decision-makers are typically responsible for evaluating and implementing solutions like yours.`
    });
    
    // Buying Signals & Tech Stack
    if (state.tech.size > 0) {
      sections.push({
        title: '\u{1F514} Buying Signals & Tech Stack',
        content: `Companies using ${techs} demonstrate technical sophistication and readiness for ${pov}. These technology signals indicate they're already investing in similar solutions and have budget allocated for this category.`
      });
    }
    
    // Geographic Focus
    sections.push({
      title: '\u{1F30D} Geographic Focus',
      content: `Target market is concentrated in ${geo}. This geographic targeting ensures your outreach aligns with your service delivery capabilities and market presence.`
    });
    
    // Value Proposition Strategy
    let vpContent = `Position ${pov} as a solution that reduces customer acquisition cost, increases reply rates, and accelerates pipeline velocity`;
    if (bm) vpContent += ` specifically for ${bm.toLowerCase()} business models`;
    vpContent += '. Emphasize proven ROI and quick time-to-value in your messaging.';
    
    sections.push({
      title: '\u{1F4A1} Value Proposition Strategy',
      content: vpContent
    });
    
    // Outreach Recommendations
    let outreachRec = '';
    const cycleMap = {
      'Short (< 30 days)': 'Given the short sales cycle, focus on immediate pain points and quick wins. Lead with case studies showing rapid implementation and fast ROI.',
      'Medium (30\u201390 days)': 'With a medium-length sales cycle, balance quick wins with strategic value. Plan for 3-4 touchpoints mixing education and social proof.',
      'Long (> 90 days)': 'The extended sales cycle requires relationship building and thought leadership. Focus on education, industry insights, and long-term value creation.'
    };
    outreachRec = cycleMap[state.salesCycle] || 'Tailor your outreach cadence to match the buying journey and decision-making timeline.';
    
    sections.push({
      title: '\u{1F4DE} Outreach Recommendations',
      content: outreachRec
    });
    
    // Confidence Assessment
    let confAssessment = '';
    if (conf < 35) {
      confAssessment = 'Consider adding more filters to narrow your targeting. More specific criteria will improve match quality and response rates.';
    } else if (conf < 70) {
      confAssessment = 'Your ICP has solid definition. Test this profile and monitor performance metrics to refine further.';
    } else {
      confAssessment = 'Excellent ICP definition with high confidence. Consider creating a relaxed variant to expand addressable market once you validate this core profile.';
    }
    
    sections.push({
      title: '\u2713 Profile Confidence',
      content: `${conf}% confidence score. ${confAssessment}`
    });
    
    return sections;
  }

  // ------- Typewriter -------------------------------------------------------
  function typewriterInto(node, text, speed = 10){
    if (!node) return Promise.resolve();
    node.textContent = '';
    const chunks = String(text).split('');
    let i = 0;
    return new Promise(res=>{
      const id = setInterval(()=>{
        if (i < chunks.length) {
          node.textContent += chunks[i];
          i++;
        } else {
          clearInterval(id);
          res();
        }
      }, speed);
    });
  }

  // ------- Summary bar ------------------------------------------------------
  function renderSummary(){
    if (!el.summaryBar) return;
    const sCount = state.seniorities.size;
    const dCount = state.departments.size;
    const tCount = state.tech.size;
    const market = state.marketType || 'B2B';
    const ds = Number(state.dealSize)||0;

    const parts = [
      `Market: ${market}`,
      `Deal size: ${ds ? `$${ds.toLocaleString()}` : 'n/a'}`,
      `Seniorities: ${sCount}`,
      `Departments: ${dCount}`,
      `Tech: ${tCount}`
    ];
    el.summaryBar.textContent = parts.join(' \u2022 ');
  }

  // ------- Output render ----------------------------------------------------
  async function renderOutput(){
    renderSummary();

    const sections = buildNarrative();
    
    if (el.output){
      el.output.innerHTML = '';
      
      // Show analyzing message
      const analyzing = document.createElement('div');
      analyzing.className = 'out-sec';
      analyzing.innerHTML = '<div class="out-h3">\u{1F916} AI Analyzing Your ICP...</div><div class="out-body muted">Processing filters and generating insights...</div>';
      el.output.appendChild(analyzing);
      
      // Wait a moment for effect
      await new Promise(res => setTimeout(res, 800));
      
      // Clear and build sections
      el.output.innerHTML = '';
      
      for (const section of sections) {
        const sec = document.createElement('section');
        sec.className = 'out-sec';

        const h = document.createElement('div');
        h.className = 'out-h3';
        h.textContent = section.title;
        sec.appendChild(h);

        const body = document.createElement('div');
        body.className = 'out-body';
        sec.appendChild(body);

        el.output.appendChild(sec);
        
        // Type out each section with slight delay between sections
        await typewriterInto(body, section.content, 6);
        await new Promise(res => setTimeout(res, 200));
      }

      // Add filter summary section
      const details = document.createElement('section');
      details.className = 'out-sec';
      details.innerHTML = `
        <div class="out-h3">\u{1F50D} Applied Filters Summary</div>
        <div class="out-body">
          <div><strong>Seniorities:</strong> ${Array.from(state.seniorities).map(id=>escapeHtml(labelForId(id,'seniority'))).join(', ') || '\u2014'}</div>
          <div><strong>Departments:</strong> ${Array.from(state.departments).map(id=>escapeHtml(labelForId(id,'dept'))).join(', ') || '\u2014'}</div>
          <div><strong>Tech Signals:</strong> ${Array.from(state.tech).map(id=>escapeHtml(labelForId(id,'tech'))).join(', ') || '\u2014'}</div>
          <div><strong>Job Titles:</strong> ${state.titles.map(escapeHtml).join(', ') || '\u2014'}</div>
          <div><strong>Keywords:</strong> ${state.keywords.map(escapeHtml).join(', ') || '\u2014'}</div>
          ${state.companyKeywords.length ? `<div><strong>Company Keywords:</strong> ${state.companyKeywords.map(escapeHtml).join(', ')}</div>` : ''}
        </div>
      `;
      el.output.appendChild(details);
    }
  }

  // ------- Exports ----------------------------------------------------------
  function exportTxt(){
    const lines = [];
    const sections = buildNarrative();
    
    lines.push('# ICP NARRATIVE\n');
    sections.forEach(section => {
      lines.push(`## ${section.title}`);
      lines.push(section.content);
      lines.push('');
    });
    
    lines.push('\n# APPLIED FILTERS');
    lines.push(`Seniorities: ${Array.from(state.seniorities).map(id=>labelForId(id,'seniority')).join(', ') || '-'}`);
    lines.push(`Departments: ${Array.from(state.departments).map(id=>labelForId(id,'dept')).join(', ') || '-'}`);
    lines.push(`Tech Signals: ${Array.from(state.tech).map(id=>labelForId(id,'tech')).join(', ') || '-'}`);
    lines.push(`Job Titles: ${state.titles.join(', ') || '-'}`);
    lines.push(`Keywords: ${state.keywords.join(', ') || '-'}`);
    lines.push(`Company Keywords: ${state.companyKeywords.join(', ') || '-'}`);
    lines.push('');
    lines.push('\n# APOLLO LINKS');
    lines.push('## Standard Link');
    lines.push(state.apolloUrl || '');
    lines.push('');
    lines.push('## Relaxed Link (More Volume)');
    lines.push(state.apolloUrlRelaxed || '');
    return lines.join('\n');
  }

  function exportJSON(){
    return {
      meta: { version: '4.0', generatedAt: new Date().toISOString() },
      state: {
        offer: state.offer,
        yourIndustry: state.yourIndustry,
        presetIndustry: state.presetIndustry,
        extraIndustries: state.extraIndustries,
        keywords: state.keywords,
        companyType: state.companyType,
        companyKeywords: state.companyKeywords,
        empRange: state.empRange,
        revRange: state.revRange,
        businessModel: state.businessModel,
        marketType: state.marketType,
        salesCycle: state.salesCycle,
        dealSize: state.dealSize,
        departments: Array.from(state.departments),
        seniorities: Array.from(state.seniorities),
        tech: Array.from(state.tech),
        fundingStage: state.fundingStage,
        geoScope: state.geoScope,
        zip: state.zip,
        state: state.state,
        radius: state.radius,
        country: state.country,
        regions: Array.from(state.regions),
        countries: state.countries,
        titles: state.titles,
        verifiedEmails: state.verifiedEmails,
        confidence: state.confidence
      },
      apollo: {
        strict: state.apolloUrl,
        relaxed: state.apolloUrlRelaxed
      }
    };
  }

  function downloadBlob(filename, blob){
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  // ------- Debug ------------------------------------------------------------
  function renderDebug(){
    try {
      if (el.dbgPerson) el.dbgPerson.textContent = JSON.stringify(buildApolloParams({person:true, org:false, kw:false, misc:false}), null, 2);
      if (el.dbgOrg)    el.dbgOrg.textContent    = JSON.stringify(buildApolloParams({person:false, org:true, kw:false, misc:false}), null, 2);
      if (el.dbgKw)     el.dbgKw.textContent     = JSON.stringify(buildApolloParams({person:false, org:false, kw:true, misc:false}), null, 2);
      if (el.dbgMisc)   el.dbgMisc.textContent   = JSON.stringify(buildApolloParams({person:false, org:false, kw:false, misc:true}), null, 2);
    } catch(e){ 
      console.error('Debug render error:', e);
    }
  }

  // ------- Actions ----------------------------------------------------------
  function bindActions(){
    if (el.btnGenerate){
      el.btnGenerate.addEventListener('click', async ()=>{
        // Show loading state
        if (el.btnGenerate) {
          el.btnGenerate.disabled = true;
          el.btnGenerate.textContent = '\u2699\uFE0F Generating...';
        }
        
        const groups = { person:true, org:true, kw:true, misc:true };
        const url = buildApolloUrl(groups);
        const relaxed = buildApolloUrlRelaxed();

        state.apolloUrl = url;
        state.apolloUrlRelaxed = relaxed;

        if (el.apolloUrl) el.apolloUrl.textContent = url;
        if (el.btnOpenApollo) el.btnOpenApollo.href = url;
        if (el.btnOpenRelaxed) {
          el.btnOpenRelaxed.onclick = (e) => {
            e.preventDefault();
            window.open(relaxed, '_blank', 'noopener');
          };
        }

        await renderOutput();
        
        // Success feedback
        if (el.inlineMsg){
          el.inlineMsg.style.color = 'var(--phage-green)';
          el.inlineMsg.style.fontWeight = '600';
          el.inlineMsg.textContent = '\u2713 ICP Generated Successfully! Scroll down to view results.';
          setTimeout(()=>{ 
            el.inlineMsg.textContent='';
            el.inlineMsg.style.color = '';
            el.inlineMsg.style.fontWeight = '';
          }, 4000);
        }
        
        // Reset button
        if (el.btnGenerate) {
          el.btnGenerate.disabled = false;
          el.btnGenerate.textContent = '\u2699 Generate ICP';
        }
        
        // Smooth scroll with delay to let message show
        setTimeout(()=>{
          if (el.resultsTop) smoothScrollTo(el.resultsTop);
        }, 500);
        
        renderDebug();
      });
    }

    if (el.btnReset){
      el.btnReset.addEventListener('click', ()=>{
        if (confirm('Reset all fields? This will reload the page.')) {
          location.reload();
        }
      });
    }

    if (el.btnCopyApollo){
      el.btnCopyApollo.addEventListener('click', async ()=>{
        const ok = await copyText(state.apolloUrl || '');
        toast(ok ? 'Apollo link copied!' : 'Copy failed.');
      });
    }

    if (el.btnExportTxt){
      el.btnExportTxt.addEventListener('click', ()=>{
        const txt = exportTxt();
        downloadBlob('icp-notes.txt', new Blob([txt], {type:'text/plain;charset=utf-8'}));
        toast('TXT exported!');
      });
    }

    if (el.btnExportJSON){
      el.btnExportJSON.addEventListener('click', ()=>{
        const j = exportJSON();
        downloadBlob('icp-config.json', new Blob([JSON.stringify(j,null,2)], {type:'application/json;charset=utf-8'}));
        toast('JSON exported!');
      });
    }

    if (el.btnOpenWithGroups){
      el.btnOpenWithGroups.addEventListener('click', ()=>{
        const url = buildApolloUrl(state.dbgGroups);
        window.open(url, '_blank', 'noopener');
      });
    }

    if (el.btnDownloadJSON){
      el.btnDownloadJSON.addEventListener('click', ()=>{
        const p = buildApolloParams(state.dbgGroups);
        downloadBlob('apollo-params.json', new Blob([JSON.stringify(p,null,2)], {type:'application/json;charset=utf-8'}));
        toast('Params JSON downloaded!');
      });
    }

    // Debug panel toggle
    if (el.dbgToggle && el.dbgBody){
      el.dbgToggle.addEventListener('click', ()=>{
        el.dbgBody.classList.toggle('open');
      });
    }

    // Debug group checkboxes
    if (el.dbgWrap){
      const groupChecks = $$('.debug-group-check', el.dbgWrap);
      groupChecks.forEach(chk=>{
        chk.addEventListener('change', ()=>{
          const g = chk.getAttribute('data-group');
          if (g) state.dbgGroups[g] = !!chk.checked;
          renderDebug();
        });
      });
    }
  }

  function toast(msg){
    if (!msg || !el.inlineMsg) return;
    el.inlineMsg.textContent = msg;
    setTimeout(()=>{ el.inlineMsg.textContent=''; }, 1800);
  }

  // ------- Init -------------------------------------------------------------
  function init(){
    initialRender();
    bindInputs();
    bindActions();
    recalcConfidence();
    renderSummary();
    renderDebug();
  }

  // Run init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
