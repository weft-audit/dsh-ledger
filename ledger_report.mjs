// 用法：node ledger_report.mjs [ledger.jsonl]
import { readLedger, renderReport } from './src/ledger.mjs'
const file = process.argv[2] || (process.env.DSH_HOME || '.') + '/ledger.jsonl'
console.log(renderReport(readLedger(file)))
