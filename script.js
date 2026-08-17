/* ==========================================================================
   Currículo — renderização dinâmica a partir de curriculo.json
   Tenta buscar o arquivo externo via fetch(); se o navegador bloquear
   (ex.: abrindo o index.html diretamente pelo disco, sem servidor local),
   usa como alternativa os dados já embutidos em data.js.
   ========================================================================== */

(function () {
  'use strict';

  async function loadData() {
    try {
      const res = await fetch('./curriculo.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (err) {
      if (window.CURRICULO_DATA) {
        console.warn('fetch(curriculo.json) falhou, usando dados embutidos em data.js:', err.message);
        return window.CURRICULO_DATA;
      }
      throw err;
    }
  }

  function digitsOnly(str) {
    return (str || '').replace(/\D/g, '');
  }

  function formatPeriod(period) {
    const fmt = (ym) => {
      if (!ym) return 'Atual';
      const [y, m] = ym.split('-');
      return `${m}/${y}`;
    };
    return `${fmt(period.start)} – ${fmt(period.end)}`;
  }

  // Cria um elemento. `content` é tratado como texto puro (textContent) por
  // padrão, o que evita que caracteres como "&" em nomes de empresas (ex.:
  // "BM&F/B3") sejam interpretados como entidades HTML. Os ícones SVG, que
  // realmente precisam inserir marcação, usam elHTML() explicitamente.
  function el(tag, attrs, content) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === 'class') node.className = v;
        else node.setAttribute(k, v);
      }
    }
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function elHTML(tag, attrs, html) {
    const node = el(tag, attrs);
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function renderMasthead(data) {
    const p = data.personalInfo;
    const mostRecentRole = (data.professionalExperience && data.professionalExperience[0])
      ? data.professionalExperience[0].position
      : '';

    const photoWrap = document.getElementById('masthead-photo-wrap');
    if (p.profilePhoto) {
      photoWrap.appendChild(el('img', {
        class: 'masthead-photo',
        src: p.profilePhoto,
        alt: `Foto de ${p.fullName}`
      }));
    }

    document.getElementById('masthead-name').textContent = p.fullName;
    document.getElementById('masthead-role').textContent = mostRecentRole;

    const contact = p.contact;
    const items = [
      {
        icon: contact.location.icon,
        label: contact.location.value,
        href: null
      },
      {
        icon: contact.email.icon,
        label: contact.email.value,
        href: `mailto:${contact.email.value}`
      },
      {
        icon: contact.whatsapp.icon,
        label: contact.whatsapp.value,
        href: `https://wa.me/55${digitsOnly(contact.whatsapp.value)}`
      },
      {
        icon: contact.phone.icon,
        label: contact.phone.value,
        href: `tel:+55${digitsOnly(contact.phone.value)}`
      }
    ];

    const list = document.getElementById('contact-row');
    items.forEach((item) => {
      const li = el('li', null);
      const iconSpan = elHTML('span', { class: 'contact-icon', 'aria-hidden': 'true' }, item.icon);
      li.appendChild(iconSpan);
      if (item.href) {
        const a = el('a', { href: item.href });
        a.textContent = item.label;
        li.appendChild(a);
      } else {
        const span = el('span');
        span.textContent = item.label;
        li.appendChild(span);
      }
      list.appendChild(li);
    });
  }

  function renderPerfil(data) {
    const el1 = document.getElementById('perfil-texto');
    el1.textContent = data.personalProfile;
  }

  function renderAreasDeConhecimento(data) {
    const container = document.getElementById('areas-conhecimento');
    data.areasOfKnowledge.forEach((group) => {
      const wrap = el('div', { class: 'skill-group' });
      wrap.appendChild(el('div', { class: 'skill-group-label' }, group.category));
      const tagList = el('div', { class: 'tag-list' });
      group.technologies.forEach((tech) => {
        tagList.appendChild(el('span', { class: 'tag' }, tech));
      });
      wrap.appendChild(tagList);
      container.appendChild(wrap);
    });
  }

  function renderFormacao(data) {
    const list = document.getElementById('formacao-lista');
    data.education.forEach((item) => {
      const li = el('li');
      li.appendChild(el('span', { class: 'edu-degree' }, item.degree));
      li.appendChild(el('span', { class: 'edu-institution' }, item.institution));
      list.appendChild(li);
    });
  }

  function renderIdiomas(data) {
    const list = document.getElementById('idiomas-lista');
    data.languages.forEach((item) => {
      const li = el('li');
      li.appendChild(el('span', { class: 'lang-name' }, item.language));
      li.appendChild(el('span', { class: 'lang-level' }, item.proficiency));
      list.appendChild(li);
    });
  }

  function renderObjetivo(data) {
    document.getElementById('objetivo-texto').textContent = data.professionalObjective;
  }

  function renderResumo(data) {
    const container = document.getElementById('resumo-texto');
    data.qualificationsSummary.forEach((paragraph) => {
      container.appendChild(el('p', null, paragraph));
    });
  }

  function renderExperiencia(data) {
    const list = document.getElementById('timeline');
    data.professionalExperience.forEach((job) => {
      const li = el('li', { class: 'job' });

      const head = el('div', { class: 'job-head' });
      head.appendChild(el('span', { class: 'job-date' }, formatPeriod(job.period)));
      head.appendChild(el('span', { class: 'job-badge' }, job.contractType));
      li.appendChild(head);

      li.appendChild(el('h3', { class: 'job-company' }, job.company));
      li.appendChild(el('p', { class: 'job-position' }, job.position));

      const ul = el('ul', { class: 'job-list' });
      job.responsibilities.forEach((r) => {
        ul.appendChild(el('li', null, r));
      });
      li.appendChild(ul);

      list.appendChild(li);
    });
  }

  function renderFooter(data) {
    document.getElementById('footer-nome').textContent = data.personalInfo.fullName;
    document.getElementById('footer-ano').textContent = new Date().getFullYear();
  }

  function wirePrintButton() {
    const btn = document.getElementById('print-btn');
    if (btn) btn.addEventListener('click', () => window.print());
  }

  function showError(message) {
    document.getElementById('app-root').innerHTML =
      `<p class="state-msg">Não foi possível carregar os dados do currículo (${message}). Verifique se curriculo.json está na mesma pasta deste arquivo, ou abra a página por um servidor local.</p>`;
  }

  async function init() {
    try {
      const data = await loadData();
      document.title = `Currículo — ${data.personalInfo.fullName}`;
      renderMasthead(data);
      renderPerfil(data);
      renderAreasDeConhecimento(data);
      renderFormacao(data);
      renderIdiomas(data);
      renderObjetivo(data);
      renderResumo(data);
      renderExperiencia(data);
      renderFooter(data);
      wirePrintButton();
    } catch (err) {
      showError(err.message);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
