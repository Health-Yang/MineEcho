import{f as e,p as t}from"./lit-runtime-DA0-mbwP.js";import{o as n}from"./string-coerce-Cl_fl99y.js";import{i as r}from"./index-89Mm3xEP.js";function i(i){let a=(i.status&&typeof i.status==`object`?i.status.securityAudit:null)?.summary??null,o=a?.critical??0,s=a?.warn??0,c=a?.info??0,l=o>0?`danger`:s>0?`warn`:`success`,u=o>0?n(`debug.security.critical`,{count:String(o)}):s>0?n(`debug.security.warnings`,{count:String(s)}):n(`debug.security.noCriticalIssues`);return t`
    <section class="grid">
      <div class="card">
        <div class="row" style="justify-content: space-between;">
          <div>
            <div class="card-title">${n(`debug.snapshotsTitle`)}</div>
            <div class="card-sub">${n(`debug.snapshotsSubtitle`)}</div>
          </div>
          <button class="btn" ?disabled=${i.loading} @click=${i.onRefresh}>
            ${i.loading?n(`common.refreshing`):n(`common.refresh`)}
          </button>
        </div>
        <div class="stack" style="margin-top: 12px;">
          <div>
            <div class="muted">${n(`debug.status`)}</div>
            ${a?t`<div class="callout ${l}" style="margin-top: 8px;">
                  ${n(`debug.security.audit`)}:
                  ${u}${c>0?` · ${n(`debug.security.info`,{count:String(c)})}`:``}.
                  ${n(`debug.security.runPrefix`)}
                  <span class="mono">openclaw security audit --deep</span>
                  ${n(`debug.security.runSuffix`)}
                </div>`:e}
            <pre class="code-block">${JSON.stringify(i.status??{},null,2)}</pre>
          </div>
          <div>
            <div class="muted">${n(`debug.health`)}</div>
            <pre class="code-block">${JSON.stringify(i.health??{},null,2)}</pre>
          </div>
          <div>
            <div class="muted">${n(`debug.lastHeartbeat`)}</div>
            <pre class="code-block">${JSON.stringify(i.heartbeat??{},null,2)}</pre>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">${n(`debug.manualRpcTitle`)}</div>
        <div class="card-sub">${n(`debug.manualRpcSubtitle`)}</div>
        <div class="stack" style="margin-top: 16px;">
          <label class="field">
            <span>${n(`debug.method`)}</span>
            <select
              .value=${i.callMethod}
              @change=${e=>i.onCallMethodChange(e.target.value)}
            >
              ${i.callMethod?e:t` <option value="" disabled>${n(`debug.selectMethod`)}</option> `}
              ${i.methods.map(e=>t`<option value=${e}>${e}</option>`)}
            </select>
          </label>
          <label class="field">
            <span>${n(`debug.paramsJson`)}</span>
            <textarea
              .value=${i.callParams}
              @input=${e=>i.onCallParamsChange(e.target.value)}
              rows="6"
            ></textarea>
          </label>
        </div>
        <div class="row" style="margin-top: 12px;">
          <button class="btn primary" @click=${i.onCall}>${n(`common.call`)}</button>
        </div>
        ${i.callError?t`<div class="callout danger" style="margin-top: 12px;">${i.callError}</div>`:e}
        ${i.callResult?t`<pre class="code-block" style="margin-top: 12px;">${i.callResult}</pre>`:e}
      </div>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card-title">${n(`debug.modelsTitle`)}</div>
      <div class="card-sub">${n(`debug.modelsSubtitle`)}</div>
      <pre class="code-block" style="margin-top: 12px;">
${JSON.stringify(i.models??[],null,2)}</pre
      >
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card-title">${n(`debug.eventLogTitle`)}</div>
      <div class="card-sub">${n(`debug.eventLogSubtitle`)}</div>
      ${i.eventLog.length===0?t` <div class="muted" style="margin-top: 12px">${n(`debug.noEvents`)}</div> `:t`
            <div class="list debug-event-log" style="margin-top: 12px;">
              ${i.eventLog.map(e=>t`
                  <div class="list-item debug-event-log__item">
                    <div class="list-main">
                      <div class="list-title">${e.event}</div>
                      <div class="list-sub">${new Date(e.ts).toLocaleTimeString()}</div>
                    </div>
                    <div class="list-meta debug-event-log__meta">
                      <pre class="code-block debug-event-log__payload">
${r(e.payload)}</pre
                      >
                    </div>
                  </div>
                `)}
            </div>
          `}
    </section>
  `}export{i as renderDebug};
//# sourceMappingURL=debug-CTBS8fG0.js.map