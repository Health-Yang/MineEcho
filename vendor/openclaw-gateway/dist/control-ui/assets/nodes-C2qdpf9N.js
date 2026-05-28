import{f as e,p as t}from"./lit-runtime-DA0-mbwP.js";import{o as n,r}from"./string-coerce-Cl_fl99y.js";import{G as i,S as a,v as o,y as s}from"./index-89Mm3xEP.js";function c(...e){let t=new Set;for(let n of e){if(!n)continue;if(Array.isArray(n)){for(let e of n){let n=e.trim();n&&t.add(n)}continue}let e=n.trim();e&&t.add(e)}return[...t].toSorted()}function l(e,t){let n=new Set(e);return t.every(e=>n.has(e))}function u(e){return{roles:c(e.roles,e.role),scopes:i(e.scopes)}}function d(e){let t=c(e.roles,e.role),n=Array.isArray(e.tokens)?e.tokens:e.tokens?Object.values(e.tokens):void 0;return{roles:n===void 0?t:c(n.filter(e=>!e.revokedAtMs).flatMap(e=>e.role??[])).filter(e=>t.includes(e)),scopes:i(e.scopes)}}function f(e,t){let n=u(e),r=t?d(t):null;return r?l(r.roles,n.roles)?l(r.scopes,n.scopes)?{kind:`re-approval`,requested:n,approved:r}:{kind:`scope-upgrade`,requested:n,approved:r}:{kind:`role-upgrade`,requested:n,approved:r}:{kind:`new-pairing`,requested:n,approved:null}}function p(e){let t=e?.agents??{},n=Array.isArray(t.list)?t.list:[],i=[];return n.forEach((e,t)=>{if(!e||typeof e!=`object`)return;let n=e,a=r(n.id)??``;if(!a)return;let o=r(n.name),s=n.default===!0;i.push({id:a,name:o,isDefault:s,index:t,record:n})}),i}function m(e,t){let n=new Set(t),i=[];for(let t of e){if(!(Array.isArray(t.commands)?t.commands:[]).some(e=>n.has(String(e))))continue;let e=r(t.nodeId)??``;if(!e)continue;let a=r(t.displayName)??e;i.push({id:e,label:a===e?e:`${a} · ${e}`})}return i.sort((e,t)=>e.label.localeCompare(t.label)),i}var h=`__defaults__`,g=[{value:`deny`,label:`Deny`},{value:`allowlist`,label:`Allowlist`},{value:`full`,label:`Full`}],_=[{value:`off`,label:`Off`},{value:`on-miss`,label:`On miss`},{value:`always`,label:`Always`}];function v(e){return e===`allowlist`||e===`full`||e===`deny`?e:`deny`}function y(e){return e===`always`||e===`off`||e===`on-miss`?e:`on-miss`}function b(e){let t=e?.defaults??{};return{security:v(t.security),ask:y(t.ask),askFallback:v(t.askFallback??`deny`),autoAllowSkills:t.autoAllowSkills??!1}}function x(e){return p(e).map(e=>({id:e.id,name:e.name,isDefault:e.isDefault}))}function S(e,t){let n=x(e),r=Object.keys(t?.agents??{}),i=new Map;n.forEach(e=>i.set(e.id,e)),r.forEach(e=>{i.has(e)||i.set(e,{id:e})});let a=Array.from(i.values());return a.length===0&&a.push({id:`main`,isDefault:!0}),a.sort((e,t)=>{if(e.isDefault&&!t.isDefault)return-1;if(!e.isDefault&&t.isDefault)return 1;let n=e.name?.trim()?e.name:e.id,r=t.name?.trim()?t.name:t.id;return n.localeCompare(r)}),a}function C(e,t){return e===h?h:e&&t.some(t=>t.id===e)?e:h}function w(e){let t=e.execApprovalsForm??e.execApprovalsSnapshot?.file??null,n=!!t,r=b(t),i=S(e.configForm,t),a=j(e.nodes),o=e.execApprovalsTarget,s=o===`node`&&e.execApprovalsTargetNodeId?e.execApprovalsTargetNodeId:null;o===`node`&&s&&!a.some(e=>e.id===s)&&(s=null);let c=C(e.execApprovalsSelectedAgent,i),l=c===h?null:(t?.agents??{})[c]??null,u=Array.isArray(l?.allowlist)?l.allowlist??[]:[];return{ready:n,disabled:e.execApprovalsSaving||e.execApprovalsLoading,dirty:e.execApprovalsDirty,loading:e.execApprovalsLoading,saving:e.execApprovalsSaving,form:t,defaults:r,selectedScope:c,selectedAgent:l,agents:i,allowlist:u,target:o,targetNodeId:s,targetNodes:a,onSelectScope:e.onExecApprovalsSelectAgent,onSelectTarget:e.onExecApprovalsTargetChange,onPatch:e.onExecApprovalsPatch,onRemove:e.onExecApprovalsRemove,onLoad:e.onLoadExecApprovals,onSave:e.onSaveExecApprovals}}function T(r){let i=r.ready,a=r.target!==`node`||!!r.targetNodeId;return t`
    <section class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <div>
          <div class="card-title">Exec approvals</div>
          <div class="card-sub">
            Allowlist and approval policy for <span class="mono">exec host=gateway/node</span>.
          </div>
        </div>
        <button
          class="btn"
          ?disabled=${r.disabled||!r.dirty||!a}
          @click=${r.onSave}
        >
          ${r.saving?`Saving…`:`Save`}
        </button>
      </div>

      ${E(r)}
      ${i?t`
            ${D(r)} ${O(r)}
            ${r.selectedScope===h?e:k(r)}
          `:t`<div class="row" style="margin-top: 12px; gap: 12px;">
            <div class="muted">Load exec approvals to edit allowlists.</div>
            <button class="btn" ?disabled=${r.loading||!a} @click=${r.onLoad}>
              ${r.loading?n(`common.loading`):n(`common.loadApprovals`)}
            </button>
          </div>`}
    </section>
  `}function E(n){let r=n.targetNodes.length>0,i=n.targetNodeId??``;return t`
    <div class="list" style="margin-top: 12px;">
      <div class="list-item">
        <div class="list-main">
          <div class="list-title">Target</div>
          <div class="list-sub">Gateway edits local approvals; node edits the selected node.</div>
        </div>
        <div class="list-meta">
          <label class="field">
            <span>Host</span>
            <select
              ?disabled=${n.disabled}
              @change=${e=>{if(e.target.value===`node`){let e=n.targetNodes[0]?.id??null;n.onSelectTarget(`node`,i||e)}else n.onSelectTarget(`gateway`,null)}}
            >
              <option value="gateway" ?selected=${n.target===`gateway`}>Gateway</option>
              <option value="node" ?selected=${n.target===`node`}>Node</option>
            </select>
          </label>
          ${n.target===`node`?t`
                <label class="field">
                  <span>Node</span>
                  <select
                    ?disabled=${n.disabled||!r}
                    @change=${e=>{let t=e.target.value.trim();n.onSelectTarget(`node`,t||null)}}
                  >
                    <option value="" ?selected=${i===``}>Select node</option>
                    ${n.targetNodes.map(e=>t`<option value=${e.id} ?selected=${i===e.id}>
                          ${e.label}
                        </option>`)}
                  </select>
                </label>
              `:e}
        </div>
      </div>
      ${n.target===`node`&&!r?t` <div class="muted">No nodes advertise exec approvals yet.</div> `:e}
    </div>
  `}function D(e){return t`
    <div class="row" style="margin-top: 12px; gap: 8px; flex-wrap: wrap;">
      <span class="label">Scope</span>
      <div class="row" style="gap: 8px; flex-wrap: wrap;">
        <button
          class="btn btn--sm ${e.selectedScope===h?`active`:``}"
          @click=${()=>e.onSelectScope(h)}
        >
          Defaults
        </button>
        ${e.agents.map(n=>{let r=n.name?.trim()?`${n.name} (${n.id})`:n.id;return t`
            <button
              class="btn btn--sm ${e.selectedScope===n.id?`active`:``}"
              @click=${()=>e.onSelectScope(n.id)}
            >
              ${r}
            </button>
          `})}
      </div>
    </div>
  `}function O(n){let r=n.selectedScope===h,i=n.defaults,a=n.selectedAgent??{},o=r?[`defaults`]:[`agents`,n.selectedScope],s=typeof a.security==`string`?a.security:void 0,c=typeof a.ask==`string`?a.ask:void 0,l=typeof a.askFallback==`string`?a.askFallback:void 0,u=r?i.security:s??`__default__`,d=r?i.ask:c??`__default__`,f=r?i.askFallback:l??`__default__`,p=typeof a.autoAllowSkills==`boolean`?a.autoAllowSkills:void 0,m=p??i.autoAllowSkills,v=p==null;return t`
    <div class="list" style="margin-top: 16px;">
      <div class="list-item">
        <div class="list-main">
          <div class="list-title">Security</div>
          <div class="list-sub">
            ${r?`Default security mode.`:`Default: ${i.security}.`}
          </div>
        </div>
        <div class="list-meta">
          <label class="field">
            <span>Mode</span>
            <select
              ?disabled=${n.disabled}
              @change=${e=>{let t=e.target.value;!r&&t===`__default__`?n.onRemove([...o,`security`]):n.onPatch([...o,`security`],t)}}
            >
              ${r?e:t`<option value="__default__" ?selected=${u===`__default__`}>
                    Use default (${i.security})
                  </option>`}
              ${g.map(e=>t`<option value=${e.value} ?selected=${u===e.value}>
                    ${e.label}
                  </option>`)}
            </select>
          </label>
        </div>
      </div>

      <div class="list-item">
        <div class="list-main">
          <div class="list-title">Ask</div>
          <div class="list-sub">
            ${r?`Default prompt policy.`:`Default: ${i.ask}.`}
          </div>
        </div>
        <div class="list-meta">
          <label class="field">
            <span>Mode</span>
            <select
              ?disabled=${n.disabled}
              @change=${e=>{let t=e.target.value;!r&&t===`__default__`?n.onRemove([...o,`ask`]):n.onPatch([...o,`ask`],t)}}
            >
              ${r?e:t`<option value="__default__" ?selected=${d===`__default__`}>
                    Use default (${i.ask})
                  </option>`}
              ${_.map(e=>t`<option value=${e.value} ?selected=${d===e.value}>
                    ${e.label}
                  </option>`)}
            </select>
          </label>
        </div>
      </div>

      <div class="list-item">
        <div class="list-main">
          <div class="list-title">Ask fallback</div>
          <div class="list-sub">
            ${r?`Applied when the UI prompt is unavailable.`:`Default: ${i.askFallback}.`}
          </div>
        </div>
        <div class="list-meta">
          <label class="field">
            <span>Fallback</span>
            <select
              ?disabled=${n.disabled}
              @change=${e=>{let t=e.target.value;!r&&t===`__default__`?n.onRemove([...o,`askFallback`]):n.onPatch([...o,`askFallback`],t)}}
            >
              ${r?e:t`<option value="__default__" ?selected=${f===`__default__`}>
                    Use default (${i.askFallback})
                  </option>`}
              ${g.map(e=>t`<option value=${e.value} ?selected=${f===e.value}>
                    ${e.label}
                  </option>`)}
            </select>
          </label>
        </div>
      </div>

      <div class="list-item">
        <div class="list-main">
          <div class="list-title">Auto-allow skill CLIs</div>
          <div class="list-sub">
            ${r?`Allow skill executables listed by the Gateway.`:v?`Using default (${i.autoAllowSkills?`on`:`off`}).`:`Override (${m?`on`:`off`}).`}
          </div>
        </div>
        <div class="list-meta">
          <label class="field">
            <span>Enabled</span>
            <input
              type="checkbox"
              ?disabled=${n.disabled}
              .checked=${m}
              @change=${e=>{let t=e.target;n.onPatch([...o,`autoAllowSkills`],t.checked)}}
            />
          </label>
          ${!r&&!v?t`<button
                class="btn btn--sm"
                ?disabled=${n.disabled}
                @click=${()=>n.onRemove([...o,`autoAllowSkills`])}
              >
                Use default
              </button>`:e}
        </div>
      </div>
    </div>
  `}function k(e){let n=[`agents`,e.selectedScope,`allowlist`],r=e.allowlist;return t`
    <div class="row" style="margin-top: 18px; justify-content: space-between;">
      <div>
        <div class="card-title">Allowlist</div>
        <div class="card-sub">Case-insensitive glob patterns.</div>
      </div>
      <button
        class="btn btn--sm"
        ?disabled=${e.disabled}
        @click=${()=>{let t=[...r,{pattern:``}];e.onPatch(n,t)}}
      >
        Add pattern
      </button>
    </div>
    <div class="list" style="margin-top: 12px;">
      ${r.length===0?t` <div class="muted">No allowlist entries yet.</div> `:r.map((t,n)=>A(e,t,n))}
    </div>
  `}function A(n,r,i){let s=r.lastUsedAt?a(r.lastUsedAt):`never`,c=r.lastUsedCommand?o(r.lastUsedCommand,120):null,l=r.lastResolvedPath?o(r.lastResolvedPath,120):null;return t`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${r.pattern?.trim()?r.pattern:`New pattern`}</div>
        <div class="list-sub">Last used: ${s}</div>
        ${c?t`<div class="list-sub mono">${c}</div>`:e}
        ${l?t`<div class="list-sub mono">${l}</div>`:e}
      </div>
      <div class="list-meta">
        <label class="field">
          <span>Pattern</span>
          <input
            type="text"
            .value=${r.pattern??``}
            ?disabled=${n.disabled}
            @input=${e=>{let t=e.target;n.onPatch([`agents`,n.selectedScope,`allowlist`,i,`pattern`],t.value)}}
          />
        </label>
        <button
          class="btn btn--sm danger"
          ?disabled=${n.disabled}
          @click=${()=>{if(n.allowlist.length<=1){n.onRemove([`agents`,n.selectedScope,`allowlist`]);return}n.onRemove([`agents`,n.selectedScope,`allowlist`,i])}}
        >
          Remove
        </button>
      </div>
    </div>
  `}function j(e){return m(e,[`system.execApprovals.get`,`system.execApprovals.set`])}function M(e){let r=B(e);return t`
    ${T(w(e))} ${V(r)} ${N(e)}
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">Nodes</div>
          <div class="card-sub">Paired devices and live links.</div>
        </div>
        <button class="btn" ?disabled=${e.loading} @click=${e.onRefresh}>
          ${e.loading?n(`common.loading`):n(`common.refresh`)}
        </button>
      </div>
      <div class="list" style="margin-top: 16px;">
        ${e.nodes.length===0?t` <div class="muted">No nodes found.</div> `:e.nodes.map(e=>G(e))}
      </div>
    </section>
  `}function N(i){let a=i.devicesList??{pending:[],paired:[]},o=Array.isArray(a.pending)?a.pending:[],s=Array.isArray(a.paired)?a.paired:[],c=new Map(s.map(e=>[r(e.deviceId),e]).filter(e=>!!e[0]));return t`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">Devices</div>
          <div class="card-sub">Pairing requests + role tokens.</div>
        </div>
        <button class="btn" ?disabled=${i.devicesLoading} @click=${i.onDevicesRefresh}>
          ${i.devicesLoading?n(`common.loading`):n(`common.refresh`)}
        </button>
      </div>
      ${i.devicesError?t`<div class="callout danger" style="margin-top: 12px;">${i.devicesError}</div>`:e}
      <div class="list" style="margin-top: 16px;">
        ${o.length>0?t`
              <div class="muted" style="margin-bottom: 8px;">Pending</div>
              ${o.map(e=>L(e,i,P(c,e)))}
            `:e}
        ${s.length>0?t`
              <div class="muted" style="margin-top: 12px; margin-bottom: 8px;">Paired</div>
              ${s.map(e=>R(e,i))}
            `:e}
        ${o.length===0&&s.length===0?t` <div class="muted">No paired devices.</div> `:e}
      </div>
    </section>
  `}function P(e,t){let n=r(t.deviceId);if(!n)return;let i=e.get(n);if(!i)return;let a=r(t.publicKey),o=r(i.publicKey);if(!(a&&o&&a!==o))return i}function F(e){return e?`roles: ${s(e.roles)} · scopes: ${s(e.scopes)}`:`none`}function I(e){switch(e){case`scope-upgrade`:return`scope upgrade requires approval`;case`role-upgrade`:return`role upgrade requires approval`;case`re-approval`:return`reconnect details changed; approval required`;case`new-pairing`:return`new device pairing request`}throw Error(`unsupported pending approval kind`)}function L(i,o,s){let c=r(i.displayName)||i.deviceId,l=typeof i.ts==`number`?a(i.ts):n(`common.na`),u=f(i,s),d=i.isRepair?` · repair`:``,p=i.remoteIp?` · ${i.remoteIp}`:``;return t`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${c}</div>
        <div class="list-sub">${i.deviceId}${p}</div>
        <div class="muted" style="margin-top: 6px;">
          ${I(u.kind)} · requested ${l}${d}
        </div>
        <div class="muted" style="margin-top: 6px;">
          requested: ${F(u.requested)}
        </div>
        ${u.approved?t`
              <div class="muted" style="margin-top: 6px;">
                approved now: ${F(u.approved)}
              </div>
            `:e}
      </div>
      <div class="list-meta">
        <div class="row" style="justify-content: flex-end; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn--sm primary" @click=${()=>o.onDeviceApprove(i.requestId)}>
            Approve
          </button>
          <button class="btn btn--sm" @click=${()=>o.onDeviceReject(i.requestId)}>
            Reject
          </button>
        </div>
      </div>
    </div>
  `}function R(e,n){let i=r(e.displayName)||e.deviceId,a=e.remoteIp?` · ${e.remoteIp}`:``,o=`roles: ${s(e.roles)}`,c=`scopes: ${s(e.scopes)}`,l=Array.isArray(e.tokens)?e.tokens:[];return t`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${i}</div>
        <div class="list-sub">${e.deviceId}${a}</div>
        <div class="muted" style="margin-top: 6px;">${o} · ${c}</div>
        ${l.length===0?t` <div class="muted" style="margin-top: 6px">Tokens: none</div> `:t`
              <div class="muted" style="margin-top: 10px;">Tokens</div>
              <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
                ${l.map(t=>z(e.deviceId,t,n))}
              </div>
            `}
      </div>
    </div>
  `}function z(n,r,i){let o=r.revokedAtMs?`revoked`:`active`,c=`scopes: ${s(r.scopes)}`,l=a(r.rotatedAtMs??r.createdAtMs??r.lastUsedAtMs??null);return t`
    <div class="row" style="justify-content: space-between; gap: 8px;">
      <div class="list-sub">${r.role} · ${o} · ${c} · ${l}</div>
      <div class="row" style="justify-content: flex-end; gap: 6px; flex-wrap: wrap;">
        <button
          class="btn btn--sm"
          @click=${()=>i.onDeviceRotate(n,r.role,r.scopes)}
        >
          Rotate
        </button>
        ${r.revokedAtMs?e:t`
              <button
                class="btn btn--sm danger"
                @click=${()=>i.onDeviceRevoke(n,r.role)}
              >
                Revoke
              </button>
            `}
      </div>
    </div>
  `}function B(e){let t=e.configForm,n=U(e.nodes),{defaultBinding:r,agents:i}=W(t);return{ready:!!t,disabled:e.configSaving||e.configFormMode===`raw`,configDirty:e.configDirty,configLoading:e.configLoading,configSaving:e.configSaving,defaultBinding:r,agents:i,nodes:n,onBindDefault:e.onBindDefault,onBindAgent:e.onBindAgent,onSave:e.onSaveBindings,onLoadConfig:e.onLoadConfig,formMode:e.configFormMode}}function V(r){let i=r.nodes.length>0,a=r.defaultBinding??``;return t`
    <section class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <div>
          <div class="card-title">${n(`nodes.binding.execNodeBinding`)}</div>
          <div class="card-sub">${n(`nodes.binding.execNodeBindingSubtitle`)}</div>
        </div>
        <button
          class="btn"
          ?disabled=${r.disabled||!r.configDirty}
          @click=${r.onSave}
        >
          ${r.configSaving?n(`common.saving`):n(`common.save`)}
        </button>
      </div>

      ${r.formMode===`raw`?t`
            <div class="callout warn" style="margin-top: 12px">
              ${n(`nodes.binding.formModeHint`)}
            </div>
          `:e}
      ${r.ready?t`
            <div class="list" style="margin-top: 16px;">
              <div class="list-item">
                <div class="list-main">
                  <div class="list-title">${n(`nodes.binding.defaultBinding`)}</div>
                  <div class="list-sub">${n(`nodes.binding.defaultBindingHint`)}</div>
                </div>
                <div class="list-meta">
                  <label class="field">
                    <span>${n(`nodes.binding.node`)}</span>
                    <select
                      ?disabled=${r.disabled||!i}
                      @change=${e=>{let t=e.target.value.trim();r.onBindDefault(t||null)}}
                    >
                      <option value="" ?selected=${a===``}>Any node</option>
                      ${r.nodes.map(e=>t`<option value=${e.id} ?selected=${a===e.id}>
                            ${e.label}
                          </option>`)}
                    </select>
                  </label>
                  ${i?e:t` <div class="muted">No nodes with system.run available.</div> `}
                </div>
              </div>

              ${r.agents.length===0?t` <div class="muted">No agents found.</div> `:r.agents.map(e=>H(e,r))}
            </div>
          `:t`<div class="row" style="margin-top: 12px; gap: 12px;">
            <div class="muted">${n(`nodes.binding.loadConfigHint`)}</div>
            <button class="btn" ?disabled=${r.configLoading} @click=${r.onLoadConfig}>
              ${r.configLoading?n(`common.loading`):n(`common.loadConfig`)}
            </button>
          </div>`}
    </section>
  `}function H(e,n){let r=e.binding??`__default__`,i=e.name?.trim()?`${e.name} (${e.id})`:e.id,a=n.nodes.length>0;return t`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${i}</div>
        <div class="list-sub">
          ${e.isDefault?`default agent`:`agent`} ·
          ${r===`__default__`?`uses default (${n.defaultBinding??`any`})`:`override: ${e.binding}`}
        </div>
      </div>
      <div class="list-meta">
        <label class="field">
          <span>Binding</span>
          <select
            ?disabled=${n.disabled||!a}
            @change=${t=>{let r=t.target.value.trim();n.onBindAgent(e.index,r===`__default__`?null:r)}}
          >
            <option value="__default__" ?selected=${r===`__default__`}>
              Use default
            </option>
            ${n.nodes.map(e=>t`<option value=${e.id} ?selected=${r===e.id}>
                  ${e.label}
                </option>`)}
          </select>
        </label>
      </div>
    </div>
  `}function U(e){return m(e,[`system.run`])}function W(e){let t={id:`main`,name:void 0,index:0,isDefault:!0,binding:null};if(!e||typeof e!=`object`)return{defaultBinding:null,agents:[t]};let n=(e.tools??{}).exec??{},r=typeof n.node==`string`&&n.node.trim()?n.node.trim():null,i=e.agents??{};if(!Array.isArray(i.list)||i.list.length===0)return{defaultBinding:r,agents:[t]};let a=p(e).map(e=>{let t=(e.record.tools??{}).exec??{},n=typeof t.node==`string`&&t.node.trim()?t.node.trim():null;return{id:e.id,name:e.name,index:e.index,isDefault:e.isDefault,binding:n}});return a.length===0&&a.push(t),{defaultBinding:r,agents:a}}function G(e){let n=!!e.connected,r=!!e.paired,i=typeof e.displayName==`string`&&e.displayName.trim()||(typeof e.nodeId==`string`?e.nodeId:`unknown`),a=Array.isArray(e.caps)?e.caps:[],o=Array.isArray(e.commands)?e.commands:[];return t`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${i}</div>
        <div class="list-sub">
          ${typeof e.nodeId==`string`?e.nodeId:``}
          ${typeof e.remoteIp==`string`?` · ${e.remoteIp}`:``}
          ${typeof e.version==`string`?` · ${e.version}`:``}
        </div>
        <div class="chip-row" style="margin-top: 6px;">
          <span class="chip">${r?`paired`:`unpaired`}</span>
          <span class="chip ${n?`chip-ok`:`chip-warn`}">
            ${n?`connected`:`offline`}
          </span>
          ${a.slice(0,12).map(e=>t`<span class="chip">${String(e)}</span>`)}
          ${o.slice(0,8).map(e=>t`<span class="chip">${String(e)}</span>`)}
        </div>
      </div>
    </div>
  `}export{M as renderNodes};
//# sourceMappingURL=nodes-C2qdpf9N.js.map