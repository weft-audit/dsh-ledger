// dsh-ledger 记账逻辑（纯函数，可独立测试）。
// 口径对齐 Jarvis tools/usage-aggregate.py：只加不乘、原币不分汇率折算、
// 面板数与机记分开；本插件只记机记。
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'

export function recordToLine(ts, sessionId, route, usage) {
  const u = usage ?? {}
  return JSON.stringify({
    ts,
    session: sessionId,
    provider: route?.provider ?? 'unknown',
    model: route?.model ?? 'unknown',
    prompt_tokens: Number(u.prompt_tokens ?? u.uncachedInputTokens ?? u.input_tokens ?? 0),
    completion_tokens: Number(u.completion_tokens ?? u.output_tokens ?? 0),
  })
}

export function aggregate(records) {
  const totals = { calls: 0, prompt_tokens: 0, completion_tokens: 0 }
  const byModel = new Map()
  for (const r of records) {
    totals.calls += 1
    totals.prompt_tokens += Number(r.prompt_tokens ?? 0)
    totals.completion_tokens += Number(r.completion_tokens ?? 0)
    const key = `${r.provider ?? 'unknown'}/${r.model ?? 'unknown'}`
    const e = byModel.get(key) ?? { calls: 0, prompt_tokens: 0, completion_tokens: 0 }
    e.calls += 1
    e.prompt_tokens += Number(r.prompt_tokens ?? 0)
    e.completion_tokens += Number(r.completion_tokens ?? 0)
    byModel.set(key, e)
  }
  return { totals, byModel: Object.fromEntries(byModel) }
}

export function appendRecord(file, ts, sessionId, route, usage) {
  if (!existsSync(file)) mkdirSync(dirname(file), { recursive: true })
  appendFileSync(file, recordToLine(ts, sessionId, route, usage) + '\n', 'utf-8')
}

export function readLedger(file) {
  if (!existsSync(file)) return []
  return readFileSync(file, 'utf-8').split('\n').filter(Boolean).map((l) => {
    try { return JSON.parse(l) } catch { return null }
  }).filter(Boolean)
}

export function renderReport(records, title = 'dsh-ledger 机记报表') {
  const { totals, byModel } = aggregate(records)
  const lines = [`== ${title} ==`, '口径：机记切片=本地日志求和；只加不乘、原币不折算。']
  lines.push(`总调用=${totals.calls} 输入tokens=${totals.prompt_tokens} 输出tokens=${totals.completion_tokens}`)
  for (const [k, v] of Object.entries(byModel)) {
    lines.push(`${k}: calls=${v.calls} prompt=${v.prompt_tokens} completion=${v.completion_tokens}`)
  }
  return lines.join('\n')
}
