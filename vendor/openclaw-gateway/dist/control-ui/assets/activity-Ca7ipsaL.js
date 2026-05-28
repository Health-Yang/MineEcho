import{f as e,p as t}from"./lit-runtime-DA0-mbwP.js";import{o as n,t as r}from"./string-coerce-Cl_fl99y.js";import{h as i,q as a}from"./index-89Mm3xEP.js";var o=[`running`,`done`,`error`];function s(e){let t=new Date(e);return!Number.isFinite(e)||Number.isNaN(t.getTime())?``:t.toLocaleTimeString([],{hour:`numeric`,minute:`2-digit`,second:`2-digit`})}function c(e){if(!Number.isFinite(e)||e<0)return n(`common.na`);if(e<1e3)return n(`activity.duration.ms`,{count:String(Math.round(e))});if(e<6e4)return n(`activity.duration.seconds`,{count:(e/1e3).toFixed(1)});let t=Math.round(e/1e3),r=Math.floor(t/60),i=t%60;return n(`activity.duration.minutes`,{minutes:String(r),seconds:String(i)})}function l(e){return n(`activity.status.${e}`)}function u(e){return e===1?n(`activity.argumentHiddenOne`):n(`activity.argumentsHidden`,{count:String(e)})}function d(e){return n(`activity.entrySummary`,{argumentSummary:u(e.hiddenArgumentCount),status:l(e.status),tool:e.toolName})}function f(e,t){return t?r([e.toolName,e.status,e.summary,d(e),e.outputPreview,e.runId,e.toolCallId,e.sessionKey].filter(Boolean).join(` `)).includes(t):!0}function p(e){return a(e.map(e=>e.toolName))}function m(e){let t=r(e.filterText);return e.entries.filter(n=>!e.statusFilters[n.status]||e.toolFilter&&n.toolName!==e.toolFilter?!1:f(n,t))}function h(e,n){return t`
    <label class="activity-status-filter activity-status-filter--${n}">
      <input
        type="checkbox"
        .checked=${e.statusFilters[n]}
        @change=${t=>e.onStatusToggle(n,t.target.checked)}
      />
      <span>${l(n)}</span>
    </label>
  `}function g(r,a){let o=r.expandedIds.has(a.id);return t`
    <details
      class="activity-entry activity-entry--${a.status}"
      role="listitem"
      .open=${o}
      @toggle=${e=>r.onEntryToggle(a.id,e.currentTarget.open)}
    >
      <summary class="activity-entry__summary">
        <span class="activity-entry__chevron" aria-hidden="true">${i.chevronRight}</span>
        <span class="activity-entry__main">
          <span class="activity-entry__title">
            <span class="activity-status activity-status--${a.status}">
              ${l(a.status)}
            </span>
            <span class="activity-entry__tool mono">${a.toolName}</span>
          </span>
          <span class="activity-entry__text">${d(a)}</span>
        </span>
        <span class="activity-entry__meta">
          <span>${s(a.updatedAt)}</span>
          <span>${c(a.durationMs)}</span>
        </span>
      </summary>
      <div class="activity-entry__body">
        <div class="activity-entry__facts">
          <span>${u(a.hiddenArgumentCount)}</span>
          <span class="mono">${n(`activity.toolCallId`)}: ${a.toolCallId}</span>
          <span class="mono">${n(`activity.runId`)}: ${a.runId}</span>
          ${a.sessionKey?t`<span class="mono">${n(`activity.session`)}: ${a.sessionKey}</span>`:e}
        </div>
        ${a.outputPreview?t`
              <pre class="activity-entry__preview">${a.outputPreview}</pre>
              ${a.outputTruncated?t`<div class="activity-entry__note">${n(`activity.outputTruncated`)}</div>`:e}
            `:t`<div class="activity-entry__note">${n(`activity.noOutputPreview`)}</div>`}
      </div>
    </details>
  `}function _(e){let r=p(e.entries),i=m(e),a=e.filterText.trim()||e.toolFilter||o.some(t=>!e.statusFilters[t]);return t`
    <section class="activity-page" aria-label=${n(`activity.title`)}>
      <div class="activity-toolbar" aria-label=${n(`activity.filtersLabel`)}>
        <label class="activity-field activity-field--search">
          <span>${n(`activity.search`)}</span>
          <input
            type="search"
            .value=${e.filterText}
            placeholder=${n(`activity.searchPlaceholder`)}
            @input=${t=>e.onFilterTextChange(t.target.value)}
          />
        </label>
        <label class="activity-field">
          <span>${n(`activity.toolFilter`)}</span>
          <select
            .value=${e.toolFilter}
            @change=${t=>e.onToolFilterChange(t.target.value)}
          >
            <option value="">${n(`activity.allTools`)}</option>
            ${r.map(e=>t`<option value=${e}>${e}</option>`)}
          </select>
        </label>
        <div class="activity-status-filters" role="group" aria-label=${n(`activity.statusFilters`)}>
          ${o.map(t=>h(e,t))}
        </div>
        <label class="activity-autofollow">
          <input
            type="checkbox"
            .checked=${e.autoFollow}
            @change=${t=>e.onToggleAutoFollow(t.target.checked)}
          />
          <span>${n(`activity.autoFollow`)}</span>
        </label>
        <div class="activity-actions">
          <button
            type="button"
            class="btn btn--sm"
            ?disabled=${i.length===0}
            @click=${e.onExpandAll}
          >
            ${n(`activity.expandAll`)}
          </button>
          <button
            type="button"
            class="btn btn--sm"
            ?disabled=${e.expandedIds.size===0}
            @click=${e.onCollapseAll}
          >
            ${n(`activity.collapseAll`)}
          </button>
          <button
            type="button"
            class="btn btn--sm danger"
            ?disabled=${e.entries.length===0}
            @click=${e.onClear}
          >
            ${n(`activity.clear`)}
          </button>
        </div>
        <div class="activity-toolbar__count" aria-live="polite">
          ${n(`activity.visibleCount`,{visible:String(i.length),total:String(e.entries.length)})}
        </div>
      </div>

      <div
        class="activity-stream"
        role="list"
        aria-label=${n(`activity.streamLabel`)}
        @scroll=${e.onScroll}
      >
        ${i.length===0?t`
              <div class="activity-empty">
                ${e.entries.length===0||!a?n(`activity.empty`):n(`activity.emptyFiltered`)}
              </div>
            `:i.map(t=>g(e,t))}
      </div>
    </section>
  `}export{_ as renderActivity};
//# sourceMappingURL=activity-Ca7ipsaL.js.map