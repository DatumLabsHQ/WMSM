import { siteUrl } from '@/lib/email/templates';

export const revalidate = 3600;

/**
 * The careers-page widget.
 *
 * Deliberately not an iframe: the script writes real anchors into the host page,
 * so the roles are readable by anything that reads the page — including a crawler,
 * which is the point. One script tag, no dependencies, no tracking, scoped styles
 * under a single class prefix so it cannot fight the host's CSS.
 *
 *   <div data-wmsm-jobs data-company="kanda-robotics"></div>
 *   <script src="https://…/embed/jobs.js" async></script>
 */
export async function GET() {
  const base = siteUrl();

  const script = `(function () {
  'use strict';
  var BASE = ${JSON.stringify(base)};
  var STYLE_ID = 'wmsm-embed-style';

  var css = [
    '.wmsm-embed{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;color:#03072D;line-height:1.5}',
    '.wmsm-embed *{box-sizing:border-box}',
    '.wmsm-embed__list{list-style:none;margin:0;padding:0}',
    '.wmsm-embed__item{border-top:1px solid rgba(3,7,45,.08)}',
    '.wmsm-embed__item:last-child{border-bottom:1px solid rgba(3,7,45,.08)}',
    '.wmsm-embed__link{display:flex;gap:12px;align-items:baseline;justify-content:space-between;flex-wrap:wrap;padding:14px 2px;text-decoration:none;color:inherit}',
    '.wmsm-embed__link:hover{background:rgba(3,7,45,.02)}',
    '.wmsm-embed__title{font-weight:600;font-size:15px}',
    '.wmsm-embed__meta{font-size:13px;color:#5C6486}',
    '.wmsm-embed__foot{margin-top:12px;font-size:12px;color:#8D94AC}',
    '.wmsm-embed__foot a{color:#4A6CF7;text-decoration:none}',
    '.wmsm-embed__empty{padding:14px 2px;font-size:14px;color:#5C6486}'
  ].join('');

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = css;
    document.head.appendChild(el);
  }

  function text(value) {
    return document.createTextNode(String(value == null ? '' : value));
  }

  function el(tag, className, child) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (child != null) node.appendChild(typeof child === 'string' ? text(child) : child);
    return node;
  }

  function render(host, data) {
    host.textContent = '';
    var wrap = el('div', 'wmsm-embed');

    if (!data.jobs.length) {
      wrap.appendChild(el('div', 'wmsm-embed__empty', 'No open roles right now.'));
    } else {
      var list = el('ul', 'wmsm-embed__list');
      data.jobs.forEach(function (job) {
        var link = el('a', 'wmsm-embed__link');
        link.href = job.url;
        link.rel = 'noopener';

        var left = document.createElement('span');
        left.appendChild(el('span', 'wmsm-embed__title', job.title));
        left.appendChild(document.createElement('br'));
        left.appendChild(el('span', 'wmsm-embed__meta', job.company + ' · ' + job.locality + ' · ' + job.arrangement));

        link.appendChild(left);
        link.appendChild(el('span', 'wmsm-embed__meta', job.salary));

        var item = el('li', 'wmsm-embed__item');
        item.appendChild(link);
        list.appendChild(item);
      });
      wrap.appendChild(list);
    }

    var foot = el('div', 'wmsm-embed__foot');
    foot.appendChild(text('Roles via '));
    var credit = el('a', null, 'West Midlands Startup Map');
    credit.href = BASE;
    credit.rel = 'noopener';
    foot.appendChild(credit);
    wrap.appendChild(foot);

    host.appendChild(wrap);
  }

  function mount(host) {
    if (host.getAttribute('data-wmsm-mounted')) return;
    host.setAttribute('data-wmsm-mounted', '1');

    var params = [];
    var company = host.getAttribute('data-company');
    var sector = host.getAttribute('data-sector');
    var limit = host.getAttribute('data-limit');
    if (company) params.push('company=' + encodeURIComponent(company));
    if (sector) params.push('sector=' + encodeURIComponent(sector));
    if (limit) params.push('limit=' + encodeURIComponent(limit));

    fetch(BASE + '/api/embed/jobs' + (params.length ? '?' + params.join('&') : ''))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { if (data) render(host, data); })
      .catch(function () { /* a careers page should not break because our map is down */ });
  }

  function boot() {
    injectStyle();
    var hosts = document.querySelectorAll('[data-wmsm-jobs]');
    for (var i = 0; i < hosts.length; i++) mount(hosts[i]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();`;

  return new Response(script, {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
      'access-control-allow-origin': '*',
    },
  });
}
