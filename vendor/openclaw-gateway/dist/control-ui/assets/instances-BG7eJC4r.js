import{f as e,p as t}from"./lit-runtime-DA0-mbwP.js";import{o as n}from"./string-coerce-Cl_fl99y.js";import{h as r,o as i}from"./index-89Mm3xEP.js";var a=!1;function o(i){let o=!a;return t`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">${n(`instances.title`)}</div>
          <div class="card-sub">${n(`instances.subtitle`)}</div>
        </div>
        <div class="row" style="gap: 8px;">
          <button
            class="btn btn--icon ${o?``:`active`}"
            @click=${()=>{a=!a,i.onRefresh()}}
            title=${n(o?`instances.showHosts`:`instances.hideHosts`)}
            aria-label=${n(`instances.toggleHostVisibility`)}
            aria-pressed=${!o}
            style="width: 36px; height: 36px;"
          >
            ${o?r.eyeOff:r.eye}
          </button>
          <button class="btn" ?disabled=${i.loading} @click=${i.onRefresh}>
            ${i.loading?n(`common.loading`):n(`common.refresh`)}
          </button>
        </div>
      </div>
      ${i.lastError?t`<div class="callout danger" style="margin-top: 12px;">${i.lastError}</div>`:e}
      ${i.statusMessage?t`<div class="callout" style="margin-top: 12px;">${i.statusMessage}</div>`:e}
      <div class="list" style="margin-top: 16px;">
        ${i.entries.length===0?t` <div class="muted">${n(`instances.noInstances`)}</div> `:i.entries.map(e=>s(e,o))}
      </div>
    </section>
  `}function s(r,a){let o=r.lastInputSeconds==null?n(`common.na`):n(`common.secondsAgo`,{count:String(r.lastInputSeconds)}),s=r.mode??`unknown`,c=r.host??`unknown host`,l=r.ip??null,u=Array.isArray(r.roles)?r.roles.filter(Boolean):[],d=Array.isArray(r.scopes)?r.scopes.filter(Boolean):[],f=d.length>0?d.length>3?`${d.length} scopes`:`scopes: ${d.join(`, `)}`:null;return t`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">
          <span class="${a?`redacted`:``}">${c}</span>
        </div>
        <div class="list-sub">
          ${l?t`<span class="${a?`redacted`:``}">${l}</span> `:e}${s}
          ${r.version??``}
        </div>
        <div class="chip-row">
          <span class="chip">${s}</span>
          ${u.map(e=>t`<span class="chip">${e}</span>`)}
          ${f?t`<span class="chip">${f}</span>`:e}
          ${r.platform?t`<span class="chip">${r.platform}</span>`:e}
          ${r.deviceFamily?t`<span class="chip">${r.deviceFamily}</span>`:e}
          ${r.modelIdentifier?t`<span class="chip">${r.modelIdentifier}</span>`:e}
          ${r.version?t`<span class="chip">${r.version}</span>`:e}
        </div>
      </div>
      <div class="list-meta">
        <div>${i(r)}</div>
        <div class="muted">${n(`instances.lastInput`,{time:o})}</div>
        <div class="muted">${n(`instances.reason`,{reason:r.reason??``})}</div>
      </div>
    </div>
  `}export{o as renderInstances};
//# sourceMappingURL=instances-BG7eJC4r.js.map