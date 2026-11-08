/**
 * 镜像人生 · Host 半
 *
 * 职责：把「工作」页里的一个日常任务编译成一个真正能交给 agent 干活的工作区。
 *
 *   <镜像人生根目录>/工作目录/<任务名>/
 *     AGENTS.md         ← 智能体定义（DSH 会话在这个目录下会自动读取）
 *     任务说明.md        ← 人看的：触发、输入、输出、验收
 *     输入清单.md        ← 成果模板 / 知识库 / 数据库的登记结果（每次上传后重写）
 *     sources.json      ← 上面这份清单的机器可读版本
 *     成果模板/          ← 交付物结构（单独的上传口）
 *     知识库/           ← 上传的资料文件
 *     数据库/           ← 上传的数据库/导出表
 *     inputs/README.md  ← 取数顺序说明
 *     outputs/          ← agent 的产出放这里
 *
 * 根目录默认 D:\Deep Seek Harness\工作区\镜像人生，客户端可传 root 覆盖。
 *
 * HTTP 路由（客户端不直接碰文件系统）：
 *   POST /mirror-life/api/inspect           { path }                → 路径是否存在、目录里有什么
 *   POST /mirror-life/api/build             { task, root, ... }     → 生成上面的工作区
 *   POST /mirror-life/api/upload            { dir, kind, mode, ... }→ 成果模板/知识库/数据库 的上传与路径登记
 *   POST /mirror-life/api/workspace/delete  { dir }                 → 撤销生成的工作区
 *
 * 边界：写入范围严格限制在 <根目录>/工作目录 之下。
 */

import fsp from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';

const API = '/mirror-life/api';
const MAX_BODY = 40 * 1024 * 1024;
const MAX_FILE = 30 * 1024 * 1024;
const MAX_LIST = 40;
const WORK_DIR_NAME = '工作目录';
const DEFAULT_MIRROR_ROOT = 'D:\\Deep Seek Harness\\工作区\\镜像人生';
const SOURCE_DIRS = { knowledge: '知识库', database: '数据库', template: '成果模板' };
const SOURCE_LABELS = { knowledge: '知识库', database: '数据库', template: '成果模板' };

/* ------------------------------------------------------------------ */
/* HTTP 小工具                                                          */
/* ------------------------------------------------------------------ */

function sendJson(response, status, body) {
  const text = JSON.stringify(body === undefined ? null : body);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(text),
  });
  response.end(text);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('请求体过大'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error('请求体不是合法 JSON'));
      }
    });
    request.on('error', reject);
  });
}

/* ------------------------------------------------------------------ */
/* 文本工具                                                             */
/* ------------------------------------------------------------------ */

function str(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function slug(text) {
  const cleaned = String(text || '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return (cleaned || '未命名任务').slice(0, 40);
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 只留文件名，去掉路径分隔符与非法字符；空名给个兜底。 */
function safeFileName(name) {
  const base = String(name || '')
    .split(/[\\/]/)
    .pop()
    .replace(/[<>:"|?*\u0000-\u001f]/g, '-')
    .replace(/^\.+/, '')
    .trim();
  return (base || '未命名文件').slice(0, 120);
}

/** 把用户填的地址规整成绝对路径（相对路径按工作目录解析），并去掉首尾引号。 */
function resolveUserPath(input, baseDir) {
  const raw = str(input).replace(/^["']|["']$/g, '');
  if (!raw) return '';
  if (/^[a-zA-Z]:[\\/]/.test(raw) || raw.startsWith('\\\\') || raw.startsWith('/')) {
    return path.normalize(raw);
  }
  return path.resolve(baseDir, raw);
}

/* ------------------------------------------------------------------ */
/* 内容生成                                                             */
/* ------------------------------------------------------------------ */

function agentsMarkdown(ctx) {
  const { task, profile, template, knowledge, database, suggestion, workspaceName } = ctx;
  const lines = [];

  lines.push(`# ${task.name} · 智能体工作区`);
  lines.push('');
  lines.push(`> 由「镜像人生」按任务生成于 ${stamp()}。修改本文件即可调整这个智能体的行为。`);
  lines.push('');
  lines.push('## 你是谁');
  lines.push('');
  const who = [];
  if (profile.role) who.push(`岗位：${profile.role}`);
  if (profile.company) who.push(`公司/业务：${profile.company}`);
  if (profile.expert) who.push(`对标基线：${profile.expert}`);
  lines.push(who.length ? who.join('；') : '岗位未填写——先补上岗位与业务，否则判断力没有落点。');
  lines.push('');
  lines.push(`你负责的日常任务：**${task.name}**${task.freqLabel ? `（${task.freqLabel}，单次约 ${task.hours} 小时）` : ''}。`);
  lines.push('');
  lines.push('## 目标');
  lines.push('');
  lines.push(`把「${task.name}」一次做对，做到不需要人再返工：${suggestion.form}。`);
  if (suggestion.tip) lines.push('');
  if (suggestion.tip) lines.push(`形态说明：${suggestion.tip}`);
  lines.push('');
  lines.push('## 工作流（按顺序执行，不要跳步）');
  lines.push('');
  const flow = Array.isArray(task.workflow)
    ? task.workflow.filter((s) => s && String(s.name || '').trim()).map((s) => ({ name: String(s.name).trim(), note: String(s.note || '').trim() }))
    : [];
  if (flow.length) {
    lines.push('> 步骤来自「镜像人生」里的工作流示意图（页面可改，改了会写进这里）。');
    lines.push('');
    flow.forEach((s, i) => {
      lines.push(`${i + 1}. **${s.name}**${s.note ? `：${s.note}` : ''}`);
    });
    let k = flow.length;
    lines.push(`${++k}. **自检**：逐条跑下面「自检清单」，有一条不过就回到上一步，不要带着问题交付。`);
    lines.push(`${++k}. **交付**：写到 \`outputs/${stamp()}-${slug(task.name)}.md\`，并在回复里给出路径与三条要点。`);
  } else {
    lines.push('1. **读输入**：先读 `输入清单.md`（谁登记了什么），再看 `成果模板/` 里有没有模板——有就以它的结构为准，没有就用 `任务说明.md` 里的骨架。');
    lines.push('2. **列事实**：把这次要用的每个数据点列成清单，逐个标出来源（文件 + 行号 / 哪张表哪一列 / 哪个已登记路径）。');
    lines.push('3. **填模板**：模板的章节结构不改，只填空、补说明；模板里没有的结论不要另起一节。');
    lines.push('4. **自检**：逐条跑「自检清单」，有一条不过就回到上一步，不要带着问题交付。');
    lines.push(`5. **交付**：写到 \`outputs/${stamp()}-${slug(task.name)}.md\`，并在回复里给出路径与三条要点。`);
  }
  lines.push('');
  lines.push('## 输入');
  lines.push('');
  lines.push('- 输入总清单：`输入清单.md`（成果模板 / 知识库 / 数据库 的登记结果，每次上传后自动刷新）');
  lines.push(`- 成果模板：\`成果模板/\`${template ? `（本次生成时带入了 \`${template.name}\`）` : '（还没上传，可让用户在页面上传）'}`);
  lines.push('- 知识库：`知识库/`（用户上传的文件）+ 清单里登记的本机路径 / 外部链接');
  lines.push('- 数据库：`数据库/`（用户上传的 .db / .sqlite / .csv 等）+ 清单里登记的本机路径 / 外部链接');
  lines.push('');
  lines.push('调用规则：');
  lines.push('');
  lines.push('- 动手前先列目录：知识库里最多挑 20 个与任务相关的文件，只读这些；不要通读整个知识库。');
  lines.push('- 数据库优先看结构（表名 / 列名）与最近一段数据，再决定取哪些字段，不要一次拉全量。');
  lines.push('- 外部链接要用联网检索 / 抓取工具取正文（不要凭标题猜内容），取不到就写「链接不可达」。');
  lines.push('- 引用知识库内容必须标出处：`<文件名>#L<行号>`；引用数据库必须写清库名、表名、过滤条件与时间范围；引用链接写完整 URL 与访问日期。');
  lines.push('- 路径不存在或读不到时，直接在产出里写「缺失 + 影响 + 取数方式」，然后继续能做的部分，不要编造。');
  lines.push('');
  lines.push('## 输出契约');
  lines.push('');
  lines.push('- 篇幅与结构以模板为准；模板没规定篇幅时，正文控制在 800~1200 字（按中文字符计，含标点，不含表格与附注）。');
  lines.push('- 所有数值必须标数据窗口（哪一天到哪一天）与口径；没有来源的推算标「估算」并给区间。');
  lines.push('- 同一份产出里的数字要能互相验算；发现矛盾停下来说明，不要两边都留着。');
  lines.push('- 结论写在最前面，证据放后面；不要用「可能 / 大概 / 相关性强」这类没有判据的词。');
  lines.push('');
  lines.push('## 自检清单（交付前逐条打勾）');
  lines.push('');
  lines.push('- [ ] 模板的每个小节都填了，没有留空章节');
  lines.push('- [ ] 每个数字都能点到来源文件/表，或明确标了「估算」');
  lines.push('- [ ] 数据窗口、口径、单位写清楚了');
  lines.push('- [ ] 正文里的数字两两复算过，没有互相矛盾');
  lines.push('- [ ] 结论可以被反证（写清楚什么情况下它是错的）');
  lines.push('- [ ] 缺口写出来了：缺什么、影响哪个结论、下一步怎么补');
  lines.push('');
  lines.push('## 工作区');
  lines.push('');
  lines.push(`- 目录：\`${workspaceName}\``);
  lines.push('- 结构：`成果模板/`（交付物结构）· `知识库/` · `数据库/` · `outputs/`（产出）· `输入清单.md`（输入总账）');
  lines.push('');
  return lines.join('\n');
}

function taskMarkdown(ctx) {
  const { task, profile, template, knowledge, database, suggestion } = ctx;
  const lines = [];
  lines.push(`# 任务说明 · ${task.name}`);
  lines.push('');
  lines.push(`- 生成时间：${stamp()}`);
  lines.push(`- 岗位：${profile.role || '（未填写）'}`);
  lines.push(`- 公司 / 业务：${profile.company || '（未填写）'}`);
  lines.push(`- 频次：${task.freqLabel || '（未填写）'}；单次耗时：约 ${task.hours} 小时；每周投入：约 ${task.perWeek} 小时`);
  lines.push(`- 建议形态：${suggestion.form}`);
  lines.push('');
  if (task.desc) {
    lines.push('## 工作内容');
    lines.push('');
    lines.push(String(task.desc));
    lines.push('');
  }
  const flow = Array.isArray(task.workflow)
    ? task.workflow.filter((s) => s && String(s.name || '').trim()).map((s) => ({ name: String(s.name).trim(), note: String(s.note || '').trim() }))
    : [];
  if (flow.length) {
    lines.push('## 工作流（页面可改；AGENTS.md 里是同一份）');
    lines.push('');
    flow.forEach((s, i) => lines.push(`${i + 1}. ${s.name}${s.note ? `：${s.note}` : ''}`));
    lines.push('');
  }
  lines.push('## 这件事什么时候算做完');
  lines.push('');
  lines.push('1. 产出的结构与你上传的模板一致；');
  lines.push('2. 每个结论都带证据（文件 + 行号 / 表 + 字段 / 时间窗口）；');
  lines.push('3. 交付前自检清单全过，缺口都写明。');
  lines.push('');
  lines.push('## 输入');
  lines.push('');
  lines.push(`- 成果模板：${template ? `\`成果模板/${template.name}\`` : '`成果模板/`（还没上传）'}`);
  lines.push('- 知识库：`知识库/` + 输入清单里登记的路径');
  lines.push('- 数据库：`数据库/` + 输入清单里登记的路径');
  lines.push('- 输入总账：`输入清单.md`');
  lines.push('');
  lines.push('## 输出');
  lines.push('');
  lines.push(`- 路径：\`outputs/${stamp()}-${slug(task.name)}.md\``);
  lines.push('- 格式：Markdown；结构以模板为准');
  lines.push('');
  lines.push('## 怎么用这个工作区');
  lines.push('');
  lines.push('1. 在 DSH 里把工作目录切到本目录（或在「镜像人生」里点生成时已自动登记为工作区）；');
  lines.push('2. 新开一个会话，直接说「按 AGENTS.md 做一次 ' + task.name + '」；');
  lines.push('3. 产出会落在 `outputs/` 里；不满意就改 AGENTS.md 的「工作流 / 自检清单」，下一轮生效。');
  lines.push('');
  return lines.join('\n');
}

/* ---------------- 输入清单：机器可读 sources.json + 人读 输入清单.md ---------------- */

function emptySources() {
  return {
    knowledge: { files: [], paths: [], urls: [] },
    database: { files: [], paths: [], urls: [] },
    template: { files: [], paths: [], urls: [] },
  };
}

function normalizeSources(raw) {
  const base = emptySources();
  if (!raw || typeof raw !== 'object') return base;
  Object.keys(base).forEach((kind) => {
    const src = raw[kind] && typeof raw[kind] === 'object' ? raw[kind] : {};
    base[kind].files = Array.isArray(src.files) ? src.files : [];
    base[kind].paths = Array.isArray(src.paths) ? src.paths : [];
    base[kind].urls = Array.isArray(src.urls) ? src.urls : [];
  });
  return base;
}

/* 外部链接只接受 http(s)：页面把它登记成「外部数据源」，agent 用联网工具去取。 */
function normalizeUrl(value) {
  const raw = String(value || '').trim();
  if (!/^https?:\/\/[^\s]+$/i.test(raw)) return '';
  return raw.length > 2000 ? raw.slice(0, 2000) : raw;
}

async function readSources(dir) {
  try {
    const raw = await fsp.readFile(path.join(dir, 'sources.json'), 'utf8');
    return normalizeSources(JSON.parse(raw));
  } catch (err) {
    return emptySources();
  }
}

async function writeSources(dir, sources) {
  const normalized = normalizeSources(sources);
  await fsp.writeFile(path.join(dir, 'sources.json'), JSON.stringify(normalized, null, 2), 'utf8');
  return normalized;
}

function inputsManifest(ctx, sources) {
  const { task } = ctx;
  const lines = [];
  lines.push(`# 输入清单 · ${task.name}`);
  lines.push('');
  lines.push(`> 由「镜像人生」维护，生成于 ${stamp()}；在页面上传 / 登记后会自动重写，不用手改。`);
  lines.push('');

  const section = (kind, extra) => {
    const dirName = SOURCE_DIRS[kind];
    const src = sources[kind];
    lines.push(`## ${SOURCE_LABELS[kind]}`);
    lines.push('');
    if (!src.files.length && !src.paths.length && !src.urls.length) {
      lines.push(`- 还没登记任何内容：可以在任务卡上「上传文件」「加外部链接」，也可以直接把文件放进 \`${dirName}/\`。`);
    } else {
      src.files.forEach((f) => {
        lines.push(`- 文件：\`${dirName}/${f.name}\`${f.size ? `（${Math.max(1, Math.round(f.size / 1024))} KB）` : ''}`);
      });
      src.paths.forEach((p) => {
        lines.push(`- 本机路径：\`${p.path}\`${p.exists === false ? '（生成时未访问到，用时先确认）' : ''}`);
      });
      src.urls.forEach((u) => {
        lines.push(`- 外部链接：${u.url}`);
      });
    }
    if (extra) lines.push(`- ${extra}`);
    lines.push('');
  };

  section('template', '交付物的结构以这里为准；和用户口头要求冲突时，先问一句再改结构。');
  section('knowledge', '先列目录挑 ≤20 个相关文件；引用标 `<文件名>#L<行号>`；外部链接先用联网检索/抓取工具取正文。');
  section('database', '先看表 / 列结构与最近一段数据，再取数；写清库名、表名、过滤条件与时间范围。');
  lines.push('## 取数顺序');
  lines.push('');
  lines.push('1. 成果模板（定结构）→ 2. 知识库（定口径与背景）→ 3. 数据库（定数字）→ 4. 缺口清单 → 5. 成稿。');
  lines.push('');
  return lines.join('\n');
}

function inputsMarkdown(ctx) {
  const { task } = ctx;
  const lines = [];
  lines.push(`# 输入说明 · ${task.name}`);
  lines.push('');
  lines.push('数据放在 `成果模板/`、`知识库/`、`数据库/` 三个目录里，登记结果写在根目录的 `输入清单.md`。');
  lines.push('');
  lines.push('## 取数顺序');
  lines.push('');
  lines.push('1. 成果模板（定结构）→ 2. 知识库（定口径与背景）→ 3. 数据库（定数字）→ 4. 缺口清单 → 5. 成稿。');
  lines.push('');
  return lines.join('\n');
}

function startupPrompt(ctx) {
  const { task, workspaceName, sources } = ctx;
  const parts = [];
  parts.push(`按工作区 \`${workspaceName}\` 里的 AGENTS.md，做一次「${task.name}」。`);
  parts.push('先读 输入清单.md 和 成果模板/，再按 AGENTS.md 的调用规则读知识库与数据库；缺口直接写出来，不要编数。');
  parts.push('产出写到 outputs/ 下，并在回复里给路径和三条要点。');
  const total = sources
    ? Object.keys(sources).reduce(
        (n, k) => n + sources[k].files.length + sources[k].paths.length + (sources[k].urls || []).length,
        0,
      )
    : 0;
  if (total) parts.push(`已登记输入 ${total} 项（见 输入清单.md）。`);
  return parts.join('\n');
}

/* ------------------------------------------------------------------ */
/* 插件入口                                                             */
/* ------------------------------------------------------------------ */

export function apply(root) {
  // Cordis 的服务必须声明依赖后才能取到（直接读 ctx.webServer 会抛
  // `cannot get property "webServer" without inject`）。这里按官方插件的做法
  // 在 apply 内用 root.inject 声明，而不是对象级 inject —— 后者会在服务缺失时
  // 让整个插件加载失败。
  root.inject(['webServer', 'workspaceRegistry'], (ctx) => {
    const webServer = ctx.webServer;
    if (!webServer || typeof webServer.register !== 'function') {
      ctx.logger?.warn?.('[mirror-life] webServer 不可用，Host 路由未注册');
      return;
    }

    const workspaceRegistry = ctx.workspaceRegistry;

  /** 镜像人生根目录：客户端可传 root 覆盖，默认 DEFAULT_MIRROR_ROOT。 */
  function mirrorRoot(raw) {
    const given = str(raw).replace(/^["']|["']$/g, '');
    if (given) {
      try {
        return path.resolve(given);
      } catch (err) {
        /* 非法路径，落回默认 */
      }
    }
    return path.resolve(DEFAULT_MIRROR_ROOT);
  }

  /** 工作区根：<镜像人生根目录>/工作目录 */
  function workRoot(raw) {
    return path.join(mirrorRoot(raw), WORK_DIR_NAME);
  }

  /** 只允许操作 工作目录 下的一级目录，返回 null 表示越界。 */
  function safeWorkspaceDir(dirRaw, rootRaw) {
    const target = path.resolve(str(dirRaw));
    const rel = path.relative(workRoot(rootRaw), target);
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
    if (rel.split(path.sep).length !== 1) return null;
    return target;
  }

  const disposers = [];

  /* ---------------- 健康检查 ---------------- */
  disposers.push(webServer.register({
    kind: 'exact',
    path: `${API}/health`,
    handler: (request, response) => {
      if (request.method !== 'GET') {
        response.writeHead(405, { allow: 'GET' });
        response.end();
        return;
      }
      sendJson(response, 200, { ok: true, app: 'mirror-life', version: '0.8.0', base: mirrorRoot() });
    },
  }));

  /* ---------------- 地址检查（只读） ---------------- */
  disposers.push(webServer.register({
    kind: 'exact',
    path: `${API}/inspect`,
    handler: async (request, response) => {
      if (request.method !== 'POST') {
        response.writeHead(405, { allow: 'POST' });
        response.end();
        return;
      }
      try {
        const body = await readJsonBody(request);
        const target = resolveUserPath(body.path, mirrorRoot());
        if (!target) return sendJson(response, 200, { ok: false, error: '地址为空' });

        let stat;
        try {
          stat = await fsp.stat(target);
        } catch (err) {
          return sendJson(response, 200, {
            ok: true,
            path: target,
            exists: false,
            error: err.code === 'ENOENT' ? '路径不存在' : `无法访问（${err.code || 'ERROR'}）`,
          });
        }

        if (!stat.isDirectory()) {
          return sendJson(response, 200, {
            ok: true,
            path: target,
            exists: true,
            isDir: false,
            size: stat.size,
            hint: '这是文件；如果它是一份数据文件（csv/xlsx/sqlite），agent 可以直接读。',
          });
        }

        const entries = await fsp.readdir(target, { withFileTypes: true });
        const listed = entries
          .filter((e) => e.name !== 'node_modules' && e.name !== '.git')
          .slice(0, MAX_LIST)
          .map((e) => ({ name: e.name, dir: e.isDirectory() }));
        const byExt = {};
        entries.forEach((e) => {
          if (e.isDirectory()) return;
          const ext = path.extname(e.name).toLowerCase() || '(无扩展名)';
          byExt[ext] = (byExt[ext] || 0) + 1;
        });
        const topExt = Object.keys(byExt)
          .sort((a, b) => byExt[b] - byExt[a])
          .slice(0, 6)
          .map((ext) => `${ext} × ${byExt[ext]}`);
        return sendJson(response, 200, {
          ok: true,
          path: target,
          exists: true,
          isDir: true,
          count: entries.length,
          entries: listed,
          summary: topExt,
        });
      } catch (err) {
        sendJson(response, 200, { ok: false, error: String((err && err.message) || err) });
      }
    },
  }));

  /* ---------------- 删除已生成的工作区（目录 + 登记） ---------------- */
  disposers.push(webServer.register({
    kind: 'exact',
    path: `${API}/workspace/delete`,
    handler: async (request, response) => {
      if (request.method !== 'POST') {
        response.writeHead(405, { allow: 'POST' });
        response.end();
        return;
      }
      try {
        const body = await readJsonBody(request);
        const target = str(body.dir);
        if (!target) return sendJson(response, 200, { ok: false, error: '缺少目录' });

        const resolved = path.resolve(target);
        // 只允许删自己生成的东西：路径必须是 <根目录>/工作目录 下的一级目录。
        const target2 = safeWorkspaceDir(resolved, body.root);
        if (!target2) {
          return sendJson(response, 200, { ok: false, error: '只能删除 镜像人生/工作目录 下生成的工作区' });
        }
        const finalDir = target2;

        let unregistered = false;
        try {
          const list = workspaceRegistry && typeof workspaceRegistry.list === 'function' ? workspaceRegistry.list() : [];
          const hit = list.find((w) => w && w.path && path.resolve(w.path) === finalDir);
          if (hit) {
            await workspaceRegistry.delete(hit.id);
            unregistered = true;
          }
        } catch (err) {
          /* 登记删不掉不影响目录删除 */
        }

        await fsp.rm(finalDir, { recursive: true, force: true });
        sendJson(response, 200, { ok: true, dir: finalDir, unregistered });
      } catch (err) {
        sendJson(response, 200, { ok: false, error: String((err && err.message) || err) });
      }
    },
  }));

  /* ---------------- 成果回传：列出 outputs/ 里最近产出的文件 ----------------
   * GET /mirror-life/api/outputs?dir=<工作区>&root=<根>
   * 只读，用来在页面上显示「这个任务最近一次产出是什么」。
   */
  disposers.push(webServer.register({
    kind: 'exact',
    path: `${API}/outputs`,
    handler: async (request, response) => {
      if (request.method !== 'GET') {
        response.writeHead(405, { allow: 'GET' });
        response.end();
        return;
      }
      try {
        const url = new URL(request.url, 'http://localhost');
        const rawDir = url.searchParams.get('dir') || '';
        const rawRoot = url.searchParams.get('root') || '';
        const dir = safeWorkspaceDir(rawDir, rawRoot);
        if (!dir) return sendJson(response, 200, { ok: false, error: '工作区不在 镜像人生/工作目录 下' });

        const outDir = path.join(dir, 'outputs');
        let names = [];
        try {
          names = await fsp.readdir(outDir);
        } catch (err) {
          return sendJson(response, 200, { ok: true, dir, count: 0, files: [] });
        }
        const listed = [];
        for (const name of names) {
          if (name === '.gitkeep') continue;
          try {
            const st = await fsp.stat(path.join(outDir, name));
            if (!st.isFile()) continue;
            listed.push({ name, size: st.size, at: st.mtime.toISOString(), path: path.join(outDir, name) });
          } catch (err) {
            /* 单个文件读不到就跳过 */
          }
        }
        listed.sort((a, b) => (a.at < b.at ? 1 : -1));
        sendJson(response, 200, { ok: true, dir, count: listed.length, files: listed.slice(0, 5) });
      } catch (err) {
        sendJson(response, 200, { ok: false, error: String((err && err.message) || err) });
      }
    },
  }));

  /* ---------------- 输入上传：文件 / 链接 / 路径 / 移除 ----------------
   * body: { dir, root?, kind: 'template'|'knowledge'|'database',
   *         mode: 'file'|'path'|'remove', name?, data?(base64), path? }
   * 文件落盘到 <工作区>/<成果模板|知识库|数据库>/，登记写进 sources.json，
   * 并重写根目录的 输入清单.md，让 agent 有唯一的输入总账可读。
   */
  disposers.push(webServer.register({
    kind: 'exact',
    path: `${API}/upload`,
    handler: async (request, response) => {
      if (request.method !== 'POST') {
        response.writeHead(405, { allow: 'POST' });
        response.end();
        return;
      }
      try {
        const body = await readJsonBody(request);
        const kind = str(body.kind);
        if (!SOURCE_DIRS[kind]) return sendJson(response, 200, { ok: false, error: '未知的输入类型' });

        const dir = safeWorkspaceDir(body.dir, body.root);
        if (!dir) return sendJson(response, 200, { ok: false, error: '工作区不在 镜像人生/工作目录 下' });

        try {
          await fsp.access(dir);
        } catch (err) {
          return sendJson(response, 200, { ok: false, error: '工作区还没生成，先点「一键生成智能体工作流」' });
        }

        const sources = await readSources(dir);
        const bucket = sources[kind];
        const subDir = path.join(dir, SOURCE_DIRS[kind]);
        const mode = str(body.mode, 'file');
        await fsp.mkdir(subDir, { recursive: true });

        if (mode === 'file') {
          const data = str(body.data);
          if (!data) return sendJson(response, 200, { ok: false, error: '文件内容为空' });
          const buffer = Buffer.from(data, 'base64');
          if (!buffer.length) return sendJson(response, 200, { ok: false, error: '文件内容为空' });
          if (buffer.length > MAX_FILE) {
            return sendJson(response, 200, { ok: false, error: `单个文件不能超过 ${Math.round(MAX_FILE / 1024 / 1024)} MB` });
          }
          const name = safeFileName(body.name);
          await fsp.writeFile(path.join(subDir, name), buffer);
          bucket.files = bucket.files.filter((f) => f.name !== name);
          bucket.files.push({ name, size: buffer.length, at: new Date().toISOString() });
        } else if (mode === 'url') {
          const url = normalizeUrl(body.url);
          if (!url) return sendJson(response, 200, { ok: false, error: '链接要以 http:// 或 https:// 开头' });
          bucket.urls = bucket.urls.filter((u) => u.url !== url);
          bucket.urls.push({ url, at: new Date().toISOString() });
        } else if (mode === 'path') {
          const registered = resolveUserPath(body.path, dir);
          if (!registered) return sendJson(response, 200, { ok: false, error: '路径为空' });
          let exists = true;
          try {
            await fsp.stat(registered);
          } catch (err) {
            exists = false;
          }
          bucket.paths = bucket.paths.filter((p) => p.path !== registered);
          bucket.paths.push({ path: registered, exists, at: new Date().toISOString() });
        } else if (mode === 'remove') {
          const name = str(body.name);
          const targetPath = str(body.path);
          const targetUrl = str(body.url);
          if (name) {
            bucket.files = bucket.files.filter((f) => f.name !== name);
            await fsp.rm(path.join(subDir, safeFileName(name)), { force: true });
          }
          if (targetPath) bucket.paths = bucket.paths.filter((p) => p.path !== targetPath);
          if (targetUrl) bucket.urls = bucket.urls.filter((u) => u.url !== targetUrl);
          if (!name && !targetPath && !targetUrl) return sendJson(response, 200, { ok: false, error: '缺少要移除的条目' });
        } else {
          return sendJson(response, 200, { ok: false, error: '未知的上传方式' });
        }

        const saved = await writeSources(dir, sources);
        await fsp.writeFile(
          path.join(dir, '输入清单.md'),
          inputsManifest({ task: { name: path.basename(dir) } }, saved),
          'utf8',
        );
        sendJson(response, 200, { ok: true, dir, kind, sources: saved });
      } catch (err) {
        sendJson(response, 200, { ok: false, error: String((err && err.message) || err) });
      }
    },
  }));

  /* ---------------- 生成工作区 ---------------- */
  disposers.push(webServer.register({
    kind: 'exact',
    path: `${API}/build`,
    handler: async (request, response) => {
      if (request.method !== 'POST') {
        response.writeHead(405, { allow: 'POST' });
        response.end();
        return;
      }
      try {
        const body = await readJsonBody(request);
        const task = body.task || {};
        const name = str(task.name);
        if (!name) return sendJson(response, 200, { ok: false, error: '任务名为空，无法生成工作区' });

        const rootDir = mirrorRoot(body.root);
        const dir = path.join(rootDir, WORK_DIR_NAME, slug(name));

        const payload = {
          task: {
            name,
            freqLabel: str(task.freqLabel),
            hours: Number(task.hours) || 0,
            perWeek: Number(task.perWeek) || 0,
            desc: str(task.desc),
            workflow: Array.isArray(task.workflow)
              ? task.workflow
                  .map((s) => ({ name: str(s && s.name), note: str(s && s.note) }))
                  .filter((s) => s.name)
              : [],
          },
          profile: {
            name: str(body.profile && body.profile.name),
            role: str(body.profile && body.profile.role),
            company: str(body.profile && body.profile.company),
            expert: str(body.profile && body.profile.expert),
          },
          template: body.template && str(body.template.text)
            ? { name: safeFileName(str(body.template.name, '成果模板.md')), text: String(body.template.text) }
            : null,
          suggestion: {
            form: str(body.suggestion && body.suggestion.form, '模板化 SOP'),
            tip: str(body.suggestion && body.suggestion.tip),
          },
          workspaceName: dir,
        };

        await fsp.mkdir(dir, { recursive: true });
        for (const sub of ['成果模板', '知识库', '数据库', 'inputs', 'outputs']) {
          await fsp.mkdir(path.join(dir, sub), { recursive: true });
        }

        const files = [];
        const write = async (rel, content) => {
          await fsp.writeFile(path.join(dir, rel), content, 'utf8');
          files.push(rel);
        };

        // 重新生成时保留已经上传/登记过的输入（sources.json 不重置）
        const sources = await readSources(dir);
        if (payload.template) {
          const tplName = safeFileName(payload.template.name);
          await write(path.join('成果模板', tplName), payload.template.text);
          sources.template.files = sources.template.files.filter((f) => f.name !== tplName);
          sources.template.files.push({
            name: tplName,
            size: Buffer.byteLength(payload.template.text),
            at: new Date().toISOString(),
          });
        }
        await writeSources(dir, sources);

        await write('AGENTS.md', agentsMarkdown(payload));
        await write('任务说明.md', taskMarkdown(payload));
        await write(path.join('inputs', 'README.md'), inputsMarkdown(payload));
        await write('输入清单.md', inputsManifest(payload, sources));
        await write(path.join('outputs', '.gitkeep'), '');

        let registered = false;
        let registerError = '';
        if (workspaceRegistry && typeof workspaceRegistry.create === 'function') {
          try {
            await workspaceRegistry.create(dir, name);
            registered = true;
          } catch (err) {
            registerError = String((err && err.message) || err);
          }
        }

        sendJson(response, 200, {
          ok: true,
          dir,
          root: rootDir,
          files,
          registered,
          registerError,
          sources,
          prompt: startupPrompt(Object.assign({}, payload, { sources })),
        });
      } catch (err) {
        sendJson(response, 200, { ok: false, error: String((err && err.message) || err) });
      }
    },
  }));

    ctx.effect(() => () => {
      disposers.forEach((dispose) => {
        try {
          if (typeof dispose === 'function') dispose();
        } catch (err) {
          /* ignore */
        }
      });
    });
  });
}

export default { apply };
