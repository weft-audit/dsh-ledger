// dsh-ledger — 用量账本（只记账，不设闸）。
// 接口依据（官方原文 dsh-session/lib/types/index.d.ts:61）：
//   'session/event'(this: Scoped<Session>, session: Session, event: SessionEvent): void
// 事件里带 usage 的记录（dsh-session types.d.ts:323-337：assistant step 的
// `usage?: TokenUsage`）才落账。绝不读余额接口、绝不设预算硬闸。
import { appendRecord } from './src/ledger.mjs'
import { join } from 'node:path'

export const name = 'dsh-ledger'

export function apply(ctx, config = {}) {
  const file = config.file
    || join(process.env.DSH_HOME || process.env.HOME || '.', 'ledger.jsonl')
  console.log(`[dsh-ledger] loaded: usage ledger -> ${file}`)

  ctx.on('session/event', (session, event) => {
    try {
      const data = event?.data ?? {}
      if (!data || data.usage == null) return
      const route = data.route ?? data.routes?.[0]
      const ts = new Date().toISOString()
      appendRecord(file, ts, session?.id ?? '?', route, data.usage)
    } catch (e) {
      console.error(`[dsh-ledger] record failed, passing through: ${String(e)}`)
    }
  })
}
