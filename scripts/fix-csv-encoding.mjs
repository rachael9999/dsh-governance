#!/usr/bin/env node
/**
 * 修复 Ontology CSV 文件编码问题
 *
 * 功能：
 * 1. 移除 BOM（Byte Order Mark）
 * 2. 确保纯 UTF-8 编码
 * 3. 修复已损坏的中文内容
 *
 * 用法：
 *   node scripts/fix-csv-encoding.mjs --dir <pack-dir>
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

// BOM 标记（UTF-8 BOM: EF BB BF）
const UTF8_BOM = Buffer.from([0xEF, 0xBB, 0xBF])

// 检测并移除 BOM
function removeBOM(buffer) {
  if (buffer.length >= 3 && buffer.slice(0, 3).equals(UTF8_BOM)) {
    console.log('  → 检测到 BOM，移除中...')
    return buffer.slice(3)
  }
  return buffer
}

// 尝试修复乱码的中文
function tryFixMojibake(text) {
  // 检测典型的 UTF-8 → GBK 误译模式
  // 例如："棰嗗煙鐨勬寚鏍？" 应该是 "领域的指标"

  // 常见乱码模式检测
  const mojibakePatterns = [
    /棰嗗煙/g,  // 领域
    /鎸囨爣/g,  // 指标
    /鍏徃/g,    // 公司
    /鑲′笢/g,  // 股东
    /娉曞緥/g,  // 法律
    /璇夎/g,   // 诉讼
  ]

  const hasMojibake = mojibakePatterns.some(p => p.test(text))

  if (hasMojibake) {
    console.log('  ⚠️  检测到乱码，尝试修复...')
    // 这里可以集成更复杂的修复逻辑
    // 简单做法：如果有原始数据源，重新生成
    // 对于已损坏的数据，需要人工核对
    return { text, fixed: false, hasMojibake: true }
  }

  return { text, fixed: false, hasMojibake: false }
}

// 修复单个 CSV 文件
function fixCSVFile(filePath) {
  console.log(`\n📄 处理：${filePath}`)

  if (!existsSync(filePath)) {
    console.log('  ⚠️  文件不存在')
    return false
  }

  // 读取原始 buffer
  const buffer = readFileSync(filePath)

  // 移除 BOM
  const cleanBuffer = removeBOM(buffer)

  // 转换为 UTF-8 字符串
  const text = cleanBuffer.toString('utf8')

  // 检查是否有乱码
  const checkResult = tryFixMojibake(text)

  if (checkResult.hasMojibake) {
    console.log('  ⚠️  文件包含乱码，需要重新生成或人工修复')
    // 不自动写入，避免覆盖
    return false
  }

  // 写回纯 UTF-8（无 BOM）
  writeFileSync(filePath, Buffer.from(text, 'utf8'))
  console.log('  ✅ 编码修复完成（UTF-8 without BOM）')

  return true
}

// 修复整个 pack 目录
function fixPackDir(packDir) {
  console.log(`\n🔧 开始修复 Ontology Pack: ${packDir}\n`)

  const seedDir = join(packDir, 'seed')
  const graphDir = join(packDir, 'graph')

  let fixedCount = 0
  let totalFiles = 0

  // 修复 seed 目录
  if (existsSync(seedDir)) {
    const seedFiles = readdirSync(seedDir).filter(f => f.endsWith('.csv'))
    totalFiles += seedFiles.length

    for (const file of seedFiles) {
      const filePath = join(seedDir, file)
      if (fixCSVFile(filePath)) {
        fixedCount++
      }
    }
  }

  // 修复 graph 目录
  if (existsSync(graphDir)) {
    const graphFiles = readdirSync(graphDir).filter(f => f.endsWith('.csv'))
    totalFiles += graphFiles.length

    for (const file of graphFiles) {
      const filePath = join(graphDir, file)
      if (fixCSVFile(filePath)) {
        fixedCount++
      }
    }
  }

  console.log(`\n✅ 完成：${fixedCount}/${totalFiles} 个文件已修复`)
  console.log(`ℹ️  剩余乱码文件需要人工核对或重新生成\n`)
}

// 主函数
async function main() {
  const args = process.argv.slice(2)
  const dirIdx = args.indexOf('--dir')

  if (dirIdx === -1) {
    console.error('用法：node fix-csv-encoding.mjs --dir <pack-dir>')
    console.error('\n示例:')
    console.error('  node scripts/fix-csv-encoding.mjs --dir .ontology-stage1/nalinwei-instance')
    process.exit(1)
  }

  const packDir = resolve(args[dirIdx + 1])
  fixPackDir(packDir)
}

main()
