(() => {
  'use strict';

  if (window.__atsHelperInitialized) return;
  window.__atsHelperInitialized = true;
  console.info('[ATS] content script loaded');

  const allowedHosts = [
    'www.intergrall.com.br',
    'wwws.intergrall.com.br',
    'www2.uranet.com.br',
    'dev.intergrall.com.br',
    'linux07'
  ];
  const allowedPath = 'callcenter/apontamento_atividade_2.php';
  const storageKeys = {
    templates: 'atsTemplates',
    popover: 'atsPopoverPosition'
  };
  const randomEmojis = ['🚀', '🌟', '✨', '🤖', '🎯', '🧭', '💡', '🔥', '📌'];
  const magicEmoji = '🪄';
  const DEBUG_FORCE_ACTIVATE = true; // TEMP: força ativação mesmo se modal não estiver visível

  const log = (...args) => {
    try {
      // console.info('[ATS]', ...args);
    } catch (_) {}
  };

  const state = {
    root: null,
    popover: null,
    panel: null,
    listContainer: null,
    footerEmojiBtn: null,
    editOverlay: null,
    templates: [],
    suppressNextCapture: false,
    lastAppliedTemplateId: null,
    observer: null,
    saveListenerAttached: false
  };

  const storageArea =
    (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) ||
    (typeof browser !== 'undefined' && browser.storage && browser.storage.local) ||
    null;

  const now = () => Date.now();

  const storageGet = async (key) => {
    if (!storageArea) return null;
    try {
      if (storageArea.get.length === 1) {
        const res = await storageArea.get(key);
        return res[key];
      }
      return await new Promise((resolve) => storageArea.get(key, (res) => resolve(res[key])));
    } catch (err) {
      console.warn('[ATS] storage get error', err);
      return null;
    }
  };

  const storageSet = async (key, value) => {
    if (!storageArea) return;
    const payload = { [key]: value };
    try {
      if (storageArea.set.length === 1) {
        return await storageArea.set(payload);
      }
      return await new Promise((resolve) => storageArea.set(payload, () => resolve()));
    } catch (err) {
      console.warn('[ATS] storage set error', err);
    }
  };

  const isTargetHostAndPath = () => {
    const hostOk = allowedHosts.includes(location.hostname);
    const pathOk = location.pathname.includes(allowedPath);
    return hostOk && pathOk;
  };

  const isElementVisible = (el) => {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      el.offsetWidth > 0 &&
      el.offsetHeight > 0
    );
  };

  const hasVisibleModalWrapper = () => {
    const list = Array.from(document.querySelectorAll('.modal--wrapper'));
    return list.some(isElementVisible);
  };

  const shouldActivate = () => {
    const hostPathOk = isTargetHostAndPath();
    const modalOk = hasVisibleModalWrapper();
    const result = hostPathOk && (modalOk || DEBUG_FORCE_ACTIVATE);
    log('shouldActivate?', { hostPathOk, modalOk, DEBUG_FORCE_ACTIVATE, result });
    return result;
  };

  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  const loadPosition = async () => {
    const saved = await storageGet(storageKeys.popover);
    if (saved && typeof saved.top === 'number' && typeof saved.left === 'number') {
      return saved;
    }
    return null;
  };

  const savePosition = (pos) => storageSet(storageKeys.popover, pos);

  const loadTemplates = async () => {
    const saved = (await storageGet(storageKeys.templates)) || [];
    state.templates = Array.isArray(saved) ? saved : [];
  };

  const persistTemplates = () => storageSet(storageKeys.templates, state.templates);

  const createRoot = () => {
    log('createRoot');
    const root = document.createElement('div');
    root.className = 'ats-root';
    state.root = root;
    document.body.appendChild(root);
  };

  const setPopoverPosition = (top, left) => {
    if (!state.popover) return;
    const size = 60;
    const maxTop = window.innerHeight - size - 4;
    const maxLeft = window.innerWidth - size - 4;
    const clampedTop = clamp(top, 4, maxTop);
    const clampedLeft = clamp(left, 4, maxLeft);
    state.popover.style.top = `${clampedTop}px`;
    state.popover.style.left = `${clampedLeft}px`;
    state.popover.style.right = 'auto';
    savePosition({ top: clampedTop, left: clampedLeft });
  };

  const createPopover = async () => {
    log('creating popover');
    const pop = document.createElement('button');
    pop.className = 'ats-popover';
    pop.title = 'Assistente Time Sheet';
    pop.textContent = magicEmoji;
    let startX = 0;
    let startY = 0;
    let startTop = 0;
    let startLeft = 0;
    let dragging = false;

    const onMouseMove = (ev) => {
      dragging = true;
      const newTop = ev.clientY - startY;
      const newLeft = ev.clientX - startX;
      setPopoverPosition(newTop, newLeft);
    };

    const endDrag = (ev) => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', endDrag);
      if (!dragging) {
        togglePanel();
      }
      dragging = false;
    };

    pop.addEventListener('mousedown', (ev) => {
      ev.preventDefault();
      const rect = pop.getBoundingClientRect();
      startX = ev.clientX - rect.left;
      startY = ev.clientY - rect.top;
      startTop = rect.top;
      startLeft = rect.left;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', endDrag);
    });

    const saved = await loadPosition();
    if (saved) {
      setPopoverPosition(saved.top, saved.left);
    } else {
      setPopoverPosition(16, window.innerWidth - 76);
    }

    state.popover = pop;
    state.root.appendChild(pop);
  };

  const closePanel = () => {
    if (!state.panel) return;
    state.panel.classList.add('closing');
    setTimeout(() => {
      state.panel.classList.remove('closing');
      state.panel.classList.remove('open');
      state.panel.style.display = 'none';
    }, 140);
  };

  const togglePanel = () => {
    if (!state.panel) return;
    if (state.panel.classList.contains('open')) {
      closePanel();
      return;
    }
    state.panel.classList.remove('closing');
    state.panel.classList.add('open');
    state.panel.style.display = 'flex';
    if (state.footerEmojiBtn) {
      state.footerEmojiBtn.textContent = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
    }
    renderTemplates();
  };

  const createPanel = () => {
    log('creating panel');
    const panel = document.createElement('div');
    panel.className = 'ats-panel';
    panel.style.top = '60px';
    panel.style.right = '16px';

    const header = document.createElement('header');
    header.textContent = `${magicEmoji} Assistente Time Sheet`;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'ats-close';
    closeBtn.setAttribute('aria-label', 'Fechar');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => closePanel());
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'ats-body';
    const list = document.createElement('ul');
    list.className = 'ats-list';
    body.appendChild(list);

    const footer = document.createElement('div');
    footer.className = 'ats-footer';
    const emojiBtn = document.createElement('button');
    emojiBtn.title = 'Desenvolvido com muito carinho por alguém que estava pensando em você 😉';
    emojiBtn.textContent = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
    footer.appendChild(emojiBtn);
    state.footerEmojiBtn = emojiBtn;

    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(footer);
    state.panel = panel;
    state.listContainer = list;
    state.root.appendChild(panel);

    const clampPanelPosition = (top, left) => {
      const rect = panel.getBoundingClientRect();
      const maxTop = window.innerHeight - rect.height - 8;
      const maxLeft = window.innerWidth - rect.width - 8;
      const clampedTop = clamp(top, 8, Math.max(8, maxTop));
      const clampedLeft = clamp(left, 8, Math.max(8, maxLeft));
      panel.style.top = `${clampedTop}px`;
      panel.style.left = `${clampedLeft}px`;
      panel.style.right = 'auto';
    };

    const beginDrag = (ev) => {
      if ((ev.target && ev.target.closest('.ats-close')) || ev.button !== 0) return;
      const rect = panel.getBoundingClientRect();
      const offsetX = ev.clientX - rect.left;
      const offsetY = ev.clientY - rect.top;
      const onMove = (moveEv) => {
        clampPanelPosition(moveEv.clientY - offsetY, moveEv.clientX - offsetX);
      };
      const endDrag = () => {
        header.classList.remove('ats-dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', endDrag);
      };
      header.classList.add('ats-dragging');
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', endDrag);
      ev.preventDefault();
    };

    header.addEventListener('mousedown', beginDrag);

    requestAnimationFrame(() => {
      const rect = panel.getBoundingClientRect();
      clampPanelPosition(rect.top, rect.left);
    });
  };

  const getSelectOptions = (selector) => {
    const sel = document.querySelector(selector);
    if (!sel) return [];
    return Array.from(sel.options || []).map((opt) => ({
      value: opt.value,
      label: (opt.textContent || '').trim()
    }));
  };

  const optionLabel = (selector, value) => {
    const options = getSelectOptions(selector);
    const found = options.find((o) => o.value === value);
    return found ? found.label : value || '-';
  };

  const renderTemplates = () => {
    if (!state.listContainer) return;
    state.listContainer.innerHTML = '';
    if (!state.templates.length) {
      const empty = document.createElement('div');
      empty.className = 'ats-empty';
      empty.textContent =
        'Nenhum template cadastrado. O que você está esperando para começar a economizar seu tempo? 🚀';
      state.listContainer.appendChild(empty);
      return;
    }

    const sorted = [...state.templates].sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return (b.lastUsedAt || 0) - (a.lastUsedAt || 0);
    });

    sorted.forEach((tpl) => {
      const li = document.createElement('li');
      li.className = 'ats-card';
      const header = document.createElement('div');
      header.className = 'ats-card-header';
      const title = document.createElement('div');
      title.className = 'ats-card-title';
      title.textContent = tpl.description || 'Sem descrição';
      header.appendChild(title);
      const badges = document.createElement('div');
      badges.innerHTML = `<span class="ats-badge">${optionLabel('#cmp_ativ_motivo', tpl.origin)}</span>`;
      header.appendChild(badges);

      const meta = document.createElement('div');
      meta.className = 'ats-card-meta';
      const details = [
        ['Duração', tpl.duration || '-'],
        ['Classificação', optionLabel('#cmp_ativ_class', tpl.classification)],
        ['Tipo', optionLabel('#cmp_ativ_tipo', tpl.type)],
        ['Origem', optionLabel('#cmp_ativ_motivo', tpl.origin)]
      ];
      const extra = tpl.origin === '03' ? ['Representante', tpl.representative || '-'] : ['Número', tpl.number || '-'];
      details.push(extra);

      details.forEach(([label, value]) => {
        const row = document.createElement('div');
        row.innerHTML = `<strong>${label}:</strong> ${value || '-'}`;
        meta.appendChild(row);
      });

      const actions = document.createElement('div');
      actions.className = 'ats-card-actions';

      const useBtn = document.createElement('button');
      useBtn.className = 'ats-btn primary';
      useBtn.title = 'Utilizar';
      useBtn.textContent = '▶';
      useBtn.addEventListener('click', () => applyTemplate(tpl.id));

      const favBtn = document.createElement('button');
      favBtn.className = 'ats-btn';
      favBtn.title = 'Favoritar';
      favBtn.innerHTML = tpl.favorite ? '<span class="ats-fav">★</span>' : '☆';
      favBtn.addEventListener('click', () => toggleFavorite(tpl.id));

      const editBtn = document.createElement('button');
      editBtn.className = 'ats-btn';
      editBtn.title = 'Editar';
      editBtn.textContent = '✏️';
      editBtn.addEventListener('click', () => openEditModal(tpl.id));

      const delBtn = document.createElement('button');
      delBtn.className = 'ats-btn';
      delBtn.title = 'Excluir';
      delBtn.textContent = '🗑️';
      delBtn.addEventListener('click', () => deleteTemplate(tpl.id));

      actions.appendChild(useBtn);
      actions.appendChild(favBtn);
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      li.appendChild(header);
      li.appendChild(meta);
      li.appendChild(actions);
      state.listContainer.appendChild(li);
    });
  };

  const findTemplate = (id) => state.templates.find((tpl) => tpl.id === id);

  const toggleFavorite = (id) => {
    const tpl = findTemplate(id);
    if (!tpl) return;
    tpl.favorite = !tpl.favorite;
    persistTemplates();
    renderTemplates();
  };

  const deleteTemplate = (id) => {
    state.templates = state.templates.filter((tpl) => tpl.id !== id);
    persistTemplates();
    renderTemplates();
  };

  const setSelectValue = (el, value) => {
    if (!el) return;
    el.value = value || '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const setTextValue = (el, value) => {
    if (!el) return;
    el.value = value || '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const applyTemplate = (id) => {
    const tpl = findTemplate(id);
    if (!tpl) return;
    setTextValue(document.querySelector('#cmp_ativ_dur'), tpl.duration);
    setSelectValue(document.querySelector('#cmp_ativ_class'), tpl.classification);
    setSelectValue(document.querySelector('#cmp_ativ_tipo'), tpl.type);
    setSelectValue(document.querySelector('#cmp_ativ_motivo'), tpl.origin);
    setTimeout(() => {
      if (tpl.origin === '03') {
        const repSelect = document.querySelector('#select_repre_cliente');
        if (repSelect) repSelect.disabled = false;
        setSelectValue(repSelect, tpl.representative);
        setTextValue(document.querySelector('#hid_cmp_repre_cliente'), tpl.representative);
      } else {
        setTextValue(document.querySelector('#nroSU'), tpl.number);
        setTextValue(document.querySelector('#n_pedido_su_cac'), tpl.number);
      }
      setTextValue(document.querySelector('#cmp_ativ_desc'), tpl.description);
    }, 60);

    tpl.lastUsedAt = now();
    state.lastAppliedTemplateId = tpl.id;
    state.suppressNextCapture = true;
    persistTemplates();
    closePanel();
  };

  const readFormData = () => {
    const dateInput = document.querySelector('input[name="cmp_ativ_dt"]:checked');
    const dateVal = dateInput ? dateInput.value : '';
    const dur = (document.querySelector('#cmp_ativ_dur') || {}).value || '';
    const classification = (document.querySelector('#cmp_ativ_class') || {}).value || '';
    const type = (document.querySelector('#cmp_ativ_tipo') || {}).value || '';
    const origin = (document.querySelector('#cmp_ativ_motivo') || {}).value || '';
    const number = (document.querySelector('#nroSU') || {}).value || '';
    const representative =
      (document.querySelector('#select_repre_cliente') || {}).value ||
      (document.querySelector('#hid_cmp_repre_cliente') || {}).value ||
      '';
    const description = (document.querySelector('#cmp_ativ_desc') || {}).value || '';
    return {
      date: dateVal,
      duration: dur.trim(),
      classification: classification.trim(),
      type: type.trim(),
      origin: origin.trim(),
      number: number.trim(),
      representative: representative.trim(),
      description: description.trim()
    };
  };

  const buildSignature = (data) =>
    JSON.stringify([
      data.classification,
      data.type,
      data.origin,
      data.number,
      data.representative,
      data.description
    ]);

  const addTemplateFromForm = () => {
    if (state.suppressNextCapture) {
      state.suppressNextCapture = false;
      return;
    }
    const data = readFormData();
    if (!data.description || !data.classification || !data.type || !data.origin) return;
    const signature = buildSignature(data);
    if (state.templates.some((tpl) => tpl.signature === signature)) return;
    const newTpl = {
      id: `tpl-${now()}`,
      createdAt: now(),
      lastUsedAt: null,
      favorite: false,
      signature,
      ...data
    };
    state.templates.push(newTpl);
    persistTemplates();
    renderTemplates();
  };

  const attachSaveListener = () => {
    if (state.saveListenerAttached) return;
    const saveBtn = document.querySelector('#saveActivity');
    if (!saveBtn) return;
    saveBtn.addEventListener('click', () => {
      addTemplateFromForm();
    });
    state.saveListenerAttached = true;
  };

  const openEditModal = (id) => {
    const tpl = findTemplate(id);
    if (!tpl) return;
    closeEditModal();
    const overlay = document.createElement('div');
    overlay.className = 'ats-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'ats-modal';

    const header = document.createElement('header');
    header.textContent = 'Editar template';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'ats-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', closeEditModal);
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'ats-modal-body';

    const fields = [
      ['Classificação', 'classification', tpl.classification, '#cmp_ativ_class', 'select'],
      ['Tipo', 'type', tpl.type, '#cmp_ativ_tipo', 'select'],
      ['Origem', 'origin', tpl.origin, '#cmp_ativ_motivo', 'select'],
      ['Número (SU/CAC/GMUD)', 'number', tpl.number, null, 'input'],
      ['Representante', 'representative', tpl.representative, '#select_repre_cliente', 'select'],
      ['Descrição', 'description', tpl.description, null, 'textarea']
    ];

    const inputs = {};
    fields.forEach(([label, key, value, selector, kind]) => {
      const row = document.createElement('div');
      row.className = 'ats-form-row';
      const lab = document.createElement('label');
      lab.textContent = label;
      row.appendChild(lab);
      let el;
      if (kind === 'select' && selector) {
        el = document.createElement('select');
        getSelectOptions(selector).forEach((opt) => {
          const o = document.createElement('option');
          o.value = opt.value;
          o.textContent = opt.label;
          el.appendChild(o);
        });
      } else if (kind === 'textarea') {
        el = document.createElement('textarea');
      } else {
        el = document.createElement('input');
        el.type = 'text';
      }
      el.value = value || '';
      row.appendChild(el);
      inputs[key] = el;
      body.appendChild(row);
    });

    const actions = document.createElement('div');
    actions.className = 'ats-modal-actions';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'ats-btn';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', closeEditModal);
    const saveBtn = document.createElement('button');
    saveBtn.className = 'ats-btn primary';
    saveBtn.textContent = 'Salvar alterações';
    saveBtn.addEventListener('click', () => {
      tpl.classification = inputs.classification.value;
      tpl.type = inputs.type.value;
      tpl.origin = inputs.origin.value;
      tpl.number = inputs.number.value.trim();
      tpl.representative = inputs.representative.value;
      tpl.description = inputs.description.value.trim();
      tpl.signature = buildSignature(tpl);
      persistTemplates();
      renderTemplates();
      closeEditModal();
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    state.root.appendChild(overlay);
    state.editOverlay = overlay;
  };

  const closeEditModal = () => {
    if (state.editOverlay) {
      state.editOverlay.remove();
      state.editOverlay = null;
    }
  };

  const destroyUI = () => {
    closeEditModal();
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
    if (state.root) {
      state.root.remove();
      state.root = null;
    }
    state.popover = null;
    state.panel = null;
    state.listContainer = null;
    state.footerEmojiBtn = null;
    state.saveListenerAttached = false;
  };

  const initUI = async () => {
    if (state.root) return;
    log('initUI start');
    createRoot();
    await createPopover();
    createPanel();
    await loadTemplates();
    renderTemplates();
    attachSaveListener();
    log('initUI done');
  };

  const ensureActivation = async () => {
    if (shouldActivate()) {
      log('activation conditions met');
      await initUI();
      attachSaveListener();
    } else {
      log('activation conditions not met, destroying UI if any');
      destroyUI();
    }
  };

  const startWatching = () => {
    if (state.observer) return;
    log('starting MutationObserver');
    state.observer = new MutationObserver(() => ensureActivation());
    state.observer.observe(document.documentElement || document.body, {
      attributes: true,
      childList: true,
      subtree: true
    });
  };

  const start = () => {
    log('start invoked');
    ensureActivation();
    startWatching();
    window.addEventListener('resize', () => {
      if (!state.popover) return;
      const rect = state.popover.getBoundingClientRect();
      setPopoverPosition(rect.top, rect.left);
    });
    document.addEventListener('mousedown', (ev) => {
      if (!state.panel || !state.panel.classList.contains('open')) return;
      const target = ev.target;
      const clickedInsidePanel = state.panel.contains(target);
      const clickedPopover = state.popover && state.popover.contains(target);
      const inEditOverlay = state.editOverlay && state.editOverlay.contains(target);
      if (!clickedInsidePanel && !clickedPopover && !inEditOverlay) {
        closePanel();
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
