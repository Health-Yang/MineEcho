import{f as e,p as t}from"./lit-runtime-DA0-mbwP.js";import{o as n}from"./string-coerce-Cl_fl99y.js";import{C as r,S as i,U as a,W as o,c as s,l as c}from"./index-89Mm3xEP.js";import{n as l,t as u}from"./channel-config-extras-aRylKKxo.js";function d(e,t){let n=e;for(let e of t){if(!n)return null;let t=o(n);if(t===`object`){let t=n.properties??{};if(typeof e==`string`&&t[e]){n=t[e];continue}let r=n.additionalProperties;if(typeof e==`string`&&r&&typeof r==`object`){n=r;continue}return null}if(t===`array`){if(typeof e!=`number`)return null;n=(Array.isArray(n.items)?n.items[0]:n.items)??null;continue}return null}return n}function f(e,t){return l(e,t)??{}}var p=[`groupPolicy`,`streamMode`,`dmPolicy`];function m(e){let n=p.flatMap(t=>t in e?[[t,e[t]]]:[]);return n.length===0?null:t`
    <div class="status-list" style="margin-top: 12px;">
      ${n.map(([e,n])=>t`
          <div>
            <span class="label">${e}</span>
            <span>${u(n)}</span>
          </div>
        `)}
    </div>
  `}function h(e){let n=s(e.schema),r=n.schema;if(!r)return t` <div class="callout danger">Schema unavailable. Use Raw.</div> `;let i=d(r,[`channels`,e.channelId]);if(!i)return t` <div class="callout danger">Channel config schema unavailable.</div> `;let a=f(e.configValue??{},e.channelId);return t`
    <div class="config-form">
      ${c({schema:i,value:a,path:[`channels`,e.channelId],hints:e.uiHints,unsupported:new Set(n.unsupportedPaths),disabled:e.disabled,showLabel:!1,onPatch:e.onPatch})}
    </div>
    ${m(a)}
  `}function g(e){let{channelId:r,props:i}=e,a=i.configSaving||i.configSchemaLoading;return t`
    <div style="margin-top: 16px;">
      ${i.configSchemaLoading?t` <div class="muted">Loading config schema…</div> `:h({channelId:r,configValue:i.configForm,schema:i.configSchema,uiHints:i.configUiHints,disabled:a,onPatch:i.onConfigPatch})}
      <div class="row" style="margin-top: 12px;">
        <button
          class="btn primary"
          ?disabled=${a||!i.configFormDirty}
          @click=${()=>i.onConfigSave()}
        >
          ${i.configSaving?`Saving…`:`Save`}
        </button>
        <button class="btn" ?disabled=${a} @click=${()=>i.onConfigReload()}>
          ${n(`common.reload`)}
        </button>
      </div>
    </div>
  `}function _(e,t){return t.snapshot?.channels?.[e]}function v(e,t){let n=t.snapshot?.channelAccounts?.[e]??[],r=t.snapshot?.channelDefaultAccountId?.[e];return(r?n.find(e=>e.accountId===r):void 0)??n[0]??null}function y(e,t){let n=_(e,t),r=t.snapshot?.channelAccounts?.[e]??[],i=v(e,t);return{configured:typeof n?.configured==`boolean`?n.configured:typeof i?.configured==`boolean`?i.configured:null,running:typeof n?.running==`boolean`?n.running:null,connected:typeof n?.connected==`boolean`?n.connected:null,defaultAccount:i,hasAnyActiveAccount:r.some(e=>e.configured||e.running||e.connected),status:n}}function b(e,t){if(!t.snapshot)return!1;let n=y(e,t);return n.configured===!0||n.running===!0||n.connected===!0||n.hasAnyActiveAccount}function x(e,t){return y(e,t).configured}function S(e){return n(e==null?`common.na`:e?`common.yes`:`common.no`)}function C(n){return t`
    <div class="card">
      <div class="card-title">${n.title}</div>
      <div class="card-sub">${n.subtitle}</div>
      ${n.accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        ${n.statusRows.map(e=>t`
            <div>
              <span class="label">${e.label}</span>
              <span>${e.value}</span>
            </div>
          `)}
      </div>

      ${n.lastError?t`<div class="callout danger" style="margin-top: 12px;">${n.lastError}</div>`:e}
      ${n.secondaryCallout??e} ${n.extraContent??e}
      ${n.configSection} ${n.footer??e}
    </div>
  `}function w(e,t){return t?.[e]?.length??0}function T(n,r){let i=w(n,r);return i<2?e:t`<div class="account-count">Accounts (${i})</div>`}function E(r){let{props:a,discord:o,accountCountLabel:s}=r,c=x(`discord`,a);return C({title:`Discord`,subtitle:`Bot status and channel configuration.`,accountCountLabel:s,statusRows:[{label:n(`common.configured`),value:S(c)},{label:n(`common.running`),value:o?.running?n(`common.yes`):n(`common.no`)},{label:n(`common.lastStart`),value:o?.lastStartAt?i(o.lastStartAt):n(`common.na`)},{label:n(`common.lastProbe`),value:o?.lastProbeAt?i(o.lastProbeAt):n(`common.na`)}],lastError:o?.lastError,secondaryCallout:o?.probe?t`<div class="callout" style="margin-top: 12px;">
          ${o.probe.ok?n(`common.probeOk`):n(`common.probeFailed`)} ·
          ${o.probe.status??``} ${o.probe.error??``}
        </div>`:e,configSection:g({channelId:`discord`,props:a}),footer:t`<div class="row" style="margin-top: 12px;">
      <button class="btn" @click=${()=>a.onRefresh(!0)}>${n(`common.probe`)}</button>
    </div>`})}function D(r){let{props:a,googleChat:o,accountCountLabel:s}=r,c=x(`googlechat`,a);return C({title:`Google Chat`,subtitle:`Chat API webhook status and channel configuration.`,accountCountLabel:s,statusRows:[{label:n(`common.configured`),value:S(c)},{label:n(`common.running`),value:o?o.running?n(`common.yes`):n(`common.no`):n(`common.na`)},{label:n(`common.credential`),value:o?.credentialSource??n(`common.na`)},{label:n(`common.audience`),value:o?.audienceType?`${o.audienceType}${o.audience?` · ${o.audience}`:``}`:n(`common.na`)},{label:n(`common.lastStart`),value:o?.lastStartAt?i(o.lastStartAt):n(`common.na`)},{label:n(`common.lastProbe`),value:o?.lastProbeAt?i(o.lastProbeAt):n(`common.na`)}],lastError:o?.lastError,secondaryCallout:o?.probe?t`<div class="callout" style="margin-top: 12px;">
          ${o.probe.ok?n(`common.probeOk`):n(`common.probeFailed`)} ·
          ${o.probe.status??``} ${o.probe.error??``}
        </div>`:e,configSection:g({channelId:`googlechat`,props:a}),footer:t`<div class="row" style="margin-top: 12px;">
      <button class="btn" @click=${()=>a.onRefresh(!0)}>${n(`common.probe`)}</button>
    </div>`})}function O(r){let{props:a,imessage:o,accountCountLabel:s}=r,c=x(`imessage`,a);return C({title:`iMessage`,subtitle:`macOS bridge status and channel configuration.`,accountCountLabel:s,statusRows:[{label:n(`common.configured`),value:S(c)},{label:n(`common.running`),value:o?.running?n(`common.yes`):n(`common.no`)},{label:n(`common.lastStart`),value:o?.lastStartAt?i(o.lastStartAt):n(`common.na`)},{label:n(`common.lastProbe`),value:o?.lastProbeAt?i(o.lastProbeAt):n(`common.na`)}],lastError:o?.lastError,secondaryCallout:o?.probe?t`<div class="callout" style="margin-top: 12px;">
          ${o.probe.ok?n(`common.probeOk`):n(`common.probeFailed`)} ·
          ${o.probe.error??``}
        </div>`:e,configSection:g({channelId:`imessage`,props:a}),footer:t`<div class="row" style="margin-top: 12px;">
      <button class="btn" @click=${()=>a.onRefresh(!0)}>${n(`common.probe`)}</button>
    </div>`})}function k(e){return e?e.length<=20?e:`${e.slice(0,8)}...${e.slice(-8)}`:n(`common.na`)}function A(r){let{props:o,nostr:s,nostrAccounts:c,accountCountLabel:l,profileFormState:u,profileFormCallbacks:d,onEditProfile:f}=r,p=c[0],m=s?.configured??p?.configured??!1,h=s?.running??p?.running??!1,_=s?.publicKey??p?.publicKey,v=s?.lastStartAt??p?.lastStartAt??null,y=s?.lastError??p?.lastError??null,b=c.length>1,x=u!=null,S=r=>{let a=r.publicKey,o=r.profile;return t`
      <div class="account-card">
        <div class="account-card-header">
          <div class="account-card-title">${o?.displayName??o?.name??r.name??r.accountId}</div>
          <div class="account-card-id">${r.accountId}</div>
        </div>
        <div class="status-list account-card-status">
          <div>
            <span class="label">${n(`common.running`)}</span>
            <span>${r.running?n(`common.yes`):n(`common.no`)}</span>
          </div>
          <div>
            <span class="label">${n(`common.configured`)}</span>
            <span>${r.configured?n(`common.yes`):n(`common.no`)}</span>
          </div>
          <div>
            <span class="label">${n(`common.publicKey`)}</span>
            <span class="monospace" title="${a??``}">${k(a)}</span>
          </div>
          <div>
            <span class="label">${n(`common.lastInbound`)}</span>
            <span
              >${r.lastInboundAt?i(r.lastInboundAt):n(`common.na`)}</span
            >
          </div>
          ${r.lastError?t` <div class="account-card-error">${r.lastError}</div> `:e}
        </div>
      </div>
    `};return t`
    <div class="card">
      <div class="card-title">Nostr</div>
      <div class="card-sub">Decentralized DMs via Nostr relays (NIP-04).</div>
      ${l}
      ${b?t`
            <div class="account-card-list">
              ${c.map(e=>S(e))}
            </div>
          `:t`
            <div class="status-list" style="margin-top: 16px;">
              <div>
                <span class="label">${n(`common.configured`)}</span>
                <span>${n(m?`common.yes`:`common.no`)}</span>
              </div>
              <div>
                <span class="label">${n(`common.running`)}</span>
                <span>${n(h?`common.yes`:`common.no`)}</span>
              </div>
              <div>
                <span class="label">${n(`common.publicKey`)}</span>
                <span class="monospace" title="${_??``}"
                  >${k(_)}</span
                >
              </div>
              <div>
                <span class="label">${n(`common.lastStart`)}</span>
                <span>
                  ${v?i(v):n(`common.na`)}
                </span>
              </div>
            </div>
          `}
      ${y?t`<div class="callout danger" style="margin-top: 12px;">${y}</div>`:e}
      ${(()=>{if(x&&d)return a({state:u,callbacks:d,accountId:c[0]?.accountId??`default`});let{name:r,displayName:i,about:o,picture:l,nip05:h}=p?.profile??s?.profile??{},g=r||i||o||l||h;return t`
      <div
        style="margin-top: 16px; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md);"
      >
        <div
          style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;"
        >
          <div style="font-weight: 500;">${n(`channels.nostr.profile`)}</div>
          ${m?t`
                <button
                  class="btn btn--sm"
                  @click=${f}
                  style="font-size: 12px; padding: 4px 8px;"
                >
                  ${n(`channels.nostr.editProfile`)}
                </button>
              `:e}
        </div>
        ${g?t`
              <div class="status-list">
                ${l?t`
                      <div style="margin-bottom: 8px;">
                        <img
                          src=${l}
                          alt=${n(`channels.nostr.profilePicture`)}
                          style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);"
                          @error=${e=>{e.target.style.display=`none`}}
                        />
                      </div>
                    `:e}
                ${r?t`<div>
                      <span class="label">${n(`channels.nostr.name`)}</span><span>${r}</span>
                    </div>`:e}
                ${i?t`<div>
                      <span class="label">${n(`channels.nostr.displayName`)}</span
                      ><span>${i}</span>
                    </div>`:e}
                ${o?t`<div>
                      <span class="label">${n(`channels.nostr.about`)}</span
                      ><span style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;"
                        >${o}</span
                      >
                    </div>`:e}
                ${h?t`<div><span class="label">NIP-05</span><span>${h}</span></div>`:e}
              </div>
            `:t`
              <div style="color: var(--text-muted); font-size: 13px">
                ${n(`channels.nostr.noProfile`)} ${n(`channels.nostr.noProfileHint`)}
              </div>
            `}
      </div>
    `})()} ${g({channelId:`nostr`,props:o})}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${()=>o.onRefresh(!1)}>${n(`common.refresh`)}</button>
      </div>
    </div>
  `}function j(r){let{props:a,signal:o,accountCountLabel:s}=r,c=x(`signal`,a);return C({title:`Signal`,subtitle:`signal-cli status and channel configuration.`,accountCountLabel:s,statusRows:[{label:n(`common.configured`),value:S(c)},{label:n(`common.running`),value:o?.running?n(`common.yes`):n(`common.no`)},{label:n(`common.baseUrl`),value:o?.baseUrl??n(`common.na`)},{label:n(`common.lastStart`),value:o?.lastStartAt?i(o.lastStartAt):n(`common.na`)},{label:n(`common.lastProbe`),value:o?.lastProbeAt?i(o.lastProbeAt):n(`common.na`)}],lastError:o?.lastError,secondaryCallout:o?.probe?t`<div class="callout" style="margin-top: 12px;">
          ${o.probe.ok?n(`common.probeOk`):n(`common.probeFailed`)} ·
          ${o.probe.status??``} ${o.probe.error??``}
        </div>`:e,configSection:g({channelId:`signal`,props:a}),footer:t`<div class="row" style="margin-top: 12px;">
      <button class="btn" @click=${()=>a.onRefresh(!0)}>${n(`common.probe`)}</button>
    </div>`})}function M(r){let{props:a,slack:o,accountCountLabel:s}=r,c=x(`slack`,a);return C({title:`Slack`,subtitle:`Socket mode status and channel configuration.`,accountCountLabel:s,statusRows:[{label:n(`common.configured`),value:S(c)},{label:n(`common.running`),value:o?.running?n(`common.yes`):n(`common.no`)},{label:n(`common.lastStart`),value:o?.lastStartAt?i(o.lastStartAt):n(`common.na`)},{label:n(`common.lastProbe`),value:o?.lastProbeAt?i(o.lastProbeAt):n(`common.na`)}],lastError:o?.lastError,secondaryCallout:o?.probe?t`<div class="callout" style="margin-top: 12px;">
          ${o.probe.ok?n(`common.probeOk`):n(`common.probeFailed`)} ·
          ${o.probe.status??``} ${o.probe.error??``}
        </div>`:e,configSection:g({channelId:`slack`,props:a}),footer:t`<div class="row" style="margin-top: 12px;">
      <button class="btn" @click=${()=>a.onRefresh(!0)}>${n(`common.probe`)}</button>
    </div>`})}function N(r){let{props:a,telegram:o,telegramAccounts:s,accountCountLabel:c}=r,l=s.length>1,u=x(`telegram`,a),d=r=>{let a=r.probe?.bot?.username,o=r.name||r.accountId;return t`
      <div class="account-card">
        <div class="account-card-header">
          <div class="account-card-title">${a?`@${a}`:o}</div>
          <div class="account-card-id">${r.accountId}</div>
        </div>
        <div class="status-list account-card-status">
          <div>
            <span class="label">${n(`common.running`)}</span>
            <span>${r.running?n(`common.yes`):n(`common.no`)}</span>
          </div>
          <div>
            <span class="label">${n(`common.configured`)}</span>
            <span>${r.configured?n(`common.yes`):n(`common.no`)}</span>
          </div>
          <div>
            <span class="label">${n(`common.lastInbound`)}</span>
            <span
              >${r.lastInboundAt?i(r.lastInboundAt):n(`common.na`)}</span
            >
          </div>
          ${r.lastError?t` <div class="account-card-error">${r.lastError}</div> `:e}
        </div>
      </div>
    `};return l?t`
      <div class="card">
        <div class="card-title">Telegram</div>
        <div class="card-sub">Bot status and channel configuration.</div>
        ${c}

        <div class="account-card-list">
          ${s.map(e=>d(e))}
        </div>

        ${o?.lastError?t`<div class="callout danger" style="margin-top: 12px;">${o.lastError}</div>`:e}
        ${o?.probe?t`<div class="callout" style="margin-top: 12px;">
              ${o.probe.ok?n(`common.probeOk`):n(`common.probeFailed`)} ·
              ${o.probe.status??``} ${o.probe.error??``}
            </div>`:e}
        ${g({channelId:`telegram`,props:a})}

        <div class="row" style="margin-top: 12px;">
          <button class="btn" @click=${()=>a.onRefresh(!0)}>${n(`common.probe`)}</button>
        </div>
      </div>
    `:C({title:`Telegram`,subtitle:`Bot status and channel configuration.`,accountCountLabel:c,statusRows:[{label:n(`common.configured`),value:S(u)},{label:n(`common.running`),value:o?.running?n(`common.yes`):n(`common.no`)},{label:n(`common.mode`),value:o?.mode??n(`common.na`)},{label:n(`common.lastStart`),value:o?.lastStartAt?i(o.lastStartAt):n(`common.na`)},{label:n(`common.lastProbe`),value:o?.lastProbeAt?i(o.lastProbeAt):n(`common.na`)}],lastError:o?.lastError,secondaryCallout:o?.probe?t`<div class="callout" style="margin-top: 12px;">
          ${o.probe.ok?n(`common.probeOk`):n(`common.probeFailed`)} ·
          ${o.probe.status??``} ${o.probe.error??``}
        </div>`:e,configSection:g({channelId:`telegram`,props:a}),footer:t`<div class="row" style="margin-top: 12px;">
      <button class="btn" @click=${()=>a.onRefresh(!0)}>${n(`common.probe`)}</button>
    </div>`})}function P(a){let{props:o,whatsapp:s,accountCountLabel:c}=a,l=x(`whatsapp`,o),u=s?.linked===!0,d=o.whatsappQrDataUrl!=null;return C({title:`WhatsApp`,subtitle:`Link WhatsApp Web and monitor connection health.`,accountCountLabel:c,statusRows:[{label:n(`common.configured`),value:S(l)},{label:n(`common.linked`),value:s?.linked?n(`common.yes`):n(`common.no`)},{label:n(`common.running`),value:s?.running?n(`common.yes`):n(`common.no`)},{label:n(`common.connected`),value:s?.connected?n(`common.yes`):n(`common.no`)},{label:n(`common.lastConnect`),value:s?.lastConnectedAt?i(s.lastConnectedAt):n(`common.na`)},{label:n(`common.lastMessage`),value:s?.lastMessageAt?i(s.lastMessageAt):n(`common.na`)},{label:n(`common.authAge`),value:s?.authAgeMs==null?n(`common.na`):r(s.authAgeMs)}],lastError:s?.lastError,extraContent:t`
      ${o.whatsappMessage?t`<div class="callout" style="margin-top: 12px;">${o.whatsappMessage}</div>`:e}
      ${o.whatsappQrDataUrl?t`<div class="qr-wrap">
            <img src=${o.whatsappQrDataUrl} alt="WhatsApp QR" />
          </div>`:e}
    `,configSection:g({channelId:`whatsapp`,props:o}),footer:t`<div class="row" style="margin-top: 14px; flex-wrap: wrap;">
      ${u?t`<button
            class="btn"
            ?disabled=${o.whatsappBusy}
            @click=${()=>o.onWhatsAppStart(!0)}
          >
            ${n(`common.relink`)}
          </button>`:t`<button
            class="btn primary"
            ?disabled=${o.whatsappBusy}
            @click=${()=>o.onWhatsAppStart(!1)}
          >
            ${o.whatsappBusy?n(`common.working`):n(`common.showQr`)}
          </button>`}
      ${d?t`<button
            class="btn"
            ?disabled=${o.whatsappBusy}
            @click=${()=>o.onWhatsAppWait()}
          >
            ${n(`common.waitForScan`)}
          </button>`:e}
      <button
        class="btn danger"
        ?disabled=${o.whatsappBusy}
        @click=${()=>o.onWhatsAppLogout()}
      >
        ${n(`common.logout`)}
      </button>
      <button class="btn" @click=${()=>o.onRefresh(!0)}>${n(`common.refresh`)}</button>
    </div>`})}function F(r){let a=r.snapshot?.channels,o=a?.whatsapp??void 0,s=a?.telegram??void 0,c=a?.discord??null,l=a?.googlechat??null,u=a?.slack??null,d=a?.signal??null,f=a?.imessage??null,p=a?.nostr??null,m=I(r.snapshot).map((e,t)=>({key:e,enabled:b(e,r),order:t})).toSorted((e,t)=>e.enabled===t.enabled?e.order-t.order:e.enabled?-1:1),h=!!(r.loading&&r.snapshot&&r.lastSuccessAt),g=r.snapshot?.warnings?.filter(e=>e.trim())??[];return t`
    <section class="grid grid-cols-2">
      ${m.map(e=>L(e.key,r,{whatsapp:o,telegram:s,discord:c,googlechat:l,slack:u,signal:d,imessage:f,nostr:p,channelAccounts:r.snapshot?.channelAccounts??null}))}
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">${n(`channels.health.title`)}</div>
          <div class="card-sub">${n(`channels.health.subtitle`)}</div>
        </div>
        <div class="muted">
          ${r.lastSuccessAt?i(r.lastSuccessAt):n(`common.na`)}
        </div>
      </div>
      ${h?t`
            <div class="callout info" style="margin-top: 12px;">
              Refreshing channel status in the background; showing the last successful snapshot.
            </div>
          `:e}
      ${r.snapshot?.partial?t`
            <div class="callout warn" style="margin-top: 12px;">
              Some channel checks did not finish before the UI budget.
              ${g.length>0?g.slice(0,3).join(`; `):``}
            </div>
          `:e}
      ${r.lastError?t`<div class="callout danger" style="margin-top: 12px;">${r.lastError}</div>`:e}
      <pre class="code-block" style="margin-top: 12px;">
${r.snapshot?JSON.stringify(r.snapshot,null,2):n(`channels.health.noSnapshotYet`)}
      </pre
      >
    </section>
  `}function I(e){return e?.channelMeta?.length?e.channelMeta.map(e=>e.id):e?.channelOrder?.length?e.channelOrder:[`whatsapp`,`telegram`,`discord`,`googlechat`,`slack`,`signal`,`imessage`,`nostr`]}function L(e,t,n){let r=T(e,n.channelAccounts);switch(e){case`whatsapp`:return P({props:t,whatsapp:n.whatsapp,accountCountLabel:r});case`telegram`:return N({props:t,telegram:n.telegram,telegramAccounts:n.channelAccounts?.telegram??[],accountCountLabel:r});case`discord`:return E({props:t,discord:n.discord,accountCountLabel:r});case`googlechat`:return D({props:t,googleChat:n.googlechat,accountCountLabel:r});case`slack`:return M({props:t,slack:n.slack,accountCountLabel:r});case`signal`:return j({props:t,signal:n.signal,accountCountLabel:r});case`imessage`:return O({props:t,imessage:n.imessage,accountCountLabel:r});case`nostr`:{let e=n.channelAccounts?.nostr??[],i=e[0],a=i?.accountId??`default`,o=i?.profile??null,s=t.nostrProfileAccountId===a?t.nostrProfileFormState:null,c=s?{onFieldChange:t.onNostrProfileFieldChange,onSave:t.onNostrProfileSave,onImport:t.onNostrProfileImport,onCancel:t.onNostrProfileCancel,onToggleAdvanced:t.onNostrProfileToggleAdvanced}:null;return A({props:t,nostr:n.nostr,nostrAccounts:e,accountCountLabel:r,profileFormState:s,profileFormCallbacks:c,onEditProfile:()=>t.onNostrProfileEdit(a,o)})}default:return R(e,t,n.channelAccounts??{})}}function R(r,i,a){let o=B(i.snapshot,r),s=y(r,i),c=typeof s.status?.lastError==`string`?s.status.lastError:void 0,l=a[r]??[],u=T(r,a);return t`
    <div class="card">
      <div class="card-title">${o}</div>
      <div class="card-sub">${n(`channels.generic.subtitle`)}</div>
      ${u}
      ${l.length>0?t`
            <div class="account-card-list">
              ${l.map(e=>G(e))}
            </div>
          `:t`
            <div class="status-list" style="margin-top: 16px;">
              <div>
                <span class="label">${n(`common.configured`)}</span>
                <span>${S(s.configured)}</span>
              </div>
              <div>
                <span class="label">${n(`common.running`)}</span>
                <span>${S(s.running)}</span>
              </div>
              <div>
                <span class="label">${n(`common.connected`)}</span>
                <span>${S(s.connected)}</span>
              </div>
            </div>
          `}
      ${c?t`<div class="callout danger" style="margin-top: 12px;">${c}</div>`:e}
      ${g({channelId:r,props:i})}
    </div>
  `}function z(e){return e?.channelMeta?.length?Object.fromEntries(e.channelMeta.map(e=>[e.id,e])):{}}function B(e,t){return z(e)[t]?.label??e?.channelLabels?.[t]??t}var V=600*1e3;function H(e){return e.lastInboundAt?Date.now()-e.lastInboundAt<V:!1}function U(e){return e.running?n(`common.yes`):H(e)?n(`common.active`):n(`common.no`)}function W(e){return e.connected===!0?n(`common.yes`):e.connected===!1?n(`common.no`):H(e)?n(`common.active`):n(`common.na`)}function G(r){let a=U(r),o=W(r);return t`
    <div class="account-card">
      <div class="account-card-header">
        <div class="account-card-title">${r.name||r.accountId}</div>
        <div class="account-card-id">${r.accountId}</div>
      </div>
      <div class="status-list account-card-status">
        <div>
          <span class="label">${n(`common.running`)}</span>
          <span>${a}</span>
        </div>
        <div>
          <span class="label">${n(`common.configured`)}</span>
          <span>${r.configured?n(`common.yes`):n(`common.no`)}</span>
        </div>
        <div>
          <span class="label">${n(`common.connected`)}</span>
          <span>${o}</span>
        </div>
        <div>
          <span class="label">${n(`common.lastInbound`)}</span>
          <span
            >${r.lastInboundAt?i(r.lastInboundAt):n(`common.na`)}</span
          >
        </div>
        ${r.lastError?t` <div class="account-card-error">${r.lastError}</div> `:e}
      </div>
    </div>
  `}export{F as renderChannels};
//# sourceMappingURL=channels-DLznpXsV.js.map