import{f as e,o as t,p as n}from"./lit-runtime-DA0-mbwP.js";import{o as r,t as i}from"./string-coerce-Cl_fl99y.js";import{p as a,v as o}from"./index-89Mm3xEP.js";import{i as s,n as c,r as l,t as u}from"./skills-shared-Dslswc_Q.js";function d(e){return e?a(e,window.location.href):null}function f(e){!(e instanceof HTMLDialogElement)||e.open||(e.isConnected?e.showModal():queueMicrotask(()=>{e.isConnected&&!e.open&&e.showModal()}))}var p=[{id:`all`,label:`All`},{id:`ready`,label:`Ready`},{id:`needs-setup`,label:`Needs Setup`},{id:`disabled`,label:`Disabled`}];function m(e,t){switch(t){case`all`:return!0;case`ready`:return!e.disabled&&e.eligible;case`needs-setup`:return!e.disabled&&!e.eligible;case`disabled`:return e.disabled}throw Error(`Unsupported skills status filter`)}function h(e){return e.disabled?`muted`:e.eligible?`ok`:`warn`}function g(t){let a=t.report?.skills??[],o={all:a.length,ready:0,"needs-setup":0,disabled:0};for(let e of a)e.disabled?o.disabled++:e.eligible?o.ready++:o[`needs-setup`]++;let c=t.statusFilter===`all`?a:a.filter(e=>m(e,t.statusFilter)),l=i(t.filter),u=l?c.filter(e=>i([e.name,e.description,e.source].join(` `)).includes(l)):c,d=s(u),f=t.detailKey?a.find(e=>e.skillKey===t.detailKey)??null:null;return n`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">Skills</div>
          <div class="card-sub">Installed skills and their status.</div>
        </div>
        <button
          class="btn"
          ?disabled=${t.loading||!t.connected}
          @click=${t.onRefresh}
        >
          ${t.loading?r(`common.loading`):r(`common.refresh`)}
        </button>
      </div>

      <div class="agent-tabs" style="margin-top: 14px;">
        ${p.map(e=>n`
            <button
              class="agent-tab ${t.statusFilter===e.id?`active`:``}"
              @click=${()=>t.onStatusFilterChange(e.id)}
            >
              ${e.label}<span class="agent-tab-count">${o[e.id]}</span>
            </button>
          `)}
      </div>

      <div
        class="filters"
        style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 12px;"
      >
        <label class="field" style="flex: 1; min-width: 180px;">
          <input
            .value=${t.filter}
            @input=${e=>t.onFilterChange(e.target.value)}
            placeholder="Filter installed skills"
            autocomplete="off"
            name="skills-filter"
          />
        </label>
        <div class="muted">${u.length} shown</div>
      </div>

      <div style="margin-top: 16px; border-top: 1px solid var(--border); padding-top: 16px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="font-weight: 600;">ClawHub</div>
          <div class="muted" style="font-size: 13px;">
            Search and install skills from the registry
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <label class="field" style="flex: 1; min-width: 180px;">
            <input
              .value=${t.clawhubQuery}
              @input=${e=>t.onClawHubQueryChange(e.target.value)}
              placeholder="Search ClawHub skills…"
              autocomplete="off"
              name="clawhub-search"
            />
          </label>
          ${t.clawhubSearchLoading?n`<span class="muted">Searching…</span>`:e}
        </div>
        ${t.clawhubSearchError?n`<div class="callout danger" style="margin-top: 8px;">
              ${t.clawhubSearchError}
            </div>`:e}
        ${t.clawhubInstallMessage?n`<div
              class="callout ${t.clawhubInstallMessage.kind===`error`?`danger`:`success`}"
              style="margin-top: 8px;"
            >
              ${t.clawhubInstallMessage.text}
            </div>`:e}
        ${_(t)}
      </div>

      ${t.error?n`<div class="callout danger" style="margin-top: 12px;">${t.error}</div>`:e}
      ${u.length===0?n`
            <div class="muted" style="margin-top: 16px">
              ${!t.connected&&!t.report?`Not connected to gateway.`:`No skills found.`}
            </div>
          `:n`
            <div class="agent-skills-groups" style="margin-top: 16px;">
              ${d.map(e=>n`
                  <details class="agent-skills-group" open>
                    <summary class="agent-skills-header">
                      <span>${e.label}</span>
                      <span class="muted">${e.skills.length}</span>
                    </summary>
                    <div class="list skills-grid">
                      ${e.skills.map(e=>y(e,t))}
                    </div>
                  </details>
                `)}
            </div>
          `}
    </section>

    ${f?b(f,t):e}
    ${t.clawhubDetailSlug?v(t):e}
  `}function _(t){let r=t.clawhubResults;return r?r.length===0?n`<div class="muted" style="margin-top: 8px;">No skills found on ClawHub.</div>`:n`
    <div class="list" style="margin-top: 8px;">
      ${r.map(r=>n`
          <div
            class="list-item list-item-clickable"
            @click=${()=>t.onClawHubDetailOpen(r.slug)}
          >
            <div class="list-main">
              <div class="list-title">${r.displayName}</div>
              <div class="list-sub">${r.summary?o(r.summary,120):r.slug}</div>
            </div>
            <div class="list-meta" style="display: flex; align-items: center; gap: 8px;">
              ${r.version?n`<span class="muted" style="font-size: 12px;">v${r.version}</span>`:e}
              <button
                class="btn btn--sm"
                ?disabled=${t.clawhubInstallSlug!==null}
                @click=${e=>{e.stopPropagation(),t.onClawHubInstall(r.slug)}}
              >
                ${t.clawhubInstallSlug===r.slug?`Installing…`:`Install`}
              </button>
            </div>
          </div>
        `)}
    </div>
  `:e}function v(i){let a=i.clawhubDetail;return n`
    <dialog
      class="md-preview-dialog"
      ${t(f)}
      @click=${e=>{let t=e.currentTarget;e.target===t&&t.close()}}
      @close=${i.onClawHubDetailClose}
    >
      <div class="md-preview-dialog__panel">
        <div class="md-preview-dialog__header">
          <div class="md-preview-dialog__title">
            ${a?.skill?.displayName??i.clawhubDetailSlug}
          </div>
          <button
            class="btn btn--sm"
            @click=${e=>{e.currentTarget.closest(`dialog`)?.close()}}
          >
            Close
          </button>
        </div>
        <div class="md-preview-dialog__body" style="display: grid; gap: 16px;">
          ${i.clawhubDetailLoading?n`<div class="muted">${r(`common.loading`)}</div>`:i.clawhubDetailError?n`<div class="callout danger">${i.clawhubDetailError}</div>`:a?.skill?n`
                    <div style="font-size: 14px; line-height: 1.5;">
                      ${a.skill.summary??``}
                    </div>
                    ${a.owner?.displayName?n`<div class="muted" style="font-size: 13px;">
                          By
                          ${a.owner.displayName}${a.owner.handle?n` (@${a.owner.handle})`:e}
                        </div>`:e}
                    ${a.latestVersion?n`<div class="muted" style="font-size: 13px;">
                          Latest: v${a.latestVersion.version}
                        </div>`:e}
                    ${a.latestVersion?.changelog?n`<div
                          style="font-size: 13px; border-top: 1px solid var(--border); padding-top: 12px; white-space: pre-wrap;"
                        >
                          ${a.latestVersion.changelog}
                        </div>`:e}
                    ${a.metadata?.os?n`<div class="muted" style="font-size: 12px;">
                          Platforms: ${a.metadata.os.join(`, `)}
                        </div>`:e}
                    <button
                      class="btn primary"
                      ?disabled=${i.clawhubInstallSlug!==null}
                      @click=${()=>{i.clawhubDetailSlug&&i.onClawHubInstall(i.clawhubDetailSlug)}}
                    >
                      ${i.clawhubInstallSlug===i.clawhubDetailSlug?`Installing…`:`Install ${a.skill.displayName}`}
                    </button>
                  `:n`<div class="muted">Skill not found.</div>`}
        </div>
      </div>
    </dialog>
  `}function y(t,r){let i=r.busyKey===t.skillKey;return n`
    <div class="list-item list-item-clickable" @click=${()=>r.onDetailOpen(t.skillKey)}>
      <div class="list-main">
        <div class="list-title" style="display: flex; align-items: center; gap: 8px;">
          <span class="statusDot ${h(t)}"></span>
          ${t.emoji?n`<span>${t.emoji}</span>`:e}
          <span>${t.name}</span>
        </div>
        <div class="list-sub">${o(t.description,140)}</div>
      </div>
      <div
        class="list-meta"
        style="display: flex; align-items: center; justify-content: flex-end; gap: 10px;"
      >
        <label class="skill-toggle-wrap" @click=${e=>e.stopPropagation()}>
          <input
            type="checkbox"
            class="skill-toggle"
            .checked=${!t.disabled}
            ?disabled=${i}
            @change=${e=>{e.stopPropagation(),r.onToggle(t.skillKey,t.disabled)}}
          />
        </label>
      </div>
    </div>
  `}function b(r,i){let a=i.busyKey===r.skillKey,o=i.edits[r.skillKey]??``,s=i.messages[r.skillKey]??null,p=r.install.length>0&&r.missing.bins.length>0,m=!!(r.bundled&&r.source!==`openclaw-bundled`),g=u(r),_=c(r);return n`
    <dialog
      class="md-preview-dialog"
      ${t(f)}
      @click=${e=>{let t=e.currentTarget;e.target===t&&t.close()}}
      @close=${i.onDetailClose}
    >
      <div class="md-preview-dialog__panel">
        <div class="md-preview-dialog__header">
          <div
            class="md-preview-dialog__title"
            style="display: flex; align-items: center; gap: 8px;"
          >
            <span class="statusDot ${h(r)}"></span>
            ${r.emoji?n`<span style="font-size: 18px;">${r.emoji}</span>`:e}
            <span>${r.name}</span>
          </div>
          <button
            class="btn btn--sm"
            @click=${e=>{e.currentTarget.closest(`dialog`)?.close()}}
          >
            Close
          </button>
        </div>
        <div class="md-preview-dialog__body" style="display: grid; gap: 16px;">
          <div>
            <div style="font-size: 14px; line-height: 1.5; color: var(--text);">
              ${r.description}
            </div>
            ${l({skill:r,showBundledBadge:m})}
          </div>

          ${g.length>0?n`
                <div
                  class="callout"
                  style="border-color: var(--warn-subtle); background: var(--warn-subtle); color: var(--warn);"
                >
                  <div style="font-weight: 600; margin-bottom: 4px;">Missing requirements</div>
                  <div>${g.join(`, `)}</div>
                </div>
              `:e}
          ${_.length>0?n`
                <div class="muted" style="font-size: 13px;">Reason: ${_.join(`, `)}</div>
              `:e}

          <div style="display: flex; align-items: center; gap: 12px;">
            <label class="skill-toggle-wrap">
              <input
                type="checkbox"
                class="skill-toggle"
                .checked=${!r.disabled}
                ?disabled=${a}
                @change=${()=>i.onToggle(r.skillKey,r.disabled)}
              />
            </label>
            <span style="font-size: 13px; font-weight: 500;">
              ${r.disabled?`Disabled`:`Enabled`}
            </span>
            ${p?n`<button
                  class="btn"
                  ?disabled=${a}
                  @click=${()=>i.onInstall(r.skillKey,r.name,r.install[0].id)}
                >
                  ${a?`Installing…`:r.install[0].label}
                </button>`:e}
          </div>

          ${s?n`<div class="callout ${s.kind===`error`?`danger`:`success`}">
                ${s.message}
              </div>`:e}
          ${r.primaryEnv?n`
                <div style="display: grid; gap: 8px;">
                  <div class="field">
                    <span
                      >API key
                      <span class="muted" style="font-weight: normal; font-size: 0.88em;"
                        >(${r.primaryEnv})</span
                      ></span
                    >
                    <input
                      type="password"
                      .value=${o}
                      @input=${e=>i.onEdit(r.skillKey,e.target.value)}
                    />
                  </div>
                  ${(()=>{let t=d(r.homepage);return t?n`<div class="muted" style="font-size: 13px;">
                          Get your key:
                          <a href="${t}" target="_blank" rel="noopener noreferrer"
                            >${r.homepage}</a
                          >
                        </div>`:e})()}
                  <button
                    class="btn primary"
                    ?disabled=${a}
                    @click=${()=>i.onSaveKey(r.skillKey)}
                  >
                    Save key
                  </button>
                </div>
              `:e}

          <div
            style="border-top: 1px solid var(--border); padding-top: 12px; display: grid; gap: 6px; font-size: 12px; color: var(--muted);"
          >
            <div><span style="font-weight: 600;">Source:</span> ${r.source}</div>
            <div style="font-family: var(--mono); word-break: break-all;">${r.filePath}</div>
            ${(()=>{let t=d(r.homepage);return t?n`<div>
                    <a href="${t}" target="_blank" rel="noopener noreferrer"
                      >${r.homepage}</a
                    >
                  </div>`:e})()}
          </div>
        </div>
      </div>
    </dialog>
  `}export{g as renderSkills};
//# sourceMappingURL=skills-CvKtSdAB.js.map