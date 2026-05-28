import{f as e,i as t,p as n,s as r}from"./lit-runtime-DA0-mbwP.js";import{o as i}from"./string-coerce-Cl_fl99y.js";import{H as a,J as o,K as s,S as c,a as l,b as u,g as d,m as f,n as p}from"./index-89Mm3xEP.js";function m(){return[{value:`ok`,label:i(`cron.runs.runStatusOk`)},{value:`error`,label:i(`cron.runs.runStatusError`)},{value:`skipped`,label:i(`cron.runs.runStatusSkipped`)}]}function h(){return[{value:`delivered`,label:i(`cron.runs.deliveryDelivered`)},{value:`not-delivered`,label:i(`cron.runs.deliveryNotDelivered`)},{value:`unknown`,label:i(`cron.runs.deliveryUnknown`)},{value:`not-requested`,label:i(`cron.runs.deliveryNotRequested`)}]}function g(e,t,n){let r=new Set(e);return n?r.add(t):r.delete(t),Array.from(r)}function _(e,t){return e.length===0?t:e.length<=2?e.join(`, `):`${e[0]} +${e.length-1}`}function v(e){let t=[`last`,...e.channels.filter(Boolean)],n=e.form.deliveryChannel?.trim();n&&!t.includes(n)&&t.push(n);let r=new Set;return t.filter(e=>r.has(e)?!1:(r.add(e),!0))}function y(e,t){if(t===`last`)return`last`;let n=e.channelMeta?.find(e=>e.id===t);return n?.label?n.label:e.channelLabels?.[t]??t}function b(e){return n`
    <div class="field cron-filter-dropdown" data-filter=${e.id}>
      <span>${e.title}</span>
      <details class="cron-filter-dropdown__details">
        <summary class="btn cron-filter-dropdown__trigger">
          <span>${e.summary}</span>
        </summary>
        <div class="cron-filter-dropdown__panel">
          <div class="cron-filter-dropdown__list">
            ${e.options.map(t=>n`
                <label class="cron-filter-dropdown__option">
                  <input
                    type="checkbox"
                    value=${t.value}
                    .checked=${e.selected.includes(t.value)}
                    @change=${n=>{let r=n.target;e.onToggle(t.value,r.checked)}}
                  />
                  <span>${t.label}</span>
                </label>
              `)}
          </div>
          <div class="row">
            <button class="btn" type="button" @click=${e.onClear}>
              ${i(`cron.runs.clear`)}
            </button>
          </div>
        </div>
      </details>
    </div>
  `}function x(t,r){let i=o(s(r));return i.length===0?e:n`<datalist id=${t}>
    ${i.map(e=>n`<option value=${e}></option> `)}
  </datalist>`}function S(e){return`cron-error-${e}`}function C(e){return e===`name`?`cron-name`:e===`scheduleAt`?`cron-schedule-at`:e===`everyAmount`?`cron-every-amount`:e===`cronExpr`?`cron-cron-expr`:e===`staggerAmount`?`cron-stagger-amount`:e===`payloadText`?`cron-payload-text`:e===`payloadModel`?`cron-payload-model`:e===`payloadThinking`?`cron-payload-thinking`:e===`timeoutSeconds`?`cron-timeout-seconds`:e===`failureAlertAfter`?`cron-failure-alert-after`:e===`failureAlertCooldownSeconds`?`cron-failure-alert-cooldown-seconds`:`cron-delivery-to`}function w(e,t,n){return e===`payloadText`?t.payloadKind===`systemEvent`?i(`cron.form.mainTimelineMessage`):i(`cron.form.assistantTaskPrompt`):e===`deliveryTo`?i(n===`webhook`?`cron.form.webhookUrl`:`cron.form.to`):{name:i(`cron.form.fieldName`),scheduleAt:i(`cron.form.runAt`),everyAmount:i(`cron.form.every`),cronExpr:i(`cron.form.expression`),staggerAmount:i(`cron.form.staggerWindow`),payloadText:i(`cron.form.assistantTaskPrompt`),payloadModel:i(`cron.form.model`),payloadThinking:i(`cron.form.thinking`),timeoutSeconds:i(`cron.form.timeoutSeconds`),deliveryTo:i(`cron.form.to`),failureAlertAfter:`Failure alert after`,failureAlertCooldownSeconds:`Failure alert cooldown`}[e]}function T(e,t,n){let r=[`name`,`scheduleAt`,`everyAmount`,`cronExpr`,`staggerAmount`,`payloadText`,`payloadModel`,`payloadThinking`,`timeoutSeconds`,`deliveryTo`,`failureAlertAfter`,`failureAlertCooldownSeconds`],i=[];for(let a of r){let r=e[a];r&&i.push({key:a,label:w(a,t,n),message:r,inputId:C(a)})}return i}function E(e){let t=document.getElementById(e);t instanceof HTMLElement&&(typeof t.scrollIntoView==`function`&&t.scrollIntoView({block:`center`,behavior:`smooth`}),t.focus())}function D(t,r=!1){return n`<span>
    ${t}
    ${r?n`
          <span class="cron-required-marker" aria-hidden="true">*</span>
          <span class="cron-required-sr">${i(`cron.form.requiredSr`)}</span>
        `:e}
  </span>`}function O(t){let a=!!t.editingJobId,o=t.form.payloadKind===`agentTurn`,s=t.form.scheduleKind===`cron`,c=v(t),u=t.runsJobId==null?void 0:t.jobs.find(e=>e.id===t.runsJobId),d=t.runsScope===`all`?i(`cron.jobList.allJobs`):u?.name??t.runsJobId??i(`cron.jobList.selectJob`),f=t.runs.toSorted((e,n)=>t.runsSortDir===`asc`?e.ts-n.ts:n.ts-e.ts),p=m(),C=h(),w=p.filter(e=>t.runsStatuses.includes(e.value)).map(e=>e.label),O=C.filter(e=>t.runsDeliveryStatuses.includes(e.value)).map(e=>e.label),M=_(w,i(`cron.runs.allStatuses`)),N=_(O,i(`cron.runs.allDelivery`)),P=t.form.sessionTarget!==`main`&&t.form.payloadKind===`agentTurn`,F=t.form.deliveryMode===`announce`&&!P?`none`:t.form.deliveryMode,I=t.cronFormCollapsed===!1||a,L=!I,R=i(a?`cron.form.editJob`:`cron.form.newJob`),B=T(t.fieldErrors,t.form,F),V=!t.busy&&B.length>0,H=t.onQuickCreate?t.onQuickCreate:t.onToggleFormCollapsed?()=>t.onToggleFormCollapsed?.(!1):null,U=t.jobsQuery.trim().length>0||t.jobsEnabledFilter!==`all`||t.jobsScheduleKindFilter!==`all`||t.jobsLastStatusFilter!==`all`||t.jobsSortBy!==`nextRunAtMs`||t.jobsSortDir!==`asc`,W=t.runsScope!==`all`||t.runsQuery.trim().length>0||t.runsStatuses.length>0||t.runsDeliveryStatuses.length>0||t.runsSortDir!==`desc`,G=V&&!t.canSubmit?B.length===1?i(`cron.form.fixFields`,{count:String(B.length)}):i(`cron.form.fixFieldsPlural`,{count:String(B.length)}):``;return n`
    <section class="card cron-summary-strip">
      <div class="cron-summary-strip__left">
        <div class="cron-summary-item">
          <div class="cron-summary-label">${i(`cron.summary.enabled`)}</div>
          <div class="cron-summary-value">
            <span class=${`chip ${t.status?.enabled?`chip-ok`:`chip-danger`}`}>
              ${t.status?t.status.enabled?i(`cron.summary.yes`):i(`cron.summary.no`):i(`common.na`)}
            </span>
          </div>
        </div>
        <div class="cron-summary-item">
          <div class="cron-summary-label">${i(`cron.summary.jobs`)}</div>
          <div class="cron-summary-value">${t.status?.jobs??i(`common.na`)}</div>
        </div>
        <div class="cron-summary-item cron-summary-item--wide">
          <div class="cron-summary-label">${i(`cron.summary.nextWake`)}</div>
          <div class="cron-summary-value">${l(t.status?.nextWakeAtMs??null)}</div>
        </div>
      </div>
      <div class="cron-summary-strip__actions">
        ${H?n`
              <button class="btn btn--primary" @click=${H}>
                ${i(`cron.form.newJob`)}
              </button>
            `:e}
        <button
          class=${t.loading?`btn cron-refresh-btn--loading`:`btn`}
          ?disabled=${t.loading}
          @click=${t.onRefresh}
        >
          ${t.loading?i(`cron.summary.refreshing`):i(`cron.summary.refresh`)}
        </button>
        ${t.error?n`<span class="muted">${t.error}</span>`:e}
      </div>
    </section>

    <section class=${`cron-workspace ${L?`cron-workspace--form-collapsed`:``}`}>
      <div class="cron-workspace-main">
        <section class="card">
          <div
            class="row"
            style="justify-content: space-between; align-items: flex-start; gap: 12px;"
          >
            <div>
              <div class="card-title">${i(`cron.jobs.title`)}</div>
              <div class="card-sub">${i(`cron.jobs.subtitle`)}</div>
            </div>
            <div class="muted">
              ${i(`cron.jobs.shownOf`,{shown:String(t.jobs.length),total:String(t.jobsTotal)})}
            </div>
          </div>
          <details class="cron-filter-panel" ?open=${U}>
            <summary class="cron-filter-panel__summary">
              <span>${i(`sessionsView.filters`)}</span>
              ${U?n`<span class="chip">${i(`common.active`)}</span>`:e}
            </summary>
            <div class="filters cron-filter-panel__body">
              <label class="field cron-filter-search">
                <span>${i(`cron.jobs.searchJobs`)}</span>
                <input
                  .value=${t.jobsQuery}
                  placeholder=${i(`cron.jobs.searchPlaceholder`)}
                  @input=${e=>t.onJobsFiltersChange({cronJobsQuery:e.target.value})}
                />
              </label>
              <label class="field">
                <span>${i(`cron.jobs.enabled`)}</span>
                <select
                  .value=${t.jobsEnabledFilter}
                  @change=${e=>t.onJobsFiltersChange({cronJobsEnabledFilter:e.target.value})}
                >
                  <option value="all">${i(`cron.jobs.all`)}</option>
                  <option value="enabled">${i(`common.enabled`)}</option>
                  <option value="disabled">${i(`common.disabled`)}</option>
                </select>
              </label>
              <label class="field">
                <span>${i(`cron.jobs.schedule`)}</span>
                <select
                  data-test-id="cron-jobs-schedule-filter"
                  .value=${t.jobsScheduleKindFilter}
                  @change=${e=>t.onJobsFiltersChange({cronJobsScheduleKindFilter:e.target.value})}
                >
                  <option value="all">${i(`cron.jobs.all`)}</option>
                  <option value="at">${i(`cron.form.at`)}</option>
                  <option value="every">${i(`cron.form.every`)}</option>
                  <option value="cron">${i(`cron.form.cronOption`)}</option>
                </select>
              </label>
              <label class="field">
                <span>${i(`cron.jobs.lastRun`)}</span>
                <select
                  data-test-id="cron-jobs-last-status-filter"
                  .value=${t.jobsLastStatusFilter}
                  @change=${e=>t.onJobsFiltersChange({cronJobsLastStatusFilter:e.target.value})}
                >
                  <option value="all">${i(`cron.jobs.all`)}</option>
                  <option value="ok">${i(`cron.runs.runStatusOk`)}</option>
                  <option value="error">${i(`cron.runs.runStatusError`)}</option>
                  <option value="skipped">${i(`cron.runs.runStatusSkipped`)}</option>
                </select>
              </label>
              <label class="field">
                <span>${i(`cron.jobs.sort`)}</span>
                <select
                  .value=${t.jobsSortBy}
                  @change=${e=>t.onJobsFiltersChange({cronJobsSortBy:e.target.value})}
                >
                  <option value="nextRunAtMs">${i(`cron.jobs.nextRun`)}</option>
                  <option value="updatedAtMs">${i(`cron.jobs.recentlyUpdated`)}</option>
                  <option value="name">${i(`cron.jobs.name`)}</option>
                </select>
              </label>
              <label class="field">
                <span>${i(`cron.jobs.direction`)}</span>
                <select
                  .value=${t.jobsSortDir}
                  @change=${e=>t.onJobsFiltersChange({cronJobsSortDir:e.target.value})}
                >
                  <option value="asc">${i(`cron.jobs.ascending`)}</option>
                  <option value="desc">${i(`cron.jobs.descending`)}</option>
                </select>
              </label>
              <label class="field">
                <span>${i(`cron.jobs.reset`)}</span>
                <button
                  class="btn"
                  data-test-id="cron-jobs-filters-reset"
                  ?disabled=${!U}
                  @click=${t.onJobsFiltersReset}
                >
                  ${i(`cron.jobs.reset`)}
                </button>
              </label>
            </div>
          </details>
          ${t.jobs.length===0?n`
                <div class="cron-empty-state">
                  <div class="cron-empty-state__title">
                    ${i(U?`cron.jobs.noMatching`:`cron.jobs.emptyTitle`)}
                  </div>
                  <div class="cron-empty-state__copy">
                    ${i(U?`cron.jobs.emptyFilteredHint`:`cron.jobs.emptyHint`)}
                  </div>
                  ${H&&!U?n`
                        <button class="btn btn--primary" @click=${H}>
                          ${i(`cron.form.newJob`)}
                        </button>
                      `:e}
                </div>
              `:n`
                <div class="list" style="margin-top: 12px;">
                  ${t.jobs.map(e=>j(e,t))}
                </div>
              `}
          ${t.jobsHasMore?n`
                <div class="row" style="margin-top: 12px">
                  <button
                    class="btn"
                    ?disabled=${t.loading||t.jobsLoadingMore}
                    @click=${t.onLoadMoreJobs}
                  >
                    ${t.jobsLoadingMore?i(`cron.jobs.loading`):i(`cron.jobs.loadMore`)}
                  </button>
                </div>
              `:e}
        </section>

        <section class="card">
          <div
            class="row"
            style="justify-content: space-between; align-items: flex-start; gap: 12px;"
          >
            <div>
              <div class="card-title">${i(`cron.runs.title`)}</div>
              <div class="card-sub">
                ${t.runsScope===`all`?i(`cron.runs.subtitleAll`):i(`cron.runs.subtitleJob`,{title:d})}
              </div>
            </div>
            <div class="muted">
              ${i(`cron.jobs.shownOf`,{shown:String(f.length),total:String(t.runsTotal)})}
            </div>
          </div>
          <details class="cron-filter-panel" ?open=${W}>
            <summary class="cron-filter-panel__summary">
              <span>${i(`sessionsView.filters`)}</span>
              ${W?n`<span class="chip">${i(`common.active`)}</span>`:e}
            </summary>
            <div class="cron-run-filters">
              <div class="cron-run-filters__row cron-run-filters__row--primary">
                <label class="field">
                  <span>${i(`cron.runs.scope`)}</span>
                  <select
                    .value=${t.runsScope}
                    @change=${e=>t.onRunsFiltersChange({cronRunsScope:e.target.value})}
                  >
                    <option value="all">${i(`cron.runs.allJobs`)}</option>
                    <option value="job" ?disabled=${t.runsJobId==null}>
                      ${i(`cron.runs.selectedJob`)}
                    </option>
                  </select>
                </label>
                <label class="field cron-run-filter-search">
                  <span>${i(`cron.runs.searchRuns`)}</span>
                  <input
                    .value=${t.runsQuery}
                    placeholder=${i(`cron.runs.searchPlaceholder`)}
                    @input=${e=>t.onRunsFiltersChange({cronRunsQuery:e.target.value})}
                  />
                </label>
                <label class="field">
                  <span>${i(`cron.jobs.sort`)}</span>
                  <select
                    .value=${t.runsSortDir}
                    @change=${e=>t.onRunsFiltersChange({cronRunsSortDir:e.target.value})}
                  >
                    <option value="desc">${i(`cron.runs.newestFirst`)}</option>
                    <option value="asc">${i(`cron.runs.oldestFirst`)}</option>
                  </select>
                </label>
              </div>
              <div class="cron-run-filters__row cron-run-filters__row--secondary">
                ${b({id:`status`,title:i(`cron.runs.status`),summary:M,options:p,selected:t.runsStatuses,onToggle:(e,n)=>{let r=g(t.runsStatuses,e,n);t.onRunsFiltersChange({cronRunsStatuses:r})},onClear:()=>{t.onRunsFiltersChange({cronRunsStatuses:[]})}})}
                ${b({id:`delivery`,title:i(`cron.runs.delivery`),summary:N,options:C,selected:t.runsDeliveryStatuses,onToggle:(e,n)=>{let r=g(t.runsDeliveryStatuses,e,n);t.onRunsFiltersChange({cronRunsDeliveryStatuses:r})},onClear:()=>{t.onRunsFiltersChange({cronRunsDeliveryStatuses:[]})}})}
              </div>
            </div>
          </details>
          ${t.runsScope===`job`&&t.runsJobId==null?n`
                <div class="muted" style="margin-top: 12px">${i(`cron.runs.selectJobHint`)}</div>
              `:f.length===0?n`
                  <div class="muted" style="margin-top: 12px">${i(`cron.runs.noMatching`)}</div>
                `:n`
                  <div class="list" style="margin-top: 12px;">
                    ${f.map(e=>z(e,t.basePath,t.onNavigateToChat))}
                  </div>
                `}
          ${(t.runsScope===`all`||t.runsJobId!=null)&&t.runsHasMore?n`
                <div class="row" style="margin-top: 12px">
                  <button
                    class="btn"
                    ?disabled=${t.runsLoadingMore}
                    @click=${t.onLoadMoreRuns}
                  >
                    ${t.runsLoadingMore?i(`cron.jobs.loading`):i(`cron.runs.loadMore`)}
                  </button>
                </div>
              `:e}
        </section>
      </div>
    </section>

    ${I?n`
          <div class="cron-form-modal-backdrop" @click=${t.onCancelEdit}>
            <section
              class="card cron-workspace-form cron-form-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="cron-form-title"
              @click=${e=>e.stopPropagation()}
            >
              <div class="cron-form-header">
                <div class="cron-form-header__copy">
                  <div id="cron-form-title" class="card-title">${R}</div>
                  ${L?e:n`
                        <div class="card-sub">
                          ${i(a?`cron.form.updateSubtitle`:`cron.form.createSubtitle`)}
                        </div>
                      `}
                </div>
                <button
                  type="button"
                  class="btn cron-form-collapse-toggle"
                  data-test-id="cron-form-close"
                  title=${i(`common.dismiss`)}
                  aria-label=${i(`common.dismiss`)}
                  @click=${t.onCancelEdit}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <div class="cron-form" ?hidden=${L}>
                <div class="cron-required-legend">
                  <span class="cron-required-marker" aria-hidden="true">*</span> ${i(`cron.form.required`)}
                </div>
                <section class="cron-form-section">
                  <div class="cron-form-section__title">${i(`cron.form.basics`)}</div>
                  <div class="cron-form-section__sub">${i(`cron.form.basicsSub`)}</div>
                  <div class="form-grid cron-form-grid">
                    <label class="field">
                      ${D(i(`cron.form.fieldName`),!0)}
                      <input
                        id="cron-name"
                        .value=${t.form.name}
                        placeholder=${i(`cron.form.namePlaceholder`)}
                        aria-invalid=${t.fieldErrors.name?`true`:`false`}
                        aria-describedby=${r(t.fieldErrors.name?S(`name`):void 0)}
                        @input=${e=>t.onFormChange({name:e.target.value})}
                      />
                      ${A(t.fieldErrors.name,S(`name`))}
                    </label>
                    <label class="field">
                      <span>${i(`cron.form.description`)}</span>
                      <input
                        .value=${t.form.description}
                        placeholder=${i(`cron.form.descriptionPlaceholder`)}
                        @input=${e=>t.onFormChange({description:e.target.value})}
                      />
                    </label>
                    <label class="field">
                      ${D(i(`cron.form.agentId`))}
                      <input
                        id="cron-agent-id"
                        .value=${t.form.agentId}
                        list="cron-agent-suggestions"
                        ?disabled=${t.form.clearAgent}
                        @input=${e=>t.onFormChange({agentId:e.target.value})}
                        placeholder=${i(`cron.form.agentPlaceholder`)}
                      />
                      <div class="cron-help">${i(`cron.form.agentHelp`)}</div>
                    </label>
                    <label class="field checkbox cron-checkbox cron-checkbox-inline">
                      <input
                        type="checkbox"
                        .checked=${t.form.enabled}
                        @change=${e=>t.onFormChange({enabled:e.target.checked})}
                      />
                      <span class="field-checkbox__label">${i(`cron.summary.enabled`)}</span>
                    </label>
                  </div>
                </section>

                <section class="cron-form-section">
                  <div class="cron-form-section__title">${i(`cron.form.schedule`)}</div>
                  <div class="cron-form-section__sub">${i(`cron.form.scheduleSub`)}</div>
                  <div class="form-grid cron-form-grid">
                    <label class="field cron-span-2">
                      ${D(i(`cron.form.schedule`))}
                      <select
                        id="cron-schedule-kind"
                        .value=${t.form.scheduleKind}
                        @change=${e=>t.onFormChange({scheduleKind:e.target.value})}
                      >
                        <option value="every">${i(`cron.form.every`)}</option>
                        <option value="at">${i(`cron.form.at`)}</option>
                        <option value="cron">${i(`cron.form.cronOption`)}</option>
                      </select>
                    </label>
                  </div>
                  ${k(t)}
                </section>

                <section class="cron-form-section">
                  <div class="cron-form-section__title">${i(`cron.form.execution`)}</div>
                  <div class="cron-form-section__sub">${i(`cron.form.executionSub`)}</div>
                  <div class="form-grid cron-form-grid">
                    <label class="field">
                      ${D(i(`cron.form.session`))}
                      <select
                        id="cron-session-target"
                        .value=${t.form.sessionTarget}
                        @change=${e=>t.onFormChange({sessionTarget:e.target.value})}
                      >
                        <option value="main">${i(`cron.form.main`)}</option>
                        <option value="isolated">${i(`cron.form.isolated`)}</option>
                      </select>
                      <div class="cron-help">${i(`cron.form.sessionHelp`)}</div>
                    </label>
                    <label class="field">
                      ${D(i(`cron.form.wakeMode`))}
                      <select
                        id="cron-wake-mode"
                        .value=${t.form.wakeMode}
                        @change=${e=>t.onFormChange({wakeMode:e.target.value})}
                      >
                        <option value="now">${i(`cron.form.now`)}</option>
                        <option value="next-heartbeat">${i(`cron.form.nextHeartbeat`)}</option>
                      </select>
                      <div class="cron-help">${i(`cron.form.wakeModeHelp`)}</div>
                    </label>
                    <label class="field ${o?``:`cron-span-2`}">
                      ${D(i(`cron.form.payloadKind`))}
                      <select
                        id="cron-payload-kind"
                        .value=${t.form.payloadKind}
                        @change=${e=>t.onFormChange({payloadKind:e.target.value})}
                      >
                        <option value="systemEvent">${i(`cron.form.systemEvent`)}</option>
                        <option value="agentTurn">${i(`cron.form.agentTurn`)}</option>
                      </select>
                      <div class="cron-help">
                        ${t.form.payloadKind===`systemEvent`?i(`cron.form.systemEventHelp`):i(`cron.form.agentTurnHelp`)}
                      </div>
                    </label>
                    ${o?n`
                          <label class="field">
                            ${D(i(`cron.form.timeoutSeconds`))}
                            <input
                              id="cron-timeout-seconds"
                              .value=${t.form.timeoutSeconds}
                              placeholder=${i(`cron.form.timeoutPlaceholder`)}
                              aria-invalid=${t.fieldErrors.timeoutSeconds?`true`:`false`}
                              aria-describedby=${r(t.fieldErrors.timeoutSeconds?S(`timeoutSeconds`):void 0)}
                              @input=${e=>t.onFormChange({timeoutSeconds:e.target.value})}
                            />
                            <div class="cron-help">${i(`cron.form.timeoutHelp`)}</div>
                            ${A(t.fieldErrors.timeoutSeconds,S(`timeoutSeconds`))}
                          </label>
                        `:e}
                  </div>
                  <label class="field cron-span-2">
                    ${D(t.form.payloadKind===`systemEvent`?i(`cron.form.mainTimelineMessage`):i(`cron.form.assistantTaskPrompt`),!0)}
                    <textarea
                      id="cron-payload-text"
                      .value=${t.form.payloadText}
                      aria-invalid=${t.fieldErrors.payloadText?`true`:`false`}
                      aria-describedby=${r(t.fieldErrors.payloadText?S(`payloadText`):void 0)}
                      @input=${e=>t.onFormChange({payloadText:e.target.value})}
                      rows="4"
                    ></textarea>
                    ${A(t.fieldErrors.payloadText,S(`payloadText`))}
                  </label>
                </section>

                <section class="cron-form-section">
                  <div class="cron-form-section__title">${i(`cron.form.deliverySection`)}</div>
                  <div class="cron-form-section__sub">${i(`cron.form.deliverySub`)}</div>
                  <div class="form-grid cron-form-grid">
                    <label class="field ${F===`none`?`cron-span-2`:``}">
                      ${D(i(`cron.form.resultDelivery`))}
                      <select
                        id="cron-delivery-mode"
                        .value=${F}
                        @change=${e=>t.onFormChange({deliveryMode:e.target.value})}
                      >
                        ${P?n`
                              <option value="announce">${i(`cron.form.announceDefault`)}</option>
                            `:e}
                        <option value="webhook">${i(`cron.form.webhookPost`)}</option>
                        <option value="none">${i(`cron.form.noneInternal`)}</option>
                      </select>
                      <div class="cron-help">${i(`cron.form.deliveryHelp`)}</div>
                    </label>
                    ${F===`none`?e:n`
                          <label
                            class="field ${F===`webhook`?`cron-span-2`:``}"
                          >
                            ${D(i(F===`webhook`?`cron.form.webhookUrl`:`cron.form.channel`),F===`webhook`)}
                            ${F===`webhook`?n`
                                  <input
                                    id="cron-delivery-to"
                                    .value=${t.form.deliveryTo}
                                    list="cron-delivery-to-suggestions"
                                    aria-invalid=${t.fieldErrors.deliveryTo?`true`:`false`}
                                    aria-describedby=${r(t.fieldErrors.deliveryTo?S(`deliveryTo`):void 0)}
                                    @input=${e=>t.onFormChange({deliveryTo:e.target.value})}
                                    placeholder=${i(`cron.form.webhookPlaceholder`)}
                                  />
                                `:n`
                                  <select
                                    id="cron-delivery-channel"
                                    .value=${t.form.deliveryChannel||`last`}
                                    @change=${e=>t.onFormChange({deliveryChannel:e.target.value})}
                                  >
                                    ${c.map(e=>n`<option value=${e}>
                                          ${y(t,e)}
                                        </option>`)}
                                  </select>
                                `}
                            ${F===`announce`?n` <div class="cron-help">${i(`cron.form.channelHelp`)}</div> `:n` <div class="cron-help">${i(`cron.form.webhookHelp`)}</div> `}
                          </label>
                          ${F===`announce`?n`
                                <label class="field cron-span-2">
                                  ${D(i(`cron.form.to`))}
                                  <input
                                    id="cron-delivery-to"
                                    .value=${t.form.deliveryTo}
                                    list="cron-delivery-to-suggestions"
                                    @input=${e=>t.onFormChange({deliveryTo:e.target.value})}
                                    placeholder=${i(`cron.form.toPlaceholder`)}
                                  />
                                  <div class="cron-help">${i(`cron.form.toHelp`)}</div>
                                </label>
                              `:e}
                          ${F===`webhook`?A(t.fieldErrors.deliveryTo,S(`deliveryTo`)):e}
                        `}
                  </div>
                </section>

                <details class="cron-advanced">
                  <summary class="cron-advanced__summary">${i(`cron.form.advanced`)}</summary>
                  <div class="cron-help">${i(`cron.form.advancedHelp`)}</div>
                  <div class="form-grid cron-form-grid">
                    <label class="field checkbox cron-checkbox">
                      <input
                        type="checkbox"
                        .checked=${t.form.deleteAfterRun}
                        @change=${e=>t.onFormChange({deleteAfterRun:e.target.checked})}
                      />
                      <span class="field-checkbox__label">${i(`cron.form.deleteAfterRun`)}</span>
                      <div class="cron-help">${i(`cron.form.deleteAfterRunHelp`)}</div>
                    </label>
                    <label class="field checkbox cron-checkbox">
                      <input
                        type="checkbox"
                        .checked=${t.form.clearAgent}
                        @change=${e=>t.onFormChange({clearAgent:e.target.checked})}
                      />
                      <span class="field-checkbox__label"
                        >${i(`cron.form.clearAgentOverride`)}</span
                      >
                      <div class="cron-help">${i(`cron.form.clearAgentHelp`)}</div>
                    </label>
                    <label class="field cron-span-2">
                      ${D(`Session key`)}
                      <input
                        id="cron-session-key"
                        .value=${t.form.sessionKey}
                        @input=${e=>t.onFormChange({sessionKey:e.target.value})}
                        placeholder="agent:main:main"
                      />
                      <div class="cron-help">
                        Optional routing key for job delivery and wake routing.
                      </div>
                    </label>
                    ${s?n`
                          <label class="field checkbox cron-checkbox cron-span-2">
                            <input
                              type="checkbox"
                              .checked=${t.form.scheduleExact}
                              @change=${e=>t.onFormChange({scheduleExact:e.target.checked})}
                            />
                            <span class="field-checkbox__label">${i(`cron.form.exactTiming`)}</span>
                            <div class="cron-help">${i(`cron.form.exactTimingHelp`)}</div>
                          </label>
                          <div class="cron-stagger-group cron-span-2">
                            <label class="field">
                              ${D(i(`cron.form.staggerWindow`))}
                              <input
                                id="cron-stagger-amount"
                                .value=${t.form.staggerAmount}
                                ?disabled=${t.form.scheduleExact}
                                aria-invalid=${t.fieldErrors.staggerAmount?`true`:`false`}
                                aria-describedby=${r(t.fieldErrors.staggerAmount?S(`staggerAmount`):void 0)}
                                @input=${e=>t.onFormChange({staggerAmount:e.target.value})}
                                placeholder=${i(`cron.form.staggerPlaceholder`)}
                              />
                              ${A(t.fieldErrors.staggerAmount,S(`staggerAmount`))}
                            </label>
                            <label class="field">
                              <span>${i(`cron.form.staggerUnit`)}</span>
                              <select
                                .value=${t.form.staggerUnit}
                                ?disabled=${t.form.scheduleExact}
                                @change=${e=>t.onFormChange({staggerUnit:e.target.value})}
                              >
                                <option value="seconds">${i(`cron.form.seconds`)}</option>
                                <option value="minutes">${i(`cron.form.minutes`)}</option>
                              </select>
                            </label>
                          </div>
                        `:e}
                    ${o?n`
                          <label class="field cron-span-2">
                            ${D(`Account ID`)}
                            <input
                              id="cron-delivery-account-id"
                              .value=${t.form.deliveryAccountId}
                              list="cron-delivery-account-suggestions"
                              ?disabled=${F!==`announce`}
                              @input=${e=>t.onFormChange({deliveryAccountId:e.target.value})}
                              placeholder="default"
                            />
                            <div class="cron-help">
                              Optional channel account ID for multi-account setups.
                            </div>
                          </label>
                          <label class="field checkbox cron-checkbox cron-span-2">
                            <input
                              type="checkbox"
                              .checked=${t.form.payloadLightContext}
                              @change=${e=>t.onFormChange({payloadLightContext:e.target.checked})}
                            />
                            <span class="field-checkbox__label">Light context</span>
                            <div class="cron-help">
                              Use lightweight bootstrap context for this agent job.
                            </div>
                          </label>
                          <label class="field">
                            ${D(i(`cron.form.model`))}
                            <input
                              id="cron-payload-model"
                              .value=${t.form.payloadModel}
                              list="cron-model-suggestions"
                              @input=${e=>t.onFormChange({payloadModel:e.target.value})}
                              placeholder=${i(`cron.form.modelPlaceholder`)}
                            />
                            <div class="cron-help">${i(`cron.form.modelHelp`)}</div>
                          </label>
                          <label class="field">
                            ${D(i(`cron.form.thinking`))}
                            <input
                              id="cron-payload-thinking"
                              .value=${t.form.payloadThinking}
                              list="cron-thinking-suggestions"
                              @input=${e=>t.onFormChange({payloadThinking:e.target.value})}
                              placeholder=${i(`cron.form.thinkingPlaceholder`)}
                            />
                            <div class="cron-help">${i(`cron.form.thinkingHelp`)}</div>
                          </label>
                        `:e}
                    ${o?n`
                          <label class="field cron-span-2">
                            ${D(`Failure alerts`)}
                            <select
                              .value=${t.form.failureAlertMode}
                              @change=${e=>t.onFormChange({failureAlertMode:e.target.value})}
                            >
                              <option value="inherit">Inherit global setting</option>
                              <option value="disabled">Disable for this job</option>
                              <option value="custom">Custom per-job settings</option>
                            </select>
                            <div class="cron-help">
                              Control when this job sends repeated-failure alerts.
                            </div>
                          </label>
                          ${t.form.failureAlertMode===`custom`?n`
                                <label class="field">
                                  ${D(`Alert after`)}
                                  <input
                                    id="cron-failure-alert-after"
                                    .value=${t.form.failureAlertAfter}
                                    aria-invalid=${t.fieldErrors.failureAlertAfter?`true`:`false`}
                                    aria-describedby=${r(t.fieldErrors.failureAlertAfter?S(`failureAlertAfter`):void 0)}
                                    @input=${e=>t.onFormChange({failureAlertAfter:e.target.value})}
                                    placeholder="2"
                                  />
                                  <div class="cron-help">Consecutive errors before alerting.</div>
                                  ${A(t.fieldErrors.failureAlertAfter,S(`failureAlertAfter`))}
                                </label>
                                <label class="field">
                                  ${D(`Cooldown (seconds)`)}
                                  <input
                                    id="cron-failure-alert-cooldown-seconds"
                                    .value=${t.form.failureAlertCooldownSeconds}
                                    aria-invalid=${t.fieldErrors.failureAlertCooldownSeconds?`true`:`false`}
                                    aria-describedby=${r(t.fieldErrors.failureAlertCooldownSeconds?S(`failureAlertCooldownSeconds`):void 0)}
                                    @input=${e=>t.onFormChange({failureAlertCooldownSeconds:e.target.value})}
                                    placeholder="3600"
                                  />
                                  <div class="cron-help">Minimum seconds between alerts.</div>
                                  ${A(t.fieldErrors.failureAlertCooldownSeconds,S(`failureAlertCooldownSeconds`))}
                                </label>
                                <label class="field">
                                  ${D(`Alert channel`)}
                                  <select
                                    .value=${t.form.failureAlertChannel||`last`}
                                    @change=${e=>t.onFormChange({failureAlertChannel:e.target.value})}
                                  >
                                    ${c.map(e=>n`<option value=${e}>
                                          ${y(t,e)}
                                        </option>`)}
                                  </select>
                                </label>
                                <label class="field">
                                  ${D(`Alert to`)}
                                  <input
                                    .value=${t.form.failureAlertTo}
                                    list="cron-delivery-to-suggestions"
                                    @input=${e=>t.onFormChange({failureAlertTo:e.target.value})}
                                    placeholder="+1555... or chat id"
                                  />
                                  <div class="cron-help">
                                    Optional recipient override for failure alerts.
                                  </div>
                                </label>
                                <label class="field">
                                  ${D(`Alert mode`)}
                                  <select
                                    .value=${t.form.failureAlertDeliveryMode||`announce`}
                                    @change=${e=>t.onFormChange({failureAlertDeliveryMode:e.target.value})}
                                  >
                                    <option value="announce">Announce (via channel)</option>
                                    <option value="webhook">Webhook (HTTP POST)</option>
                                  </select>
                                </label>
                                <label class="field">
                                  ${D(`Alert account ID`)}
                                  <input
                                    .value=${t.form.failureAlertAccountId}
                                    @input=${e=>t.onFormChange({failureAlertAccountId:e.target.value})}
                                    placeholder="Account ID for multi-account setups"
                                  />
                                </label>
                              `:e}
                        `:e}
                    ${F===`none`?e:n`
                          <label class="field checkbox cron-checkbox cron-span-2">
                            <input
                              type="checkbox"
                              .checked=${t.form.deliveryBestEffort}
                              @change=${e=>t.onFormChange({deliveryBestEffort:e.target.checked})}
                            />
                            <span class="field-checkbox__label"
                              >${i(`cron.form.bestEffortDelivery`)}</span
                            >
                            <div class="cron-help">${i(`cron.form.bestEffortHelp`)}</div>
                          </label>
                        `}
                  </div>
                </details>
              </div>
              ${V?n`
                    <div
                      class="cron-form-status"
                      role="status"
                      aria-live="polite"
                      ?hidden=${L}
                    >
                      <div class="cron-form-status__title">${i(`cron.form.cantAddYet`)}</div>
                      <div class="cron-help">${i(`cron.form.fillRequired`)}</div>
                      <ul class="cron-form-status__list">
                        ${B.map(e=>n`
                            <li>
                              <button
                                type="button"
                                class="cron-form-status__link"
                                @click=${()=>E(e.inputId)}
                              >
                                ${e.label}: ${i(e.message)}
                              </button>
                            </li>
                          `)}
                      </ul>
                    </div>
                  `:e}
              <div class="row cron-form-actions" ?hidden=${L}>
                <button
                  class="btn primary"
                  ?disabled=${t.busy||!t.canSubmit}
                  @click=${t.onAdd}
                >
                  ${t.busy?i(`cron.form.saving`):i(a?`cron.form.saveChanges`:`cron.form.addJob`)}
                </button>
                ${G?n`
                      <div class="cron-submit-reason" aria-live="polite">
                        ${G}
                      </div>
                    `:e}
                ${a?n`
                      <button class="btn" ?disabled=${t.busy} @click=${t.onCancelEdit}>
                        ${i(`cron.form.cancel`)}
                      </button>
                    `:e}
              </div>
            </section>
          </div>
        `:e}
    ${x(`cron-agent-suggestions`,t.agentSuggestions)}
    ${x(`cron-model-suggestions`,t.modelSuggestions)}
    ${x(`cron-thinking-suggestions`,t.thinkingSuggestions)}
    ${x(`cron-tz-suggestions`,t.timezoneSuggestions)}
    ${x(`cron-delivery-to-suggestions`,t.deliveryToSuggestions)}
    ${x(`cron-delivery-account-suggestions`,t.accountSuggestions)}
  `}function k(e){let t=e.form;return t.scheduleKind===`at`?n`
      <label class="field cron-span-2" style="margin-top: 12px;">
        ${D(i(`cron.form.runAt`),!0)}
        <input
          id="cron-schedule-at"
          type="datetime-local"
          .value=${t.scheduleAt}
          aria-invalid=${e.fieldErrors.scheduleAt?`true`:`false`}
          aria-describedby=${r(e.fieldErrors.scheduleAt?S(`scheduleAt`):void 0)}
          @input=${t=>e.onFormChange({scheduleAt:t.target.value})}
        />
        ${A(e.fieldErrors.scheduleAt,S(`scheduleAt`))}
      </label>
    `:t.scheduleKind===`every`?n`
      <div class="form-grid cron-form-grid" style="margin-top: 12px;">
        <label class="field">
          ${D(i(`cron.form.every`),!0)}
          <input
            id="cron-every-amount"
            .value=${t.everyAmount}
            aria-invalid=${e.fieldErrors.everyAmount?`true`:`false`}
            aria-describedby=${r(e.fieldErrors.everyAmount?S(`everyAmount`):void 0)}
            @input=${t=>e.onFormChange({everyAmount:t.target.value})}
            placeholder=${i(`cron.form.everyAmountPlaceholder`)}
          />
          ${A(e.fieldErrors.everyAmount,S(`everyAmount`))}
        </label>
        <label class="field">
          <span>${i(`cron.form.unit`)}</span>
          <select
            .value=${t.everyUnit}
            @change=${t=>e.onFormChange({everyUnit:t.target.value})}
          >
            <option value="minutes">${i(`cron.form.minutes`)}</option>
            <option value="hours">${i(`cron.form.hours`)}</option>
            <option value="days">${i(`cron.form.days`)}</option>
          </select>
        </label>
      </div>
    `:n`
    <div class="form-grid cron-form-grid" style="margin-top: 12px;">
      <label class="field">
        ${D(i(`cron.form.expression`),!0)}
        <input
          id="cron-cron-expr"
          .value=${t.cronExpr}
          aria-invalid=${e.fieldErrors.cronExpr?`true`:`false`}
          aria-describedby=${r(e.fieldErrors.cronExpr?S(`cronExpr`):void 0)}
          @input=${t=>e.onFormChange({cronExpr:t.target.value})}
          placeholder=${i(`cron.form.expressionPlaceholder`)}
        />
        ${A(e.fieldErrors.cronExpr,S(`cronExpr`))}
      </label>
      <label class="field">
        <span>${i(`cron.form.timezoneOptional`)}</span>
        <input
          .value=${t.cronTz}
          list="cron-tz-suggestions"
          @input=${t=>e.onFormChange({cronTz:t.target.value})}
          placeholder=${i(`cron.form.timezonePlaceholder`)}
        />
        <div class="cron-help">${i(`cron.form.timezoneHelp`)}</div>
      </label>
      <div class="cron-help cron-span-2">${i(`cron.form.jitterHelp`)}</div>
    </div>
  `}function A(t,a){return t?n`<div id=${r(a)} class="cron-help cron-error">${i(t)}</div>`:e}function j(t,r){let a=`list-item list-item-clickable cron-job${r.runsJobId===t.id?` list-item-selected`:``}`,o=e=>{r.onLoadRuns(t.id),e()};return n`
    <div class=${a} @click=${()=>r.onLoadRuns(t.id)}>
      <div class="cron-job-header">
        <div class="list-main">
          <div class="list-title">${t.name}</div>
          <div class="list-sub">${p(t)}</div>
          ${t.agentId?n`<div class="muted cron-job-agent">
                ${i(`cron.jobDetail.agent`)}: ${t.agentId}
              </div>`:e}
        </div>
        <div class="list-meta">${I(t)}</div>
      </div>
      ${M(t)}
      <div class="cron-job-footer">
        <div class="chip-row cron-job-chips">
          <span class=${`chip ${t.enabled?`chip-ok`:`chip-danger`}`}>
            ${t.enabled?i(`cron.jobList.enabled`):i(`cron.jobList.disabled`)}
          </span>
          <span class="chip">${t.sessionTarget}</span>
          <span class="chip">${t.wakeMode}</span>
        </div>
        <div class="row cron-job-actions">
          <button
            class="btn"
            ?disabled=${r.busy}
            @click=${e=>{e.stopPropagation(),o(()=>r.onEdit(t))}}
          >
            ${i(`cron.jobList.edit`)}
          </button>
          <button
            class="btn"
            ?disabled=${r.busy}
            @click=${e=>{e.stopPropagation(),o(()=>r.onClone(t))}}
          >
            ${i(`cron.jobList.clone`)}
          </button>
          <button
            class="btn"
            ?disabled=${r.busy}
            @click=${e=>{e.stopPropagation(),o(()=>r.onToggle(t,!t.enabled))}}
          >
            ${t.enabled?i(`cron.jobList.disable`):i(`cron.jobList.enable`)}
          </button>
          <button
            class="btn"
            ?disabled=${r.busy}
            @click=${e=>{e.stopPropagation(),o(()=>r.onRun(t,`force`))}}
          >
            ${i(`cron.jobList.run`)}
          </button>
          <button
            class="btn"
            ?disabled=${r.busy}
            @click=${e=>{e.stopPropagation(),o(()=>r.onRun(t,`due`))}}
          >
            Run if due
          </button>
          <button
            class="btn"
            ?disabled=${r.busy}
            @click=${e=>{e.stopPropagation(),r.onLoadRuns(t.id)}}
          >
            ${i(`cron.jobList.history`)}
          </button>
          <button
            class="btn danger"
            ?disabled=${r.busy}
            @click=${e=>{e.stopPropagation(),o(()=>r.onRemove(t))}}
          >
            ${i(`cron.jobList.remove`)}
          </button>
        </div>
      </div>
    </div>
  `}function M(r){let a=d(r);if(!a)return n``;if(a.kind===`systemEvent`)return n`<div class="cron-job-detail">
      <span class="cron-job-detail-label">${i(`cron.jobDetail.system`)}</span>
      <span class="muted cron-job-detail-value">${a.text}</span>
    </div>`;let o=r.delivery,s=o?.mode===`webhook`?o.to?` (${o.to})`:``:o?.channel||o?.to?` (${o.channel??`last`}${o.to?` -> ${o.to}`:``})`:``;return n`
    <div class="cron-job-detail">
      <div class="cron-job-detail-section">
        <span class="cron-job-detail-label">${i(`cron.jobDetail.prompt`)}</span>
        <div class="muted cron-job-detail-value chat-text" @click=${N}>
          ${t(f(a.message))}
        </div>
      </div>
      ${o?n`<div class="cron-job-detail-section">
            <span class="cron-job-detail-label">${i(`cron.jobDetail.delivery`)}</span>
            <span class="muted cron-job-detail-value">${o.mode}${s}</span>
          </div>`:e}
    </div>
  `}function N(e){e.target?.closest(`a,button,input,textarea,select,summary,[role='button'],[role='link']`)&&e.stopPropagation()}function P(e){return typeof e!=`number`||!Number.isFinite(e)?i(`common.na`):c(e)}function F(e,t=Date.now()){let n=c(e);return i(e>t?`cron.runEntry.next`:`cron.runEntry.due`,{rel:n})}function I(e){let t=e.state?.lastStatus,r=t===`ok`?`cron-job-status-ok`:t===`error`?`cron-job-status-error`:t===`skipped`?`cron-job-status-skipped`:`cron-job-status-na`,a=i(t===`ok`?`cron.runs.runStatusOk`:t===`error`?`cron.runs.runStatusError`:t===`skipped`?`cron.runs.runStatusSkipped`:`common.na`),o=e.state?.nextRunAtMs,s=e.state?.lastRunAtMs;return n`
    <div class="cron-job-state">
      <div class="cron-job-state-row">
        <span class="cron-job-state-key">${i(`cron.jobState.status`)}</span>
        <span class=${`cron-job-status-pill ${r}`}>${a}</span>
      </div>
      <div class="cron-job-state-row">
        <span class="cron-job-state-key">${i(`cron.jobState.next`)}</span>
        <span class="cron-job-state-value" title=${u(o)}>
          ${P(o)}
        </span>
      </div>
      <div class="cron-job-state-row">
        <span class="cron-job-state-key">${i(`cron.jobState.last`)}</span>
        <span class="cron-job-state-value" title=${u(s)}>
          ${P(s)}
        </span>
      </div>
    </div>
  `}function L(e){switch(e){case`ok`:return i(`cron.runs.runStatusOk`);case`error`:return i(`cron.runs.runStatusError`);case`skipped`:return i(`cron.runs.runStatusSkipped`);default:return i(`cron.runs.runStatusUnknown`)}}function R(e){switch(e){case`delivered`:return i(`cron.runs.deliveryDelivered`);case`not-delivered`:return i(`cron.runs.deliveryNotDelivered`);case`not-requested`:return i(`cron.runs.deliveryNotRequested`);case`unknown`:return i(`cron.runs.deliveryUnknown`);default:return i(`cron.runs.deliveryUnknown`)}}function z(r,o,s){let c=typeof r.sessionKey==`string`&&r.sessionKey.trim().length>0?`${a(`chat`,o)}?session=${encodeURIComponent(r.sessionKey)}`:null,l=L(r.status??`unknown`),d=R(r.deliveryStatus??`not-requested`),p=r.usage,m=p&&typeof p.total_tokens==`number`?`${p.total_tokens} tokens`:p&&typeof p.input_tokens==`number`&&typeof p.output_tokens==`number`?`${p.input_tokens} in / ${p.output_tokens} out`:null,h=r.summary||r.error||i(`cron.runEntry.noSummary`),g=!!r.error&&!!r.summary;return n`
    <div class="list-item cron-run-entry">
      <div class="cron-run-entry__header">
        <div class="list-main cron-run-entry__main">
          <div class="list-title cron-run-entry__title">
            ${r.jobName??r.jobId}
            <span class="muted"> · ${l}</span>
          </div>
          <div class="chip-row" style="margin-top: 4px;">
            <span class="chip">${d}</span>
            ${r.model?n`<span class="chip">${r.model}</span>`:e}
            ${r.provider?n`<span class="chip">${r.provider}</span>`:e}
            ${m?n`<span class="chip">${m}</span>`:e}
          </div>
        </div>
        <div class="list-meta cron-run-entry__meta">
          <div>${u(r.ts)}</div>
          ${typeof r.runAtMs==`number`?n`<div class="muted">${i(`cron.runEntry.runAt`)} ${u(r.runAtMs)}</div>`:e}
          <div class="muted">${r.durationMs??0}ms</div>
          ${typeof r.nextRunAtMs==`number`?n`<div class="muted">${F(r.nextRunAtMs)}</div>`:e}
          ${c?n`<div>
                <a
                  class="session-link"
                  href=${c}
                  @click=${e=>{e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||s&&r.sessionKey&&(e.preventDefault(),s(r.sessionKey))}}
                  >${i(`cron.runEntry.openRunChat`)}</a
                >
              </div>`:e}
          ${g?n`<div class="muted">${r.error}</div>`:e}
          ${r.deliveryError?n`<div class="muted">${r.deliveryError}</div>`:e}
        </div>
      </div>
      <div class="cron-run-entry__body chat-text">
        ${t(f(h))}
      </div>
    </div>
  `}export{O as renderCron};
//# sourceMappingURL=cron-BVzi_5UI.js.map