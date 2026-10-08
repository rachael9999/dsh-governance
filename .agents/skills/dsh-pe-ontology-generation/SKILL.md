---
name: dsh-pe-ontology-generation
description: 生成 PE 尽调 Ontology Pack 并加载到 DeepSeek Harness 的完整工作流
---

# PE Ontology Generation & Loading Skill

在 DeepSeek Harness 中**从 PDF 尽调报告生成**并**加载**PE 尽调 Ontology Pack 的完整技能。

## 触发条件

用户需要：
- 从 PDF 尽调报告（法律/财务/业务）自动生成 ontology
- 将生成的 ontology 加载到 DSH Web/Terminal 中
- 浏览/查询 PE 尽调 ontology（概念、关系、问题、规则）

## 核心能力

1. **PDF 解析**：从尽调报告提取实体、关系、风险规则
2. **Ontology 生成**：生成符合 `FileOntologyPackProvider` 要求的 7 个 CSV 表
3. **Pack 配置**：创建 `pack.schema.json` 和图谱定义
4. **DSH 集成**：注册 semantic-provider 并加载到运行时
5. **端到端验证**：通过探针脚本验证 ontology 可访问

## 前置条件

1. **尽调报告 PDF**：
   - 法律尽调报告（Legal DD Report）
   - 财务尽调报告（Financial DD Report）
   - 业务尽调报告（Business DD Report）

2. **DSH 环境**：
   ```bash
   cd <workspace>/deepseek-harness
   pnpm install
   ```

## 完整工作流

### Phase 1: 生成 Ontology Pack

#### Step 1.1: 准备 PDF 文件

```bash
# 创建项目目录
mkdir -p .ontology-stage1/<project-name>/raw
cd .ontology-stage1/<project-name>/raw

# 放入 PDF 文件
# - legal_dd_report.pdf
# - financial_dd_report.pdf
# - business_dd_report.pdf
```

#### Step 1.2: 运行提取脚本

```bash
cd <workspace>/deepseek-harness
node scripts/extract-pe-ontology.mjs \
  --input .ontology-stage1/<project-name>/raw \
  --output .ontology-stage1/<project-name>/generated
```

**提取逻辑**：
- **实体/概念**：从财务指标、法律实体、业务实体提取（`01_entities.csv`）
- **DDQ 问题**：从尽调问题列表提取（`01_ddq_200.csv`）
- **映射关系**：问题→实体映射（`02_ddq_ontology_mapping.csv`）
- **证据要求**：每个问题需要的证据类型（`03_evidence_requirements.csv`）
- **任务模板**：尽调任务定义（`06_task_templates.csv`）
- **风险规则**：从风险发现提取（`seed/02_risk_rules.csv`）
- **图谱节点**：实体关系图（`graph/nodes.csv`）

#### Step 1.3: 验证生成的 CSV

```bash
# 检查文件齐备性
ls -la .ontology-stage1/<project-name>/generated/seed/*.csv
ls -la .ontology-stage1/<project-name>/generated/graph/nodes.csv
cat .ontology-stage1/<project-name>/generated/pack.schema.json
```

**期望输出**：
```
seed/
├── 01_ddq_200.csv           # 200 个 DDQ 问题
├── 02_ddq_ontology_mapping.csv
├── 03_evidence_requirements.csv
├── 04_task_mapping.csv
├── 05_risk_mapping.csv
├── 06_ontology_inventory.csv
├── 06_task_templates.csv
└── 02_risk_rules.csv        # 风险规则

graph/
└── nodes.csv                # 图谱节点

pack.schema.json             # Pack 定义
```

### Phase 2: 配置 DSH 运行时

#### Step 2.1: 注册 Ontology Provider

编辑 `packages/bundle/web-app/cordis.patch.yml`：

```yaml
- insert:
    # 1. Semantic runtime (必需)
    - id: semantic-host
      name: '@deepseek-ai/dsh-semantic-host'

    # 2. PE ontology provider (加载生成的 pack)
    - id: semantic-provider-pe
      name: '@deepseek-ai/dsh-semantic-provider-pe'
      # 自定义路径时设置：
      # config:
      #   canonicalRoot: '<workspace>/.ontology-stage1/<project-name>/generated'

    # 3. Ontology RPC service (暴露给前端)
    - id: ontology-rpc
      name: '@deepseek-ai/dsh-api-ontology-rpc'

    # 4. 前端 UI 组件
    - id: ui-ontology
      name: '@deepseek-ai/dsh-client-ui-ontology'
```

#### Step 2.2: 设置环境变量（可选）

如需加载自定义路径的 ontology：

```bash
export PE_CANONICAL_ROOT=<workspace>/.ontology-stage1/<project-name>/generated
```

### Phase 3: 构建并启动

```bash
cd <workspace>/deepseek-harness

# 构建全栈（host + client）
pnpm run build

# 启动 Web 界面
pnpm dsh web

# 或启动 Headless 模式执行查询
pnpm dsh --profile headless "分析<project-name>的财务风险"
```

### Phase 4: 验证 Ontology 已加载

#### 方法 1: 浏览器验证

1. 打开 http://127.0.0.1:3080
2. 点击 Conversation 侧栏的 **Ontology** 标签
3. 检查是否显示：
   - **Concepts**: ~552 个实体/指标
   - **Questions**: ~257 个 DDQ 问题
   - **Rules**: ~38 个风险规则

#### 方法 2: 探针脚本验证

```bash
cat > /tmp/probe-ontology.mjs << 'EOF'
import { Context } from '@deepseek-ai/cordis'
import typertRegistry from '@deepseek-ai/dsh-typert-registry'
import { TypertGatewayService } from '@deepseek-ai/dsh-api-gateway'
import semanticHost from '@deepseek-ai/dsh-semantic-host'
import providerPe from '@deepseek-ai/dsh-semantic-provider-pe'
import { OntologyRpcService } from '@deepseek-ai/dsh-api-ontology-rpc'

const ctx = new Context()
ctx.plugin(typertRegistry)
ctx.plugin(TypertGatewayService)
ctx.plugin(semanticHost)
ctx.plugin(providerPe)
ctx.plugin(OntologyRpcService)
await new Promise(resolve => setTimeout(resolve, 100))

const gw = ctx.get('typertGateway')

// 获取 manifest
const manifest = await gw.invoke({
  namespace: 'ontology',
  method: 'manifest',
  args: { request: {} }
})
console.log('Manifest:', JSON.stringify(manifest, null, 2))

// Browse 前 10 个对象
const browse = await gw.invoke({
  namespace: 'ontology',
  method: 'browse',
  args: { request: { limit: 10 } }
})
console.log('\nTop 10 objects:')
browse.items.forEach(item => {
  console.log(`- ${item.ref.objectId}: ${item.summary}`)
})

// 获取某个对象的关系
if (browse.items.length > 0) {
  const ref = browse.items[0].ref
  const relations = await gw.invoke({
    namespace: 'ontology',
    method: 'relations',
    args: { request: { object: ref } }
  })
  console.log(`\nRelations for ${ref.objectId}:`)
  console.log(relations)
}
EOF

cd <workspace>/deepseek-harness
node /tmp/probe-ontology.mjs
```

**期望输出**：
```json
{
  "snapshotId": "explorer",
  "packRefs": [
    {
      "packId": "pe-dd",
      "version": "v1.2-canonical"
    }
  ],
  "counts": {
    "concepts": 552,
    "relations": 3625,
    "questions": 257,
    "rules": 39
  }
}

Top 10 objects:
- METRIC.CUST.001: 前五大客户占比
- METRIC.CUST.002: 客户集中度 HHI 指数
- METRIC.SUPP.001: 前五大供应商占比
...
```

## 常见问题排查

### Q1: Ontology Tab 显示"当前没有已加载的语义包"

**根因**：`semantic-provider-pe` 未成功加载 pack

**排查步骤**：
```bash
# 1. 检查 pack.schema.json 格式
cat .ontology-stage1/<project-name>/generated/pack.schema.json | jq

# 2. 验证 CSV 文件齐备性
ls .ontology-stage1/<project-name>/generated/seed/*.csv | wc -l
# 应该 >= 7 个文件

# 3. 运行探针脚本看错误信息
node /tmp/probe-ontology.mjs 2>&1 | grep -A5 "Error"
```

**修复**：
- 确保 `pack.schema.json` 使用 `tables` 字段（不是 `files`）
- 补全 7 个必需表：`questions`, `ontologyMapping`, `evidenceRequirements`, `taskMapping`, `riskMapping`, `inventory`, `taskTemplates`
- 参考 `examples/pe-ontology-pack/pack.schema.json`

### Q2: Manifest 返回空 counts

**根因**：CSV 数据格式错误或路径不对

**排查**：
```bash
# 检查 CSV 表头
head -3 .ontology-stage1/<project-name>/generated/seed/01_ddq_200.csv
head -3 .ontology-stage1/<project-name>/generated/seed/06_ontology_inventory.csv

# 验证 pack.schema.json 的 tables 定义
cat .ontology-stage1/<project-name>/generated/pack.schema.json | jq '.tables'
```

**修复**：
- CSV 必须包含正确的列名（参考 `examples/pe-ontology-pack/seed/`）
- `pack.schema.json` 的 `tables` 字段必须匹配实际 CSV 文件名

### Q3: 构建时 tsdown 崩溃 (exit code 3221225477)

**根因**：`node:sqlite` 在 Windows 上的竞争条件

**修复**：
```bash
# 1. 终止所有 node 进程
taskkill /F /IM node.exe

# 2. 等待 3 秒让 SQLite 锁释放
sleep 3

# 3. 重新启动
pnpm dsh web
```

### Q4: `database is locked` 错误

**根因**：之前的 DSH 实例未正常关闭，SQLite 锁未释放

**修复**：
```bash
# 1. 终止所有 node 进程
taskkill /F /IM node.exe

# 2. 检查 governance.sqlite 的 journal 文件
ls -la ~/.dsh/governance.sqlite*

# 3. 如果 journal 文件过大（>100MB），备份后删除
mv ~/.dsh/governance.sqlite ~/.dsh/governance.sqlite.backup
rm ~/.dsh/governance.sqlite-journal

# 4. 重启 DSH
pnpm dsh web
```

## 输出产物

成功执行后：

1. **Ontology Pack 目录**：
   ```
   .ontology-stage1/<project-name>/generated/
   ├── seed/*.csv           # 7 个 ontology 表
   ├── graph/nodes.csv      # 图谱定义
   └── pack.schema.json     # Pack 配置
   ```

2. **DSH 运行时集成**：
   - Ontology Tab 出现在 Conversation 侧栏
   - 可浏览 552+ concepts / 257+ questions / 38+ rules
   - 可查询对象关系、证据要求、任务模板

3. **验证报告**：
   - 探针脚本输出 manifest counts
   - 前端 UI 显示数据

## 扩展：自定义 Ontology 领域

如需加载非 PE 领域的 ontology：

1. **修改 provider**：
   ```typescript
   // packages/semantic/semantic-provider-custom/src/index.ts
   export function apply(ctx: Context) {
     void ctx.semantic.registerProvider(() => ({
       name: 'custom-domain',
       async load() {
         const fileProvider = new FileOntologyPackProvider(...)
         return legacyPackToSemanticPack(loaded, 'custom-type')
       }
     }))
   }
   ```

2. **注册到 cordis.patch.yml**：
   ```yaml
   - id: semantic-provider-custom
     name: '@deepseek-ai/dsh-semantic-provider-custom'
   ```

## 参考文件

- `packages/semantic/semantic-provider-pe/src/index.ts` - PE Provider 实现
- `packages/ontology/ontology-files/src/index.ts` - FileOntologyPackProvider
- `packages/bundle/web-app/cordis.patch.yml` - Web Bundle 配置
- `examples/pe-ontology-pack/` - 完整示例 Pack
- `.ontology-stage1/nalinwei-instance/` - 纳琳威项目实际数据
- `packages/domain/domain-pe/src/converters.ts` - Legacy→Semantic 转换

## 相关 Skills

- [dsh-prose-standard](../dsh-prose-standard/SKILL.md) - PDF 文本提取标准
- [dsh-code-review](../dsh-code-review/SKILL.md) - Ontology 生成代码审查
