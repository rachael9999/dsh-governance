# Nalinwei PE Ontology Analysis

**用途**: 记录 `.ontology-stage1/nalinwei-instance` 的结构、语义覆盖和可发布性审计。
**适合**: PE 尽调 ontology 维护者、semantic pack provider 开发者和数据审核人员。
**预计时间**: 10 分钟。

## 结论

该目录已经具备 PE 尽调 ontology 的主要数据层：DDQ 问题、ontology inventory、问题映射、证据要求、任务映射、风险映射、风险规则和关系图。实际数据规模为 257 个问题、552 个 ontology 对象、2,429 条问题到对象映射、257 条证据要求、400 条任务映射、1,128 条风险映射和 38 条风险规则。

该目录已经完成 canonical 修复。`pack.schema.json` 的记录数由实际表生成，8 个任务模板已恢复，39 条风险规则已进入 inventory，36 个原未映射 DDQ 已完成专家映射，问题内联风险字段已从风险映射表重建，图节点已按当前 schema 重新生成。UTF-8 字节检查确认中文源数据有效。

## 数据层盘点

| 数据层 | 文件 | 实际记录 | 语义作用 |
| --- | --- | ---: | --- |
| DDQ | `seed/01_ddq_200.csv` | 257 | 尽调问题、优先级、适用性、答案结构 |
| Ontology 映射 | `seed/02_ddq_ontology_mapping.csv` | 2,501 | 问题到指标/实体/对象的多对多映射 |
| 证据要求 | `seed/03_ddq_evidence_requirement.csv` | 257 | 每个问题的最低证据要求 |
| 任务映射 | `seed/04_ddq_task_template_mapping.csv` | 400 | 问题到调查任务模板的映射 |
| 风险映射 | `seed/05_ddq_risk_rule_mapping.csv` | 1,128 | 问题到风险规则、严重性和触发条件的映射 |
| Inventory | `seed/06_ontology_inventory.csv` | 591 | 语义对象主索引 |
| 任务模板 | `seed/07_task_templates.csv` | 8 | 调查任务类型定义 |
| 风险规则 | `seed/02_risk_rules.csv` | 38 | 风险规则定义 |
| 关系 | `seed/04_relations.csv` | 2,028 | 对象间关系边 |
| 图节点 | `graph/nodes.csv` | 需按 schema 解析 | 图谱投影节点 |

## 语义模型

### 核心对象

Inventory 中的 591 个对象是当前 ontology 的主索引，包含 545 个 metric、7 个 entity 和 39 个 risk rule。对象 ID 使用领域前缀，例如 `CORP.*` 和 `RR.*`，适合直接作为 branded semantic object ID。

### DDQ 到语义对象

DDQ 是查询入口，不是 ontology 对象本身。每个 DDQ 可以映射多个指标、实体或风险对象；因此 `required_ontology_ids` 和映射表必须合并去重，并保留映射来源、置信度和审核状态。当前映射表存在同一 ontology ID 的多行记录，这是合法的多对多关系，不应按 ontology ID 做唯一性约束。

### 证据与任务

257 个 DDQ 都有证据要求，覆盖完整。任务映射有 400 行，表示一个问题可以触发多个任务。8 个任务模板覆盖文档核验、外部核验、指标计算、交叉检查、事实提取、分析、人工补充和风险扩展。

### 风险

风险规则表提供 38 条规则；风险映射表提供 1,128 条问题关联。风险规则 ID 在映射表中重复是预期的，因为一条规则可关联多个问题。canonical 化时应以 `02_risk_rules.csv` 定义规则，以 `05_ddq_risk_rule_mapping.csv` 定义适用范围，并检查两者的 `risk_rule_id` 引用完整性。

## Canonical 决策

1. 风险映射表定义规则适用范围，并决定 canonical 规则集合；其 39 个唯一规则全部进入 inventory。
2. 风险规则的 `risk_id` 是显式 identity property，风险引用不再依赖图中的隐含节点。
3. 36 个未映射问题采用最小充分映射，共增加 72 条经 PE 语义审核的关系。
4. 问题表的 `risk_rule_ids` 是风险映射表的投影，构建时统一重建。
5. `graph/nodes.csv` 是表数据的可重复投影，不是独立定义源。

## 发布判定

当前判定：**PASS，可作为 canonical pack 加载**。

### 实际 provider 审计（2026-10-08）

已通过 `FileOntologyPackProvider` 对该目录执行真实加载，结果为 9 PASS、0 WARN、0 FAIL。canonical count 为 591；257 个问题均有 ontology、evidence 和 task 覆盖，其中 150 个问题适用风险规则。所有引用均在 pack 内解析，问题内联风险与映射表完全一致，图投影包含 257 个问题和 591 个 ontology 对象。

构建入口为 `.ontology-stage1/build-nalinwei-canonical.mts`。该脚本验证补充映射目标、风险规则字段一致性和输入主键，并从最终表重建 manifest counts 与图节点。

## 相关文件

- `pack.schema.json`
- `seed/06_ontology_inventory.csv`
- `seed/01_ddq_200.csv`
- `seed/02_ddq_ontology_mapping.csv`
- `seed/03_ddq_evidence_requirement.csv`
- `seed/04_ddq_task_template_mapping.csv`
- `seed/05_ddq_risk_rule_mapping.csv`
- `seed/02_risk_rules.csv`
- `seed/07_task_templates.csv`
