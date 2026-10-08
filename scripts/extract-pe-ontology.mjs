#!/usr/bin/env node
/**
 * PE Ontology Extractor
 *
 * 从 PDF 尽调报告自动生成 Ontology Pack CSV 文件
 *
 * 用法：
 *   node scripts/extract-pe-ontology.mjs --input <pdf-dir> --output <output-dir>
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

// 简单的 PDF 文本提取（实际应该用 pdf-parse 或类似库）
function extractTextFromPDF(pdfPath) {
  console.log(`[INFO] 读取 PDF: ${pdfPath}`)
  // TODO: 集成真实的 PDF 解析库
  // 这里返回占位符，实际应该调用 pdf-parse
  return ''
}

// 从尽调报告提取 DDQ 问题
function extractDDQQuestions(text) {
  console.log('[INFO] 提取 DDQ 问题...')
  // TODO: 实现 NLP 提取逻辑
  // 返回示例：
  return [
    { id: 'Q001', text: '公司前五大客户占比是否超过 60%？', domain: 'CUST' },
    { id: 'Q002', text: '公司是否存在重大未决诉讼？', domain: 'LEGAL' },
    // ... 更多问题
  ]
}

// 从尽调报告提取实体/指标
function extractEntities(text) {
  console.log('[INFO] 提取实体/指标...')
  // TODO: 实现实体识别
  return [
    { id: 'METRIC.CUST.001', type: 'metric', name: '前五大客户占比', value: '68%', domain: 'CUST' },
    { id: 'ENTITY.LEGAL.001', type: 'entity', name: '未决诉讼', status: 'pending', domain: 'LEGAL' },
    // ... 更多实体
  ]
}

// 生成问题→本体映射
function generateOntologyMapping(questions, entities) {
  console.log('[INFO] 生成 ontology 映射...')
  const mappings = []
  for (const q of questions) {
    // 简单启发式：根据 domain 匹配
    const relatedEntities = entities.filter(e => e.domain === q.domain)
    for (const e of relatedEntities.slice(0, 3)) {
      mappings.push({
        question_id: q.id,
        concept_id: e.id,
        relation_type: 'addresses'
      })
    }
  }
  return mappings
}

// 生成证据要求
function generateEvidenceRequirements(questions) {
  console.log('[INFO] 生成证据要求...')
  return questions.map(q => ({
    question_id: q.id,
    evidence_type: 'document',
    required: true,
    description: `需要提供${q.domain}领域的 supporting documents`
  }))
}

// 生成任务模板
function generateTaskTemplates(questions) {
  console.log('[INFO] 生成任务模板...')
  const templates = []
  const domainGroups = {}

  for (const q of questions) {
    if (!domainGroups[q.domain]) domainGroups[q.domain] = []
    domainGroups[q.domain].push(q.id)
  }

  for (const [domain, questionIds] of Object.entries(domainGroups)) {
    templates.push({
      template_id: `TMPL.${domain}`,
      name: `${domain} 领域尽调任务`,
      description: `执行${domain}领域的尽职调查`,
      question_ids: questionIds.join(';')
    })
  }

  return templates
}

// 生成风险规则
function generateRiskRules(entities) {
  console.log('[INFO] 生成风险规则...')
  const rules = []

  // 示例规则
  if (entities.some(e => e.name.includes('客户占比') && parseFloat(e.value) > 0.6)) {
    rules.push({
      rule_id: 'RR.CUST.001',
      name: '客户集中度风险',
      condition: '前五大客户占比 > 60%',
      severity: 'HIGH',
      description: '客户集中度过高可能导致经营风险'
    })
  }

  if (entities.some(e => e.type === 'entity' && e.name.includes('诉讼'))) {
    rules.push({
      rule_id: 'RR.LEGAL.001',
      name: '重大未决诉讼风险',
      condition: '存在未决诉讼',
      severity: 'CRITICAL',
      description: '未决诉讼可能对公司造成重大财务影响'
    })
  }

  return rules
}

// 生成图谱节点
function generateGraphNodes(entities) {
  console.log('[INFO] 生成图谱节点...')
  return entities.map(e => ({
    node_id: e.id,
    node_type: e.type,
    name: e.name,
    domain: e.domain,
    properties: JSON.stringify(e)
  }))
}

// 写入 CSV 文件（UTF-8 without BOM）
function writeCSV(filePath, rows, columns) {
  const header = columns.join(',')
  const lines = rows.map(row =>
    columns.map(col => {
      const val = row[col] ?? ''
      // CSV 转义：包含逗号或引号的字段用引号包裹
      if (String(val).includes(',') || String(val).includes('"')) {
        return `"${String(val).replace(/"/g, '""')}"`
      }
      return val
    }).join(',')
  )
  const content = [header, ...lines].join('\n')
  // 使用 Buffer 明确写入 UTF-8 without BOM
  writeFileSync(filePath, Buffer.from(content, 'utf8'))
  console.log(`  ✓ ${filePath} (UTF-8 without BOM)`)
}

// 主函数
async function main() {
  const args = process.argv.slice(2)
  const inputIdx = args.indexOf('--input')
  const outputIdx = args.indexOf('--output')

  if (inputIdx === -1 || outputIdx === -1) {
    console.error('用法：node extract-pe-ontology.mjs --input <pdf-dir> --output <output-dir>')
    process.exit(1)
  }

  const inputDir = resolve(args[inputIdx + 1])
  const outputDir = resolve(args[outputIdx + 1])

  console.log(`\n📥 输入目录：${inputDir}`)
  console.log(`📤 输出目录：${outputDir}\n`)

  // 创建输出目录
  const seedDir = join(outputDir, 'seed')
  const graphDir = join(outputDir, 'graph')
  mkdirSync(seedDir, { recursive: true })
  mkdirSync(graphDir, { recursive: true })

  // 读取所有 PDF
  const pdfFiles = []
  if (existsSync(inputDir)) {
    const files = readFileSync(inputDir, { withFileTypes: true })
      .filter(d => d.isFile() && d.name.endsWith('.pdf'))
      .map(d => d.name)
    pdfFiles.push(...files)
  }

  if (pdfFiles.length === 0) {
    console.warn('⚠️  未找到 PDF 文件，生成示例数据...')
  }

  // 提取数据
  let allText = ''
  for (const pdf of pdfFiles) {
    allText += extractTextFromPDF(join(inputDir, pdf))
  }

  const questions = extractDDQQuestions(allText)
  const entities = extractEntities(allText)
  const mappings = generateOntologyMapping(questions, entities)
  const evidenceReqs = generateEvidenceRequirements(questions)
  const taskTemplates = generateTaskTemplates(questions)
  const riskRules = generateRiskRules(entities)
  const graphNodes = generateGraphNodes(entities)

  // 生成 inventory（entities + metrics）
  const inventory = entities.map(e => ({
    concept_id: e.id,
    concept_type: e.type,
    name: e.name,
    domain: e.domain
  }))

  // 写入 CSV 文件
  console.log('\n📝 生成 CSV 文件:')

  writeCSV(
    join(seedDir, '01_ddq_200.csv'),
    questions,
    ['id', 'text', 'domain']
  )

  writeCSV(
    join(seedDir, '02_ddq_ontology_mapping.csv'),
    mappings,
    ['question_id', 'concept_id', 'relation_type']
  )

  writeCSV(
    join(seedDir, '03_evidence_requirements.csv'),
    evidenceReqs,
    ['question_id', 'evidence_type', 'required', 'description']
  )

  writeCSV(
    join(seedDir, '04_task_mapping.csv'),
    [],
    ['task_id', 'question_id', 'template_id']
  )

  writeCSV(
    join(seedDir, '05_risk_mapping.csv'),
    riskRules.map(r => ({ rule_id: r.rule_id, question_ids: '' })),
    ['rule_id', 'question_ids']
  )

  writeCSV(
    join(seedDir, '06_ontology_inventory.csv'),
    inventory,
    ['concept_id', 'concept_type', 'name', 'domain']
  )

  writeCSV(
    join(seedDir, '06_task_templates.csv'),
    taskTemplates,
    ['template_id', 'name', 'description', 'question_ids']
  )

  writeCSV(
    join(seedDir, '02_risk_rules.csv'),
    riskRules,
    ['rule_id', 'name', 'condition', 'severity', 'description']
  )

  writeCSV(
    join(graphDir, 'nodes.csv'),
    graphNodes,
    ['node_id', 'node_type', 'name', 'domain', 'properties']
  )

  // 生成 pack.schema.json
  const schema = {
    tables: {
      questions: {
        path: 'seed/01_ddq_200.csv',
        idColumn: 'id',
        columns: {
          text: { type: 'string' },
          domain: { type: 'string' }
        }
      },
      ontologyMapping: {
        path: 'seed/02_ddq_ontology_mapping.csv',
        idColumn: 'question_id'
      },
      evidenceRequirements: {
        path: 'seed/03_evidence_requirements.csv',
        idColumn: 'question_id'
      },
      taskMapping: {
        path: 'seed/04_task_mapping.csv'
      },
      riskMapping: {
        path: 'seed/05_risk_mapping.csv'
      },
      inventory: {
        path: 'seed/06_ontology_inventory.csv',
        idColumn: 'concept_id'
      },
      taskTemplates: {
        path: 'seed/06_task_templates.csv',
        idColumn: 'template_id'
      }
    },
    graph: {
      nodes: {
        path: 'graph/nodes.csv',
        idColumn: 'node_id'
      }
    }
  }

  writeFileSync(
    join(outputDir, 'pack.schema.json'),
    JSON.stringify(schema, null, 2),
    'utf-8'
  )
  console.log(`  ✓ ${join(outputDir, 'pack.schema.json')}`)

  console.log('\n✅ Ontology 生成完成！')
  console.log(`\n下一步:`)
  console.log(`  1. 检查生成的 CSV 文件: ${seedDir}`)
  console.log(`  2. 设置环境变量：export PE_CANONICAL_ROOT=${outputDir}`)
  console.log(`  3. 在 cordis.patch.yml 中注册 semantic-provider-pe`)
  console.log(`  4. 运行：pnpm dsh web`)
}

main().catch(err => {
  console.error('❌ 错误:', err.message)
  process.exit(1)
})
