#!/usr/bin/env python3
"""
修复 nodes.csv 文件中的乱码问题
将所有"领域的指标"的乱码替换为正确的中文
"""

import re

# 乱码模式 → 正确中文
MOJIBAKE_MAP = {
    '棰嗗煙鐨勬寚鏍？': '领域的指标',
    '棰嗗煙鐨勬寚鏍？': '领域的指标',
    '棰嗗煙鐨勬寚鏍': '领域的指标',
    '锟斤拷': '领域的指标',  # 常见乱码
}

def fix_line(line):
    """修复一行中的乱码"""
    result = line
    for mojibake, correct in MOJIBAKE_MAP.items():
        result = result.replace(mojibake, correct)
    return result

def main():
    input_file = '.ontology-stage1/nalinwei-instance/graph/nodes.csv'
    output_file = '.ontology-stage1/nalinwei-instance/graph/nodes.csv'

    print(f'📄 读取文件：{input_file}')

    # 读取文件（UTF-8）
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    print(f'📊 总行数：{len(lines)}')

    # 修复乱码
    fixed_count = 0
    fixed_lines = []
    for i, line in enumerate(lines, 1):
        fixed_line = fix_line(line)
        if fixed_line != line:
            fixed_count += 1
            print(f'  ✓ 第 {i} 行已修复')
        fixed_lines.append(fixed_line)

    print(f'\n✅ 修复完成：{fixed_count}/{len(lines)} 行已修复')

    # 写回文件（UTF-8 without BOM）
    with open(output_file, 'w', encoding='utf-8', newline='\n') as f:
        f.writelines(fixed_lines)

    print(f'📝 文件已保存：{output_file}')
    print('✨ 所有"领域的指标"乱码已修复\n')

if __name__ == '__main__':
    main()
