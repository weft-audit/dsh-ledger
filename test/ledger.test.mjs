// dsh-ledger 验收：注入 3 条模拟用量正确聚合；口径只加不乘。
import { aggregate, recordToLine, renderReport } from '../src/ledger.mjs'

let fails = 0
function check(name, cond) {
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}`)
  if (!cond) fails += 1
}

const recs = [
  JSON.parse(recordToLine('2026-10-18T00:00:00Z', 's1', { provider: 'deepseek', model: 'flash' },
    { input_tokens: 100, output_tokens: 50 })),
  JSON.parse(recordToLine('2026-10-18T00:01:00Z', 's1', { provider: 'deepseek', model: 'flash' },
    { prompt_tokens: 200, completion_tokens: 80 })),
  JSON.parse(recordToLine('2026-10-18T00:02:00Z', 's2', { provider: 'dashscope', model: 'qwen3.8-max' },
    { uncachedInputTokens: 300, output_tokens: 120 })),
]
const { totals, byModel } = aggregate(recs)
check('3 条注入聚合 calls=3', totals.calls === 3)
check('输入 token 求和=600', totals.prompt_tokens === 600)
check('输出 token 求和=250', totals.completion_tokens === 250)
check('按模型分组 2 组', Object.keys(byModel).length === 2)
check('报表含口径声明', renderReport(recs).includes('只加不乘'))

// golden：固定输入 → 报表逐行精确匹配（防口径漂移）
const expected = [
  '== dsh-ledger 机记报表 ==',
  '口径：机记切片=本地日志求和；只加不乘、原币不折算。',
  '总调用=3 输入tokens=600 输出tokens=250',
  'deepseek/flash: calls=2 prompt=300 completion=130',
  'dashscope/qwen3.8-max: calls=1 prompt=300 completion=120',
].join('\n')
const got = renderReport(recs)
check('golden 报表逐行一致', got === expected)

if (fails > 0) {
  console.error(`LEDGER_TESTS_FAIL count=${fails}`)
  process.exit(1)
}
console.log('LEDGER_TESTS_PASS')
