# dsh-ledger

用量账本（accounting only）：监听 session/event 中带 usage 的记录写 JSONL；
`ledger_report.mjs` 出单一口径报表。口径对齐 usage-aggregate.py：
只加不乘、原币不折算、面板数与机记分列（本插件只记机记）。

## 禁用

不读余额接口、不设预算硬闸。裁决与预算归人/主审计。

## 测试

```bash
node --test test/ledger.test.mjs
```
