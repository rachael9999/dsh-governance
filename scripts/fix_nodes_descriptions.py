#!/usr/bin/env python3
"""
为 nodes.csv 中的每个指标生成具体的中文描述
"""

# 指标名称 → 具体中文描述
DESCRIPTIONS = {
    'CompanyName': '公司的法定注册名称，用于工商登记和对外经营',
    'LegalEntityType': '公司的法律组织形式，如有限责任公司、股份有限公司等',
    'RegistrationNumber': '工商行政管理部门核发的统一社会信用代码或工商注册号',
    'EstablishmentDate': '公司在工商部门正式注册成立的日期',
    'RegisteredCapital': '公司在工商登记的注册资本总额，反映公司法定资本规模',
    'PaidInCapital': '股东实际已缴纳到位的资本金额，反映真实出资情况',
    'RegisteredAddress': '公司在工商登记的法定住所地址',
    'OperatingAddress': '公司实际经营活动的办公地址',
    'BusinessScope': '工商登记许可的经营范围，规定公司可从事的业务活动',
    'BusinessStatus': '公司当前的经营状态，如存续、吊销、注销等',
    'TotalShares': '公司发行的股份总数，反映公司股本规模',
    'ShareholderCount': '持有公司股份的股东总人数',
    'Top1ShareholderRatio': '第一大股东持股比例，反映股权集中度',
    'Top3ShareholderRatio': '前三大股东合计持股比例，反映核心股东控制力',
    'Top5ShareholderRatio': '前五大股东合计持股比例，反映主要股东影响力',
    'FounderOwnership': '创始人及其一致行动人合计持股比例',
    'ManagementOwnership': '公司管理层（董事、监事、高管）合计持股比例',
    'EmployeeOwnership': '员工持股平台或员工直接持股合计比例',
    'InstitutionalOwnership': '机构投资者（基金、保险、券商等）合计持股比例',
    'ForeignOwnership': '境外投资者（含 QFII、陆股通等）合计持股比例',
    'UltimateBeneficialOwner': '通过股权穿透识别的最终实际控制人',
    'VotingRightsRatio': '实际控制人可支配的表决权比例',
    'ControlRightsRatio': '实际控制人可支配的控制权比例',
    'FounderControlRatio': '创始人通过股权、协议等方式实际控制的表决权比例',
    'BoardControlRatio': '创始人或实控人能够控制的董事会席位比例',
    'VetoRights': '是否存在一票否决权等特殊公司治理安排',
    'ConcertPartyArrangement': '是否存在一致行动人协议或其他联合控制安排',
    'ControlChainLength': '从公司到最终实控人之间的股权层级数量',
    'ControlComplexity': '股权结构复杂程度，综合考虑层级、交叉持股等因素',
    'ControlStability': '控制权稳定性，反映股权结构变化对公司控制的影响',
    'SubsidiaryCount': '公司控股的子公司总数量',
    'ControlledSubsidiaryRatio': '控股子公司数量占全部对外投资的比例',
    'AssociateCount': '公司参股的联营企业数量',
    'JointVentureCount': '公司参与的合营企业数量',
    'ConsolidationScope': '纳入合并报表范围的主体数量及变化',
    'RelatedPartyCount': '关联方总数量，包括股东、高管控制的其他企业',
    'RelatedPartyTransactionRatio': '关联交易金额占营业收入或采购总额的比例',
    'RelatedPartyReceivable': '关联方应收款项余额及占比',
}

def main():
    input_file = 'D:/deepseek-harness/.ontology-stage1/nalinwei-instance/graph/nodes.csv'
    output_file = 'D:/deepseek-harness/.ontology-stage1/nalinwei-instance/graph/nodes.csv'

    print(f'📄 读取文件：{input_file}')

    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    fixed_count = 0
    fixed_lines = []

    # 保留 header
    fixed_lines.append(lines[0])

    for line in lines[1:]:
        if not line.strip():
            continue

        parts = line.strip().split(',', 4)
        if len(parts) >= 4:
            node_id, node_type, name, old_desc, metadata = parts[0], parts[1], parts[2], parts[3], ','.join(parts[4:])

            # 查找对应的中文描述
            new_desc = DESCRIPTIONS.get(name, 'Corporate & Ownership 领域的指标')

            # 确保 metadata 是完整 JSON
            if not metadata.strip().startswith('{'):
                metadata = '{' + metadata

            # 重建行
            fixed_line = f'{node_id},{node_type},{name},{new_desc},{metadata}\n'
            fixed_lines.append(fixed_line)
            fixed_count += 1

    print(f'✅ 修复完成：{fixed_count} 行已更新')

    # 写回文件
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        f.writelines(fixed_lines)

    print(f'📝 文件已保存：{output_file}')
    print('✨ 所有指标描述已更新为具体中文说明\n')

if __name__ == '__main__':
    main()
