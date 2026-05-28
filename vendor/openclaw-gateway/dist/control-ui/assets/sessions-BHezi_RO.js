import{f as e,p as t}from"./lit-runtime-DA0-mbwP.js";import{o as n,r,t as i}from"./string-coerce-Cl_fl99y.js";import{H as a,P as o,S as s,_ as c,d as l,f as u,h as d,s as f,u as p,x as m}from"./index-89Mm3xEP.js";var h=[`off`,`minimal`,`low`,`medium`,`high`],g=[``,`off`,`on`,`full`],_=[``,`on`,`off`],v=[``,`off`,`on`,`stream`],y=[10,25,50,100];function b(e,t){return Object.prototype.hasOwnProperty.call(e,t)?e[t]??null:null}function x(e,t){return(!e.modelProvider||e.modelProvider===t?.modelProvider)&&(!e.model||e.model===t?.model)}function S(e,t){let n=x(e,t),r=p(e.thinkingDefault??(n?t?.thinkingDefault:void 0)),i=e.thinkingLevels?.length?e.thinkingLevels:n&&t?.thinkingLevels?.length?t.thinkingLevels:(e.thinkingOptions?.length?e.thinkingOptions:n&&t?.thinkingOptions?.length?t.thinkingOptions:h).map(e=>({id:u(e),label:e}));return[{value:``,label:r},...i.map(e=>({value:u(e.id),label:l(e.id,e.label)}))]}function ee(e,t){return!t||e.includes(t)?[...e]:[...e,t]}function C(e,t){return!t||e.some(e=>e.value===t)?[...e]:[...e,{value:t,label:l(t)}]}function w(){return g.map(e=>({value:e,label:n(e===``?`sessionsView.inherit`:e===`off`?`sessionsView.offExplicit`:`sessionsView.${e}`)}))}function T(){return _.map(e=>({value:e,label:n(e===``?`sessionsView.inherit`:`sessionsView.${e}`)}))}function E(e){switch(e){case`running`:return n(`sessionsView.statusRunning`);case`done`:return n(`sessionsView.statusDone`);case`failed`:return n(`sessionsView.statusFailed`);case`killed`:return n(`sessionsView.statusKilled`);case`timeout`:return n(`sessionsView.statusTimeout`);default:return n(`sessionsView.statusUnknown`)}}function D(e){if(c(e))return{label:n(`sessionsView.statusLive`),tone:`live`};if(e.status===`running`&&e.hasActiveRun===!1)return{label:n(`sessionsView.statusIdle`),tone:`idle`};if(e.status){let t=e.status===`done`?`done`:`failed`;return{label:E(e.status),tone:t}}return e.hasActiveRun===!1?{label:n(`sessionsView.statusIdle`),tone:`idle`}:{label:n(`sessionsView.statusUnknown`),tone:`muted`}}function O(e){let r=D(e),i=`${n(`sessionsView.status`)}: ${r.label}`;return t`
    <span
      class="session-status-badge session-status-badge--${r.tone}"
      title=${i}
      aria-label=${i}
    >
      <span class="session-status-badge__dot" aria-hidden="true"></span>
      <span class="session-status-badge__label">${r.label}</span>
    </span>
  `}function k(e){return e||null}function A(e,t,n){let r=i(t);return r?e.filter(e=>{let t=i(e.key),a=i(e.label),s=i(e.kind),l=i(e.displayName),u=i(o(e.agentRuntime)),d=i(e.status),f=c(e)?`live running`:e.hasActiveRun===!1?`idle`:``;if(t.includes(r)||a.includes(r)||s.includes(r)||l.includes(r)||u.includes(r)||d.includes(r)||f.includes(r))return!0;let p=m(e.key);return(p?i(b(n,p.agentId)?.name):``).includes(r)}):e}function j(e,t,n){let r=n===`asc`?1:-1;return[...e].toSorted((e,n)=>{let i=0;switch(t){case`key`:i=(e.key??``).localeCompare(n.key??``);break;case`kind`:i=(e.kind??``).localeCompare(n.kind??``);break;case`updated`:i=(e.updatedAt??0)-(n.updatedAt??0);break;case`tokens`:i=(e.totalTokens??e.inputTokens??e.outputTokens??0)-(n.totalTokens??n.inputTokens??n.outputTokens??0);break}return i*r})}function M(e,t,n){let r=t*n;return e.slice(r,r+n)}function N(e){let t=Number(e.trim());return Number.isFinite(t)&&t>0}function P(e){return i(e.searchQuery).length>0||N(e.activeMinutes)||N(e.limit)||!e.includeGlobal||!e.includeUnknown||!e.showArchived}function te(e){switch(e){case`manual`:return n(`sessionsView.manual`);case`auto-threshold`:return n(`sessionsView.autoThreshold`);case`overflow-retry`:return n(`sessionsView.overflowRetry`);case`timeout-retry`:return n(`sessionsView.timeoutRetry`);default:return e}}function F(e){return n(e===1?`sessionsView.checkpoint`:`sessionsView.checkpoints`,{count:String(e)})}function I(e){return typeof e.tokensBefore==`number`&&typeof e.tokensAfter==`number`&&Number.isFinite(e.tokensBefore)&&Number.isFinite(e.tokensAfter)?n(`sessionsView.tokenRange`,{before:e.tokensBefore.toLocaleString(),after:e.tokensAfter.toLocaleString()}):typeof e.tokensBefore==`number`&&Number.isFinite(e.tokensBefore)?n(`sessionsView.tokensBefore`,{count:e.tokensBefore.toLocaleString()}):n(`sessionsView.tokenDeltaUnavailable`)}function L(e){if(typeof e!=`number`||!Number.isFinite(e)||e<0)return null;let t=Math.round(e/1e3);if(t<60)return`${t}s`;let n=Math.floor(t/60),r=t%60;if(n<60)return r>0?`${n}m ${r}s`:`${n}m`;let i=Math.floor(n/60),a=n%60;return a>0?`${i}h ${a}m`:`${i}h`}function R(e){let{row:t,updated:i,checkpointCount:a}=e,o=[{label:n(`sessionsView.key`),value:t.key},{label:n(`sessionsView.kind`),value:t.kind},{label:n(`sessionsView.updated`),value:i},{label:n(`sessionsView.tokens`),value:f(t)},{label:n(`sessionsView.compaction`),value:F(a)}],s=(e,t)=>{let n=r(t);n&&o.push({label:e,value:n})};return s(n(`sessionsView.status`),t.status),s(n(`sessionsView.model`),t.model),s(n(`sessionsView.provider`),t.modelProvider),s(n(`sessionsView.runtime`),L(t.runtimeMs)),s(n(`sessionsView.surface`),t.surface),s(n(`sessionsView.subject`),t.subject),s(n(`sessionsView.room`),t.room),s(n(`sessionsView.space`),t.space),s(n(`sessionsView.sessionId`),t.sessionId),typeof t.hasActiveRun==`boolean`&&o.push({label:n(`sessionsView.activeRun`),value:t.hasActiveRun?n(`common.yes`):n(`common.no`)}),typeof t.archived==`boolean`&&o.push({label:n(`sessionsView.archived`),value:t.archived?n(`common.yes`):n(`common.no`)}),o}function z(e){return e instanceof Element&&!!e.closest(`a, button, input, label, select, textarea`)}function B(e){return t`
    <label class=${[`session-filter-check`,`session-filter-toggle`,e.extraClass??``,e.checked?`session-filter-check--active`:``].filter(Boolean).join(` `)} data-tooltip=${e.title}>
      <input
        name=${e.name}
        class="session-filter-check__input"
        type="checkbox"
        .checked=${e.checked}
        @change=${t=>e.onChange(t.target.checked)}
      />
      <span class="session-filter-check__mark" aria-hidden="true">${d.check}</span>
      <span class="session-filter-check__label">${e.label}</span>
    </label>
  `}function V(r){let i=r.result?.sessions??[],a=A(i,r.searchQuery,r.agentIdentityById),o=j(a,r.sortColumn,r.sortDir),s=o.length,c=Math.max(1,Math.ceil(s/r.pageSize)),l=Math.min(r.page,c-1),u=M(o,l,r.pageSize),f=i.length===0?P(r):a.length===0,p=n(`sessionsView.activeTooltip`,{count:r.activeMinutes.trim()}),m=n(`sessionsView.limitTooltip`),h=n(`sessionsView.globalTooltip`),g=n(`sessionsView.unknownTooltip`),_=n(`sessionsView.showArchivedTooltip`),v=!r.filtersCollapsed,b=n(`sessionsView.filters`),x=n(v?`sessionsView.hideFilters`:`sessionsView.showFilters`),S=(e,n,i=``)=>{let a=r.sortColumn===e,o=a&&r.sortDir===`asc`?`desc`:`asc`;return t`
      <th
        class=${i}
        data-sortable
        data-sort-dir=${a?r.sortDir:``}
        @click=${()=>r.onSortChange(e,a?o:`desc`)}
      >
        ${n}
        <span class="data-table-sort-icon">${d.arrowUpDown}</span>
      </th>
    `};return t`
    <section class="card">
      <div class="row" style="justify-content: space-between; margin-bottom: 12px;">
        <div>
          <div class="card-title">${n(`sessionsView.title`)}</div>
          <div class="card-sub">
            ${r.result?n(`sessionsView.store`,{path:r.result.path}):n(`sessionsView.subtitle`)}
          </div>
        </div>
        <button class="btn" ?disabled=${r.loading} @click=${r.onRefresh}>
          ${r.loading?n(`common.loading`):n(`common.refresh`)}
        </button>
      </div>

      <div class="sessions-filter-panel">
        <div class="sessions-filter-panel__header">
          <div class="sessions-filter-panel__title">${b}</div>
          <button
            class="sessions-filter-panel__toggle"
            type="button"
            aria-expanded=${String(v)}
            aria-controls="sessions-filter-bar"
            @click=${r.onToggleFiltersCollapsed}
          >
            ${v?d.chevronDown:d.chevronRight}
            <span>${x}</span>
          </button>
        </div>

        ${v?t`
              <div
                id="sessions-filter-bar"
                class="sessions-filter-bar"
                aria-label="Session filters"
              >
                <div class="session-filter-primary-row">
                  <label class="session-filter-field" data-tooltip=${p}>
                    <span class="session-filter-label">${n(`sessionsView.active`)}</span>
                    <input
                      class="session-filter-input session-filter-input--minutes"
                      placeholder=${n(`sessionsView.minutesPlaceholder`)}
                      .value=${r.activeMinutes}
                      ?disabled=${r.showArchived}
                      @input=${e=>r.onFiltersChange({activeMinutes:e.target.value,limit:r.limit,includeGlobal:r.includeGlobal,includeUnknown:r.includeUnknown,showArchived:r.showArchived})}
                    />
                  </label>
                  <label class="session-filter-field" data-tooltip=${m}>
                    <span class="session-filter-label">${n(`sessionsView.limit`)}</span>
                    <input
                      class="session-filter-input session-filter-input--limit"
                      .value=${r.limit}
                      @input=${e=>r.onFiltersChange({activeMinutes:r.activeMinutes,limit:e.target.value,includeGlobal:r.includeGlobal,includeUnknown:r.includeUnknown,showArchived:r.showArchived})}
                    />
                  </label>
                </div>
                <div
                  class="session-filter-toggle-group"
                  role="group"
                  aria-label=${n(`sessionsView.sourceFilters`)}
                >
                  ${B({name:`includeGlobal`,checked:r.includeGlobal,label:n(`sessionsView.global`),title:h,onChange:e=>r.onFiltersChange({activeMinutes:r.activeMinutes,limit:r.limit,includeGlobal:e,includeUnknown:r.includeUnknown,showArchived:r.showArchived})})}
                  ${B({name:`includeUnknown`,checked:r.includeUnknown,label:n(`sessionsView.unknown`),title:g,onChange:e=>r.onFiltersChange({activeMinutes:r.activeMinutes,limit:r.limit,includeGlobal:r.includeGlobal,includeUnknown:e,showArchived:r.showArchived})})}
                  ${B({name:`showArchived`,checked:r.showArchived,label:n(`sessionsView.showArchived`),title:_,extraClass:`session-archive-toggle`,onChange:e=>r.onFiltersChange({activeMinutes:r.activeMinutes,limit:r.limit,includeGlobal:r.includeGlobal,includeUnknown:r.includeUnknown,showArchived:e})})}
                </div>
              </div>
            `:e}
      </div>

      ${r.error?t`<div class="callout danger" style="margin-bottom: 12px;">${r.error}</div>`:e}

      <div class="data-table-wrapper">
        <div class="data-table-toolbar">
          <div class="data-table-search">
            <input
              type="text"
              placeholder=${n(`sessionsView.searchPlaceholder`)}
              .value=${r.searchQuery}
              @input=${e=>r.onSearchChange(e.target.value)}
            />
          </div>
        </div>

        ${r.selectedKeys.size>0?t`
              <div class="data-table-bulk-bar">
                <span
                  >${n(`sessionsView.selected`,{count:String(r.selectedKeys.size)})}</span
                >
                <button class="btn btn--sm" @click=${r.onDeselectAll}>
                  ${n(`common.unselect`)}
                </button>
                <button
                  class="btn btn--sm danger"
                  ?disabled=${r.loading}
                  @click=${r.onDeleteSelected}
                >
                  ${d.trash} ${n(`sessionsView.deleteSelected`)}
                </button>
              </div>
            `:e}

        <div class="data-table-container">
          <table class="data-table sessions-table">
            <thead>
              <tr>
                <th class="data-table-checkbox-col">
                  ${u.length>0?t`<input
                        type="checkbox"
                        .checked=${u.length>0&&u.every(e=>r.selectedKeys.has(e.key))}
                        .indeterminate=${u.some(e=>r.selectedKeys.has(e.key))&&!u.every(e=>r.selectedKeys.has(e.key))}
                        @change=${()=>{u.every(e=>r.selectedKeys.has(e.key))?r.onDeselectPage(u.map(e=>e.key)):r.onSelectPage(u.map(e=>e.key))}}
                        aria-label=${n(`sessionsView.selectAllOnPage`)}
                      />`:e}
                </th>
                ${S(`key`,n(`sessionsView.key`),`data-table-key-col`)}
                <th>${n(`sessionsView.label`)}</th>
                ${S(`kind`,n(`sessionsView.kind`))}
                <th class="session-status-col">${n(`sessionsView.status`)}</th>
                <th>${n(`agents.context.runtime`)}</th>
                ${S(`updated`,n(`sessionsView.updated`))}
                ${S(`tokens`,n(`sessionsView.tokens`))}
                <th class="session-compaction-col">${n(`sessionsView.compaction`)}</th>
                <th>${n(`sessionsView.thinking`)}</th>
                <th>${n(`sessionsView.fast`)}</th>
                <th>${n(`sessionsView.verbose`)}</th>
                <th>${n(`sessionsView.reasoning`)}</th>
              </tr>
            </thead>
            <tbody>
              ${u.length===0?t`
                    <tr>
                      <td colspan="13" class="data-table-empty-cell">
                        ${f?t`
                              <div class="data-table-empty-state" role="status" aria-live="polite">
                                <div>${n(`sessionsView.noSessionsMatchFilters`)}</div>
                                <button class="btn btn--sm" @click=${r.onClearFilters}>
                                  ${n(`sessionsView.showAll`)}
                                </button>
                              </div>
                            `:n(`sessionsView.noSessions`)}
                      </td>
                    </tr>
                  `:u.flatMap(e=>H(e,r))}
            </tbody>
          </table>
        </div>

        ${s>0?t`
              <div class="data-table-pagination">
                <div class="data-table-pagination__info">
                  ${l*r.pageSize+1}-${Math.min((l+1)*r.pageSize,s)}
                  of ${s} row${s===1?``:`s`}
                </div>
                <div class="data-table-pagination__controls">
                  <select
                    style="height: 32px; padding: 0 8px; font-size: 13px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--card);"
                    .value=${String(r.pageSize)}
                    @change=${e=>r.onPageSizeChange(Number(e.target.value))}
                  >
                    ${y.map(e=>t`<option value=${e}>${e} per page</option>`)}
                  </select>
                  <button ?disabled=${l<=0} @click=${()=>r.onPageChange(l-1)}>
                    Previous
                  </button>
                  <button
                    ?disabled=${l>=c-1}
                    @click=${()=>r.onPageChange(l+1)}
                  >
                    ${n(`common.next`)}
                  </button>
                </div>
              </div>
            `:e}
      </div>
    </section>
  `}function H(i,c){let l=i.updatedAt?s(i.updatedAt):n(`common.na`),d=i.thinkingLevel??``,p=d?u(d):``,h=C(S(i,c.result?.defaults),p),g=i.fastMode===!0?`on`:i.fastMode===!1?`off`:``,_=C(T(),g),y=i.verboseLevel??``,x=C(w(),y),E=i.reasoningLevel??``,D=ee(v,E),A=i.latestCompactionCheckpoint,j=i.compactionCheckpointCount??0,M=Math.max(j,+!!A),N=j>0||!!A,P=c.expandedCheckpointKey===i.key,L=c.checkpointItemsByKey[i.key]??[],B=c.checkpointErrorByKey[i.key],V=`session-checkpoints-${encodeURIComponent(i.key)}`,H=F(M),U=R({row:i,updated:l,checkpointCount:M}),W=r(i.displayName)??null,ne=r(i.label)??``,G=!!(W&&W!==i.key&&W!==ne),K=m(i.key),q=K?b(c.agentIdentityById,K.agentId):null,J=r(q?.emoji)??``,Y=r(q?.name)??``,X=Y&&K?`${J?`${J} `:``}${Y} (${K.channel})`:null,re=X??i.key,Z=i.kind!==`global`,ie=Z?`${a(`chat`,c.basePath)}?session=${encodeURIComponent(i.key)}`:null,Q=i.kind===`cron`?`data-table-badge--cron`:i.kind===`direct`?`data-table-badge--direct`:i.kind===`group`?`data-table-badge--group`:i.kind===`global`?`data-table-badge--global`:`data-table-badge--unknown`,ae=[`session-data-row`,N?`session-data-row--expandable`:``,P?`session-data-row--expanded`:``].filter(Boolean).join(` `),$=()=>{N&&c.onToggleCheckpointDetails(i.key)};return[t`<tr
      class=${ae}
      tabindex=${N?`0`:e}
      aria-expanded=${N?String(P):e}
      aria-controls=${N?V:e}
      @click=${e=>{!N||z(e.target)||$()}}
      @keydown=${e=>{!N||z(e.target)||(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),$())}}
    >
      <td class="data-table-checkbox-col">
        <input
          type="checkbox"
          .checked=${c.selectedKeys.has(i.key)}
          @change=${()=>c.onToggleSelect(i.key)}
          aria-label=${n(`sessionsView.selectSession`)}
        />
      </td>
      <td class="data-table-key-col">
        <div
          class=${X?`session-key-cell`:`mono session-key-cell`}
          title=${re}
        >
          ${Z?t`<a
                href=${ie}
                class="session-link"
                @click=${e=>{e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||c.onNavigateToChat&&(e.preventDefault(),c.onNavigateToChat(i.key))}}
                >${X??i.key}</a
              >`:X??i.key}
          ${G?t`<span class="muted session-key-display-name">${W}</span>`:e}
        </div>
      </td>
      <td>
        <input
          .value=${i.label??``}
          ?disabled=${c.loading}
          placeholder=${n(`sessionsView.optionalPlaceholder`)}
          style="width: 100%; max-width: 140px; padding: 6px 10px; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-sm);"
          @change=${e=>{let t=r(e.target.value)??null;c.onPatch(i.key,{label:t})}}
        />
      </td>
      <td>
        <span class="data-table-badge ${Q}">${i.kind}</span>
      </td>
      <td class="session-status-col">${O(i)}</td>
      <td class="session-runtime-cell">
        <span class="mono">${o(i.agentRuntime)}</span>
      </td>
      <td>${l}</td>
      <td class="session-token-cell">${f(i)}</td>
      <td class="session-compaction-col">
        <div class="session-compaction-cell">
          ${N?t`
                <button
                  class="session-compaction-trigger"
                  type="button"
                  aria-expanded=${String(P)}
                  aria-controls=${V}
                  aria-label=${n(P?`sessionsView.hideSessionDetails`:`sessionsView.showSessionDetails`,{count:H})}
                  @click=${e=>{e.stopPropagation(),$()}}
                >
                  <span class="session-compaction-count">${H}</span>
                </button>
              `:t`<span class="muted session-compaction-count">${n(`common.none`)}</span>`}
        </div>
      </td>
      <td>
        <select
          ?disabled=${c.loading}
          style="padding: 6px 10px; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-sm); min-width: 90px;"
          @change=${e=>{let t=e.target.value;c.onPatch(i.key,{thinkingLevel:k(t)})}}
        >
          ${h.map(e=>t`<option value=${e.value} ?selected=${p===e.value}>
                ${e.label}
              </option>`)}
        </select>
      </td>
      <td>
        <select
          ?disabled=${c.loading}
          style="padding: 6px 10px; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-sm); min-width: 90px;"
          @change=${e=>{let t=e.target.value;c.onPatch(i.key,{fastMode:t===``?null:t===`on`})}}
        >
          ${_.map(e=>t`<option value=${e.value} ?selected=${g===e.value}>
                ${e.label}
              </option>`)}
        </select>
      </td>
      <td>
        <select
          ?disabled=${c.loading}
          style="padding: 6px 10px; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-sm); min-width: 90px;"
          @change=${e=>{let t=e.target.value;c.onPatch(i.key,{verboseLevel:t||null})}}
        >
          ${x.map(e=>t`<option value=${e.value} ?selected=${y===e.value}>
                ${e.label}
              </option>`)}
        </select>
      </td>
      <td>
        <select
          ?disabled=${c.loading}
          style="padding: 6px 10px; font-size: 13px; border: 1px solid var(--border); border-radius: var(--radius-sm); min-width: 90px;"
          @change=${e=>{let t=e.target.value;c.onPatch(i.key,{reasoningLevel:t||null})}}
        >
          ${D.map(e=>t`<option value=${e} ?selected=${E===e}>
                ${e||n(`sessionsView.inherit`)}
              </option>`)}
        </select>
      </td>
    </tr>`,...P&&N?[t`<tr id=${V} class="session-checkpoint-details-row">
            <td colspan="13">
              <div class="session-details-panel">
                <div class="session-details-panel__hero">
                  <div>
                    <div class="session-details-panel__eyebrow">
                      ${n(`sessionsView.sessionDetails`)}
                    </div>
                    <div class="session-details-panel__title">${X??i.key}</div>
                    ${G?t`
                          <div class="muted session-details-panel__subtitle">${W}</div>
                        `:e}
                  </div>
                  <div class="session-details-panel__badges">
                    ${O(i)}
                    <span class="data-table-badge ${Q}">${i.kind}</span>
                  </div>
                </div>

                <div class="session-details-grid">
                  ${U.map(e=>t`
                      <div class="session-detail-stat">
                        <div class="session-detail-stat__label">${e.label}</div>
                        <div class="session-detail-stat__value" title=${e.value}>
                          ${e.value}
                        </div>
                      </div>
                    `)}
                </div>

                <div class="session-details-section">
                  <div class="session-details-section__header">
                    <div>
                      <div class="session-details-panel__eyebrow">
                        ${n(`sessionsView.compactionHistory`)}
                      </div>
                      <div class="session-details-section__title">${H}</div>
                    </div>
                  </div>
                  ${c.checkpointLoadingKey===i.key?t`<div class="muted session-details-empty">
                        ${n(`sessionsView.loadingCheckpoints`)}
                      </div>`:B?t`<div class="callout danger">${B}</div>`:L.length===0?t`<div class="muted session-details-empty">
                            ${n(`sessionsView.noCheckpoints`)}
                          </div>`:t`
                            <div class="session-checkpoint-list">
                              ${L.map(e=>t`
                                  <div class="session-checkpoint-card">
                                    <div class="session-checkpoint-card__header">
                                      <strong>
                                        ${te(e.reason)} ·
                                        ${s(e.createdAt)}
                                      </strong>
                                      <span class="muted session-checkpoint-card__delta">
                                        ${I(e)}
                                      </span>
                                    </div>
                                    ${e.summary?t`<div class="session-checkpoint-card__summary">
                                          ${e.summary}
                                        </div>`:t`
                                          <div class="muted">${n(`sessionsView.noSummary`)}</div>
                                        `}
                                    <div class="session-checkpoint-card__actions">
                                      <button
                                        class="btn btn--sm"
                                        ?disabled=${c.checkpointBusyKey===e.checkpointId}
                                        @click=${()=>c.onBranchFromCheckpoint(i.key,e.checkpointId)}
                                      >
                                        ${n(`sessionsView.branchFromCheckpoint`)}
                                      </button>
                                      <button
                                        class="btn btn--sm"
                                        ?disabled=${c.checkpointBusyKey===e.checkpointId}
                                        @click=${()=>c.onRestoreCheckpoint(i.key,e.checkpointId)}
                                      >
                                        ${n(`sessionsView.restoreCheckpoint`)}
                                      </button>
                                    </div>
                                  </div>
                                `)}
                            </div>
                          `}
                </div>
              </div>
            </td>
          </tr>`]:[]]}export{V as renderSessions};
//# sourceMappingURL=sessions-BHezi_RO.js.map