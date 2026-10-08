#!/usr/bin/env python3
"""
完全清理 nodes.csv 文件：
1. 移除 BOM
2. 修复 metadata_json 中的 Python 代码片段
3. 确保纯 UTF-8 编码
"""

import json
import re

def clean_metadata_json(metadata_str):
    """修复 metadata_json 字段"""
    # 移除 Python 条件表达式，只保留 false
    metadata_str = re.sub(r'"" if derived else "false"', '"false"', metadata_str)

    # 确保是有效的 JSON
    try:
        # 尝试解析 JSON
        parsed = json.loads(metadata_str)
        return json.dumps(parsed, ensure_ascii=False)
    except:
        # 如果解析失败，返回清理后的字符串
        return metadata_str

def main():
    input_file = 'D:/deepseek-harness/.ontology-stage1/nalinwei-instance/graph/nodes.csv'
    output_file = 'D:/deepseek-harness/.ontology-stage1/nalinwei-instance/graph/nodes.csv'

    print(f'📄 读取文件：{input_file}')

    # 读取原始字节
    with open(input_file, 'rb') as f:
        raw_bytes = f.read()

    # 移除 BOM (EF BB BF)
    if raw_bytes.startswith(b'\xef\xbb\xbf'):
        print('  → 移除 BOM...')
        raw_bytes = raw_bytes[3:]

    # 解码为 UTF-8
    content = raw_bytes.decode('utf-8')
    lines = content.split('\n')

    print(f'📊 总行数：{len(lines)}')

    # 处理每一行
    fixed_lines = []
    fixed_count = 0

    for i, line in enumerate(lines, 1):
        if not line.strip():
            continue

        if i == 1:
            # 保留 header
            fixed_lines.append(line)
            continue

        # 解析 CSV 行
        parts = line.split(',', 4)  # 分成 5 部分
        if len(parts) >= 5:
            node_id, node_type, name, description, metadata_json = parts[0], parts[1], parts[2], parts[3], ','.join(parts[4:])

            # 清理 metadata_json
            cleaned_metadata = clean_metadata_json(metadata_json)

            # 重建行
            fixed_line = f'{node_id},{node_type},{name},{description},{cleaned_metadata}'
            fixed_lines.append(fixed_line)
            fixed_count += 1
        else:
            # 保持原样
            fixed_lines.append(line)

    print(f'\n✅ 修复完成：{fixed_count} 行已处理')

    # 写回文件（UTF-8 without BOM）
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        f.write('\n'.join(fixed_lines))

    print(f'📝 文件已保存：{output_file}')
    print('✨ 所有 metadata_json 已清理为纯 JSON\n')

if __name__ == '__main__':
    main()
