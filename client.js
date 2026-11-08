/**
 * 镜像人生 · 客户端界面（MVP v0.8.0）
 *
 * 挂载点：左侧面板列 sidebar.panellist（id = mirror-life，紧跟在「自动化任务」之后）
 *         + 中央面板 main（key = mirror-life）。
 *         页面内部自带左侧目录：家庭 / 工作 / 爱好 是「镜像人生」下的子目录。
 * 数据：只存本机浏览器 localStorage（key = mirror-life:v1），不经过 Host、不上传。
 * 四条线：健康（体检指标/身体提醒）、家庭（成员/生日/节日/关怀动作）、工作（任务盘点/提效建议/能力差距）、爱好（社区与培养路径）。
 */
window.__ModuleLoader__.load({
  id: '@local/mirror-life',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useMemo } = React;

    /* ============================== 常量 ============================== */

    const STORE_KEY = 'mirror-life:v1';

    /* 镜像人生自己的根目录：工作区不再放进当前会话的工作目录。 */
    const DEFAULT_MIRROR_ROOT = 'D:\\Deep Seek Harness\\工作区\\镜像人生';
  // 页头那句「励志语句」的默认值；用户可以在页头直接改，存在 profile.motto 里
  const DEFAULT_MOTTO = '工作是为了更好的工作';
    const WORK_DIR_NAME = '工作目录';

    const CSS = `
.ml-root { display:flex; flex-direction:column; gap:16px; padding:20px 24px 28px; color:var(--dsw-alias-label-primary); font-size:13px; line-height:1.6; box-sizing:border-box; min-height:100%; }
.ml-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
.ml-h1 { font-size:19px; font-weight:600; margin:0; letter-spacing:.2px; }
.ml-sub { color:var(--dsw-alias-label-secondary); font-size:12px; margin-top:2px; }
/* v0.7.2 页头励志语句：可点、可改，用主题色渐变字突出显示 */
.ml-motto { display:inline-flex; align-items:baseline; gap:6px; margin:7px 0 0; padding:2px 10px 3px 0; border:0; background:transparent; cursor:pointer; text-align:left;
  font-size:17px; font-weight:700; letter-spacing:.4px; line-height:1.45; max-width:100%;
  background-image:linear-gradient(92deg, var(--ml-accent), color-mix(in srgb, var(--ml-accent) 55%, var(--dsw-alias-label-primary)));
  -webkit-background-clip:text; background-clip:text; color:transparent;
  text-shadow:0 1px 0 rgba(255,255,255,.35); }
.ml-motto:hover { filter:brightness(1.06); }
.ml-motto .ml-motto-pen { font-size:12px; font-weight:400; color:var(--dsw-alias-label-secondary); -webkit-text-fill-color:var(--dsw-alias-label-secondary); opacity:0; transition:opacity .15s; }
.ml-motto:hover .ml-motto-pen { opacity:.85; }
.ml-motto-edit { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:7px; }
.ml-motto-input { font-size:15px; font-weight:600; min-width:260px; max-width:520px; }
.ml-badge { font-size:11px; color:var(--dsw-alias-label-secondary); border:1px solid var(--dsw-alias-border-l1); border-radius:999px; padding:2px 10px; white-space:nowrap; }
.ml-stats { display:flex; gap:10px; flex-wrap:wrap; }
.ml-stat { flex:1 1 130px; background:var(--dsw-alias-bg-layer-1); border:1px solid var(--dsw-alias-border-l1); border-radius:10px; padding:9px 12px; }
.ml-stat b { display:block; font-size:18px; font-weight:600; line-height:1.3; }
.ml-stat span { color:var(--dsw-alias-label-secondary); font-size:11px; }
.ml-tabs { display:flex; gap:4px; border-bottom:1px solid var(--dsw-alias-border-l1); }
.ml-tab { appearance:none; border:0; background:transparent; padding:8px 14px; color:var(--dsw-alias-label-secondary); font-size:13px; font-family:inherit; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; border-radius:6px 6px 0 0; }
.ml-tab:hover { color:var(--dsw-alias-label-primary); background:var(--dsw-alias-bg-layer-1); }
.ml-tab.on { color:var(--dsw-alias-brand-primary); border-bottom-color:var(--dsw-alias-brand-primary); font-weight:600; }
.ml-body { display:flex; flex-direction:column; gap:14px; }
.ml-card { background:var(--dsw-alias-bg-layer-1); border:1px solid var(--dsw-alias-border-l1); border-radius:12px; padding:14px 16px; }
.ml-card h3 { margin:0 0 10px; font-size:13px; font-weight:600; }
.ml-card h3 small { font-weight:400; color:var(--dsw-alias-label-secondary); margin-left:6px; font-size:11px; }
.ml-row { display:flex; gap:8px; flex-wrap:wrap; align-items:flex-end; }
.ml-field { display:flex; flex-direction:column; gap:4px; min-width:110px; }
.ml-field > label { font-size:11px; color:var(--dsw-alias-label-secondary); }
.ml-in { height:30px; border:1px solid var(--dsw-alias-border-l1); border-radius:7px; background:var(--dsw-alias-bg-base); color:var(--dsw-alias-label-primary); padding:0 9px; font-size:13px; font-family:inherit; outline:none; box-sizing:border-box; }
.ml-in:focus { border-color:var(--dsw-alias-brand-primary); }
textarea.ml-in { height:auto; min-height:62px; padding:6px 9px; resize:vertical; line-height:1.5; }
.ml-btn { height:30px; padding:0 13px; border-radius:7px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); font-size:13px; font-family:inherit; cursor:pointer; white-space:nowrap; }
.ml-btn:hover { border-color:var(--dsw-alias-border-l2); }
.ml-btn.primary { background:var(--dsw-alias-brand-primary); border-color:var(--dsw-alias-brand-primary); color:#fff; }
.ml-btn.ghost { background:transparent; }
.ml-btn.danger { color:var(--dsw-alias-state-error-primary); }
.ml-btn:disabled { opacity:.45; cursor:not-allowed; }
.ml-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:10px; }
.ml-member { background:var(--dsw-alias-bg-layer-2); border:1px solid var(--dsw-alias-border-l1); border-radius:10px; padding:10px 12px; display:flex; flex-direction:column; gap:5px; }
.ml-member .top { display:flex; justify-content:space-between; align-items:center; gap:8px; }
.ml-name { font-weight:600; font-size:13px; }
.ml-mhead { display:flex; align-items:center; gap:9px; min-width:0; }
.ml-mhead .ml-mname { display:flex; align-items:center; gap:5px; flex-wrap:wrap; min-width:0; }
.ml-avatar { width:38px; height:38px; border-radius:50%; object-fit:cover; flex:0 0 auto; background:var(--dsw-alias-bg-overlay); border:1px solid var(--dsw-alias-border-l1); }
.ml-avatar.ph { display:grid; place-items:center; font-size:13px; color:var(--dsw-alias-label-secondary); }
.ml-age { font-size:11px; padding:1px 7px; border-radius:99px; background:var(--dsw-alias-bg-layer-1); border:1px solid var(--dsw-alias-border-l1); color:var(--dsw-alias-label-secondary); white-space:nowrap; }
.ml-sub { font-size:12px; line-height:1.65; display:flex; flex-direction:column; gap:5px; padding:8px 10px; border-radius:8px; background:var(--dsw-alias-bg-layer-1); border:1px dashed var(--dsw-alias-border-l1); }
.ml-sub-h { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.ml-sub-h b { font-size:12px; }
.ml-phase { font-size:11px; padding:1px 7px; border-radius:6px; border:1px solid var(--dsw-alias-border-l1); color:var(--dsw-alias-label-secondary); }
.ml-phase.on { border-color:var(--dsw-alias-brand-primary); color:var(--dsw-alias-brand-primary); }
.ml-tiny { font-size:11px; color:var(--dsw-alias-label-secondary); }
.ml-card-actions { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
.ml-rel { color:var(--dsw-alias-label-secondary); font-size:11px; margin-left:6px; }
.ml-sex { color:var(--dsw-alias-label-secondary); font-size:11px; margin-left:5px; padding:0 5px; border-radius:4px; background:var(--dsw-alias-bg-layer-2); }
.ml-x { border:0; background:transparent; color:var(--dsw-alias-state-idle-primary); cursor:pointer; font-size:13px; padding:0 2px; line-height:1; }
.ml-x:hover { color:var(--dsw-alias-state-error-primary); }
.ml-days { font-size:12px; color:var(--dsw-alias-label-secondary); }
.ml-days.hot { color:var(--dsw-alias-state-warn-primary); font-weight:600; }
.ml-days.today { color:var(--dsw-alias-brand-primary); font-weight:600; }
.ml-tip { font-size:12px; color:var(--dsw-alias-label-secondary); line-height:1.5; }
.ml-chip { display:inline-flex; align-items:center; gap:4px; font-size:11px; padding:1px 8px; border-radius:999px; border:1px solid var(--dsw-alias-border-l1); color:var(--dsw-alias-label-secondary); background:var(--dsw-alias-bg-base); margin:0 4px 4px 0; }
.ml-chip.on { border-color:var(--dsw-alias-brand-primary); color:var(--dsw-alias-brand-primary); }
.ml-chipbtn { cursor:pointer; appearance:none; font-family:inherit; }
.ml-list { display:flex; flex-direction:column; gap:8px; }
.ml-item { display:flex; align-items:center; gap:8px; justify-content:space-between; background:var(--dsw-alias-bg-base); border:1px solid var(--dsw-alias-border-l1); border-radius:8px; padding:7px 10px; }
.ml-item .grow { flex:1; min-width:0; }
.ml-muted { color:var(--dsw-alias-label-secondary); font-size:12px; }
.ml-table { width:100%; border-collapse:collapse; font-size:12px; }
.ml-table th { text-align:left; color:var(--dsw-alias-label-secondary); font-weight:500; padding:6px 8px; border-bottom:1px solid var(--dsw-alias-border-l1); }
.ml-table td { padding:6px 8px; border-bottom:1px solid var(--dsw-alias-border-l1); vertical-align:top; }
.ml-table tr:last-child td { border-bottom:0; }
.ml-foot { display:flex; gap:8px; flex-wrap:wrap; align-items:center; padding-top:10px; border-top:1px solid var(--dsw-alias-border-l1); color:var(--dsw-alias-label-secondary); font-size:11px; }
.ml-empty { padding:18px; text-align:center; color:var(--dsw-alias-label-secondary); font-size:12px; border:1px dashed var(--dsw-alias-border-l1); border-radius:10px; }
.ml-split { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
@media (max-width:760px) { .ml-split { grid-template-columns:1fr; } }

/* ---------- 页面骨架：左侧目录 + 右侧内容 ---------- */
.ml-page { display:flex; height:100%; min-height:0; box-sizing:border-box; color:var(--dsw-alias-label-primary); font-size:13px; line-height:1.6;
  /* v0.7.2：整页底色不再跟着应用的白底，用主题色微微染色 + 两团柔光 */
  background-color: color-mix(in srgb, var(--ml-accent) 9%, var(--dsw-alias-bg-base));
  background-image:
    radial-gradient(900px 380px at 10% -6%, color-mix(in srgb, var(--ml-accent) 20%, transparent), transparent 68%),
    radial-gradient(760px 340px at 100% 0%, color-mix(in srgb, var(--ml-accent) 13%, transparent), transparent 72%),
    linear-gradient(180deg, transparent, color-mix(in srgb, var(--ml-accent) 4%, transparent));
}
.ml-nav { width:208px; flex:0 0 208px; height:100%; box-sizing:border-box; border-right:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); display:flex; flex-direction:column; gap:1px; padding:14px 8px 16px; overflow:auto; }
.ml-nav-kicker { font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--dsw-alias-label-secondary); padding:0 10px 8px; }
.ml-nav-root { display:flex; align-items:center; gap:8px; padding:6px 10px 8px; font-weight:600; font-size:13px; }
.ml-nav-root svg { flex:0 0 auto; color:var(--dsw-alias-brand-primary); }
.ml-nav-group { display:flex; flex-direction:column; gap:1px; }
.ml-nav-item { appearance:none; border:0; background:transparent; color:var(--dsw-alias-label-secondary); font:inherit; font-size:13px; text-align:left; padding:6px 10px 6px 26px; border-radius:8px; cursor:pointer; display:flex; align-items:center; gap:7px; }
.ml-nav-item:hover { background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); }
.ml-nav-item.on { background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-brand-primary); font-weight:600; }
.ml-nav-item .cnt { margin-left:auto; font-size:11px; color:var(--dsw-alias-label-secondary); font-weight:400; }
.ml-nav-leaf { display:block; width:100%; text-align:left; appearance:none; border:0; background:transparent; font:inherit; padding:3px 10px 3px 40px; font-size:12px; color:var(--dsw-alias-label-secondary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; cursor:pointer; border-radius:7px; }
.ml-nav-leaf:hover { background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); }
.ml-nav-leaf.muted { cursor:default; opacity:.72; }
.ml-nav-leaf.muted:hover { background:transparent; color:var(--dsw-alias-label-secondary); }
.ml-focus { outline:2px solid var(--ml-accent); outline-offset:2px; }
.ml-week { display:flex; flex-direction:column; gap:6px; }
.ml-week-row { display:flex; gap:9px; align-items:flex-start; padding:7px 9px; border:1px solid var(--dsw-alias-border-l1); border-radius:8px; background:var(--dsw-alias-bg-base); }
.ml-week-row.done { opacity:.55; }
.ml-week-row.done .ml-week-title { text-decoration:line-through; }
.ml-week-day { flex:0 0 58px; font-size:11px; font-weight:600; color:var(--ml-accent); }
.ml-week-title { font-size:12.5px; color:var(--dsw-alias-label-primary); }
.ml-week-why { font-size:11px; color:var(--dsw-alias-label-secondary); margin-top:2px; }
.ml-week-row input[type=checkbox] { margin:3px 0 0; accent-color:var(--ml-accent); }
.ml-url { font-size:11.5px; color:var(--dsw-alias-label-secondary); word-break:break-all; }
.ml-hitem { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:8px 10px; border:1px solid var(--dsw-alias-border-l1); border-radius:9px; background:var(--dsw-alias-bg-layer-1); }
.ml-hname { display:flex; flex-direction:column; min-width:96px; }
.ml-hname b { font-size:13px; }
.ml-hval { font-size:15px; font-weight:700; }
.ml-href { font-size:12px; color:var(--dsw-alias-label-secondary); }
.ml-status { font-size:11px; padding:1px 7px; border-radius:999px; border:1px solid var(--dsw-alias-border-l1); }
.ml-status.normal { color:var(--dsw-alias-state-success-primary); border-color:color-mix(in srgb, var(--dsw-alias-state-success-primary) 45%, transparent); }
.ml-status.high, .ml-status.low, .ml-status.abnormal { color:var(--dsw-alias-state-warn-primary); border-color:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 45%, transparent); }
.ml-status.unknown { color:var(--dsw-alias-label-secondary); }
.ml-notes { display:flex; flex-direction:column; gap:6px; }
.ml-note { padding:8px 10px; border-radius:8px; border-left:3px solid var(--dsw-alias-border-l2); background:var(--dsw-alias-bg-layer-1); font-size:12.5px; line-height:1.55; }
.ml-note.warn { border-left-color:var(--dsw-alias-state-warn-primary); }
.ml-note.bad { border-left-color:var(--dsw-alias-state-error-primary); }
.ml-note.good { border-left-color:var(--dsw-alias-state-success-primary); }
.ml-note.info { border-left-color:var(--ml-accent); }
.ml-nav-sep { height:1px; background:var(--dsw-alias-border-l1); margin:8px 10px; }
.ml-main { flex:1; min-width:0; height:100%; overflow:auto; }
.ml-main > .ml-root { padding:18px 22px 28px; }
.ml-crumb { font-size:11px; color:var(--dsw-alias-label-secondary); }
.ml-crumb b { color:var(--dsw-alias-label-primary); font-weight:600; }

/* ---------- 任务卡内的智能体工作流 ---------- */
.ml-task { display:flex; flex-direction:column; gap:8px; flex:1 1 auto; min-width:0; }
.ml-item > .ml-x { flex:0 0 auto; align-self:flex-start; }
.ml-task-main { min-width:0; }
.ml-wf { margin-top:9px; padding:9px 11px 10px; border:1px solid var(--dsw-alias-border-l1); border-radius:9px; background:var(--dsw-alias-bg-layer-1); }
.ml-wf-h { display:flex; align-items:baseline; flex-wrap:wrap; gap:6px; font-size:11px; font-weight:600; letter-spacing:.04em; color:var(--dsw-alias-label-secondary); margin-bottom:7px; }
.ml-wf-h .ml-muted { font-weight:400; letter-spacing:0; }
.ml-wf .ml-btn { height:26px; padding:0 9px; font-size:12px; }
.ml-wf-foot { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
.ml-line { display:flex; gap:4px; font-size:11px; line-height:1.5; word-break:break-all; margin-top:4px; }
.ml-line.ok { color:var(--dsw-alias-state-success-primary); }
.ml-line.bad { color:var(--dsw-alias-state-error-primary); }
.ml-line.wait { color:var(--dsw-alias-state-warn-primary); }
.ml-ws { font-size:11px; line-height:1.6; word-break:break-all; color:var(--dsw-alias-label-secondary); }
.ml-ups { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-top:9px; padding-top:9px; border-top:1px dashed var(--dsw-alias-border-l1); }
.ml-badge { font-size:10px; padding:1px 6px; border-radius:999px; border:1px solid var(--dsw-alias-border-l1); color:var(--dsw-alias-state-success-primary); letter-spacing:.02em; }
.ml-badge.wait { color:var(--dsw-alias-state-warn-primary); }
.ml-task-head { display:flex; align-items:center; flex-wrap:wrap; gap:6px; }
.ml-task-head .ml-grow { flex:1 1 auto; min-width:0; }
.ml-task-head .ml-btn { height:24px; padding:0 8px; font-size:12px; }
.ml-desc { font-size:11px; line-height:1.6; color:var(--dsw-alias-label-secondary); white-space:pre-wrap; word-break:break-word; margin-top:4px; }
/* 工作流示意图 */
.ml-flow { display:flex; flex-wrap:wrap; align-items:stretch; gap:6px; margin:7px 0 4px; }
.ml-flow-node { flex:1 1 118px; min-width:104px; border:1px solid var(--dsw-alias-border-l1); border-radius:8px; background:var(--dsw-alias-bg-base); padding:6px 7px; }
.ml-flow-node .n { font-size:10px; color:var(--dsw-alias-label-secondary); letter-spacing:.06em; }
.ml-flow-node .t { font-size:12px; font-weight:600; line-height:1.45; word-break:break-word; margin-top:1px; }
.ml-flow-node .note { font-size:10px; color:var(--dsw-alias-label-secondary); margin-top:2px; word-break:break-word; }
.ml-flow-arrow { align-self:center; color:var(--dsw-alias-label-secondary); font-size:12px; }
.ml-flow-step { display:flex; align-items:center; gap:5px; margin-top:5px; }
.ml-flow-step .ml-in { flex:1 1 auto; min-width:0; height:26px; }
.ml-flow-step .ml-x { flex:0 0 auto; }
/* 新增任务弹窗 */
.ml-mask { position:fixed; inset:0; z-index:80; background:rgba(12,14,20,.44); display:flex; align-items:center; justify-content:center; padding:18px; }
.ml-modal { width:min(580px,100%); max-height:min(84vh,760px); overflow:auto; background:var(--dsw-alias-bg-layer-2); border:1px solid var(--dsw-alias-border-l2); border-radius:12px; padding:15px 17px 14px; box-shadow:0 18px 48px rgba(0,0,0,.3); }
.ml-modal-h { display:flex; align-items:baseline; justify-content:space-between; gap:10px; font-size:13px; font-weight:600; margin-bottom:10px; }
.ml-modal-h .ml-muted { font-weight:400; font-size:11px; }
.ml-modal-foot { display:flex; justify-content:flex-end; gap:8px; margin-top:14px; }
.ml-up { border:1px solid var(--dsw-alias-border-l1); border-radius:8px; padding:7px 8px; background:var(--dsw-alias-bg-base); }
.ml-up-h { display:flex; align-items:baseline; gap:2px; font-size:11px; margin-bottom:5px; }
.ml-up-list { display:flex; flex-direction:column; gap:2px; margin-bottom:4px; }
.ml-up-item { display:flex; align-items:center; gap:4px; font-size:11px; line-height:1.5; word-break:break-all; }
.ml-up-item code { flex:1 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ml-up-item .ml-x { flex:0 0 auto; width:16px; height:16px; line-height:1; font-size:12px; }
.ml-up .ml-row { flex-wrap:nowrap; align-items:center; }
.ml-ws code { background:var(--dsw-alias-bg-layer-2); border-radius:4px; padding:1px 5px; color:var(--dsw-alias-label-primary); }

/* ---------- 主题与外观（v0.6.0） ---------- */
.ml-page { --ml-accent: var(--dsw-alias-brand-primary); --ml-soft: var(--dsw-alias-bg-layer-2); --ml-hero: linear-gradient(135deg, var(--dsw-alias-bg-layer-1), var(--dsw-alias-bg-layer-2)); }
.ml-page[data-theme="warm"] { --ml-accent:#e07a33; --ml-soft:rgba(224,122,51,.13); --ml-hero:linear-gradient(135deg, rgba(224,122,51,.20), rgba(224,122,51,.03)); }
.ml-page[data-theme="teal"] { --ml-accent:#2b9c8d; --ml-soft:rgba(43,156,141,.13); --ml-hero:linear-gradient(135deg, rgba(43,156,141,.20), rgba(43,156,141,.03)); }
.ml-page[data-theme="indigo"] { --ml-accent:#6a63d8; --ml-soft:rgba(106,99,216,.14); --ml-hero:linear-gradient(135deg, rgba(106,99,216,.22), rgba(106,99,216,.03)); }
.ml-page[data-theme="rose"] { --ml-accent:#cf5f8a; --ml-soft:rgba(207,95,138,.13); --ml-hero:linear-gradient(135deg, rgba(207,95,138,.20), rgba(207,95,138,.03)); }
.ml-page .ml-head { background:var(--ml-hero); border:1px solid var(--dsw-alias-border-l1); border-radius:14px; padding:14px 16px; }
.ml-page .ml-btn { transition:background .15s ease, border-color .15s ease, color .15s ease, transform .12s ease, box-shadow .15s ease; }
.ml-page .ml-btn.primary { background:var(--ml-accent); border-color:var(--ml-accent); color:#fff; box-shadow:0 1px 3px rgba(0,0,0,.10); }
.ml-page .ml-btn.primary:hover { filter:brightness(1.06); }
.ml-page .ml-btn:active { transform:translateY(1px); }
.ml-page .ml-btn:focus-visible, .ml-page .ml-nav-item:focus-visible, .ml-page .ml-chipbtn:focus-visible { outline:2px solid var(--ml-accent); outline-offset:1px; }
.ml-page .ml-nav-item.on { background:var(--ml-soft); color:var(--ml-accent); box-shadow:inset 3px 0 0 var(--ml-accent); }
.ml-page .ml-nav-item.on .cnt { color:var(--ml-accent); }
.ml-page .ml-nav-root svg { color:var(--ml-accent); }
.ml-page .ml-chip.on { border-color:var(--ml-accent); color:var(--ml-accent); }
.ml-page .ml-stat { border-top:2px solid var(--ml-accent); transition:background .16s ease, transform .16s ease; }
.ml-page .ml-stat:hover { background:var(--ml-soft); transform:translateY(-1px); }
.ml-page .ml-card { transition:box-shadow .18s ease, border-color .18s ease; }
.ml-page .ml-card:hover { box-shadow:0 6px 20px rgba(0,0,0,.07); border-color:var(--dsw-alias-border-l2); }
.ml-page .ml-member, .ml-page .ml-item { transition:border-color .16s ease, box-shadow .16s ease; }
.ml-page .ml-member:hover, .ml-page .ml-item:hover { border-color:var(--dsw-alias-border-l2); box-shadow:0 4px 14px rgba(0,0,0,.05); }
.ml-page .ml-avatar { box-shadow:0 0 0 2px var(--ml-soft); }
.ml-page .ml-avatar.ph { color:var(--ml-accent); }
.ml-page .ml-h1 { letter-spacing:.3px; }
.ml-page .ml-empty { border-color:var(--dsw-alias-border-l2); }
.ml-page .ml-flow-node { border-color:var(--dsw-alias-border-l1); transition:border-color .16s ease, transform .16s ease; }
.ml-page .ml-flow-node:hover { border-color:var(--ml-accent); transform:translateY(-1px); }
.ml-tools { display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
.ml-swatches { display:flex; align-items:center; gap:6px; padding:3px 8px; border:1px solid var(--dsw-alias-border-l1); border-radius:999px; background:rgba(255,255,255,.28); }
.ml-page[data-theme] .ml-swatches { background:var(--dsw-alias-bg-base); }
.ml-swatch { width:15px; height:15px; border-radius:50%; border:1px solid rgba(0,0,0,.16); cursor:pointer; padding:0; appearance:none; }
.ml-swatch:hover { transform:scale(1.12); }
.ml-swatch.on { box-shadow:0 0 0 2px var(--dsw-alias-bg-base), 0 0 0 3px var(--ml-accent); }
.ml-nav-top { display:flex; align-items:center; }
.ml-nav-toggle { appearance:none; border:0; background:transparent; color:var(--dsw-alias-label-secondary); cursor:pointer; margin-left:auto; padding:3px 7px; border-radius:7px; font-size:12px; line-height:1; }
.ml-nav-toggle:hover { background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); }
.ml-nav-char { display:none; font-size:12px; font-weight:600; }
.ml-page.nav-mini .ml-nav { width:64px; flex:0 0 64px; padding:12px 6px 16px; }
.ml-page.nav-mini .ml-nav-kicker, .ml-page.nav-mini .ml-nav-leaf, .ml-page.nav-mini .ml-nav-sep { display:none; }
.ml-page.nav-mini .ml-nav-top { flex-direction:column; gap:6px; padding-bottom:4px; }
.ml-page.nav-mini .ml-nav-toggle { margin:0; }
.ml-page.nav-mini .ml-nav-group { align-items:stretch; }
.ml-page.nav-mini .ml-nav-item { justify-content:center; padding:8px 0; }
.ml-page.nav-mini .ml-nav-lbl, .ml-page.nav-mini .ml-nav-item .cnt { display:none; }
.ml-page.nav-mini .ml-nav-char { display:inline; }
.ml-page.nav-mini .ml-crumb { opacity:.7; }

@media (max-width:820px) {
  .ml-page { flex-direction:column; }
  .ml-nav { width:auto; flex:0 0 auto; height:auto; flex-direction:row; flex-wrap:wrap; align-items:center; gap:4px; border-right:0; border-bottom:1px solid var(--dsw-alias-border-l1); padding:8px 10px; }
  .ml-nav-kicker, .ml-nav-root, .ml-nav-leaf, .ml-nav-sep { display:none; }
  .ml-nav-group { flex-direction:row; gap:4px; }
  .ml-nav-item { padding:5px 10px; }
  .ml-ups { grid-template-columns:1fr; }
}

/* ---------- v0.7.2 立体感：分层阴影、渐变、可按压 ---------- */
.ml-page {
  --ml-sh-1: 0 1px 1px rgba(16,18,26,.05), 0 1px 2px rgba(16,18,26,.05);
  --ml-sh-2: 0 2px 4px rgba(16,18,26,.06), 0 8px 22px -12px rgba(16,18,26,.28);
  --ml-sh-3: 0 4px 10px -4px rgba(16,18,26,.22), 0 20px 44px -22px rgba(16,18,26,.42);
  --ml-hi: inset 0 1px 0 rgba(255,255,255,.5);
  --ml-inset: inset 0 1px 2px rgba(16,18,26,.08);
  perspective: 1200px;
}
.ml-page .ml-head {
  box-shadow: var(--ml-sh-2), var(--ml-hi);
  position: relative;
  overflow: hidden;
}
.ml-page .ml-head::after {
  content: '';
  position: absolute;
  inset: -40% -10% auto auto;
  width: 220px; height: 220px;
  background: radial-gradient(circle at 30% 30%, var(--ml-soft), transparent 70%);
  pointer-events: none;
}
.ml-page .ml-card, .ml-page .ml-member, .ml-page .ml-item, .ml-page .ml-up {
  background-image: linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,0));
  box-shadow: var(--ml-sh-1), var(--ml-hi);
}
.ml-page .ml-card:hover, .ml-page .ml-member:hover, .ml-page .ml-item:hover {
  box-shadow: var(--ml-sh-2), var(--ml-hi);
  transform: translateY(-1px);
}
.ml-page .ml-stat {
  background-image: linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,0));
  box-shadow: var(--ml-sh-1), var(--ml-hi);
  transform-style: preserve-3d;
}
.ml-page .ml-stat:hover {
  box-shadow: var(--ml-sh-2), var(--ml-hi);
  transform: translateY(-3px) rotateX(2.5deg);
}
.ml-page .ml-btn {
  box-shadow: var(--ml-sh-1), var(--ml-hi);
  background-image: linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,0));
}
.ml-page .ml-btn:hover { box-shadow: var(--ml-sh-2), var(--ml-hi); transform: translateY(-1px); }
.ml-page .ml-btn:active { transform: translateY(1px); box-shadow: var(--ml-inset); background-image: none; }
.ml-page .ml-btn.primary {
  box-shadow: 0 2px 6px -1px color-mix(in srgb, var(--ml-accent) 55%, transparent), var(--ml-hi);
  background-image: linear-gradient(180deg, rgba(255,255,255,.26), rgba(255,255,255,0));
}
.ml-page .ml-btn.primary:hover {
  box-shadow: 0 6px 18px -4px color-mix(in srgb, var(--ml-accent) 60%, transparent), var(--ml-hi);
}
.ml-page .ml-nav { box-shadow: inset -1px 0 0 var(--dsw-alias-border-l1), 3px 0 14px -12px rgba(0,0,0,.4); }
.ml-page .ml-nav-item { transition: background .15s ease, color .15s ease, transform .12s ease; }
.ml-page .ml-nav-item:hover { transform: translateX(1px); }
.ml-page .ml-nav-item.on { box-shadow: inset 3px 0 0 var(--ml-accent), var(--ml-sh-1); }
.ml-page .ml-nav-group-h {
  display: flex; align-items: center; gap: 5px; width: 100%;
  appearance: none; border: 0; background: transparent; cursor: pointer;
  padding: 6px 9px 4px; border-radius: 7px;
  color: var(--dsw-alias-label-secondary); font-size: 11px; letter-spacing: .04em;
}
.ml-page .ml-nav-group-h:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.ml-page .ml-nav-group-h .cnt { margin-left: auto; }
.ml-page .ml-nav-row { display: flex; align-items: center; gap: 2px; }
.ml-page .ml-nav-row .ml-nav-item { flex: 1 1 auto; min-width: 0; }
.ml-page .ml-nav-chev {
  flex: 0 0 auto; appearance: none; border: 0; background: transparent; cursor: pointer;
  color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 1;
  padding: 6px 5px; border-radius: 6px; opacity: .55;
}
.ml-page .ml-nav-chev:hover { opacity: 1; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.ml-page .ml-nav-chev .chev { display: inline-block; transition: transform .15s ease; }
.ml-page .ml-nav-group.closed .ml-nav-chev .chev { transform: rotate(-90deg); }
.ml-page.nav-mini .ml-nav-chev { display: none; }
.ml-page .ml-nav-group-body { display: flex; flex-direction: column; gap: 1px; overflow: hidden; }
.ml-page .ml-nav-group.closed .ml-nav-group-body { display: none; }
.ml-page .ml-flow-node {
  background-image: linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,0));
  box-shadow: var(--ml-sh-1), var(--ml-hi);
}
.ml-page .ml-flow-node:hover { box-shadow: var(--ml-sh-2), var(--ml-hi); }
.ml-page .ml-avatar { box-shadow: 0 0 0 2px var(--ml-soft), 0 2px 8px -2px rgba(0,0,0,.35); }
.ml-page .ml-focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--ml-accent), 0 10px 26px -14px color-mix(in srgb, var(--ml-accent) 70%, transparent);
  transform: translateY(-1px);
}
.ml-page .ml-modal {
  box-shadow: 0 30px 70px -24px rgba(0,0,0,.5), var(--ml-hi);
  transform: translateZ(0);
  animation: ml-pop .16s ease-out;
}
@keyframes ml-pop {
  from { opacity: 0; transform: translateY(6px) scale(.985); }
  to { opacity: 1; transform: none; }
}
.ml-page .ml-swatches { box-shadow: var(--ml-sh-1), var(--ml-hi); }
.ml-page .ml-swatch { box-shadow: 0 1px 2px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.4); }
@media (prefers-reduced-motion: reduce) {
  .ml-page .ml-card, .ml-page .ml-stat, .ml-page .ml-btn, .ml-page .ml-nav-item, .ml-page .ml-flow-node { transition: none; }
  .ml-page .ml-modal { animation: none; }
}
`;

    const FREQ = [
      { key: 'day', label: '每天', perWeek: 5 },
      { key: 'week', label: '每周', perWeek: 1 },
      { key: 'biweek', label: '每两周', perWeek: 0.5 },
      { key: 'month', label: '每月', perWeek: 0.25 },
      { key: 'rare', label: '偶尔', perWeek: 0.1 },
    ];

    const LEVELS = [
      { v: 1, label: '1 不会' },
      { v: 2, label: '2 需人带' },
      { v: 3, label: '3 能独立做' },
      { v: 4, label: '4 能带人做' },
      { v: 5, label: '5 能定标准' },
    ];

    /** 岗位族基线：只列可观察能力，每个都带一条可执行的强化动作。 */
    const ROLE_FAMILIES = {
      product: {
        name: '产品经理',
        caps: [
          { id: 'p1', name: '需求真伪判断', target: 4, action: '每周挑 1 个需求写清"为什么不做"，交上级点评' },
          { id: 'p2', name: '指标体系设计', target: 4, action: '给自己的模块画一张指标树，标出北极星指标与护栏指标' },
          { id: 'p3', name: '方案取舍与决策记录', target: 4, action: '每个方案补一段"为什么不是另一个"，沉淀决策日志' },
          { id: 'p4', name: '跨团队推动', target: 4, action: '列出手上 3 个依赖方，各约一次 15 分钟对齐' },
          { id: 'p5', name: '上线后验证与复盘', target: 3, action: '上线 2 周内出复盘：预期 / 实际 / 差异原因' },
        ],
      },
      ops: {
        name: '运营',
        caps: [
          { id: 'o1', name: '活动目标拆解', target: 4, action: '把下次活动的目标拆成流量 × 转化 × 客单三段，各写一个抓手' },
          { id: 'o2', name: '数据看板与归因', target: 4, action: '搭一张周看板，固定 5 个指标并标出异常阈值' },
          { id: 'o3', name: '内容与素材复用', target: 3, action: '把一个爆款素材拆成 5 个变体，形成素材库' },
          { id: 'o4', name: '投放与预算控制', target: 4, action: '给每笔投放设止损线与复盘节点' },
          { id: 'o5', name: '跨部门协同节奏', target: 3, action: '固定每周一次 20 分钟协同会，只过卡点与决策' },
        ],
      },
      sales: {
        name: '销售/商务',
        caps: [
          { id: 's1', name: '客户画像与分层', target: 4, action: '把客户按成交概率分成 A/B/C 三层，各定一种跟进节奏' },
          { id: 's2', name: '需求挖掘', target: 4, action: '每次拜访准备 5 个开放式问题，记录客户原话' },
          { id: 's3', name: '异议处理', target: 4, action: '整理近 10 次被拒原因，各写一句应对话术' },
          { id: 's4', name: '商机推进节奏', target: 4, action: '每个商机标注下一动作与日期，超期自动提醒' },
          { id: 's5', name: '复盘与预测', target: 3, action: '每周算一次预测准确率，偏差超过 20% 找原因' },
        ],
      },
      dev: {
        name: '研发/技术',
        caps: [
          { id: 'd1', name: '需求澄清与拆解', target: 4, action: '每个需求写清输入输出与边界，模糊点挂"待确认"不硬写' },
          { id: 'd2', name: '设计与评审', target: 4, action: '动手前写 1 页设计说明，找 1 个人评审' },
          { id: 'd3', name: '测试与质量门禁', target: 4, action: '给自己负责的模块列一张上线检查清单' },
          { id: 'd4', name: '排期与风险暴露', target: 4, action: '任务拆到 0.5 天粒度，风险提前 3 天报' },
          { id: 'd5', name: '复盘与沉淀', target: 3, action: '每个事故写 5 行复盘：现象 / 根因 / 修复 / 防再发 / 责任人' },
        ],
      },
      design: {
        name: '设计',
        caps: [
          { id: 'g1', name: '需求理解与目标对齐', target: 4, action: '接需求先复述目标与验收标准，确认后再动手' },
          { id: 'g2', name: '方案探索与取舍', target: 4, action: '每个需求给 2~3 个方向，写清取舍理由' },
          { id: 'g3', name: '设计规范与一致性', target: 4, action: '整理自己模块的组件与间距规范，落到文件里' },
          { id: 'g4', name: '设计走查与落地', target: 4, action: '上线前做一次逐像素走查，列出偏差清单' },
          { id: 'g5', name: '作品表达', target: 3, action: '每个项目留一页案例：问题 / 过程 / 结果数据' },
        ],
      },
      finance: {
        name: '财务',
        caps: [
          { id: 'f1', name: '核算口径清晰', target: 4, action: '维护一份口径字典：每个科目/指标的定义与取数来源' },
          { id: 'f2', name: '报表勾稽', target: 4, action: '出表前做三表勾稽与同比环比双复核' },
          { id: 'f3', name: '预算与差异分析', target: 4, action: '每月出差异分析：差异额 / 原因 / 建议动作' },
          { id: 'f4', name: '合规与风险识别', target: 4, action: '列一张高风险事项清单，标出触发条件与上报路径' },
          { id: 'f5', name: '业务沟通', target: 3, action: '把一份财务结论翻译成业务能听懂的 3 句话' },
        ],
      },
      hr: {
        name: '人力',
        caps: [
          { id: 'h1', name: '岗位画像与招聘标准', target: 4, action: '每个在招岗位写清 3 条硬标准与 2 条否决项' },
          { id: 'h2', name: '面试评估一致性', target: 4, action: '统一评分表，面试后 2 小时内打分并写证据' },
          { id: 'h3', name: '员工关系处理', target: 4, action: '整理常见场景的处理流程与话术，避免临场发挥' },
          { id: 'h4', name: '绩效与反馈', target: 4, action: '每月给直接下属一次具体反馈（事实 + 影响 + 建议）' },
          { id: 'h5', name: '组织与人才盘点', target: 3, action: '按"能力 × 意愿"给团队画一张九宫格' },
        ],
      },
      content: {
        name: '研究/内容',
        caps: [
          { id: 'n1', name: '问题界定与假设', target: 4, action: '每篇产出先写 1 句话结论 + 3 个可被推翻的假设' },
          { id: 'n2', name: '信源与数据溯源', target: 4, action: '关键数字都标来源与截止日，取不到就写缺口' },
          { id: 'n3', name: '结构与读者视角', target: 4, action: '动笔前先写目录，每个小标题回答读者一个问题' },
          { id: 'n4', name: '观点与证据配对', target: 4, action: '每条观点后跟一条证据，找不到证据就降级为"推测"' },
          { id: 'n5', name: '成稿核对', target: 3, action: '交付前把正文数字两两复算一遍，矛盾立即停手' },
        ],
      },
      general: {
        name: '通用职场',
        caps: [
          { id: 'u1', name: '任务拆解与排期', target: 4, action: '把手上一件事拆到「半天能完成」的粒度，标出依赖' },
          { id: 'u2', name: '交付质量', target: 4, action: '给自己每类交付物定一份 0/1 检查清单' },
          { id: 'u3', name: '沟通与同步', target: 4, action: '每周固定一次进展同步：完成 / 卡点 / 需要谁' },
          { id: 'u4', name: '问题解决', target: 4, action: '遇到卡点先写清「现象 / 已排除 / 下一步找谁」再求助' },
          { id: 'u5', name: '复盘与沉淀', target: 3, action: '每月挑一件做砸的事写 5 行复盘' },
        ],
      },
    };

    /** 岗位文本 → 岗位族。顺序要紧：越具体的放在前面。 */
    const ROLE_RULES = [
      { test: /研发|开发|工程师|程序|前端|后端|测试|算法|运维|架构/i, key: 'dev' },
      { test: /设计|UI|UX|视觉|交互|美工|插画/i, key: 'design' },
      { test: /产品经理|产品|需求|PRD|原型/i, key: 'product' },
      { test: /销售|商务|BD|客户经理|渠道|大客户/i, key: 'sales' },
      { test: /运营|电商|店铺|投放|增长|活动|直播|内容运营|用户运营/i, key: 'ops' },
      { test: /财务|会计|审计|税务|出纳|成本/i, key: 'finance' },
      { test: /人力|HR|招聘|组织|培训|薪酬|行政/i, key: 'hr' },
      { test: /研究|分析|咨询|编辑|记者|写作|内容|策划|文案/i, key: 'content' },
    ];

    /** 行业包：从公司/业务描述里检索，命中就给 2 条行业特有能力。 */
    const INDUSTRIES = {
      ecommerce: {
        name: '电商/跨境',
        caps: [
          { name: '平台规则与合规', target: 4, action: '整理所售站点的规则清单（listing 规范 / 违规红线 / 申诉路径），每季度复核一次' },
          { name: '转化漏斗与广告效率', target: 4, action: '把「曝光→点击→加购→成交」四段做成周表，每段标一个可干预动作' },
        ],
      },
      saas: {
        name: '软件/互联网',
        caps: [
          { name: '版本节奏与灰度', target: 4, action: '给当前版本画出发布路径：灰度比例 → 观察指标 → 回滚条件' },
          { name: '留存与活跃指标', target: 4, action: '定义次留/7 留/月活口径，并找出影响最大的一条路径' },
        ],
      },
      manufacturing: {
        name: '制造/供应链',
        caps: [
          { name: '良率与工艺纪律', target: 4, action: '挑一道关键工序，记录每次异常与处置，形成 SOP' },
          { name: '交付与库存平衡', target: 4, action: '每周算一次齐套率与在途，标出可能断料的 3 个料号' },
        ],
      },
      education: {
        name: '教育/培训',
        caps: [
          { name: '课程交付质量', target: 4, action: '给一节课定 3 条可观察的交付标准（节奏 / 互动 / 练习）' },
          { name: '续费与口碑', target: 4, action: '统计退课与续费原因各前 3 项，各写一条改进' },
        ],
      },
      medical: {
        name: '医疗/健康',
        caps: [
          { name: '合规与记录完整', target: 5, action: '对照规范逐条核对一次记录完整性，缺项列清单' },
          { name: '多角色协作与交接', target: 4, action: '把一次交接写成固定模板：现状 / 风险 / 待办 / 谁接手' },
        ],
      },
      fin: {
        name: '金融',
        caps: [
          { name: '风控与合规底线', target: 5, action: '列出本岗位 3 条红线与触发后的上报路径，贴在看得见的地方' },
          { name: '收益与风险测算', target: 4, action: '每个方案给一版「基准 / 悲观 / 乐观」三情景测算' },
        ],
      },
      media: {
        name: '广告/内容/媒体',
        caps: [
          { name: '选题与传播判断', target: 4, action: '每次选题写清「给谁看 / 为什么现在看 / 看完做什么」' },
          { name: '素材与版权合规', target: 4, action: '建一份素材来源台账，标清授权范围与到期时间' },
        ],
      },
      logistics: {
        name: '物流/仓储',
        caps: [
          { name: '时效与成本控制', target: 4, action: '按线路统计时效达成率与单均成本，找最差的一条先改' },
          { name: '异常处理闭环', target: 4, action: '把丢件/破损/延误的处理时限写进清单，逐单跟踪' },
        ],
      },
      retail: {
        name: '零售/餐饮',
        caps: [
          { name: '门店运营与损耗', target: 4, action: '每周盘一次损耗前 3 项，各写一条止损动作' },
          { name: '复购与体验', target: 4, action: '统计复购率与差评关键词，各挑一条改' },
        ],
      },
      construction: {
        name: '建筑/工程',
        caps: [
          { name: '图纸规范与交底', target: 4, action: '每次交底留一份签字记录：内容 / 疑问 / 结论' },
          { name: '进度与验收节点', target: 4, action: '把关键节点做成横道图，标出验收所需材料' },
        ],
      },
      public: {
        name: '政务/公共服务',
        caps: [
          { name: '政策口径一致', target: 5, action: '维护一份口径台账：事项 / 依据 / 有效期 / 解释人' },
          { name: '群众沟通与留痕', target: 4, action: '每次答复留三样：诉求原文 / 依据 / 承诺时间' },
        ],
      },
    };

    const INDUSTRY_RULES = [
      { test: /跨境|亚马逊|亚马逊|独立站|电商|淘宝|天猫|拼多多|虾皮|shopee|速卖通|店铺/i, key: 'ecommerce' },
      { test: /SaaS|软件|互联网|科技|APP|平台|小程序|系统开发/i, key: 'saas' },
      { test: /制造|工厂|生产|工艺|供应链|五金|注塑|机械/i, key: 'manufacturing' },
      { test: /教育|培训|学校|课程|教培|留学/i, key: 'education' },
      { test: /医疗|医药|医院|健康|器械|诊所/i, key: 'medical' },
      { test: /金融|银行|保险|证券|基金|信贷|支付/i, key: 'fin' },
      { test: /广告|营销|媒体|影视|出版|MCN|自媒体|品牌/i, key: 'media' },
      { test: /物流|仓储|快递|运输|货代|外贸/i, key: 'logistics' },
      { test: /餐饮|零售|门店|超市|连锁|奶茶|咖啡/i, key: 'retail' },
      { test: /建筑|工程|施工|装修|地产|市政/i, key: 'construction' },
      { test: /政府|政务|事业单位|公共服务|国企|社区/i, key: 'public' },
    ];

    /** 公司类型包：补 1 条组织环境相关的能力。 */
    const COMPANY_TYPES = {
      big: { name: '大公司/集团', cap: { name: '跨部门协同与流程合规', target: 4, action: '列出你常打交道的 3 个部门，各写清「找谁 / 要什么 / 多久」' } },
      startup: { name: '创业/小团队', cap: { name: '一岗多能与优先级', target: 4, action: '每周只留 3 件必须做成的事，其余明确说"这周不做"' } },
      foreign: { name: '外企/跨国', cap: { name: '英文表达与跨国协作', target: 4, action: '每周用英文写一段 5 行的进展同步，练到不用改' } },
      state: { name: '国企/事业单位', cap: { name: '流程留痕与政策口径', target: 4, action: '每件对外事项都留「依据 / 批复 / 时间」三样材料' } },
    };

    const COMPANY_RULES = [
      { test: /集团|大厂|上市|500 ?强|总部|事业部/i, key: 'big' },
      { test: /创业|初创|小团队|工作室|个体|夫妻店/i, key: 'startup' },
      { test: /外企|外资|跨国|海外|global|亚太/i, key: 'foreign' },
      { test: /国企|央企|事业单位|公务员|政府|机关/i, key: 'state' },
    ];

    function pickBy(rules, text, fallback) {
      const t = String(text || '');
      const hit = rules.find((r) => r.test.test(t));
      return hit ? hit.key : fallback;
    }

    /** 按「岗位 + 公司/业务」自动检索生成对标基线：岗位族 4 条 + 行业 2 条 + 公司类型 1 条。 */
    function deriveBaseline(work) {
      const w = work || {};
      const roleKey = pickBy(ROLE_RULES, w.role, 'general');
      const industryKey = pickBy(INDUSTRY_RULES, String(w.business || '') + ' ' + String(w.company || ''), '');
      const companyKey = pickBy(COMPANY_RULES, String(w.company || '') + ' ' + String(w.business || ''), '');
      const fam = ROLE_FAMILIES[roleKey] || ROLE_FAMILIES.general;
      const ind = industryKey ? INDUSTRIES[industryKey] : null;
      const co = companyKey ? COMPANY_TYPES[companyKey] : null;
      const items = fam.caps.slice(0, 4).map((c) => ({ id: c.id, name: c.name, target: c.target, action: c.action, why: '岗位族：' + fam.name }));
      if (ind) ind.caps.forEach((c, i) => items.push({ id: 'i-' + industryKey + '-' + i, name: c.name, target: c.target, action: c.action, why: '行业：' + ind.name }));
      if (co) items.push({ id: 'c-' + companyKey, name: co.cap.name, target: co.cap.target, action: co.cap.action, why: '公司类型：' + co.name });
      return {
        roleKey,
        roleName: fam.name,
        industryKey,
        industryName: ind ? ind.name : '',
        companyKey,
        companyName: co ? co.name : '',
        items,
        sig: [roleKey, industryKey, companyKey, w.role || '', w.business || '', w.company || ''].join('|'),
      };
    }

    /** 任务名 → 提效形态。规则命中即给建议；都不中则退回模板化 SOP。 */
    const AUTOMATIONS = [
      { re: /周报|月报|日报|报表|数据|统计|复盘/, form: '数据汇总 Agent', tip: '固定取数口径 → 按模板出表 → 异常值高亮 → 人只处理异常' },
      { re: /会议|纪要|同步|访谈|沟通记录/, form: '会议纪要 Agent', tip: '录音转写 → 按议题分段 → 抽待办与负责人 → 回填任务表' },
      { re: /审批|报销|合同|流程|签核|合规/, form: '审批工作流', tip: '表单触发 → 规则校验 → 分级审批 → 全链路留痕' },
      { re: /客服|答疑|回复|邮件|工单|咨询/, form: '回复 Agent', tip: '知识库检索 → 生成草稿 → 人工确认后发送' },
      { re: /方案|策划|汇报|PPT|文档|写作|brief|材料/, form: '写作 Agent', tip: '大纲 → 素材检索 → 初稿 → 按检查清单自检，人负责定稿' },
      { re: /跟进|客户|商机|线索|销售|谈判/, form: 'CRM 自动化', tip: '线索打分 → 跟进提醒 → 阶段流转 → 失单原因回收' },
      { re: /排期|计划|任务分配|进度|协调/, form: '排期工作流', tip: '任务拆到 0.5 天 → 标依赖 → 每日自动要进度' },
    ];

    const FIXED_FESTIVALS = [
      { name: '元旦', m: 1, d: 1 },
      { name: '情人节', m: 2, d: 14 },
      { name: '国庆节', m: 10, d: 1 },
      { name: '圣诞节', m: 12, d: 25 },
    ];

    const HOBBY_LIB = [
      {
        tag: '跑步',
        communities: [
          { name: '悦跑圈', url: 'https://www.thejoyrun.com' },
          { name: 'Keep 社区', url: 'https://www.gotokeep.com' },
          { name: '豆瓣跑步小组', url: 'https://www.douban.com/group/running/' },
        ],
        path: ['先定每周 2 次 × 3 公里，只求不断更', '记录配速与心率，4 周后单次加量不超过 10%', '报名一场 10 公里赛事，用比赛倒逼训练'],
      },
      {
        tag: '骑行',
        communities: [
          { name: '行者', url: 'https://www.imxingzhe.com' },
          { name: '美骑网', url: 'https://www.biketo.com' },
          { name: '贴吧骑行吧', url: 'https://tieba.baidu.com/f?kw=%E9%AA%91%E8%A1%8C' },
        ],
        path: ['先把通勤改成每周 2 次骑行，距离 8~10 公里', '学会基础保养（打气/补胎/调刹车），减少半路抛锚', '加入本地骑行群，参加一次 30 公里团骑'],
      },
      {
        tag: '游泳',
        communities: [
          { name: '知乎游泳话题', url: 'https://www.zhihu.com/topic/19553793' },
          { name: '豆瓣游泳小组', url: 'https://www.douban.com/group/swim/' },
          { name: '泳者论坛（必应）', url: 'https://www.bing.com/search?q=%E6%B8%B8%E6%B3%B3%E8%AE%BA%E5%9D%9B' },
        ],
        path: ['先固定每周 1 次，目标是从头到尾不停 200 米', '找教练纠正一次换气与打腿，效率立刻提升', '定一个 800 米计时目标，每月测一次'],
      },
      {
        tag: '健身',
        communities: [
          { name: 'Keep 训练营', url: 'https://www.gotokeep.com' },
          { name: '知乎健身话题', url: 'https://www.zhihu.com/topic/19551391' },
          { name: 'B 站健身区', url: 'https://www.bilibili.com/v/ent/training/' },
        ],
        path: ['先定每周 3 次 × 30 分钟，动作只练基础 5 个', '记录每次重量与组数，8 周后看进步曲线', '找个搭子或教练，把计划固定到日历里'],
      },
      {
        tag: '摄影',
        communities: [
          { name: '图虫', url: 'https://tuchong.com' },
          { name: '蜂鸟网', url: 'https://www.fengniao.com' },
          { name: '500px', url: 'https://500px.com' },
        ],
        path: ['先定 30 天同一主题（如"家门口的一公里"）每天 1 张', '每张照片只用一个参数变化，逼自己理解光圈/快门/ISO', '在社区发 10 张并收 3 条具体批评，再决定升级器材'],
      },
      {
        tag: '读书',
        communities: [
          { name: '豆瓣读书', url: 'https://book.douban.com' },
          { name: '微信读书', url: 'https://weread.qq.com' },
          { name: '小宇宙读书播客', url: 'https://www.xiaoyuzhoufm.com' },
        ],
        path: ['每天固定 20 分钟同一时段读，只求连续 21 天', '每本书只写 3 句话：讲了什么 / 我接受什么 / 我要改什么', '加入一个共读小组，每月至少一次输出'],
      },
      {
        tag: '写作',
        communities: [
          { name: '简书', url: 'https://www.jianshu.com' },
          { name: '豆瓣写作小组', url: 'https://www.douban.com/group/write/' },
          { name: '知乎创作中心', url: 'https://www.zhihu.com/creator' },
        ],
        path: ['先定每周 1 篇 500 字，写自己正在做的事', '固定一个栏目名与结构，降低每次开始的成本', '公开连续更新 8 周，用读者反馈挑一个方向深入'],
      },
      {
        tag: '吉他',
        communities: [
          { name: '吉他中国', url: 'https://www.guitarchina.com' },
          { name: 'B 站吉他区', url: 'https://www.bilibili.com/v/music/' },
          { name: '知乎吉他话题', url: 'https://www.zhihu.com/topic/19554816' },
        ],
        path: ['每天 15 分钟只练和弦转换，先能弹完一首歌', '用一首歌当"毕业曲"，允许弹得糙但必须完整', '找同城琴友或线上打卡群，每周交一次作业'],
      },
      {
        tag: '烹饪',
        communities: [
          { name: '下厨房', url: 'https://www.xiachufang.com' },
          { name: '豆果美食', url: 'https://www.douguo.com' },
          { name: 'B 站美食区', url: 'https://www.bilibili.com/v/food/' },
        ],
        path: ['先固定 5 道拿手菜，做到不用看菜谱', '每周尝试 1 道新菜，记录失败点', '请朋友来家里吃一次，用真实反馈定下一阶段'],
      },
      {
        tag: '徒步',
        communities: [
          { name: '两步路', url: 'https://www.2bulu.com' },
          { name: '8264 户外', url: 'https://www.8264.com' },
          { name: '豆瓣徒步小组', url: 'https://www.douban.com/group/hiking/' },
        ],
        path: ['先走 3 条 10 公里内的成熟路线，练体能与装备', '学会看轨迹与天气，出门前给家人发路线', '跟一个本地徒步群走一次 20 公里以上路线'],
      },
      {
        tag: '桌游',
        communities: [
          { name: 'BGG', url: 'https://boardgamegeek.com' },
          { name: '集石', url: 'https://www.jishi.com' },
          { name: '豆瓣桌游小组', url: 'https://www.douban.com/group/boardgame/' },
        ],
        path: ['先固定 3 款规则简单的游戏，熟悉到能教人', '每周组一次 2 小时局，固定 3~4 人', '尝试一款重度游戏，练规则讲解与结算'],
      },
      {
        tag: '绘画',
        communities: [
          { name: '站酷', url: 'https://www.zcool.com.cn' },
          { name: 'Lofter 绘画', url: 'https://www.lofter.com' },
          { name: 'B 站绘画区', url: 'https://www.bilibili.com/v/painting/' },
        ],
        path: ['每天 20 分钟速写，只画眼前的东西', '每周临摹 1 张完整作品，拆解构图与配色', '每月发一次作品，收集 3 条具体反馈'],
      },
    ];

    const WEEK_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

    /* ============================== 工具函数 ============================== */

    const clone = (v) => JSON.parse(JSON.stringify(v));

    const uid = () => Math.random().toString(36).slice(2, 9);

    /* ---------- 任务模板：只收文本类文件，正文截断保存 ---------- */

    const TEMPLATE_LIMIT = 40000;

    function normalizeTemplate(raw) {
      if (!raw || typeof raw !== 'object') return null;
      const name = String(raw.name || '').slice(0, 120);
      const text = String(raw.text || '').slice(0, TEMPLATE_LIMIT);
      if (!name && !text) return null;
      return {
        name: name || '（未命名模板）',
        size: Number(raw.size) || text.length,
        text,
        addedAt: String(raw.addedAt || ''),
      };
    }

    function fmtSize(n) {
      const v = Number(n) || 0;
      if (v < 1024) return v + ' B';
      return (v / 1024).toFixed(1) + ' KB';
    }

    const safeName = (s) => String(s || '任务').replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 40);

    /* ---------- Host 接口：地址检查与工作区生成（走 index.js 注册的本地路由） ---------- */

    const API_BASE = '/mirror-life/api';

    function apiUrl(p) {
      const relative = String(p || '').replace(/^\/+/, '');
      try {
        return new URL(relative, document.baseURI).pathname;
      } catch (err) {
        return '/' + relative;
      }
    }

    function postJson(p, body) {
      return fetch(apiUrl(p), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body || {}),
      }).then((res) => {
        if (!res.ok) throw new Error('Host 接口返回 HTTP ' + res.status + '，插件可能需要重启 DSH 后才生效');
        return res.json();
      });
    }

    const buildWorkspace = (payload) => postJson(API_BASE + '/build', payload);
    const uploadSource = (body) => postJson(API_BASE + '/upload', body);

    /* 三个上传口：成果模板 / 知识库 / 数据库 */
    const SOURCE_KINDS = [
      { key: 'template', label: '成果模板', hint: '交付物的结构以这里为准' },
      { key: 'knowledge', label: '知识库', hint: '背景资料、口径、历史文档' },
      { key: 'database', label: '数据库', hint: 'csv / xlsx / sqlite，或外部链接' },
    ];

    function emptySources() {
      return {
        template: { files: [], paths: [], urls: [] },
        knowledge: { files: [], paths: [], urls: [] },
        database: { files: [], paths: [], urls: [] },
      };
    }

    function normalizeSources(raw) {
      const base = emptySources();
      if (!raw || typeof raw !== 'object') return base;
      Object.keys(base).forEach((kind) => {
        const src = raw[kind] && typeof raw[kind] === 'object' ? raw[kind] : {};
        base[kind].files = Array.isArray(src.files)
          ? src.files.map((f) => ({ name: String(f.name || ''), size: Number(f.size) || 0, at: String(f.at || '') }))
          : [];
        base[kind].paths = Array.isArray(src.paths)
          ? src.paths.map((p) => ({ path: String(p.path || ''), exists: p.exists !== false, at: String(p.at || '') }))
          : [];
        base[kind].urls = Array.isArray(src.urls)
          ? src.urls.map((u) => ({ url: String(u.url || ''), at: String(u.at || '') })).filter((u) => u.url)
          : [];
      });
      return base;
    }

    /** 读成 base64（不带 data: 前缀），交给 Host 落盘。 */
    function readFileBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || '');
          const comma = result.indexOf(',');
          resolve(comma >= 0 ? result.slice(comma + 1) : '');
        };
        reader.onerror = () => reject(new Error('这个文件读不出来，可能需要换一个格式'));
        reader.readAsDataURL(file);
      });
    }

    function pickFiles(onPick, onError) {
      try {
        const el = document.createElement('input');
        el.type = 'file';
        el.multiple = true;
        el.style.display = 'none';
        el.onchange = () => {
          const files = Array.prototype.slice.call(el.files || []);
          if (files.length) onPick(files);
        };
        el.click();
      } catch (err) {
        if (onError) onError('当前环境不允许打开文件选择框。');
      }
    }

    function copyText(text) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(String(text || ''));
      } catch (err) {
        /* 落到下面的 reject */
      }
      return Promise.reject(new Error('浏览器不允许写剪贴板，请手动复制'));
    }

    function emptyState() {
      return {
        profile: { name: '', note: '', motto: DEFAULT_MOTTO, weeklyFamily: 7, weeklyWork: 45, sleepFloor: 7, priority: 'family' },
        family: [],
        work: { company: '', role: '', business: '', root: DEFAULT_MIRROR_ROOT, tasks: [], skills: {} },
        hobbies: [],
        health: emptyHealth(),
        week: { start: '', items: [] },
      };
    }

    function loadState() {
      try {
        const raw = window.localStorage.getItem(STORE_KEY);
        if (!raw) return emptyState();
        return normalize(JSON.parse(raw));
      } catch (err) {
        return emptyState();
      }
    }

    function normalize(input) {
      const base = emptyState();
      if (!input || typeof input !== 'object') return base;
      const out = base;
      if (input.profile && typeof input.profile === 'object') {
        out.profile.name = String(input.profile.name || '');
        out.profile.note = String(input.profile.note || '');
        out.profile.weeklyFamily = Math.min(80, Math.max(0, Number(input.profile.weeklyFamily) || 0));
        out.profile.weeklyWork = Math.min(100, Math.max(0, Number(input.profile.weeklyWork) || 0));
        out.profile.sleepFloor = Math.min(10, Math.max(4, Number(input.profile.sleepFloor) || 7));
        out.profile.motto = String(input.profile.motto || DEFAULT_MOTTO).slice(0, 80);
        out.profile.priority =
          input.profile.priority === 'work' || input.profile.priority === 'hobby' || input.profile.priority === 'health'
            ? input.profile.priority
            : 'family';
      }
      if (Array.isArray(input.family)) {
        out.family = input.family.map((m) => {
          const period = m && m.period && typeof m.period === 'object' ? m.period : {};
          const growth = m && m.growth && typeof m.growth === 'object' ? m.growth : {};
          const relation = String(m.relation || '家人');
          const canPeriod = relation === '爱人' || relation === '妻子';
          const canGrowth = relation === '儿子' || relation === '女儿';
          return {
            id: String(m.id || uid()),
            name: String(m.name || ''),
            relation,
            gender: String((m && m.gender) || ''),
            birthday: String(m.birthday || ''),
            hobbies: String(m.hobbies || ''),
            note: String(m.note || ''),
            avatar: String((m && m.avatar) || ''),
            period: {
              enabled: canPeriod && Boolean(period.enabled),
              lastStart: String(period.lastStart || ''),
              length: Math.min(35, Math.max(21, Number(period.length) || 28)),
            },
            growth: {
              enabled: canGrowth && Boolean(growth.enabled),
              note: String(growth.note || ''),
            },
          };
        });
      }
      if (input.work && typeof input.work === 'object') {
        const w = input.work;
        out.work.company = String(w.company || '');
        out.work.role = String(w.role || '');
        out.work.business = String(w.business || '');
        out.work.root = String(w.root || DEFAULT_MIRROR_ROOT);
        out.work.tasks = Array.isArray(w.tasks)
          ? w.tasks.map((t) => ({
              id: String(t.id || uid()),
              name: String(t.name || ''),
              freq: FREQ.some((f) => f.key === t.freq) ? t.freq : 'week',
              hours: Number(t.hours) || 1,
              desc: String(t.desc || ''),
              workflow: Array.isArray(t.workflow)
                ? t.workflow
                    .map((s) => ({ id: String((s && s.id) || uid()), name: String((s && s.name) || ''), note: String((s && s.note) || '') }))
                    .filter((s) => s.name)
                : [],
              template: normalizeTemplate(t.template),
              kb: String(t.kb || ''),
              db: String(t.db || ''),
              workspace:
                t.workspace && typeof t.workspace === 'object' && t.workspace.dir
                  ? {
                      dir: String(t.workspace.dir),
                      at: String(t.workspace.at || ''),
                      prompt: String(t.workspace.prompt || ''),
                      registered: Boolean(t.workspace.registered),
                      sources: normalizeSources(t.workspace.sources),
                    }
                  : null,
            }))
          : [];
        out.work.skills = w.skills && typeof w.skills === 'object' ? w.skills : {};
      }
      if (Array.isArray(input.hobbies)) {
        out.hobbies = input.hobbies.map((x) => ({ id: String(x.id || uid()), tag: String(x.tag || '') }));
      }
      if (input.health && typeof input.health === 'object') {
        const hh = input.health;
        out.health.height = String(hh.height || '');
        out.health.weight = String(hh.weight || '');
        out.health.lastExam = String(hh.lastExam || '');
        out.health.items = Array.isArray(hh.items)
          ? hh.items
              .map((it) => ({
                id: String((it && it.id) || uid()),
                at: String((it && it.at) || ''),
                name: String((it && it.name) || '').slice(0, 40),
                value: String((it && it.value) || '').slice(0, 20),
                unit: String((it && it.unit) || '').slice(0, 20),
                ref: String((it && it.ref) || '').slice(0, 40),
                status: ['normal', 'high', 'low', 'abnormal', 'unknown'].indexOf(it && it.status) >= 0 ? it.status : 'unknown',
              }))
              .filter((it) => it.name && it.value)
          : [];
        out.health.reports = Array.isArray(hh.reports)
          ? hh.reports
              .map((r) => ({
                id: String((r && r.id) || uid()),
                name: String((r && r.name) || '').slice(0, 60),
                at: String((r && r.at) || ''),
                size: Number((r && r.size) || 0),
              }))
              .filter((r) => r.name)
              .slice(-5)
          : [];
      }
      if (input.week && typeof input.week === 'object' && Array.isArray(input.week.items)) {
        out.week.start = String(input.week.start || '');
        out.week.items = input.week.items
          .map((x) => ({
            id: String((x && x.id) || uid()),
            date: String((x && x.date) || ''),
            who: String((x && x.who) || ''),
            title: String((x && x.title) || ''),
            why: String((x && x.why) || ''),
            done: Boolean(x && x.done),
          }))
          .filter((x) => x.date && x.title);
      }
      return out;
    }

    function saveState(state) {
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
      } catch (err) {
        /* 隐私模式或配额不足时静默降级，界面仍可用 */
      }
    }

    function startOfToday() {
      const n = new Date();
      return new Date(n.getFullYear(), n.getMonth(), n.getDate());
    }

    function parseDate(str) {
      if (!str) return null;
      const parts = String(str).split('-').map(Number);
      if (parts.length < 3 || !parts[0] || !parts[1] || !parts[2]) return null;
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    /** 距离下一次生日的天数（只在月和日上比较，今天=0，已过则算到明年）。 */
    function daysUntilBirthday(str) {
      const d = parseDate(str);
      if (!d) return null;
      const today = startOfToday();
      let next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
      if (next < today) next = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate());
      return Math.round((next - today) / 86400000);
    }

    function nthWeekday(year, month, weekday, n) {
      const first = new Date(year, month - 1, 1);
      const shift = (weekday - first.getDay() + 7) % 7;
      return new Date(year, month - 1, 1 + shift + (n - 1) * 7);
    }

    /** 未来 window 天内的固定节日（母亲节/父亲节按星期计算；农历节日不内置，避免算错）。 */
    function upcomingFestivals(windowDays) {
      const today = startOfToday();
      const y = today.getFullYear();
      const candidates = [];
      [y, y + 1].forEach((year) => {
        FIXED_FESTIVALS.forEach((f) => candidates.push({ name: f.name, date: new Date(year, f.m - 1, f.d) }));
        candidates.push({ name: '母亲节', date: nthWeekday(year, 5, 0, 2) });
        candidates.push({ name: '父亲节', date: nthWeekday(year, 6, 0, 3) });
      });
      return candidates
        .map((c) => ({ name: c.name, date: c.date, days: Math.round((c.date - today) / 86400000) }))
        .filter((c) => c.days >= 0 && c.days <= windowDays)
        .sort((a, b) => a.days - b.days);
    }

    function fmtDate(d) {
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return mm + '-' + dd;
    }

    /* ---------------- 农历节日（用浏览器内置的中国农历，不内置逐年日期表） ----------------
     * Intl 带 u-ca-chinese 时给出「农历月/日」，据此在下一个窗口里找节日。
     * 没有该能力的环境返回空数组，界面上就只显示公历节日，不会出错。
     */
    const LUNAR_NAMES = {
      '1-1': '春节',
      '1-15': '元宵节',
      '5-5': '端午节',
      '7-7': '七夕',
      '8-15': '中秋节',
      '9-9': '重阳节',
    };

    let lunarFmt = null;
    let lunarFmtReady = false;

    function lunarOf(date) {
      if (!lunarFmtReady) {
        lunarFmtReady = true;
        try {
          const f = new window.Intl.DateTimeFormat('en-u-ca-chinese', { month: 'numeric', day: 'numeric' });
          // 先试格式化一个已知日期，确认当前浏览器带了农历日历数据
          const parts = f.formatToParts(new Date(2026, 1, 17));
          if (parts && parts.length >= 2) lunarFmt = f;
        } catch (err) {
          lunarFmt = null;
        }
      }
      if (!lunarFmt) return null;
      try {
        const parts = lunarFmt.formatToParts(date);
        let month = '';
        let day = '';
        let leap = false;
        parts.forEach((p) => {
          if (p.type === 'month') {
            month = p.value;
            if (/bis|闰/i.test(p.value)) leap = true;
          }
          if (p.type === 'day') day = p.value;
        });
        const m = parseInt(month.replace(/[^\d]/g, ''), 10);
        const d = parseInt(day.replace(/[^\d]/g, ''), 10);
        if (!m || !d || leap) return null;
        return { m, d };
      } catch (err) {
        return null;
      }
    }

    function upcomingLunarFestivals(windowDays) {
      const today = startOfToday();
      const out = [];
      for (let i = 0; i <= windowDays; i += 1) {
        const d = addDays(today, i);
        const ld = lunarOf(d);
        if (!ld) continue;
        const name = LUNAR_NAMES[ld.m + '-' + ld.d];
        if (name) out.push({ name, date: d, days: i, lunar: true });
      }
      return out;
    }

    /** 公历 + 农历节日合并（农历优先占位，同一天不重复列）。 */
    function allFestivals(windowDays) {
      const list = upcomingFestivals(windowDays).concat(upcomingLunarFestivals(windowDays));
      const seen = {};
      return list
        .sort((a, b) => a.days - b.days)
        .filter((f) => {
          const key = fmtDate(f.date);
          if (seen[key]) return false;
          seen[key] = true;
          return true;
        });
    }

    function autoFor(name) {
      for (let i = 0; i < AUTOMATIONS.length; i += 1) {
        if (AUTOMATIONS[i].re.test(name || '')) return AUTOMATIONS[i];
      }
      return { form: '模板化 SOP', tip: '先把输入 / 输出 / 检查清单固定下来，稳定后再考虑 Agent 化' };
    }

    function weeklyHours(task) {
      const f = FREQ.find((x) => x.key === task.freq) || FREQ[1];
      return (Number(task.hours) || 0) * f.perWeek;
    }

    /* ---------------- 家人：年龄标签 / 经期 / 成长关注 / 头像 ---------------- */

    function addDays(date, n) {
      const d = new Date(date.getTime());
      d.setDate(d.getDate() + n);
      return d;
    }

    function ageInfo(birthday) {
      const d = parseDate(birthday);
      if (!d) return null;
      const now = startOfToday();
      if (d > now) return { label: '日期在未来', months: 0, years: 0 };
      let months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (now.getDate() < d.getDate()) months -= 1;
      months = Math.max(0, months);
      const years = Math.floor(months / 12);
      const rest = months % 12;
      let label;
      if (months < 12) label = months + ' 个月';
      else if (years >= 18 || rest === 0) label = years + ' 岁';
      else label = years + ' 岁 ' + rest + ' 个月';
      return { label, months, years };
    }

    /** 经期推算：下次预计开始日、当前阶段与关怀提示。周期 21~35 天，默认 28。 */
    function cycleInfo(period) {
      const start = parseDate(period && period.lastStart);
      if (!start) return null;
      const len = Math.min(35, Math.max(21, Number(period && period.length) || 28));
      const today = startOfToday();
      if (start > today) return { error: '上次开始日期在未来，改一下才能推算' };
      let next = addDays(start, len);
      let guard = 0;
      while (next <= today && guard < 24) {
        next = addDays(next, len);
        guard += 1;
      }
      let cur = start;
      guard = 0;
      while (addDays(cur, len) <= today && guard < 24) {
        cur = addDays(cur, len);
        guard += 1;
      }
      const cycleDay = Math.round((today.getTime() - cur.getTime()) / 86400000) + 1;
      const daysToNext = Math.round((next.getTime() - today.getTime()) / 86400000);
      const ovu = addDays(next, -14);
      const fertileFrom = addDays(ovu, -5);
      const fertileTo = addDays(ovu, 1);
      const t = today.getTime();
      let phase;
      let tip;
      if (cycleDay <= 5) {
        phase = '经期';
        tip = '这几天别安排重活：备好热饮与止痛药，晚上多问一句「今天累不累」。';
      } else if (t >= fertileFrom.getTime() && t <= fertileTo.getTime()) {
        phase = '排卵期';
        tip = '体力和情绪通常最好，适合一起安排运动或出门走走。';
      } else if (t < ovu.getTime()) {
        phase = '卵泡期';
        tip = '精力在回升，适合商量计划和需要耐心的事。';
      } else {
        phase = '黄体期';
        tip = '容易疲倦或情绪起伏：少争论，多分担家务，提醒早点睡。';
      }
      return { len, next, daysToNext, cycleDay, phase, tip, ovu, fertileFrom, fertileTo };
    }

    const GROWTH_STAGES = [
      { max: 12, name: '婴儿期', focus: ['作息与喂养规律', '大动作与精细动作', '眼神与声音回应', '建立安全感'], act: '每天固定 3 段「专注陪伴 10 分钟」，期间不看手机。' },
      { max: 36, name: '幼儿期', focus: ['语言爆发：多对话少纠正', '自主吃饭穿衣', '情绪命名与安抚', '每天户外 1 小时'], act: '每天睡前共读 10 分钟；周末带去一次跑跳类活动。' },
      { max: 72, name: '学龄前', focus: ['规则感与等待', '握笔与自理', '同伴交往', '保护好奇心'], act: '每周一次「你问我答」：让 TA 提问，你只回答不评价。' },
      { max: 144, name: '小学', focus: ['学习习惯：先做后玩', '阅读量与表达', '一项长期运动', '屏幕时间边界'], act: '固定作业时段与起床时间；每周至少一次亲子运动。' },
      { max: 216, name: '初中', focus: ['自主学习与计划', '同伴关系与边界', '承接情绪波动', '兴趣深入'], act: '每周一次 20 分钟「只聊不劝」，建议留到 TA 问起时。' },
      { max: 9999, name: '高中/成年', focus: ['目标感与选择能力', '压力管理与睡眠', '金钱与责任', '独立生活技能'], act: '每月一次「未来 6 个月」对话：听计划，只帮 TA 补资源。' },
    ];

    function growthInfo(birthday) {
      const a = ageInfo(birthday);
      if (!a) return null;
      const stage = GROWTH_STAGES.find((s) => a.months < s.max) || GROWTH_STAGES[GROWTH_STAGES.length - 1];
      return { stage: stage.name, focus: stage.focus, act: stage.act, age: a.label, months: a.months };
    }

    function initialOf(name) {
      const s = String(name || '').trim();
      return s ? s.slice(0, 1) : '?';
    }

    function pickImage(onPick, onError) {
      let input;
      try {
        input = document.createElement('input');
      } catch (err) {
        onError && onError('当前环境不支持选图');
        return;
      }
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files && input.files[0];
        if (!file) return;
        if (!/^image\//.test(file.type || '')) {
          onError && onError('只能选图片文件（jpg / png / webp）');
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const raw = String(reader.result || '');
          shrinkAvatar(raw, (out) => onPick(out), onError);
        };
        reader.onerror = () => onError && onError('读取图片失败，换一张试试');
        reader.readAsDataURL(file);
      };
      input.click();
    }

    /** 头像压缩成 160×160 JPEG；浏览器没有 canvas 时退回原图（限 200KB）。 */
    function shrinkAvatar(raw, done, onError) {
      const fail = () => {
        if (raw.length > 260000) {
          onError && onError('图片太大（压缩不可用时上限 200KB），先裁小一点');
          return;
        }
        done(raw);
      };
      let canvas = null;
      let ctx = null;
      try {
        canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 160;
        ctx = canvas.getContext && canvas.getContext('2d');
      } catch (err) {
        ctx = null;
      }
      if (!ctx) {
        fail();
        return;
      }
      const img = new window.Image();
      img.onload = () => {
        try {
          const side = Math.min(img.width || 160, img.height || 160);
          ctx.drawImage(img, ((img.width || side) - side) / 2, ((img.height || side) - side) / 2, side, side, 0, 0, 160, 160);
          const out = canvas.toDataURL('image/jpeg', 0.82);
          if (!out || out.length < 64) {
            fail();
            return;
          }
          done(out);
        } catch (err) {
          fail();
        }
      };
      img.onerror = () => onError && onError('这个格式读不了，换成 jpg 或 png 试试');
      img.src = raw;
    }

    function careTip(member, days) {
      const hobby = member.hobbies ? '（' + member.hobbies + '）' : '';
      if (days === null) return '补上生日日期，提醒才有意义。';
      if (days === 0) return '今天生日：一条语音比红包有效，晚上 8 点前打过去。';
      if (days <= 7) return '生日还有 ' + days + ' 天：今天下单礼物' + hobby + '，预约当天送达。';
      if (days <= 30) return '生日还有 ' + days + ' 天：本周定下礼物方向与预算，别拖到最后一周。';
      return '本周安排一次 20 分钟专注交流（不谈工作，聊 TA 最近在忙什么）。';
    }

    /* ---------------- 本周关怀计划：把「分配时间」落成 7 天里的具体动作 ---------------- */

    function isoDate(d) {
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function weekStartOf(date) {
      const d = new Date(date.getTime());
      const wd = (d.getDay() + 6) % 7; /* 周一 = 0 */
      d.setDate(d.getDate() - wd);
      d.setHours(0, 0, 0, 0);
      return d;
    }

    const WEEKDAY = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

    /** 按生日 / 节日 / 经期 / 成长阶段 / 常规陪伴 生成一周动作，最多 12 条。 */
    function buildWeekPlan(state) {
      const today = startOfToday();
      const start = weekStartOf(today);
      const items = [];
      const push = (date, who, title, why) => {
        const key = isoDate(date) + '|' + who + '|' + title;
        if (items.some((x) => x.key === key)) return;
        items.push({ key, id: uid(), date: isoDate(date), who, title, why, done: false });
      };

      state.family.forEach((m) => {
        const d = daysUntilBirthday(m.birthday);
        if (d !== null && d <= 14) {
          const day = addDays(today, d);
          push(addDays(day, -2), m.name, '准备生日礼物与当天安排' + (m.hobbies ? '（' + m.hobbies + '）' : ''), '生日 ' + fmtDate(day));
          push(day, m.name, '当天打电话或到场（20:00 前）', '生日当天');
        }
      });

      allFestivals(14).forEach((f) => {
        push(addDays(today, Math.max(0, f.days - 1)), '全家', '准备' + f.name + '（' + fmtDate(f.date) + '）', f.lunar ? '农历节日' : '节日');
      });

      state.family.forEach((m) => {
        const c = cycleInfo(m.period);
        if (c && !c.error && c.daysToNext !== null && c.daysToNext <= 10) {
          push(addDays(today, c.daysToNext), m.name, '备好经期用品与热饮，这几天少排重活', '预计 ' + c.phase + '（' + fmtDate(c.next) + '）');
        }
        const g = growthInfo(m.birthday);
        if (g && g.focus && g.focus.length) {
          push(addDays(start, 5), m.name, g.act || ('关注：' + g.focus[0]), '成长阶段 · ' + g.stage);
        }
      });

      state.family.slice(0, 6).forEach((m, i) => {
        push(addDays(start, (i + 1) % 7), m.name, '20 分钟专注交流（' + (m.hobbies || '聊 TA 最近在忙什么') + '）', '常规陪伴');
      });

      return {
        start: isoDate(start),
        items: items.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)).slice(0, 12).map((x) => ({
          id: x.id,
          date: x.date,
          who: x.who,
          title: x.title,
          why: x.why,
          done: false,
        })),
      };
    }

    /** 「我」的节奏：把每周时间预算与优先级翻译成一句可执行的话。 */
    function rhythmNote(state) {
      const p = state.profile;
      const n = state.family.length;
      const perPerson = n ? p.weeklyFamily / n : 0;
      const parts = [];
      if (!n) parts.push('先加家人，时间才有分配对象。');
      else if (p.weeklyFamily <= 0) parts.push('每周家庭时间是 0——先给自己定一个下限（建议 ≥7 小时）。');
      else parts.push('每周 ' + p.weeklyFamily + ' 小时给家庭，平均每人 ' + perPerson.toFixed(1) + ' 小时。');
      if (p.priority === 'family') parts.push('这季度第一优先是家庭，工作排第二。');
      if (p.priority === 'work') parts.push('这季度第一优先是工作：家庭时间要守住下限，别被挤没。');
      if (p.priority === 'hobby') parts.push('这季度第一优先是爱好：每周至少留 2 次练习。');
      if (p.priority === 'health') parts.push('这季度第一优先是身体：睡眠底线 ' + p.sleepFloor + ' 小时不能破。');
      return parts.join(' ');
    }


    const FLOW_FALLBACK = ['收集输入与参考', '拆成可执行动作', '执行并记录卡点', '给出结论与下一步'];

    const FLOW_RULES = [
      { test: /(数据|报表|周报|月报|日报|复盘|指标|广告|投放|ACOS|CPC|转化|流量|GMV|业绩)/i,
        steps: ['拉取数据并锁定窗口', '按维度拆分对比', '定位异常与归因', '给出调整动作'] },
      { test: /(客户|客服|邮件|消息|差评|售后|退款|投诉|工单)/i,
        steps: ['收集待处理消息与订单', '分类并排优先级', '查单查规则确认事实', '给回复与补偿方案'] },
      { test: /(上架|选品|listing|新品|主图|详情页|关键词|文案)/i,
        steps: ['收集产品资料与合规要求', '写标题五点与关键词', '处理图片与素材', '提交并跟踪审核'] },
      { test: /(补货|库存|采购|订货|供应链|交期|仓储)/i,
        steps: ['拉销量与库存/在途', '算安全库存与订货点', '按促销与季节调整', '出补货单并确认交期'] },
      { test: /(合同|审批|合规|政策|条款|风险|法务|授权)/i,
        steps: ['收集材料与关联文件', '逐条核对条款规则', '标出风险点与依据', '给处理建议并留痕'] },
      { test: /(会|纪要|议程|讨论|评审|对齐)/i,
        steps: ['确认议程与参会人', '记录要点与决议', '整理成纪要结构', '分发并跟踪待办'] },
      { test: /(方案|汇报|提案|PPT|演讲|计划|规划)/i,
        steps: ['明确听众与目的', '搭结构列要点', '补数据与证据', '成稿并预判问答'] },
    ];

    function splitClauses(desc) {
      return String(desc || '')
        .split(/[。；;\n\r]+/)
        .map((s) => s.replace(/^[-*·\d\s.、)]+/, '').trim())
        .filter((s) => s.length >= 4 && s.length <= 30);
    }

    function inferWorkflow(task, role) {
      const text = String((task && task.name) || '') + ' ' + String((task && task.desc) || '');
      const rule = FLOW_RULES.find((r) => r.test.test(text));
      const clauses = splitClauses(task && task.desc);
      const middle = clauses.length >= 2 ? clauses.slice(0, 4) : (rule ? rule.steps.slice() : FLOW_FALLBACK.slice());
      const steps = ['确认交付物与截止时间'];
      steps.push(role ? '按「' + role + '」的标准定验收线' : '定下这次算合格的验收线');
      middle.forEach((s) => steps.push(s));
      steps.push('按成果模板成稿并自检');
      return steps.map((s) => ({ id: uid(), name: s, note: '' }));
    }

    function ensureWorkflow(task, role) {
      if (task && Array.isArray(task.workflow) && task.workflow.length) return task.workflow;
      return inferWorkflow(task, role);
    }

    function reportMarkdown(state) {
      const w = state.work;
      const baseline = deriveBaseline(w);
      const expert = { name: baseline.roleName, caps: baseline.items };
      const rows = w.tasks
        .map((t) => ({ t, perWeek: weeklyHours(t) }))
        .sort((a, b) => b.perWeek - a.perWeek);
      const total = rows.reduce((s, r) => s + r.perWeek, 0);
      const caps = expert.caps.map((c) => {
        const level = Number(w.skills[c.id]) || 0;
        return { c, level, gap: c.target - level };
      });
      const gaps = caps.filter((x) => x.gap > 0).sort((a, b) => b.gap - a.gap);
      const now = new Date();
      const stamp =
        now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

      const lines = [];
      lines.push('# 镜像人生 · 工作提效与能力差距报告');
      lines.push('');
      lines.push('> ' + (state.profile.motto || DEFAULT_MOTTO));
      lines.push('');
      lines.push('- 生成时间：' + stamp);
      lines.push('- 岗位：' + (w.role || '（未填）'));
      lines.push('- 公司：' + (w.company || '（未填）'));
      lines.push('- 公司业务：' + (w.business || '（未填）'));
      lines.push('- 对标基线：' + baseline.roleName
        + (baseline.industryName ? ' / ' + baseline.industryName : '')
        + (baseline.companyName ? ' / ' + baseline.companyName : '')
        + '（按岗位与公司业务自动检索生成，非真人专家，仅供对照）');
      lines.push('- 说明：本报告由本机规则生成，未经过 AI 推理；数字来自你的填写。');
      lines.push('');
      lines.push('## 一、任务盘点（按周耗时排序）');
      lines.push('');
      if (!rows.length) {
        lines.push('_尚未录入任务。_');
      } else {
        lines.push('| 任务 | 频次 | 单次耗时 | 周耗时 | 建议形态 |');
        lines.push('| --- | --- | --- | --- | --- |');
        rows.forEach((r) => {
          lines.push(
            '| ' + r.t.name + ' | ' + (FREQ.find((f) => f.key === r.t.freq) || {}).label + ' | ' + r.t.hours + ' h | ' + r.perWeek.toFixed(1) + ' h | ' + autoFor(r.t.name).form + ' |',
          );
        });
        lines.push('');
        lines.push('合计每周投入：**' + total.toFixed(1) + ' 小时**。');
      }
      lines.push('');
      lines.push('## 二、提效路线（三阶段）');
      lines.push('');
      const phase1 = rows.filter((r) => autoFor(r.t.name).form === '模板化 SOP');
      const phase2 = rows.slice(0, 3);
      lines.push('### 第 1 周：先模板化（不需要技术，今天就能做）');
      if (phase1.length) phase1.forEach((r) => lines.push('- **' + r.t.name + '**：' + autoFor(r.t.name).tip));
      else lines.push('- 把耗时最长的任务先写成固定模板：输入 / 输出 / 检查清单三栏。');
      lines.push('');
      lines.push('### 第 2~4 周：半自动 Agent（先做省时最多的前 3 项）');
      phase2.forEach((r) => {
        const a = autoFor(r.t.name);
        lines.push('- **' + r.t.name + '**（每周 ' + r.perWeek.toFixed(1) + ' h）→ ' + a.form + '：' + a.tip);
      });
      if (!phase2.length) lines.push('- 先补录任务，再谈自动化。');
      lines.push('');
      lines.push('### 第 2 个月起：工作流闭环');
      lines.push('- 把已跑通的 Agent 串成流程：触发 → 处理 → 人工确认 → 留痕。');
      lines.push('- 每个流程设一个指标（省下的小时数或返工次数），每月看一次。');
      lines.push('');
      lines.push('## 三、能力差距（对标 ' + baseline.roleName + (baseline.industryName ? ' · ' + baseline.industryName : '') + '）');
      lines.push('');
      if (!caps.length) {
        lines.push('_当前基线没有可对照的能力项。_');
      } else {
        lines.push('| 能力 | 来源 | 你的水平 | 期望 | 差距 | 强化动作 |');
        lines.push('| --- | --- | --- | --- | --- | --- |');
        caps.forEach((x) => {
          lines.push(
            '| ' + x.c.name + ' | ' + (x.c.why || '基线') + ' | ' + (x.level ? x.level : '未评') + ' | ' + x.c.target + ' | ' + (x.gap > 0 ? '+' + x.gap : '达标') + ' | ' + x.c.action + ' |',
          );
        });
      }
      lines.push('');
      lines.push('## 四、未来 7 天行动');
      lines.push('');
      if (gaps.length) {
        gaps.slice(0, 3).forEach((x, i) => lines.push(i + 1 + '. ' + x.c.name + '：' + x.c.action));
      } else {
        lines.push('1. 任选一项能力，给自己定一个可被检验的小目标。');
      }
      if (rows.length) lines.push((gaps.length ? Math.min(gaps.length, 3) : 1) + 1 + '. 为「' + rows[0].t.name + '」生成第一个智能体工作区，并按成果模板跑一次。');
      lines.push('');
      lines.push('## 五、成果模板');
      lines.push('');
      const tplEntries = [];
      w.tasks.forEach((t) => {
        if (t.template && t.template.text) tplEntries.push({ task: t, label: t.template.name, from: '任务卡（旧数据）' });
        const sr = normalizeSources(t.workspace && t.workspace.sources);
        const bucket = sr.template || { files: [], paths: [] };
        bucket.files.forEach((f) => tplEntries.push({ task: t, label: f.name, from: '工作区 成果模板/' }));
        bucket.paths.forEach((p) => tplEntries.push({ task: t, label: p.path, from: '登记路径' }));
      });
      if (!tplEntries.length) {
        lines.push('_还没有成果模板。生成智能体工作流后，在「成果模板」上传口传一份，agent 就会按它的结构写交付物。_');
      } else {
        lines.push('| 任务 | 成果模板 | 来源 |');
        lines.push('| --- | --- | --- |');
        tplEntries.forEach((e) => {
          lines.push('| ' + e.task.name + ' | `' + e.label + '` | ' + e.from + ' |');
        });
        lines.push('');
      }
      const legacyTpls = w.tasks.filter((t) => t.template && t.template.text);
      legacyTpls.forEach((t) => {
        lines.push('### 旧模板原文：' + t.name + ' · ' + t.template.name);
        lines.push('');
        lines.push('```text');
        lines.push(String(t.template.text).replace(/\s+$/, ''));
        lines.push('```');
        lines.push('');
      });
      lines.push('## 六、工作区与输入（三个上传口）');
      lines.push('');
      const wsTasks = w.tasks.filter((t) => t.workspace && t.workspace.dir);
      const wsRoot = w.root || DEFAULT_MIRROR_ROOT;
      if (!wsTasks.length) {
        lines.push('_还没有生成工作区。在任务上点「一键生成智能体工作流」，会在 `' + wsRoot + '\\' + WORK_DIR_NAME + '\\` 下建一个目录：AGENTS.md（智能体定义）+ 任务说明 + 成果模板/ + 知识库/ + 数据库/ + outputs/。_');
      } else {
        lines.push('- 镜像人生根目录：`' + wsRoot + '`');
        lines.push('- 工作区根：`' + wsRoot + '\\' + WORK_DIR_NAME + '`');
        lines.push('');
        wsTasks.forEach((t) => {
          lines.push('### 工作区：' + t.name);
          lines.push('');
          lines.push('- 目录：`' + t.workspace.dir + '`');
          if (t.desc) lines.push('- 工作内容：' + t.desc);
          const flow = ensureWorkflow(t, w.role);
          if (flow.length) lines.push('- 工作流：' + flow.map((s, i) => (i + 1) + ') ' + s.name).join(' → ') + '（写进 AGENTS.md，可改）');
          lines.push('- 智能体：`AGENTS.md`（在该目录开新会话会自动读取）' + (t.workspace.registered ? ' · 已登记到工作区列表' : ''));
          const src = normalizeSources(t.workspace.sources);
          SOURCE_KINDS.forEach((spec) => {
            const bucket = src[spec.key] || { files: [], paths: [], urls: [] };
            const items = bucket.files
              .map((f) => '`' + f.name + '`')
              .concat(bucket.paths.map((p) => '`' + p.path + '`（本机）'))
              .concat((bucket.urls || []).map((u) => '<' + u.url + '>'));
            lines.push('- ' + spec.label + '：' + (items.length ? items.join('、') : '未登记'));
          });
          lines.push('- 取数顺序：成果模板 → 知识库 → 数据库 → 缺口 → 成稿（见 `输入清单.md`）');
          if (t.workspace.prompt) {
            lines.push('- 启动提示词：');
            lines.push('');
            lines.push('```text');
            lines.push(String(t.workspace.prompt));
            lines.push('```');
            lines.push('');
          }
        });
      }
      lines.push('## 七、家庭节奏与本周关怀');
      lines.push('');
      const pf = state.profile || {};
      lines.push('- 时间预算：每周给家庭 ' + (pf.weeklyFamily || 0) + ' h · 每周工作 ' + (pf.weeklyWork || 0) + ' h · 睡眠底线 ' + (pf.sleepFloor || 0) + ' h');
      lines.push('- 本季度第一优先：' + ({ family: '家庭', work: '工作', hobby: '爱好', health: '身体' }[pf.priority] || '未填'));
      lines.push('- 判断：' + rhythmNote(state));
      lines.push('');
      const wk = (state.week && state.week.items) || [];
      if (!wk.length) {
        lines.push('_本周关怀计划还没生成。打开「家庭」页点「生成本周计划」。_');
      } else {
        lines.push('| 日期 | 动作 | 对象 | 原因 | 完成 |');
        lines.push('| --- | --- | --- | --- | --- |');
        wk.forEach((x) => {
          lines.push('| ' + x.date + ' | ' + x.title + ' | ' + (x.who || '-') + ' | ' + (x.why || '-') + ' | ' + (x.done ? '✓' : ' ') + ' |');
        });
        lines.push('');
        lines.push('已完成 ' + wk.filter((x) => x.done).length + ' / ' + wk.length + ' 条。');
      }
      lines.push('');
      lines.push('## 八、身体健康（指标与提醒）');
      lines.push('');
      const hh = state.health || emptyHealth();
      const hItems = hh.items || [];
      const bmi = bmiInfo(hh.height, hh.weight);
      lines.push('- 身体档案：身高 ' + (hh.height || '—') + ' cm · 体重 ' + (hh.weight || '—') + ' kg · BMI ' + (bmi ? bmi.bmi + '（' + bmi.label + '）' : '未填') + ' · 最近体检 ' + (hh.lastExam || '未填'));
      lines.push('');
      if (hItems.length) {
        lines.push('| 指标 | 数值 | 参考 | 状态 |');
        lines.push('| --- | --- | --- | --- |');
        hItems.forEach((it) => {
          lines.push('| ' + it.name + ' | ' + it.value + (it.unit ? ' ' + it.unit : '') + ' | ' + (it.ref || '—') + ' | ' + (HEALTH_STATUS[it.status] || '待确认') + ' |');
        });
        lines.push('');
      } else {
        lines.push('_还没有录入健康指标：打开「健康」页上传体检报告或手动添加。_');
        lines.push('');
      }
      lines.push('需要注意：');
      healthNotes(hh, state.profile).forEach((n) => {
        lines.push('- ' + n.text);
      });
      lines.push('');
      lines.push('---');
      lines.push('_镜像人生 MVP v0.8.0 · 规则生成，非投资/职业/医疗建议_');
      return lines.join('\n');
    }

    function downloadText(filename, text) {
      try {
        const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      } catch (err) {
        /* 下载失败不阻断界面 */
      }
    }

    /* ============================== 基础组件 ============================== */

    function Field(props) {
      return h('div', { className: 'ml-field', style: props.style || null },
        h('label', null, props.label),
        props.children,
      );
    }

    function TextInput(props) {
      return h('input', {
        className: 'ml-in',
        type: props.type || 'text',
        value: props.value,
        placeholder: props.placeholder || '',
        onChange: (e) => props.onChange(e.target.value),
        style: props.width ? { width: props.width } : null,
      });
    }

    function TextArea(props) {
      return h('textarea', {
        className: 'ml-in',
        value: props.value,
        placeholder: props.placeholder || '',
        onChange: (e) => props.onChange(e.target.value),
        rows: props.rows || 3,
      });
    }

    function Select(props) {
      return h('select', {
        className: 'ml-in',
        value: props.value,
        onChange: (e) => props.onChange(e.target.value),
        style: props.width ? { width: props.width } : null,
      }, props.options.map((o) => h('option', { key: o.value, value: o.value }, o.label)));
    }

    function Btn(props) {
      const cls = 'ml-btn' + (props.variant ? ' ' + props.variant : '');
      return h('button', { className: cls, type: 'button', onClick: props.onClick, disabled: props.disabled || false }, props.children);
    }

    function Card(props) {
      return h('div', { className: 'ml-card' }, props.title ? h('h3', null, props.title, props.hint ? h('small', null, props.hint) : null) : null, props.children);
    }

    function Empty(props) {
      return h('div', { className: 'ml-empty' }, props.children);
    }

    /* ============================== 健康 ============================== */

    const HEALTH_STATUS = { normal: '正常', high: '偏高', low: '偏低', abnormal: '异常', unknown: '待确认' };

    const EXAM_MARKERS = [
      { name: '收缩压', unit: 'mmHg', ref: '90~140', re: /(收缩压|高压)[^0-9]{0,14}(\d{2,3})/, min: 90, max: 140 },
      { name: '舒张压', unit: 'mmHg', ref: '60~90', re: /(舒张压|低压)[^0-9]{0,14}(\d{2,3})/, min: 60, max: 90 },
      { name: '空腹血糖', unit: 'mmol/L', ref: '3.9~6.1', re: /(空腹血糖|血糖|GLU)[^0-9]{0,14}(\d+(?:\.\d+)?)/, min: 3.9, max: 6.1 },
      { name: '总胆固醇', unit: 'mmol/L', ref: '2.9~5.2', re: /(总胆固醇|TC)[^0-9]{0,14}(\d+(?:\.\d+)?)/, min: 2.9, max: 5.2 },
      { name: '甘油三酯', unit: 'mmol/L', ref: '0.4~1.7', re: /(甘油三酯|TG)[^0-9]{0,14}(\d+(?:\.\d+)?)/, min: 0.4, max: 1.7 },
      { name: '低密度脂蛋白', unit: 'mmol/L', ref: '0~3.4', re: /(低密度脂蛋白|LDL)[^0-9]{0,14}(\d+(?:\.\d+)?)/, max: 3.4 },
      { name: '高密度脂蛋白', unit: 'mmol/L', ref: '1.0~1.6', re: /(高密度脂蛋白|HDL)[^0-9]{0,14}(\d+(?:\.\d+)?)/, min: 1.0 },
      { name: '尿酸', unit: 'μmol/L', ref: '155~420', re: /(尿酸|UA)[^0-9]{0,14}(\d+(?:\.\d+)?)/, min: 155, max: 420 },
      { name: '肌酐', unit: 'μmol/L', ref: '44~115', re: /(肌酐|CREA|Cr)[^0-9]{0,14}(\d+(?:\.\d+)?)/, min: 44, max: 115 },
      { name: '谷丙转氨酶', unit: 'U/L', ref: '7~40', re: /(谷丙转氨酶|丙氨酸氨基转移酶|ALT)[^0-9]{0,14}(\d+(?:\.\d+)?)/, min: 7, max: 40 },
      { name: '谷草转氨酶', unit: 'U/L', ref: '13~35', re: /(谷草转氨酶|天冬氨酸氨基转移酶|AST)[^0-9]{0,14}(\d+(?:\.\d+)?)/, min: 13, max: 35 },
      { name: '血红蛋白', unit: 'g/L', ref: '115~150', re: /(血红蛋白|HGB|Hb)[^0-9]{0,14}(\d+(?:\.\d+)?)/, min: 115, max: 150 },
      { name: '白细胞', unit: '×10⁹/L', ref: '3.5~9.5', re: /(白细胞|WBC)[^0-9]{0,14}(\d+(?:\.\d+)?)/, min: 3.5, max: 9.5 },
      { name: '血小板', unit: '×10⁹/L', ref: '125~350', re: /(血小板|PLT)[^0-9]{0,14}(\d+(?:\.\d+)?)/, min: 125, max: 350 },
      { name: '促甲状腺激素', unit: 'mIU/L', ref: '0.27~4.2', re: /(促甲状腺激素|TSH)[^0-9]{0,14}(\d+(?:\.\d+)?)/, min: 0.27, max: 4.2 },
      { name: '总胆红素', unit: 'μmol/L', ref: '3.4~20.5', re: /(总胆红素|TBIL)[^0-9]{0,14}(\d+(?:\.\d+)?)/, min: 3.4, max: 20.5 },
      { name: '心率', unit: '次/分', ref: '60~100', re: /(心率|脉搏)[^0-9]{0,12}(\d{2,3})/, min: 60, max: 100 },
    ];

    const EXAM_TEXT_MARKERS = [
      { name: '脂肪肝', ref: '未见脂肪肝', re: /(轻度|中度|重度)?\s*脂肪肝/, value: (m) => (m[1] ? m[1] + '脂肪肝' : '脂肪肝') },
      { name: '甲状腺结节', ref: '未见结节', re: /甲状腺结节/, value: () => '见报告描述' },
      { name: '幽门螺杆菌', ref: '阴性', re: /(幽门螺杆菌|Hp)[^。\n]{0,10}(阳性|阴性)/, value: (m) => m[2] },
    ];

    const HEALTH_ADVICE = {
      收缩压: '少盐（每天≤5g）、少熬夜；连续 3 天早晚各测一次，持续高于 140 就去医院。',
      舒张压: '和收缩压一起看，别只测一次就下结论；安静坐 5 分钟再测。',
      空腹血糖: '先停含糖饮料和夜宵，餐后走 15 分钟；复查空腹血糖和糖化血红蛋白。',
      总胆固醇: '少油炸、少肥肉；多吃燕麦、豆类、深海鱼，3 个月后复查。',
      甘油三酯: '主要来自酒和精制碳水：先戒酒、少甜食，3 个月后复查。',
      低密度脂蛋白: '这是「坏胆固醇」，优先减饱和脂肪（肥肉、奶油、椰子油），必要时听医生的。',
      高密度脂蛋白: '这是「好胆固醇」，偏低时多做有氧（快走、骑车、游泳），每周 150 分钟。',
      尿酸: '少啤酒、少动物内脏和浓汤，每天喝水 2000ml 以上；关节红肿热痛立刻就医。',
      肌酐: '别自行吃蛋白粉、止痛药；复查肾功，有明显水肿尽快就医。',
      谷丙转氨酶: '先停酒、停来路不明的保健品，2~4 周复查肝功。',
      谷草转氨酶: '结合谷丙一起看，近期别熬夜、别剧烈运动后再抽血。',
      血红蛋白: '偏低时查一下是否缺铁；红肉/动物肝脏配维 C，女性留意经期量。',
      白细胞: '近期有感冒/感染会偏高，2 周后复查血常规。',
      血小板: '和白细胞一起看；明显异常去血液科复查。',
      促甲状腺激素: '内分泌科看看，别自行补碘或忌碘。',
      总胆红素: '轻度偏高常见于熬夜/疲劳，明显升高或伴眼黄要就医。',
      心率: '静息心率偏快要看是否熬夜、咖啡因、焦虑；持续 >100 或 <50 就医。',
      脂肪肝: '减重 5% 就能明显改善；少酒、少糖、多动。',
      甲状腺结节: '按报告建议复查超声，绝大多数不用处理，别焦虑。',
      幽门螺杆菌: '消化内科规范四联用药，家里分餐、用公筷。',
    };

    function emptyHealth() {
      return { items: [], reports: [], height: '', weight: '', lastExam: '' };
    }

    function bmiInfo(height, weight) {
      const h = Number(height) / 100;
      const w = Number(weight);
      if (!(h > 0.8 && h < 2.4) || !(w > 20 && w < 300)) return null;
      const bmi = w / (h * h);
      let label = '正常';
      let level = 'ok';
      if (bmi < 18.5) {
        label = '偏瘦';
        level = 'warn';
      } else if (bmi >= 28) {
        label = '肥胖';
        level = 'bad';
      } else if (bmi >= 24) {
        label = '偏重';
        level = 'warn';
      }
      return { bmi: Math.round(bmi * 10) / 10, label: label, level: level };
    }

    function parseExamReport(text) {
      const src = String(text || '')
        .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 65248))
        .replace(/[：]/g, ':');
      const out = [];
      const seen = {};
      const push = (it) => {
        if (!it || seen[it.name]) return;
        seen[it.name] = true;
        out.push(it);
      };
      const bp = src.match(/血压[^0-9]{0,10}(\d{2,3})\s*[\/／]\s*(\d{2,3})/);
      if (bp) {
        push({ name: '收缩压', value: bp[1], unit: 'mmHg', ref: '90~140', status: Number(bp[1]) > 140 ? 'high' : Number(bp[1]) < 90 ? 'low' : 'normal' });
        push({ name: '舒张压', value: bp[2], unit: 'mmHg', ref: '60~90', status: Number(bp[2]) > 90 ? 'high' : Number(bp[2]) < 60 ? 'low' : 'normal' });
      }
      EXAM_MARKERS.forEach((mk) => {
        const m = src.match(mk.re);
        if (!m) return;
        const v = Number(m[2] !== undefined ? m[2] : m[1]);
        if (!isFinite(v)) return;
        let status = 'normal';
        if (mk.max !== undefined && v > mk.max) status = 'high';
        else if (mk.min !== undefined && v < mk.min) status = 'low';
        push({ name: mk.name, value: String(v), unit: mk.unit, ref: mk.ref, status: status });
      });
      EXAM_TEXT_MARKERS.forEach((mk) => {
        const m = src.match(mk.re);
        if (!m) return;
        const status = mk.name === '幽门螺杆菌' ? (m[2] === '阳性' ? 'abnormal' : 'normal') : 'abnormal';
        push({ name: mk.name, value: mk.value(m), unit: '', ref: mk.ref, status: status });
      });
      return out;
    }

    function guessStatus(value, ref) {
      const v = Number(value);
      const m = String(ref || '').match(/^\s*(\d+(?:\.\d+)?)\s*[~～\-—至]\s*(\d+(?:\.\d+)?)\s*$/);
      if (!isFinite(v) || !m) return 'unknown';
      if (v > Number(m[2])) return 'high';
      if (v < Number(m[1])) return 'low';
      return 'normal';
    }

    function healthNotes(health, profile) {
      const notes = [];
      const items = (health && health.items) || [];
      items.forEach((it) => {
        if (it.status === 'normal' || it.status === 'unknown') return;
        const adv = HEALTH_ADVICE[it.name] || '这项不在参考范围内，按报告建议复查，别自行用药。';
        notes.push({
          level: 'warn',
          text: it.name + ' ' + it.value + (it.unit ? ' ' + it.unit : '') + '（' + (HEALTH_STATUS[it.status] || '异常') + '）：' + adv,
        });
      });
      const bmi = bmiInfo(health && health.height, health && health.weight);
      if (bmi && bmi.level !== 'ok') {
        notes.push({ level: bmi.level, text: 'BMI ' + bmi.bmi + '（' + bmi.label + '）：按每周 0.5~1 斤的速度慢慢调，别极端节食。' });
      }
      const last = String((health && health.lastExam) || '');
      if (last) {
        const days = Math.floor((Date.now() - new Date(last + 'T00:00:00').getTime()) / 86400000);
        if (days > 365) notes.push({ level: 'info', text: '距上次体检 ' + days + ' 天了，抽空复查一次（血常规 + 肝功 + 血脂 + 血糖）。' });
      } else {
        notes.push({ level: 'info', text: '还没填「最近体检日期」。填上之后，这里会提醒你什么时候该复查。' });
      }
      if (profile && Number(profile.sleepFloor) < 7) {
        notes.push({ level: 'info', text: '睡眠底线设成了 ' + profile.sleepFloor + ' 小时，长期低于 7 小时会影响血糖、血压和情绪，尽量往 7 小时靠。' });
      }
      if (!items.length) {
        notes.push({ level: 'info', text: '还没有指标：把体检报告的文字粘进来，或先手动加 2~3 条（血压、血糖、血脂）。' });
      } else if (!notes.some((n) => n.level === 'warn' || n.level === 'bad')) {
        notes.push({ level: 'good', text: '现在录入的指标都在参考范围里。保持每周 150 分钟中等强度运动、少盐少糖，一年复查一次就好。' });
      }
      notes.push({ level: 'info', text: '久坐每小时起来走 3 分钟。以上是通用建议，不构成诊断，具体听医生的。' });
      return notes;
    }

    function HealthTab(props) {
      const state = props.state;
      const update = props.update;
      const focus = props.focus || {};
      const health = state.health;
      const [msg, setMsg] = useState('');
      const [paste, setPaste] = useState('');
      const [showPaste, setShowPaste] = useState(false);
      const [showAdd, setShowAdd] = useState(false);
      const [draft, setDraft] = useState({ name: '', value: '', unit: '', ref: '' });

      const items = health.items || [];
      const notes = healthNotes(health, state.profile);
      const bmi = bmiInfo(health.height, health.weight);
      const flagged = items.filter((it) => it.status !== 'normal').length;

      const patchHealth = (patch) => update((s) => { s.health = Object.assign({}, s.health, patch); });

      function importItems(list, sourceName) {
        if (!list.length) {
          setMsg('没认出常见指标。可以在报告 App 里「复制文本」再粘一次，或者手动添加。');
          return;
        }
        update((s) => {
          const map = {};
          (s.health.items || []).forEach((it) => { map[it.name] = it; });
          list.forEach((it) => {
            const old = map[it.name];
            map[it.name] = {
              id: old ? old.id : uid(),
              at: old ? old.at : isoDate(new Date()),
              name: it.name,
              value: it.value,
              unit: it.unit || '',
              ref: it.ref || '',
              status: it.status || 'unknown',
            };
          });
          s.health.items = Object.keys(map).map((k) => map[k]);
        });
        setMsg('已识别 ' + list.length + ' 项指标（' + sourceName + '）。有不对的直接删掉重加。');
      }

      function saveReport(text, name) {
        const body = String(text || '').slice(0, 4000);
        if (!body.trim()) {
          setMsg('这份内容里没有文字。');
          return;
        }
        const list = parseExamReport(body);
        importItems(list, name);
        update((s) => {
          const reports = (s.health.reports || []).slice(-4);
          reports.push({ id: uid(), name: String(name || '粘贴的文本').slice(0, 60), at: isoDate(new Date()), size: body.length });
          s.health.reports = reports;
        });
      }

      function pickReport() {
        try {
          const el = document.createElement('input');
          el.type = 'file';
          el.accept = '.txt,.csv,.md,.json,.log,text/plain';
          el.onchange = () => {
            const file = el.files && el.files[0];
            if (!file) return;
            if (!/\.(txt|csv|md|json|log)$/i.test(file.name)) {
              setMsg('这个格式浏览器里读不出文字。请在报告 App 里「复制文本」粘进来，或另存为 txt/csv 再上传。');
              return;
            }
            const reader = new FileReader();
            reader.onload = () => saveReport(String(reader.result || ''), file.name);
            reader.readAsText(file, 'utf-8');
          };
          el.click();
        } catch (err) {
          setMsg('浏览器不允许打开文件选择框。');
        }
      }

      function addManual() {
        const name = String(draft.name || '').trim();
        const value = String(draft.value || '').trim();
        if (!name || !value) {
          setMsg('指标名和数值都要填。');
          return;
        }
        const ref = String(draft.ref || '').trim();
        update((s) => {
          s.health.items = (s.health.items || []).concat([
            { id: uid(), at: isoDate(new Date()), name: name, value: value, unit: String(draft.unit || '').trim(), ref: ref, status: guessStatus(value, ref) },
          ]);
        });
        setDraft({ name: '', value: '', unit: '', ref: '' });
        setMsg('已添加「' + name + '」。');
      }

      return h('div', { className: 'ml-body' },
        h(Card, { title: '身体档案', hint: '身高体重用来算 BMI' },
          h('div', { className: 'ml-row' },
            h(Field, { label: '身高（cm）', style: { flex: '1 1 110px' } },
              h(TextInput, { type: 'number', value: health.height, onChange: (v) => patchHealth({ height: v }) }),
            ),
            h(Field, { label: '体重（kg）', style: { flex: '1 1 110px' } },
              h(TextInput, { type: 'number', value: health.weight, onChange: (v) => patchHealth({ weight: v }) }),
            ),
            h(Field, { label: '最近体检日期', style: { flex: '1 1 150px' } },
              h(TextInput, { type: 'date', value: health.lastExam, onChange: (v) => patchHealth({ lastExam: v }) }),
            ),
          ),
          h('div', { className: 'ml-tip', style: { marginTop: '8px' } },
            bmi
              ? 'BMI ' + bmi.bmi + ' · ' + bmi.label + '（中国标准：18.5~23.9 正常，24~27.9 偏重，≥28 肥胖；只做筛查，肌肉多的人会偏高）'
              : '填了身高体重，这里会算出 BMI。'),
        ),
        h(Card, { title: '体检报告', hint: '上传后自动认指标' },
          h('div', { className: 'ml-row' },
            h(Btn, { variant: 'primary', onClick: pickReport }, '上传报告文件'),
            h(Btn, { onClick: () => setShowPaste(!showPaste) }, showPaste ? '收起粘贴框' : '粘贴报告文本'),
          ),
          h('div', { className: 'ml-tip', style: { marginTop: '6px' } },
            '支持 txt / csv / md / json（体检 App 里一般有「复制报告」）。PDF、图片浏览器读不出文字，先转成文字或手动加。'),
          showPaste
            ? h('div', { style: { marginTop: '8px' } },
                h(TextArea, {
                  value: paste,
                  rows: 6,
                  placeholder: '把报告文字粘在这里，例如：\n血压 145/92 mmHg\n空腹血糖 6.8 mmol/L\n总胆固醇 5.9 mmol/L\n尿酸 468 μmol/L',
                  onChange: setPaste,
                }),
                h('div', { className: 'ml-row', style: { marginTop: '6px' } },
                  h(Btn, { variant: 'primary', onClick: () => { saveReport(paste, '粘贴的文本'); setPaste(''); setShowPaste(false); } }, '解析并生成指标'),
                ),
              )
            : null,
          (health.reports || []).length
            ? h('div', { className: 'ml-list', style: { marginTop: '8px' } },
                health.reports.map((r) =>
                  h('div', { className: 'ml-item', key: r.id },
                    h('div', { className: 'grow' },
                      h('b', null, r.name),
                      h('div', { className: 'ml-tip' }, r.at + ' · ' + r.size + ' 字'),
                    ),
                    h('button', {
                      className: 'ml-x',
                      type: 'button',
                      title: '移除这份报告记录',
                      onClick: () => patchHealth({ reports: (health.reports || []).filter((x) => x.id !== r.id) }),
                    }, '×'),
                  ),
                ),
              )
            : null,
          msg ? h('div', { className: 'ml-tip', style: { marginTop: '6px' } }, msg) : null,
        ),
        h(Card, { title: '健康指标', hint: items.length ? items.length + ' 项 · ' + flagged + ' 项异常' : '还没有指标' },
          items.length
            ? h('div', { className: 'ml-list' }, items.map((it) => {
                const focused = focus.kind === 'metric' && focus.id === it.id;
                return h('div', { className: 'ml-hitem' + (focused ? ' ml-focus' : ''), id: 'ml-x-' + it.id, key: it.id },
                  h('div', { className: 'ml-hname' }, h('b', null, it.name), it.at ? h('div', { className: 'ml-tiny' }, '来源 ' + it.at) : null),
                  h('div', { className: 'ml-hval' }, it.value + (it.unit ? ' ' + it.unit : '')),
                  h('div', { className: 'ml-href' }, '参考 ' + (it.ref || '—')),
                  h('span', { className: 'ml-status ' + (it.status || 'unknown') }, HEALTH_STATUS[it.status] || '待确认'),
                  h('button', {
                    className: 'ml-x',
                    type: 'button',
                    title: '删除这条指标',
                    onClick: () => {
                      patchHealth({ items: items.filter((x) => x.id !== it.id) });
                      setMsg('已删除「' + it.name + '」。');
                    },
                  }, '×'),
                );
              }))
            : h(Empty, null, '还没有指标：上传体检报告，或点下面「手动添加指标」。'),
          h('div', { className: 'ml-row', style: { marginTop: '10px' } },
            h(Btn, { onClick: () => setShowAdd(!showAdd) }, showAdd ? '收起手动添加' : '手动添加指标'),
            items.length
              ? h(Btn, {
                  variant: 'danger',
                  onClick: () => {
                    if (window.confirm('清空所有健康指标？家人和工作数据不受影响。')) patchHealth({ items: [] });
                  },
                }, '清空指标')
              : null,
          ),
          showAdd
            ? h('div', { className: 'ml-row', style: { marginTop: '8px' } },
                h(Field, { label: '指标名', style: { flex: '1 1 130px' } },
                  h(TextInput, { value: draft.name, placeholder: '如 空腹血糖', onChange: (v) => setDraft(Object.assign({}, draft, { name: v })) }),
                ),
                h(Field, { label: '数值', style: { flex: '0 1 90px' } },
                  h(TextInput, { value: draft.value, placeholder: '6.8', onChange: (v) => setDraft(Object.assign({}, draft, { value: v })) }),
                ),
                h(Field, { label: '单位', style: { flex: '0 1 90px' } },
                  h(TextInput, { value: draft.unit, placeholder: 'mmol/L', onChange: (v) => setDraft(Object.assign({}, draft, { unit: v })) }),
                ),
                h(Field, { label: '参考值', style: { flex: '0 1 110px' } },
                  h(TextInput, { value: draft.ref, placeholder: '3.9~6.1', onChange: (v) => setDraft(Object.assign({}, draft, { ref: v })) }),
                ),
                h('div', { className: 'ml-field', style: { flex: '0 0 auto' } },
                  h(Btn, { variant: 'primary', onClick: addManual }, '添加'),
                ),
              )
            : null,
        ),
        h(Card, { title: '需要注意', hint: '按你的指标和档案算的，不是诊断' },
          h('div', { className: 'ml-notes' }, notes.map((n, i) => h('div', { className: 'ml-note ' + n.level, key: i }, n.text))),
        ),
      );
    }

    /* ============================== 家庭 ============================== */

    function FamilyTab(props) {
      const state = props.state;
      const update = props.update;
      const focus = props.focus || {};
      const RELATIONS = ['爱人', '妻子', '丈夫', '父亲', '母亲', '兄弟', '姐妹', '儿子', '女儿', '其他'];
      const GENDERS = ['女', '男', '其他'];
      const [draft, setDraft] = useState({ name: '', relation: '爱人', gender: '', birthday: '', hobbies: '', note: '' });
      const [msg, setMsg] = useState('');
      const members = state.family.map((m) => {
        const canGrowth = m.relation === '儿子' || m.relation === '女儿';
        return {
          m,
          canGrowth,
          days: daysUntilBirthday(m.birthday),
          age: ageInfo(m.birthday),
          cycle: m.period && m.period.enabled ? cycleInfo(m.period) : null,
          growth: canGrowth && m.growth && m.growth.enabled ? growthInfo(m.birthday) : null,
        };
      });
      const soon = members.filter((x) => x.days !== null && x.days <= 30).sort((a, b) => a.days - b.days);
      const festivals = allFestivals(60);
      const week = state.week || { start: '', items: [] };
      const weekDone = week.items.filter((x) => x.done).length;

      function regenWeek() {
        update((s) => {
          s.week = buildWeekPlan(s);
        });
        setMsg('已按生日 / 节日 / 经期 / 成长阶段重排本周计划');
      }

      function clearWeek() {
        let yes = true;
        try {
          if (typeof window.confirm === 'function') yes = window.confirm('清空本周关怀计划？删除后可以再生成。');
        } catch (err) {
          yes = true;
        }
        if (!yes) return;
        update((s) => {
          s.week = { start: '', items: [] };
        });
        setMsg('本周关怀计划已清空');
      }

      function toggleWeekItem(id) {
        update((s) => {
          const it = (s.week && s.week.items || []).find((x) => x.id === id);
          if (it) it.done = !it.done;
        });
      }

      function add() {
        if (!draft.name.trim()) return;
        const relation = draft.relation;
        const canPeriod = relation === '爱人' || relation === '妻子';
        update((s) => {
          s.family.push({
            id: uid(),
            name: draft.name.trim(),
            relation,
            gender: draft.gender,
            birthday: draft.birthday,
            hobbies: draft.hobbies.trim(),
            note: draft.note.trim(),
            avatar: '',
            period: { enabled: canPeriod, lastStart: '', length: 28 },
            growth: { enabled: relation === '儿子' || relation === '女儿' },
          });
        });
        setDraft({ name: '', relation: '爱人', gender: '', birthday: '', hobbies: '', note: '' });
        setMsg('已添加「' + draft.name.trim() + '」。生日、年龄与关怀建议都已在卡片里。');
      }

      function remove(id) {
        update((s) => {
          s.family = s.family.filter((m) => m.id !== id);
        });
      }

      function patchMember(id, patch) {
        update((s) => {
          const m = s.family.find((x) => x.id === id);
          if (m) Object.assign(m, patch);
        });
      }

      function patchPeriod(id, patch) {
        update((s) => {
          const m = s.family.find((x) => x.id === id);
          if (m) m.period = Object.assign({ enabled: true, lastStart: '', length: 28 }, m.period, patch);
        });
      }

      function uploadAvatar(m) {
        pickImage(
          (dataUrl) => {
            patchMember(m.id, { avatar: dataUrl });
            setMsg('已更新「' + m.name + '」的头像');
          },
          (err) => setMsg(err),
        );
      }

      function renderMember(x) {
        const m = x.m;
        const cycle = x.cycle;
        const growth = x.growth;
        const canPeriod = m.relation === '爱人' || m.relation === '妻子';
        return h('div', { className: 'ml-member' + (focus.kind === 'member' && focus.id === m.id ? ' ml-focus' : ''), key: m.id, id: 'ml-m-' + m.id },
          h('div', { className: 'top' },
            h('div', { className: 'ml-mhead' },
              m.avatar
                ? h('img', { className: 'ml-avatar', src: m.avatar, alt: m.name })
                : h('span', { className: 'ml-avatar ph', title: '还没上传照片' }, initialOf(m.name)),
              h('div', { className: 'ml-mname' },
                h('span', { className: 'ml-name' }, m.name),
                h('span', { className: 'ml-rel' }, m.relation),
                m.gender ? h('span', { className: 'ml-sex' }, m.gender) : null,
                x.age ? h('span', { className: 'ml-age' }, x.age.label) : null,
              ),
            ),
            h('button', { className: 'ml-x', type: 'button', title: '删除', onClick: () => remove(m.id) }, '×'),
          ),
          h('div', {
            className: 'ml-days' + (x.days === 0 ? ' today' : x.days !== null && x.days <= 14 ? ' hot' : ''),
          }, x.days === null ? '未填生日' : x.days === 0 ? '今天生日 🎂' : '距生日 ' + x.days + ' 天'),
          h('div', { className: 'ml-card-actions' },
            h(Btn, { variant: 'ghost', onClick: () => uploadAvatar(m) }, m.avatar ? '换头像' : '上传照片'),
            canPeriod
              ? h(Btn, {
                  variant: 'ghost',
                  onClick: () => patchPeriod(m.id, { enabled: !(m.period && m.period.enabled) }),
                }, m.period && m.period.enabled ? '收起经期' : '经期记录')
              : null,
            x.canGrowth
              ? h(Btn, {
                  variant: 'ghost',
                  onClick: () => patchMember(m.id, { growth: { enabled: !(m.growth && m.growth.enabled) } }),
                }, m.growth && m.growth.enabled ? '收起成长关注' : '成长关注')
              : null,
          ),
          canPeriod && m.period && m.period.enabled
            ? h('div', { className: 'ml-sub' },
                h('div', { className: 'ml-sub-h' },
                  h('b', null, '经期记录'),
                  cycle && !cycle.error ? h('span', { className: 'ml-phase on' }, cycle.phase + ' · 第 ' + cycle.cycleDay + ' 天') : null,
                  h('span', { className: 'grow' }),
                  cycle && !cycle.error ? h('span', { className: 'ml-tiny' }, '下次预计 ' + fmtDate(cycle.next) + '（' + cycle.daysToNext + ' 天后）') : null,
                ),
                h('div', { className: 'ml-row' },
                  h(Field, { label: '上次开始' },
                    h(TextInput, {
                      type: 'date',
                      value: m.period.lastStart || '',
                      onChange: (v) => patchPeriod(m.id, { lastStart: v }),
                    }),
                  ),
                  h(Field, { label: '周期(天)' },
                    h(TextInput, {
                      type: 'number',
                      value: String(m.period.length || 28),
                      onChange: (v) => patchPeriod(m.id, { length: Number(v) || 28 }),
                    }),
                  ),
                ),
                cycle
                  ? h('div', { className: 'ml-tiny' },
                      cycle.error ? cycle.error : cycle.tip + '（易孕窗 ' + fmtDate(cycle.fertileFrom) + ' ~ ' + fmtDate(cycle.fertileTo) + '）')
                  : h('div', { className: 'ml-tiny' }, '填上上次开始日期，就能推算下次、当前阶段与关怀提示。'),
              )
            : null,
          growth
            ? h('div', { className: 'ml-sub' },
                h('div', { className: 'ml-sub-h' },
                  h('b', null, '成长关注 · ' + growth.stage),
                  h('span', { className: 'ml-tiny' }, growth.age + ' · 这阶段看 4 件事'),
                ),
                h('div', { className: 'ml-btags' }, growth.focus.map((f) => h('span', { className: 'ml-chip', key: f }, f))),
                h('div', { className: 'ml-tiny' }, '本周动作：' + growth.act),
                h('div', { className: 'ml-row', style: { marginTop: '6px' } },
                  h(Field, { label: '成长备注（只对儿子 / 女儿显示）', style: { flex: '1 1 100%' } },
                    h(TextArea, {
                      rows: 2,
                      value: (m.growth && m.growth.note) || '',
                      placeholder: '如：最近开始怕黑，睡前留一盏小灯；这个月学会了自己收拾书包。',
                      onChange: (v) => patchMember(m.id, { growth: { enabled: true, note: v } }),
                    }),
                  ),
                ),
              )
            : null,
          m.hobbies ? h('div', null, String(m.hobbies).split(/[、,，\s]+/).filter(Boolean).map((t) => h('span', { className: 'ml-chip', key: t }, t))) : null,
          h('div', { className: 'ml-tip' }, careTip(m, x.days)),
        );
      }

      return h('div', { className: 'ml-body' },
        h(Card, { title: '添加家人', hint: '生日 → 年龄标签与提醒；配偶（爱人/妻子）可记经期，子女可看成长关注' },
          h('div', { className: 'ml-row' },
            h(Field, { label: '称呼', style: { flex: '1 1 120px' } },
              h(TextInput, { value: draft.name, placeholder: '如：妈妈 / 小雨', onChange: (v) => setDraft({ ...draft, name: v }) }),
            ),
            h(Field, { label: '关系' },
              h(Select, {
                value: draft.relation,
                options: RELATIONS.map((x) => ({ value: x, label: x })),
                onChange: (v) => setDraft({ ...draft, relation: v }),
              }),
            ),
            h(Field, { label: '性别' },
              h(Select, {
                value: draft.gender,
                options: [{ value: '', label: '未填' }].concat(GENDERS.map((g) => ({ value: g, label: g }))),
                onChange: (v) => setDraft({ ...draft, gender: v }),
              }),
            ),
            h(Field, { label: '生日' },
              h(TextInput, { type: 'date', value: draft.birthday, onChange: (v) => setDraft({ ...draft, birthday: v }) }),
            ),
            h(Field, { label: '爱好', style: { flex: '1 1 150px' } },
              h(TextInput, { value: draft.hobbies, placeholder: '如：养花、广场舞', onChange: (v) => setDraft({ ...draft, hobbies: v }) }),
            ),
            h(Btn, { variant: 'primary', onClick: add, disabled: !draft.name.trim() }, '添加'),
          ),
          msg ? h('div', { className: 'ml-muted', style: { marginTop: '8px' } }, msg) : null,
        ),
        h(Card, { title: '家人', hint: members.length + ' 位' },
          members.length === 0
            ? h(Empty, null, '还没有添加家人。先添加 1~2 位最需要被照顾的家人。')
            : h('div', { className: 'ml-grid' }, members.map(renderMember)),
        ),
        h('div', { className: 'ml-split' },
          h(Card, { title: '近 60 天节日' },
            festivals.length === 0
              ? h(Empty, null, '近 60 天没有节日。')
              : h('div', { className: 'ml-list' },
                  festivals.map((f) =>
                    h('div', { className: 'ml-item', key: f.name + f.days },
                      h('div', { className: 'grow' }, h('b', null, f.name), h('span', { className: 'ml-muted' }, '  ' + fmtDate(f.date) + (f.lunar ? ' · 农历' : ''))),
                      h('span', { className: 'ml-muted' }, f.days === 0 ? '今天' : f.days + ' 天'),
                    ),
                  ),
                ),
          ),
          h(Card, { title: '本周关怀排期', hint: '给每位家人留 20 分钟' },
            members.length === 0
              ? h(Empty, null, '添加家人后自动生成。')
              : h('div', { className: 'ml-list' },
                  members.map((x, i) =>
                    h('div', { className: 'ml-item', key: x.m.id },
                      h('div', { className: 'grow' }, h('b', null, WEEK_NAMES[i % 7] + ' 20:00'), h('span', { className: 'ml-muted' }, '  ' + x.m.name)),
                      h('span', { className: 'ml-muted' }, x.days !== null && x.days <= 30 ? '生日临近，优先' : '例行'),
                    ),
                  ),
                ),
          ),
        ),
        soon.length
          ? h(Card, { title: '需要现在动作', hint: '30 天内生日' },
              h('div', { className: 'ml-list' },
                soon.map((x) => h('div', { className: 'ml-item', key: x.m.id }, h('div', { className: 'grow' }, h('div', { className: 'ml-tip' }, careTip(x.m, x.days))))),
              ),
            )
          : null,
        h(Card, {
          title: '本周关怀计划',
          hint: week.items.length ? '已完成 ' + weekDone + ' / ' + week.items.length + '（按周起点 ' + (week.start || '未生成') + '）' : '把「分配时间」落成 7 天里的动作',
        },
          week.items.length === 0
            ? h('div', null,
                h('div', { className: 'ml-tip', style: { marginBottom: '9px' } },
                  '会按生日、节日、经期、成长阶段给每位家人排一条具体动作；做完打勾，下周重排时会保留本周记录。'),
                h(Btn, { variant: 'primary', onClick: regenWeek, disabled: members.length === 0 }, '生成本周计划'),
              )
            : h('div', null,
                h('div', { className: 'ml-week' },
                  week.items.map((it) =>
                    h('div', { className: 'ml-week-row' + (it.done ? ' done' : ''), key: it.id },
                      h('input', {
                        type: 'checkbox',
                        checked: Boolean(it.done),
                        onChange: () => toggleWeekItem(it.id),
                        'aria-label': '完成：' + it.title,
                      }),
                      h('div', { className: 'ml-week-day' }, it.date.slice(5)),
                      h('div', { className: 'grow' },
                        h('div', { className: 'ml-week-title' }, it.title),
                        h('div', { className: 'ml-week-why' }, it.who + ' · ' + it.why),
                      ),
                    ),
                  ),
                ),
                h('div', { className: 'ml-row', style: { marginTop: '9px' } },
                  h(Btn, { variant: 'ghost', onClick: regenWeek }, '重新生成'),
                  h(Btn, { variant: 'ghost', onClick: clearWeek }, '清空计划'),
                ),
              ),
        ),
      );
    }

    /* ============================== 工作 ============================== */

    function WorkTab(props) {
      const state = props.state;
      const update = props.update;
      const w = state.work;
      const focus = props.focus || {};
      const [draft, setDraft] = useState({ name: '', freq: 'week', hours: 2, desc: '' });
      const [addOpen, setAddOpen] = useState(false);
      const [editingId, setEditingId] = useState('');
      const [editDesc, setEditDesc] = useState('');
      const [folded, setFolded] = useState({});
      const [editFlow, setEditFlow] = useState({});
      const [pathDraft, setPathDraft] = useState({});
      const [pathOpen, setPathOpen] = useState({});
      const [assetMsg, setAssetMsg] = useState('');
      const [busyId, setBusyId] = useState('');
      const [baselineMsg, setBaselineMsg] = useState('');
      const [outState, setOutState] = useState({});

      const baseline = deriveBaseline(w);
      const expert = { name: baseline.roleName, caps: baseline.items };
      const rows = useMemo(
        () => w.tasks.map((t) => ({ t, perWeek: weeklyHours(t) })).sort((a, b) => b.perWeek - a.perWeek),
        [w.tasks],
      );
      const total = rows.reduce((s, r) => s + r.perWeek, 0);
      const caps = expert.caps.map((c) => {
        const level = Number(w.skills[c.id]) || 0;
        return { c, level, gap: c.target - level };
      });
      const gaps = caps.filter((x) => x.gap > 0).sort((a, b) => b.gap - a.gap);

      function addTask() {
        const name = draft.name.trim();
        if (!name) return;
        const task = {
          id: uid(),
          name,
          freq: draft.freq,
          hours: Number(draft.hours) || 1,
          desc: draft.desc.trim(),
          workflow: inferWorkflow({ name, desc: draft.desc }, w.role),
          template: null,
        };
        update((s) => { s.work.tasks.push(task); });
        setDraft({ name: '', freq: 'week', hours: 2, desc: '' });
        setAddOpen(false);
        setAssetMsg('已添加「' + name + '」，工作流示意图在下面，可以直接改。');
      }

      /* ---------------- 工作流示意：展示 + 编辑 ---------------- */
      const workflowOf = (t) => ensureWorkflow(t, w.role);

      const setWorkflow = (taskId, steps) => {
        update((s) => {
          const t = s.work.tasks.find((x) => x.id === taskId);
          if (t) t.workflow = steps;
        });
      };

      const patchStep = (t, idx, name) => {
        const steps = workflowOf(t).map((s, i) => (i === idx ? { id: s.id, name, note: s.note } : s));
        setWorkflow(t.id, steps);
      };

      const moveStep = (t, idx, dir) => {
        const steps = workflowOf(t).slice();
        const j = idx + dir;
        if (j < 0 || j >= steps.length) return;
        const tmp = steps[idx];
        steps[idx] = steps[j];
        steps[j] = tmp;
        setWorkflow(t.id, steps);
      };

      const dropStep = (t, idx) => {
        const steps = workflowOf(t).filter((_, i) => i !== idx);
        if (!steps.length) {
          setAssetMsg('至少留一步：工作流不能为空');
          return;
        }
        setWorkflow(t.id, steps);
      };

      const appendStep = (t) => {
        const steps = workflowOf(t).concat([{ id: uid(), name: '新步骤', note: '' }]);
        setWorkflow(t.id, steps);
        setEditFlow((p) => Object.assign({}, p, { [t.id]: true }));
      };

      const regenWorkflow = (t) => {
        setWorkflow(t.id, inferWorkflow(t, w.role));
        setAssetMsg('已按「' + t.name + '」' + (t.desc ? '与工作内容描述' : '') + '重新生成工作流');
      };

      const toggleFold = (t) => {
        setFolded((p) => Object.assign({}, p, { [t.id]: !(p[t.id] !== undefined ? p[t.id] : Boolean(t.workspace)) }));
      };

      const renderFlow = (t) => {
        const steps = workflowOf(t);
        const nodes = [];
        steps.forEach((s, i) => {
          if (i) nodes.push(h('span', { className: 'ml-flow-arrow', key: 'ar' + i }, '→'));
          nodes.push(h('div', { className: 'ml-flow-node', key: 'nd' + s.id },
            h('div', { className: 'n' }, String(i + 1).padStart(2, '0')),
            h('div', { className: 't' }, s.name),
            s.note ? h('div', { className: 'note' }, s.note) : null,
          ));
        });
        const editing = Boolean(editFlow[t.id]);
        return h('div', { className: 'ml-wf' },
          h('div', { className: 'ml-wf-h' },
            '工作流示意',
            h('span', { className: 'ml-muted' }, '· ' + steps.length + ' 步 · 按「' + (w.role || '岗位') + '」与任务描述生成'),
            h('span', { className: 'grow' }),
            h(Btn, { variant: 'ghost', onClick: () => regenWorkflow(t) }, '按描述重生成'),
            h(Btn, { variant: 'ghost', onClick: () => setEditFlow((p) => Object.assign({}, p, { [t.id]: !editing })) },
              editing ? '收起编辑' : '编辑'),
          ),
          h('div', { className: 'ml-flow' }, nodes),
          editing
            ? h('div', null,
                steps.map((s, i) =>
                  h('div', { className: 'ml-flow-step', key: 'ed' + s.id },
                    h('span', { className: 'ml-muted', style: { width: '20px', textAlign: 'right' } }, String(i + 1)),
                    h(TextInput, { value: s.name, onChange: (v) => patchStep(t, i, v) }),
                    h('button', { className: 'ml-x', type: 'button', title: '上移', onClick: () => moveStep(t, i, -1) }, '↑'),
                    h('button', { className: 'ml-x', type: 'button', title: '下移', onClick: () => moveStep(t, i, 1) }, '↓'),
                    h('button', { className: 'ml-x', type: 'button', title: '删除这一步', onClick: () => dropStep(t, i) }, '×'),
                  ),
                ),
                h('div', { className: 'ml-wf-foot' },
                  h(Btn, { variant: 'ghost', onClick: () => appendStep(t) }, '+ 新增一步'),
                  h(Btn, { variant: 'ghost', onClick: () => regenWorkflow(t) }, '按描述重生成'),
                ),
              )
            : null,
        );
      };

      const openEditDesc = (t) => {
        setEditingId(t.id);
        setEditDesc(t.desc || '');
      };

      const saveDesc = (regen) => {
        const id = editingId;
        const text = editDesc.trim();
        const target = w.tasks.find((x) => x.id === id);
        update((s) => {
          const t = s.work.tasks.find((x) => x.id === id);
          if (t) t.desc = text;
        });
        setEditingId('');
        if (regen && target) setWorkflow(id, inferWorkflow({ name: target.name, desc: text }, w.role));
        setAssetMsg(regen ? '工作内容已保存，工作流按新描述重生成' : '工作内容已保存');
      };

      const patchTask = (taskId, patch) => {
        update((s) => {
          const t = s.work.tasks.find((x) => x.id === taskId);
          if (t) Object.keys(patch).forEach((k) => { t[k] = patch[k]; });
        });
      };

      const setSources = (taskId, sources) => {
        update((s) => {
          const t = s.work.tasks.find((x) => x.id === taskId);
          if (t && t.workspace) t.workspace.sources = normalizeSources(sources);
        });
      };

      const kindLabel = (kind) => (SOURCE_KINDS.find((x) => x.key === kind) || {}).label || kind;

      const uploadOne = (task, kind, file) => {
        setAssetMsg('');
        setBusyId(task.id + ':' + kind);
        readFileBase64(file)
          .then((data) => uploadSource({ dir: task.workspace.dir, root: w.root, kind, mode: 'file', name: file.name, data }))
          .then((res) => {
            if (!res || res.ok === false) throw new Error((res && res.error) || '上传失败');
            setSources(task.id, res.sources);
            setAssetMsg('已加入' + kindLabel(kind) + '：' + file.name);
          })
          .catch((err) => setAssetMsg(String((err && err.message) || err)))
          .then(() => setBusyId(''));
      };

      const registerUrl = (task, kind) => {
        const key = task.id + ':' + kind;
        const value = String(pathDraft[key] || '').trim();
        if (!value) {
          setAssetMsg('先填一个外部链接，再点添加');
          return;
        }
        if (!/^https?:\/\/[^\s]+$/i.test(value)) {
          setAssetMsg('链接要以 http:// 或 https:// 开头');
          return;
        }
        setBusyId(key);
        uploadSource({ dir: task.workspace.dir, root: w.root, kind, mode: 'url', url: value })
          .then((res) => {
            if (!res || res.ok === false) throw new Error((res && res.error) || '添加失败');
            setSources(task.id, res.sources);
            setPathDraft((p) => Object.assign({}, p, { [key]: '' }));
            setAssetMsg('已加入' + kindLabel(kind) + '外部链接：' + value);
          })
          .catch((err) => setAssetMsg(String((err && err.message) || err)))
          .then(() => setBusyId(''));
      };

      const removeEntry = (task, kind, entry) => {
        setBusyId(task.id + ':' + kind);
        uploadSource({
          dir: task.workspace.dir,
          root: w.root,
          kind,
          mode: 'remove',
          name: entry.name || '',
          path: entry.path || '',
          url: entry.url || '',
        })
          .then((res) => {
            if (!res || res.ok === false) throw new Error((res && res.error) || '移除失败');
            setSources(task.id, res.sources);
            setAssetMsg('已移除' + kindLabel(kind) + '：' + (entry.name || entry.path || entry.url));
          })
          .catch((err) => setAssetMsg(String((err && err.message) || err)))
          .then(() => setBusyId(''));
      };

      const loadOutputs = (t) => {
        if (!t.workspace) return;
        setOutState((s) => Object.assign({}, s, { [t.id]: { loading: true, files: [], err: '' } }));
        const q = API_BASE + '/outputs?dir=' + encodeURIComponent(t.workspace.dir) + '&root=' + encodeURIComponent(w.root);
        fetch(apiUrl(q))
          .then((res) => {
            if (!res.ok) throw new Error('Host 接口返回 HTTP ' + res.status);
            return res.json();
          })
          .then((res) => {
            if (!res || res.ok === false) throw new Error((res && res.error) || '读取产出失败');
            setOutState((s) => Object.assign({}, s, { [t.id]: { loading: false, files: res.files || [], err: '' } }));
          })
          .catch((err) => setOutState((s) => Object.assign({}, s, { [t.id]: { loading: false, files: [], err: String((err && err.message) || err) } })));
      };

      const renderOutputs = (t) => {
        const o = outState[t.id];
        return h('div', null,
          h('div', { className: 'ml-wf-foot' },
            h(Btn, { variant: 'ghost', disabled: o && o.loading, onClick: () => loadOutputs(t) }, o && o.loading ? '读取中…' : '最近产出'),
            o && !o.loading && !o.err
              ? h('span', { className: 'ml-tiny' }, o.files.length ? o.files.length + ' 个文件' : '还没有产出')
              : null,
          ),
          o && o.err ? h('div', { className: 'ml-muted', style: { marginTop: '4px' } }, o.err) : null,
          o && o.files && o.files.length
            ? h('div', { style: { marginTop: '4px' } },
                o.files.map((f) =>
                  h('div', { className: 'ml-tip', key: f.name },
                    '· ' + f.name + '（' + fmtSize(f.size || 0) + '，' + String(f.at || '').slice(0, 16).replace('T', ' ') + '）'),
                ),
              )
            : null,
        );
      };

      const generateWorkspace = (task) => {
        setAssetMsg('');
        setBusyId(task.id);
        const payload = {
          task: {
            name: task.name,
            desc: task.desc || '',
            freqLabel: (FREQ.find((f) => f.key === task.freq) || {}).label || '',
            hours: task.hours,
            perWeek: Number(weeklyHours(task).toFixed(2)),
            workflow: workflowOf(task).map((s) => ({ name: s.name, note: s.note || '' })),
          },
          profile: {
            name: state.profile.name,
            role: w.role,
            company: w.business,
            business: w.business,
            expert: expert.name,
          },
          template: task.template ? { name: task.template.name, text: task.template.text } : null,
          suggestion: autoFor(task.name),
          root: w.root,
        };
        buildWorkspace(payload)
          .then((res) => {
            if (!res || res.ok === false) throw new Error((res && res.error) || '生成失败');
            update((s) => {
              const t = s.work.tasks.find((x) => x.id === task.id);
              if (t) {
                t.workspace = {
                  dir: res.dir,
                  at: new Date().toISOString(),
                  prompt: res.prompt || '',
                  registered: Boolean(res.registered),
                  sources: normalizeSources(res.sources),
                };
              }
            });
            setAssetMsg('已生成：' + res.dir + (res.registered ? '（已登记到工作区列表）' : ''));
            setFolded((p) => Object.assign({}, p, { [task.id]: false }));
          })
          .catch((err) => setAssetMsg(String((err && err.message) || err)))
          .then(() => setBusyId(''));
      };

      /* 生成之后才出现的三个上传口：成果模板 / 知识库 / 数据库 */
      const renderUploader = (t, spec) => {
        const src = ((t.workspace && t.workspace.sources) || emptySources())[spec.key] || { files: [], paths: [], urls: [] };
        const key = t.id + ':' + spec.key;
        const busy = busyId === key;
        const total = src.files.length + src.paths.length + src.urls.length;
        return h('div', { className: 'ml-up', key: spec.key },
          h('div', { className: 'ml-up-h' },
            h('b', null, spec.label),
            h('span', { className: 'ml-muted' }, '  ' + spec.hint),
          ),
          total
            ? h('div', { className: 'ml-up-list' },
                src.files.map((f) =>
                  h('div', { className: 'ml-up-item', key: 'f:' + f.name },
                    h('code', null, f.name),
                    h('span', { className: 'ml-muted' }, ' ' + fmtSize(f.size || 0)),
                    h('button', { className: 'ml-x', type: 'button', title: '移除', onClick: () => removeEntry(t, spec.key, { name: f.name }) }, '×'),
                  ),
                ),
                src.urls.map((u) =>
                  h('div', { className: 'ml-up-item', key: 'u:' + u.url },
                    h('span', { className: 'ml-url' }, u.url.replace(/^https?:\/\//, '').slice(0, 46) + (u.url.length > 54 ? '…' : '')),
                    h('button', { className: 'ml-x', type: 'button', title: '移除', onClick: () => removeEntry(t, spec.key, { url: u.url }) }, '×'),
                  ),
                ),
                src.paths.map((p) =>
                  h('div', { className: 'ml-up-item', key: 'p:' + p.path },
                    h('code', null, p.path),
                    h('span', { className: 'ml-muted' }, p.exists === false ? ' 路径不存在' : ' 已登记'),
                    h('button', { className: 'ml-x', type: 'button', title: '移除', onClick: () => removeEntry(t, spec.key, { path: p.path }) }, '×'),
                  ),
                ),
              )
            : h('div', { className: 'ml-muted' }, '还没有内容'),
          h('div', { className: 'ml-wf-foot' },
            h(Btn, {
              variant: 'ghost',
              disabled: busy,
              onClick: () => pickFiles((files) => files.forEach((f) => uploadOne(t, spec.key, f)), setAssetMsg),
            }, busy ? '处理中…' : '上传文件'),
            h(Btn, {
              variant: 'ghost',
              onClick: () => setPathOpen((p) => Object.assign({}, p, { [key]: !p[key] })),
            }, pathOpen[key] ? '收起链接' : '加外部链接'),
          ),
          pathOpen[key]
            ? h('div', null,
                h('div', { className: 'ml-row', style: { marginTop: '6px' } },
                  h(TextInput, {
                    value: pathDraft[key] || '',
                    placeholder: spec.key === 'database' ? 'https://example.com/ads.csv' : 'https://example.com/report',
                    onChange: (v) => setPathDraft((p) => Object.assign({}, p, { [key]: v })),
                  }),
                  h(Btn, { variant: 'primary', disabled: busy, onClick: () => registerUrl(t, spec.key) }, '添加链接'),
                ),
                h('div', { className: 'ml-muted', style: { marginTop: '4px' } },
                  '外部链接会写进「输入清单.md」，agent 生成时用联网检索/抓取去取正文；内网或需要登录的链接它取不到，会如实报「链接不可达」。'),
              )
            : null,
        );
      };

      const renderTask = (r) => {
        const t = r.t;
        const generated = Boolean(t.workspace);
        const focused = focus.kind === 'task' && focus.id === t.id;
        const isFolded = focused ? false : folded[t.id] !== undefined ? folded[t.id] : generated;
        return h('div', {
          className: 'ml-item' + (focused ? ' ml-focus' : ''),
          key: t.id,
          id: 'ml-t-' + t.id,
          style: { alignItems: 'flex-start' },
        },
          h('div', { className: 'ml-task' },
            h('div', { className: 'ml-task-head' },
              h('b', null, t.name),
              h('span', { className: 'ml-badge' + (generated ? '' : ' wait') }, generated ? '已生成' : '待生成'),
              h('span', { className: 'ml-muted' }, (FREQ.find((f) => f.key === t.freq) || {}).label + ' · ' + t.hours + 'h/次 · 每周 ' + r.perWeek.toFixed(1) + 'h'),
              h('span', { className: 'grow' }),
              h(Btn, { variant: 'ghost', onClick: () => toggleFold(t) }, isFolded ? '展开' : '收起'),
            ),
            isFolded
              ? null
              : h('div', { className: 'ml-task-main' },
                  t.desc
                    ? h('div', { className: 'ml-desc' }, t.desc)
                    : h('div', { className: 'ml-muted' }, '还没写工作内容描述——补上它，工作流才会贴近你实际在做的动作。'),
                  h('div', { className: 'ml-wf-foot' },
                    h(Btn, { variant: 'ghost', onClick: () => openEditDesc(t) }, t.desc ? '编辑工作内容' : '补充工作内容'),
                  ),
                  h('div', { className: 'ml-tip' }, '建议：' + autoFor(t.name).form + ' — ' + autoFor(t.name).tip),
                  renderFlow(t),
                  h('div', { className: 'ml-wf' },
                    h('div', { className: 'ml-wf-h' },
                      '智能体工作流',
                      t.workspace
                        ? h('span', { className: 'ml-muted' }, t.workspace.registered ? '· 已登记到工作区列表' : '· 未登记为工作区')
                        : h('span', { className: 'ml-muted' }, '· 生成后自动带 AGENTS.md'),
                    ),
                    t.workspace
                      ? h('div', null,
                          h('div', { className: 'ml-ws' },
                            h('div', null, '工作区：', h('code', null, t.workspace.dir)),
                            h('div', null, '智能体：AGENTS.md'),
                          ),
                          h('div', { className: 'ml-wf-foot' },
                            h(Btn, {
                              variant: 'ghost',
                              onClick: () => copyText(t.workspace.prompt || '按工作区 ' + t.workspace.dir + ' 里的 AGENTS.md 执行一次「' + t.name + '」')
                                .then(() => setAssetMsg('启动提示词已复制'))
                                .catch((err) => setAssetMsg(String((err && err.message) || err))),
                            }, '复制启动提示词'),
                            h(Btn, { variant: 'ghost', disabled: busyId === t.id, onClick: () => generateWorkspace(t) },
                              busyId === t.id ? '重新生成中…' : '重新生成'),
                          ),
                          renderOutputs(t),
                          h('div', { className: 'ml-ups' }, SOURCE_KINDS.map((spec) => renderUploader(t, spec))),
                        )
                      : h('div', null,
                          h('div', { className: 'ml-muted', style: { marginBottom: '8px' } },
                            '工作区会建在：' + w.root + '\\' + WORK_DIR_NAME + '\\' + safeName(t.name)),
                          h(Btn, { variant: 'primary', disabled: busyId === t.id, onClick: () => generateWorkspace(t) },
                            busyId === t.id ? '生成中…' : '一键生成智能体工作流'),
                          h('div', { className: 'ml-muted', style: { marginTop: '8px' } },
                            '生成后可以分别上传成果模板、知识库、数据库，也可以直接加外部链接。'),
                        ),
                  ),
                ),
          ),
          h('button', {
            className: 'ml-x',
            type: 'button',
            title: '删除',
            onClick: () => update((s) => { s.work.tasks = s.work.tasks.filter((x) => x.id !== t.id); }),
          }, '×'),
        );
      };

      return h('div', { className: 'ml-body' },
        h(Card, { title: '岗位信息', hint: '公司、业务、岗位一起决定对标基线' },
          h('div', { className: 'ml-row' },
            h(Field, { label: '公司', style: { flex: '1 1 160px' } },
              h(TextInput, { value: w.company, placeholder: '如：星野家居（创业团队）', onChange: (v) => update((s) => { s.work.company = v; }) }),
            ),
            h(Field, { label: '公司业务 / 行业', style: { flex: '2 1 220px' } },
              h(TextInput, { value: w.business, placeholder: '如：跨境电商，卖家居小件', onChange: (v) => update((s) => { s.work.business = v; }) }),
            ),
            h(Field, { label: '岗位', style: { flex: '1 1 150px' } },
              h(TextInput, { value: w.role, placeholder: '如：亚马逊运营', onChange: (v) => update((s) => { s.work.role = v; }) }),
            ),
          ),
          h('div', { className: 'ml-sub', style: { marginTop: '10px' } },
            h('div', { className: 'ml-sub-h' },
              h('b', null, '对标基线（自动检索）'),
              h('span', { className: 'ml-chip' }, '岗位族：' + baseline.roleName),
              baseline.industryName ? h('span', { className: 'ml-chip' }, '行业：' + baseline.industryName) : null,
              baseline.companyName ? h('span', { className: 'ml-chip' }, '公司类型：' + baseline.companyName) : null,
              h('span', { className: 'grow' }),
              h('span', { className: 'ml-tiny' }, baseline.items.length + ' 条能力'),
              h(Btn, {
                variant: 'ghost',
                onClick: () => setBaselineMsg(
                  '已按「' + (w.role || '岗位未填') + '」' + (w.business ? '与「' + w.business + '」' : '') + '重新检索：'
                  + [baseline.roleName].concat(baseline.industryName ? [baseline.industryName] : []).concat(baseline.companyName ? [baseline.companyName] : []).join(' / '),
                ),
              }, '重新检索'),
            ),
            h('div', { className: 'ml-tiny' },
              '按「岗位 + 公司/业务」关键词自动生成：岗位族 4 条 + 行业 2 条 + 公司类型 1 条；改上面三个输入会自动重算，能力自评按这里的条目打分。',
            ),
            baselineMsg ? h('div', { className: 'ml-tiny', style: { color: 'var(--dsw-alias-brand-primary)' } }, baselineMsg) : null,
          ),
          h('div', { className: 'ml-row', style: { marginTop: '8px' } },
            h(Field, { label: '镜像人生根目录（工作区建在它的 工作目录/ 下）', style: { flex: '1 1 320px' } },
              h(TextInput, { value: w.root, placeholder: DEFAULT_MIRROR_ROOT, onChange: (v) => update((s) => { s.work.root = v; }) }),
            ),
          ),
        ),
        h(Card, { title: '日常任务', hint: '只填最常做的 5~8 件；每件事都能一键生成智能体工作区' },
          h('div', { className: 'ml-row', style: { alignItems: 'center' } },
            h(Btn, { variant: 'primary', onClick: () => setAddOpen(true) }, '+ 新增日常任务'),
            h('span', { className: 'ml-muted' }, '在窗口里写清这件事具体在做什么，会自动生成工作流示意图，可逐条编辑'),
          ),
          rows.length
            ? h('div', { className: 'ml-list', style: { marginTop: '12px' } }, rows.map(renderTask))
            : h(Empty, null, '还没录入任务。先写 3 件每周都要做的事，每件都能一键生成一个智能体工作区。'),
          assetMsg ? h('div', { className: 'ml-muted', style: { marginTop: '8px', color: 'var(--dsw-alias-state-warn-primary)' } }, assetMsg) : null,
          rows.length ? h('div', { className: 'ml-muted', style: { marginTop: '8px' } }, '合计每周 ' + total.toFixed(1) + ' 小时；其中前 3 项占 ' + (total ? (rows.slice(0, 3).reduce((s, r) => s + r.perWeek, 0) / total * 100).toFixed(0) : 0) + '%。生成的工作区会随建议文档一起导出，方便直接喂给 agent。') : null,
        ),
        h(Card, { title: '能力自评', hint: '对标「' + baseline.roleName + (baseline.industryName ? ' · ' + baseline.industryName : '') + '」，选 1~5 级' },
          expert.caps.length === 0
            ? h(Empty, null, '还没检索出基线；先填岗位、公司业务。')
            : h('div', { className: 'ml-list' },
                caps.map((x) =>
                  h('div', { className: 'ml-item', key: x.c.id },
                    h('div', { className: 'grow' },
                      h('b', null, x.c.name),
                      h('span', { className: 'ml-muted' }, '  期望 ' + x.c.target + ' 级'),
                      h('span', { className: 'ml-tiny' }, '  · 来源：' + (x.c.why || '基线')),
                      h('div', { className: 'ml-tip' }, x.c.action),
                    ),
                    h(Select, {
                      value: String(x.level || 0),
                      width: '110px',
                      options: [{ value: '0', label: '未评' }].concat(LEVELS.map((l) => ({ value: String(l.v), label: l.label }))),
                      onChange: (v) => update((s) => { s.work.skills[x.c.id] = Number(v) || 0; }),
                    }),
                  ),
                ),
              ),
        ),
        h(Card, { title: '提效建议' },
          rows.length === 0 && gaps.length === 0
            ? h(Empty, null, '录入任务并完成自评后，这里给出提效与补强顺序。')
            : h('div', null,
                h('table', { className: 'ml-table' },
                  h('thead', null, h('tr', null, ['优先级', '事项', '建议'].map((t) => h('th', { key: t }, t)))),
                  h('tbody', null,
                    rows.slice(0, 5).map((r, i) =>
                      h('tr', { key: 'a' + r.t.id },
                        h('td', null, 'P' + (i + 1)),
                        h('td', null, r.t.name + '（周 ' + r.perWeek.toFixed(1) + 'h）'),
                        h('td', null, autoFor(r.t.name).form),
                      ),
                    ),
                    gaps.slice(0, 3).map((x, i) =>
                      h('tr', { key: 'b' + x.c.id },
                        h('td', null, 'C' + (i + 1)),
                        h('td', null, '补能力：' + x.c.name + '（差距 ' + x.gap + ' 级）'),
                        h('td', null, x.c.action),
                      ),
                    ),
                  ),
                ),
                h('div', { className: 'ml-row', style: { marginTop: '12px' } },
                  h(Btn, { variant: 'primary', onClick: () => downloadText('镜像人生-工作提效报告.md', reportMarkdown(state)) }, '导出建议文档 (Markdown)'),
                ),
              ),
        ),
        addOpen || editingId
          ? h('div', {
              className: 'ml-mask',
              onClick: (e) => { if (e.target === e.currentTarget) { setAddOpen(false); setEditingId(''); } },
            },
              h('div', { className: 'ml-modal' },
                h('div', { className: 'ml-modal-h' },
                  h('span', null, editingId ? '编辑工作内容' : '新增日常任务'),
                  h('span', { className: 'ml-muted' }, editingId ? '改完可以顺手重生成工作流' : '写清在做什么，工作流按它生成'),
                ),
                editingId
                  ? h('div', null,
                      h(Field, { label: '工作内容描述' },
                        h(TextArea, {
                          value: editDesc,
                          rows: 5,
                          placeholder: '例如：每周一拉上周广告报表，按 SKU 对比花费、点击、转化；找出 ACOS 超标的 3 个活动，给出调价建议。',
                          onChange: setEditDesc,
                        }),
                      ),
                      h('div', { className: 'ml-modal-foot' },
                        h(Btn, { variant: 'ghost', onClick: () => setEditingId('') }, '取消'),
                        h(Btn, { variant: 'ghost', onClick: () => saveDesc(false) }, '只保存'),
                        h(Btn, { variant: 'primary', onClick: () => saveDesc(true) }, '保存并重生成工作流'),
                      ),
                    )
                  : h('div', null,
                      h(Field, { label: '任务名' },
                        h(TextInput, {
                          value: draft.name,
                          placeholder: '如：每周广告数据复盘',
                          onChange: (v) => setDraft(Object.assign({}, draft, { name: v })),
                        }),
                      ),
                      h('div', { className: 'ml-row', style: { marginTop: '8px' } },
                        h(Field, { label: '频次' },
                          h(Select, {
                            value: draft.freq,
                            options: FREQ.map((f) => ({ value: f.key, label: f.label })),
                            onChange: (v) => setDraft(Object.assign({}, draft, { freq: v })),
                          }),
                        ),
                        h(Field, { label: '单次耗时(小时)' },
                          h(TextInput, {
                            type: 'number',
                            value: String(draft.hours),
                            width: '90px',
                            onChange: (v) => setDraft(Object.assign({}, draft, { hours: Number(v) || 1 })),
                          }),
                        ),
                      ),
                      h('div', { style: { marginTop: '8px' } },
                        h(Field, { label: '工作内容（越具体，工作流越准；分句写，每句可能变成一步）' },
                          h(TextArea, {
                            value: draft.desc,
                            rows: 5,
                            placeholder: '例如：每周一拉上周广告报表，按 SKU 对比花费、点击、转化；找出 ACOS 超标的 3 个活动，给出调价建议。',
                            onChange: (v) => setDraft(Object.assign({}, draft, { desc: v })),
                          }),
                        ),
                      ),
                      h('div', { className: 'ml-modal-foot' },
                        h(Btn, { variant: 'ghost', onClick: () => setAddOpen(false) }, '取消'),
                        h(Btn, { variant: 'primary', onClick: addTask, disabled: !draft.name.trim() }, '添加并生成工作流'),
                      ),
                    ),
              ))
          : null,
      );
    }

    /* ============================== 爱好 ============================== */

    function HobbyTab(props) {
      const state = props.state;
      const update = props.update;
      const focus = props.focus || {};
      const [custom, setCustom] = useState('');

      const tags = state.hobbies.map((x) => x.tag);
      const has = (t) => tags.indexOf(t) >= 0;

      function toggle(tag) {
        update((s) => {
          if (s.hobbies.some((x) => x.tag === tag)) s.hobbies = s.hobbies.filter((x) => x.tag !== tag);
          else s.hobbies.push({ id: uid(), tag });
        });
      }

      function addCustom() {
        const t = custom.trim();
        if (!t || has(t)) return;
        update((s) => { s.hobbies.push({ id: uid(), tag: t }); });
        setCustom('');
      }

      const cards = state.hobbies.map((x) => {
        const lib = HOBBY_LIB.find((y) => y.tag === x.tag);
        return {
          tag: x.tag,
          communities: lib ? lib.communities : [{ name: '必应搜索「' + x.tag + ' 社群」', url: 'https://www.bing.com/search?q=' + encodeURIComponent(x.tag + ' 社群 同城') }],
          path: lib ? lib.path : ['先定一个 30 天小目标（每周 2 次 × 30 分钟）', '加入 1 个社区，每周至少发 1 条记录', '4 周后复盘：留下最适合你的时间与场地'],
        };
      });

      return h('div', { className: 'ml-body' },
        h(Card, { title: '我的爱好', hint: '点选或自己加' },
          h('div', { style: { marginBottom: '10px' } },
            HOBBY_LIB.map((lib) =>
              h('button', {
                key: lib.tag,
                type: 'button',
                className: 'ml-chip ml-chipbtn' + (has(lib.tag) ? ' on' : ''),
                onClick: () => toggle(lib.tag),
              }, lib.tag),
            ),
          ),
          h('div', { className: 'ml-row' },
            h(Field, { label: '其他爱好', style: { flex: '1 1 200px' } },
              h(TextInput, { value: custom, placeholder: '如：钓鱼、木工、看话剧', onChange: setCustom }),
            ),
            h(Btn, { onClick: addCustom, disabled: !custom.trim() }, '加入'),
          ),
        ),
        cards.length === 0
          ? h(Empty, null, '选 1~2 个真正想培养的爱好，别贪多。')
          : h('div', { className: 'ml-list' },
              cards.map((c) =>
                h('div', {
                  className: 'ml-member' + (focus.kind === 'hobby' && focus.tag === c.tag ? ' ml-focus' : ''),
                  key: c.tag,
                  id: 'ml-h-' + c.tag,
                  style: { gap: '8px' },
                },
                  h('div', { className: 'top' },
                    h('b', { className: 'ml-name' }, c.tag),
                    h('button', { className: 'ml-x', type: 'button', title: '移除', onClick: () => toggle(c.tag) }, '×'),
                  ),
                  h('div', null, c.communities.map((cm) =>
                    h('a', {
                      key: cm.name,
                      className: 'ml-chip',
                      href: cm.url,
                      target: '_blank',
                      rel: 'noreferrer noopener',
                      style: { textDecoration: 'none' },
                    }, cm.name + ' ↗'),
                  )),
                  h('div', { className: 'ml-tip' },
                    c.path.map((p, i) => h('div', { key: i }, (i + 1) + '. ' + p)),
                  ),
                ),
              ),
            ),
      );
    }

    /* ============================== 页面骨架 ============================== */

    const TAB_KEY = 'mirror-life:tab';

    const SECTIONS = [
      { key: 'health', label: '健康', hint: '体检指标 · 身体提醒' },
      { key: 'family', label: '家庭', hint: '生日 · 节日 · 关怀动作' },
      { key: 'work', label: '工作', hint: '任务盘点 · 提效建议 · 能力差距' },
      { key: 'hobby', label: '爱好', hint: '同好社区 · 培养路径' },
    ];

    const SECTION_LABEL = { overview: '总览', health: '健康', family: '家庭', work: '工作', hobby: '爱好' };

    function readTab() {
      try {
        const t = window.localStorage.getItem(TAB_KEY);
        if (t === 'overview' || t === 'health' || t === 'family' || t === 'work' || t === 'hobby') return t;
      } catch (err) {
        /* ignore */
      }
      return 'overview';
    }

    const THEME_KEY = 'mirror-life:theme';
    const NAV_KEY = 'mirror-life:nav';

    const THEMES = [
      { key: 'auto', label: '跟随应用主题', dot: 'linear-gradient(135deg, #5b8def, #8f5bef)' },
      { key: 'warm', label: '暖橙', dot: '#e07a33' },
      { key: 'teal', label: '青绿', dot: '#2b9c8d' },
      { key: 'indigo', label: '靛蓝', dot: '#6a63d8' },
      { key: 'rose', label: '玫瑰', dot: '#cf5f8a' },
    ];

    function readTheme() {
      try {
        const t = window.localStorage.getItem(THEME_KEY);
        if (THEMES.some((x) => x.key === t)) return t;
      } catch (err) {
        /* ignore */
      }
      return 'auto';
    }

    function readNavMini() {
      try {
        return window.localStorage.getItem(NAV_KEY) === 'mini';
      } catch (err) {
        /* ignore */
      }
      return false;
    }

    function storeFlag(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (err) {
        /* ignore */
      }
    }

    const NAVOPEN_KEY = 'mirror-life:nav-open';

    function readNavOpen() {
      try {
        const raw = window.localStorage.getItem(NAVOPEN_KEY);
        if (!raw) return {};
        const obj = JSON.parse(raw);
        return obj && typeof obj === 'object' ? obj : {};
      } catch (err) {
        /* ignore */
      }
      return {};
    }

    function MirrorIcon(props) {
      const size = (props && props.size) || 18;
      return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': 'true' },
        h('rect', { x: 2.8, y: 2.8, width: 18.4, height: 18.4, rx: 6, stroke: 'currentColor', strokeWidth: 1.4 }),
        h('ellipse', { cx: 12, cy: 10.6, rx: 4.1, ry: 5.3, stroke: 'currentColor', strokeWidth: 1.4 }),
        h('path', { d: 'M12 16.2v3.6', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }),
      );
    }

    function OverviewTab(props) {
      const state = props.state;
      const go = props.go;
      const update = props.update;

      const days = [];
      state.family.forEach((m) => {
        const d = daysUntilBirthday(m.birthday);
        if (d !== null && d <= 7) {
          days.push({ key: 'b-' + m.id, text: m.name + (d === 0 ? ' · 今天生日' : ' · ' + d + ' 天后生日'), tip: careTip(m, d) });
        }
      });
      upcomingFestivals(7).forEach((f) => {
        days.push({
          key: 'f-' + f.name,
          text: f.name + ' · ' + fmtDate(f.date) + (f.days === 0 ? '（今天）' : '（' + f.days + ' 天后）'),
          tip: '提前一天准备，别在当天找礼物。',
        });
      });
      upcomingLunarFestivals(7).forEach((f) => {
        days.push({
          key: 'lf-' + f.name,
          text: f.name + '（农历）· ' + fmtDate(f.date) + (f.days === 0 ? '（今天）' : '（' + f.days + ' 天后）'),
          tip: '农历节日：提前两天定好回家/订餐/礼物，别等到当天才想。',
        });
      });

      const rows = state.work.tasks.map((t) => ({ t, perWeek: weeklyHours(t) })).sort((a, b) => b.perWeek - a.perWeek);
      const totalWeekly = rows.reduce((s, r) => s + r.perWeek, 0);
      const noBirthday = state.family.filter((m) => !m.birthday).length;
      const topTask = rows[0];

      const p = state.profile;
      const week = state.week || { start: '', items: [] };
      const weekDone = week.items.filter((x) => x.done).length;

      return h('div', { className: 'ml-body' },
        h(Card, { title: '我的节奏', hint: '先定时间预算，再谈照顾别人' },
          h('div', { className: 'ml-row' },
            h(Field, { label: '每周给家庭（h）', style: { flex: '1 1 110px' } },
              h(TextInput, { type: 'number', value: String(p.weeklyFamily), onChange: (v) => update((s) => { s.profile.weeklyFamily = Number(v) || 0; }) }),
            ),
            h(Field, { label: '每周工作（h）', style: { flex: '1 1 110px' } },
              h(TextInput, { type: 'number', value: String(p.weeklyWork), onChange: (v) => update((s) => { s.profile.weeklyWork = Number(v) || 0; }) }),
            ),
            h(Field, { label: '睡眠底线（h）', style: { flex: '1 1 110px' } },
              h(TextInput, { type: 'number', value: String(p.sleepFloor), onChange: (v) => update((s) => { s.profile.sleepFloor = Number(v) || 0; }) }),
            ),
            h(Field, { label: '本季度第一优先', style: { flex: '1 1 150px' } },
              h(Select, {
                value: p.priority,
                options: [
                  { value: 'family', label: '家庭' },
                  { value: 'work', label: '工作' },
                  { value: 'hobby', label: '爱好' },
                  { value: 'health', label: '身体' },
                ],
                onChange: (v) => update((s) => { s.profile.priority = v; }),
              }),
            ),
          ),
          h('div', { className: 'ml-tip', style: { marginTop: '8px' } }, rhythmNote(state)),
          week.items.length
            ? h('div', { className: 'ml-tip', style: { marginTop: '4px' } },
                '本周关怀计划：已完成 ' + weekDone + ' / ' + week.items.length + ' 条，去「家庭」页打勾或重排。')
            : h('div', { className: 'ml-row', style: { marginTop: '8px' } },
                h(Btn, { variant: 'ghost', onClick: () => go('family') }, '去「家庭」生成本周关怀计划'),
              ),
        ),
        h(Card, { title: '最近 7 天', hint: '生日与节日' },
          days.length
            ? h('div', { className: 'ml-list' },
                days.map((d) =>
                  h('div', { className: 'ml-item', key: d.key },
                    h('div', { className: 'grow' }, h('b', null, d.text), h('div', { className: 'ml-tip' }, d.tip)),
                  ),
                ),
              )
            : h(Empty, null, '未来 7 天没有生日或节日。可以先把家人的生日补齐。'),
        ),
        h(Card, { title: '四条线的下一步' },
          h('div', { className: 'ml-list' },
            h('div', { className: 'ml-item' },
              h('div', { className: 'grow' },
                h('b', null, '身体'),
                h('div', { className: 'ml-tip' },
                  (function () {
                    const hs = (state.health && state.health.items) || [];
                    const flags = hs.filter((it) => it.status !== 'normal');
                    if (!hs.length) return '还没有体检指标：把最近一次体检报告的文字粘进「健康」页，会拆成指标并给出注意事项。';
                    if (!flags.length) return '已录入 ' + hs.length + ' 项，都在参考范围里；保持作息，一年复查一次。';
                    return '已录入 ' + hs.length + ' 项，' + flags.length + ' 项要关注：' + flags.slice(0, 3).map((x) => x.name + ' ' + x.value).join('、') + '。';
                  })()),
              ),
            ),
            h('div', { className: 'ml-item' },
              h('div', { className: 'grow' },
                h('b', null, '家庭'),
                h('div', { className: 'ml-tip' },
                  state.family.length
                    ? (noBirthday ? '有 ' + noBirthday + ' 位家人没填生日，先补上，提醒才不会漏。' : '生日都齐了，看看本周该给谁留 20 分钟专注时间。')
                    : '还没有家人档案：先加 3 个人（爱人、父母、孩子）。'),
              ),
            ),
            h('div', { className: 'ml-item' },
              h('div', { className: 'grow' },
                h('b', null, '工作'),
                h('div', { className: 'ml-tip' },
                  topTask
                    ? '每周投入 ' + totalWeekly.toFixed(1) + ' 小时；最耗时的是「' + topTask.t.name + '」（' + topTask.perWeek.toFixed(1) + ' h/周），建议形态：' + autoFor(topTask.t.name).form + '。'
                    : '还没录任务：写下 3 件每周都要做的事，再给每件事一键生成智能体工作区。'),
              ),
            ),
            h('div', { className: 'ml-item' },
              h('div', { className: 'grow' },
                h('b', null, '爱好'),
                h('div', { className: 'ml-tip' },
                  state.hobbies.length
                    ? '已选 ' + state.hobbies.length + ' 个爱好；去「爱好」看同好社区和 3 步培养路径。'
                    : '还没有爱好：先选 1 个你最想长期做下去的。'),
              ),
            ),
          ),
          h('div', { className: 'ml-row', style: { marginTop: '10px' } },
            h(Btn, { onClick: () => go('health') }, '去健康'),
            h(Btn, { onClick: () => go('family') }, '去家庭'),
            h(Btn, { onClick: () => go('work') }, '去工作'),
            h(Btn, { onClick: () => go('hobby') }, '去爱好'),
          ),
        ),
      );
    }

    function MirrorLifePage() {
      const [state, setState] = useState(loadState);
      const [tab, setTab] = useState(readTab);
      const [theme, setTheme] = useState(readTheme);
      const [navMini, setNavMini] = useState(readNavMini);
      const [navOpen, setNavOpen] = useState(readNavOpen);
      const [focus, setFocus] = useState({ kind: '', id: '', tag: '' });
      const [mottoEdit, setMottoEdit] = useState(false);
      const [mottoDraft, setMottoDraft] = useState('');

      const saveMotto = () => {
        const next = String(mottoDraft || '').trim().slice(0, 60) || DEFAULT_MOTTO;
        setState((s) => ({ ...s, profile: { ...s.profile, motto: next } }));
        setMottoEdit(false);
      };

      const toggleNavGroup = (key) => {
        setNavOpen((prev) => {
          const next = { ...prev, [key]: prev[key] === false };
          try {
            window.localStorage.setItem(NAVOPEN_KEY, JSON.stringify(next));
          } catch (err) {
            /* ignore */
          }
          return next;
        });
      };

      useEffect(() => {
        saveState(state);
      }, [state]);

      const switchTab = (next) => {
        setFocus({ kind: '', id: '', tag: '' });
        setTab(next);
        try {
          window.localStorage.setItem(TAB_KEY, next);
        } catch (err) {
          /* ignore */
        }
      };

      /* 左侧目录里的对象可以直接点开：切到对应页并把那一条高亮 + 滚到中间 */
      const openLeaf = (sectionKey, leaf) => {
        const kind = sectionKey === 'health' ? 'metric' : sectionKey === 'family' ? 'member' : sectionKey === 'work' ? 'task' : 'hobby';
        setFocus({ kind, id: leaf.key, tag: leaf.tag || '' });
        setTab(sectionKey);
        try {
          window.localStorage.setItem(TAB_KEY, sectionKey);
        } catch (err) {
          /* ignore */
        }
        const elId =
          kind === 'metric' ? 'ml-x-' + leaf.key : kind === 'member' ? 'ml-m-' + leaf.key : kind === 'task' ? 'ml-t-' + leaf.key : 'ml-h-' + (leaf.tag || leaf.key);
        setTimeout(() => {
          try {
            const el = document.getElementById(elId);
            if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
          } catch (err) {
            /* 滚动失败不影响其它功能 */
          }
        }, 60);
      };

      const pickTheme = (next) => {
        setTheme(next);
        storeFlag(THEME_KEY, next);
      };

      const toggleNav = () => {
        const next = !navMini;
        setNavMini(next);
        storeFlag(NAV_KEY, next ? 'mini' : 'full');
      };

      const update = (mutator) => {
        setState((prev) => {
          const next = clone(prev);
          mutator(next);
          return next;
        });
      };

      const birthdaySoon = state.family.filter((m) => {
        const d = daysUntilBirthday(m.birthday);
        return d !== null && d <= 30;
      }).length;
      const totalWeekly = state.work.tasks.reduce((s, t) => s + weeklyHours(t), 0);
      const festSoon = upcomingFestivals(30).length;

      const healthItems = state.health.items || [];
      const healthFlagged = healthItems.filter((it) => it.status !== 'normal').length;
      const counts = { health: healthFlagged, family: state.family.length, work: state.work.tasks.length, hobby: state.hobbies.length };
      const healthLeaves = healthItems
        .slice()
        .sort((a, b) => (a.status === 'normal' ? 1 : 0) - (b.status === 'normal' ? 1 : 0))
        .slice(0, 8)
        .map((it) => ({ key: it.id, text: it.name + ' ' + it.value + (it.status && it.status !== 'normal' ? ' · ' + (HEALTH_STATUS[it.status] || '异常') : ''), tag: '' }));
      const leaves = {
        health: healthLeaves,
        family: state.family.slice(0, 8).map((m) => ({ key: m.id, text: m.name + (m.birthday ? '' : ' · 未填生日'), tag: '' })),
        work: state.work.tasks.slice(0, 8).map((t) => ({ key: t.id, text: t.name + (t.workspace ? ' · 有工作区' : ''), tag: '' })),
        hobby: state.hobbies.slice(0, 8).map((x) => ({ key: x.id, text: x.tag, tag: x.tag })),
      };
      const emptyLeaf = { health: '还没有体检指标', family: '还没有家人', work: '还没有任务', hobby: '还没有爱好' };

      return h('div', {
        className: 'ml-page' + (navMini ? ' nav-mini' : ''),
        'data-theme': theme,
        'data-nav': navMini ? 'mini' : 'full',
      },
        h('style', { dangerouslySetInnerHTML: { __html: CSS } }),
        h('nav', { className: 'ml-nav', 'aria-label': '镜像人生目录' },
          h('div', { className: 'ml-nav-top' },
            h('div', { className: 'ml-nav-kicker' }, '镜像人生'),
            h('button', {
              type: 'button',
              className: 'ml-nav-toggle',
              title: navMini ? '展开目录' : '收起目录',
              'aria-label': navMini ? '展开目录' : '收起目录',
              onClick: toggleNav,
            }, navMini ? '»' : '«'),
          ),
          h('button', {
            type: 'button',
            className: 'ml-nav-item' + (tab === 'overview' ? ' on' : ''),
            title: '总览 · 最近 7 天与四条线的下一步',
            style: navMini ? undefined : { paddingLeft: '10px' },
            onClick: () => switchTab('overview'),
          },
            navMini ? h('span', { className: 'ml-nav-char' }, '总') : h(MirrorIcon, { size: 15 }),
            h('span', { className: 'ml-nav-lbl' }, '总览'),
            navMini ? null : h('span', { className: 'cnt' }, ''),
          ),
          h('div', { className: 'ml-nav-sep' }),
          SECTIONS.map((s) => {
            const open = navOpen[s.key] !== false;
            return h('div', { className: 'ml-nav-group' + (open ? '' : ' closed'), key: s.key },
              h('div', { className: 'ml-nav-row' },
                h('button', {
                  type: 'button',
                  className: 'ml-nav-item' + (tab === s.key ? ' on' : ''),
                  title: s.label + ' · ' + s.hint,
                  onClick: () => switchTab(s.key),
                },
                  h('span', { className: 'ml-nav-char' }, s.label.slice(0, 1)),
                  h('span', { className: 'ml-nav-lbl' }, s.label),
                  h('span', { className: 'cnt' }, String(counts[s.key] || 0)),
                ),
                h('button', {
                  type: 'button',
                  className: 'ml-nav-chev',
                  title: open ? '收起「' + s.label + '」目录' : '展开「' + s.label + '」目录',
                  'aria-label': (open ? '收起' : '展开') + s.label + '目录',
                  'aria-expanded': open ? 'true' : 'false',
                  onClick: () => toggleNavGroup(s.key),
                }, h('span', { className: 'chev' }, '▾')),
              ),
              h('div', { className: 'ml-nav-group-body' },
                (leaves[s.key].length ? leaves[s.key] : [{ key: '_empty', text: emptyLeaf[s.key], tag: '' }]).map((leaf) => {
                  const active =
                    (s.key === 'health' && focus.kind === 'metric' && focus.id === leaf.key) ||
                    (s.key === 'family' && focus.kind === 'member' && focus.id === leaf.key) ||
                    (s.key === 'work' && focus.kind === 'task' && focus.id === leaf.key) ||
                    (s.key === 'hobby' && focus.kind === 'hobby' && focus.id === leaf.key);
                  return h('button', {
                    type: 'button',
                    key: leaf.key,
                    className: 'ml-nav-leaf' + (leaf.key === '_empty' ? ' muted' : '') + (active ? ' on' : ''),
                    title: leaf.text,
                    style: active ? { color: 'var(--ml-accent)', fontWeight: '600' } : null,
                    onClick: leaf.key === '_empty' ? undefined : () => openLeaf(s.key, leaf),
                  }, leaf.text);
                }),
              ),
            );
          }),
        ),
        h('main', { className: 'ml-main' },
          h('div', { className: 'ml-root' },
            h('div', { className: 'ml-head' },
              h('div', null,
                h('div', { className: 'ml-crumb' }, '镜像人生 / ', h('b', null, SECTION_LABEL[tab] || '总览')),
                h('h1', { className: 'ml-h1' }, tab === 'overview' ? '今天该做什么' : SECTION_LABEL[tab] + ' · ' + (SECTIONS.find((s) => s.key === tab) || {}).hint),
                mottoEdit
                  ? h('div', { className: 'ml-motto-edit' },
                      h('input', {
                        className: 'ml-in ml-motto-input',
                        value: mottoDraft,
                        maxLength: 60,
                        placeholder: '写一句给自己的话（≤60 字）',
                        autoFocus: true,
                        onChange: (e) => setMottoDraft(e.target.value),
                        onKeyDown: (e) => {
                          if (e.key === 'Enter') saveMotto();
                          if (e.key === 'Escape') setMottoEdit(false);
                        },
                      }),
                      h(Btn, { variant: 'primary', onClick: saveMotto }, '保存'),
                      h(Btn, { variant: 'ghost', onClick: () => setMottoEdit(false) }, '取消'),
                    )
                  : h('button', {
                      type: 'button',
                      className: 'ml-motto',
                      title: '点一下，换成你自己的励志语句',
                      onClick: () => {
                        setMottoDraft(state.profile.motto || DEFAULT_MOTTO);
                        setMottoEdit(true);
                      },
                    },
                      h('span', null, state.profile.motto || DEFAULT_MOTTO),
                      h('span', { className: 'ml-motto-pen' }, ' ✎'),
                    ),
              ),
              h('div', { className: 'ml-tools' },
                h('div', { className: 'ml-swatches', role: 'group', 'aria-label': '界面配色' },
                  THEMES.map((t) =>
                    h('button', {
                      key: t.key,
                      type: 'button',
                      className: 'ml-swatch' + (theme === t.key ? ' on' : ''),
                      title: '配色：' + t.label,
                      'aria-label': '配色：' + t.label,
                      style: { background: t.dot },
                      onClick: () => pickTheme(t.key),
                    }),
                  ),
                ),
                h('span', { className: 'ml-badge' }, '数据仅存本机浏览器'),
              ),
            ),
            tab === 'overview'
              ? [
                  h('div', { className: 'ml-stats', key: 'stats' },
                    h('div', { className: 'ml-stat' }, h('b', null, String(state.family.length)), h('span', null, '位家人')),
                    h('div', { className: 'ml-stat' }, h('b', null, String(birthdaySoon)), h('span', null, '30 天内生日')),
                    h('div', { className: 'ml-stat' }, h('b', null, String(festSoon)), h('span', null, '30 天内节日')),
                    h('div', { className: 'ml-stat' }, h('b', null, totalWeekly ? totalWeekly.toFixed(1) : '0'), h('span', null, '每周任务耗时(h)')),
                    h('div', { className: 'ml-stat' }, h('b', null, String(state.hobbies.length)), h('span', null, '个爱好')),
                    h('div', { className: 'ml-stat' }, h('b', null, String(healthFlagged)), h('span', null, '项指标待关注')),
                  ),
                  h(OverviewTab, { key: 'overview', state, go: switchTab, update }),
                ]
              : null,
            tab === 'health' ? h(HealthTab, { state, update, focus }) : null,
            tab === 'family' ? h(FamilyTab, { state, update, focus }) : null,
            tab === 'work' ? h(WorkTab, { state, update, focus }) : null,
            tab === 'hobby' ? h(HobbyTab, { state, update, focus }) : null,
            h('div', { className: 'ml-foot' },
              h('span', null, '镜像人生 MVP v0.8.0 · 规则生成，不做 AI 推理，也不构成医疗/职业建议'),
              h('span', { style: { flex: '1' } }),
              h(Btn, { variant: 'ghost', onClick: () => downloadText('mirror-life-备份.json', JSON.stringify(state, null, 2)) }, '导出数据'),
              h(Btn, {
                variant: 'ghost',
                onClick: () => {
                  try {
                    const el = document.createElement('input');
                    el.type = 'file';
                    el.accept = '.json,application/json';
                    el.onchange = () => {
                      const file = el.files && el.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        try {
                          setState(normalize(JSON.parse(String(reader.result))));
                        } catch (err) {
                          /* 文件格式不对就保持原样 */
                        }
                      };
                      reader.readAsText(file, 'utf-8');
                    };
                    el.click();
                  } catch (err) {
                    /* 浏览器限制时忽略 */
                  }
                },
              }, '导入数据'),
              h(Btn, {
                variant: 'danger',
                onClick: () => {
                  if (window.confirm('清空本机全部镜像人生数据？此操作不可撤销。')) setState(emptyState());
                },
              }, '清空'),
            ),
          ),
        ),
      );
    }

    /* ============================== 注册 ============================== */

    return {
      inject: ['slots'],
      apply(ctx) {
        /* 左侧面板列：紧跟在「自动化任务」（order 10）之后 */
        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register({
            name: 'sidebar.panellist',
            id: 'mirror-life',
            order: 15,
            label: '镜像人生',
          }, MirrorIcon),
        );
        /* 中央面板：由左栏那一格的 id 选中 */
        ctx.slots.inject('main', () =>
          ctx.slots.register({
            name: 'main',
            key: 'mirror-life',
          }, MirrorLifePage),
        );
      },
    };
  },
});
