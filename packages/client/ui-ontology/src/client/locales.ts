/** Locale dictionaries for the ontology explorer plugin. */

/** Dictionary namespace owned by this plugin. */
export const NS = 'ontology'

/** The ontology dictionary key set (the source of truth for both locales). */
export type OntologyKey =
  | 'view.ontology'
  | 'search.placeholder'
  | 'search.button'
  | 'search.unresolved'
  | 'packs'
  | 'noPacks'
  | 'loading'
  | 'error'
  | 'browse'
  | 'detail'
  | 'graph'
  | 'type'
  | 'namespace'
  | 'query'
  | 'prev'
  | 'next'
  | 'count'
  | 'snapshot'
  | 'relations'
  | 'incoming'
  | 'outgoing'
  | 'provenance'
  | 'evidence'
  | 'questions'
  | 'rules'
  | 'aliases'
  | 'unresolved'
  | 'empty'
  | 'packs.select'
  | 'packs.available'
  | 'packs.loaded'
  | 'packs.none'
  | 'refresh'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The ontology view tab label and explorer strings. */
    'ontology': OntologyKey
  }
}

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh: Record<OntologyKey, string> = {
  'view.ontology': '本体',
  'search.placeholder': '搜索概念 / 别名（如 “毛利率”）',
  'search.button': '解析',
  'search.unresolved': '未找到匹配',
  'packs': '已加载包',
  'noPacks': '当前没有已加载的语义包。部署侧需为语义服务注册一个 provider 并加载完整 SemanticPack。',
  'loading': '加载中…',
  'error': '出错',
  'browse': '浏览',
  'detail': '详情',
  'graph': '关系图',
  'type': '类型',
  'namespace': '命名空间',
  'query': '关键词',
  'prev': '上一页',
  'next': '下一页',
  'count': '数量',
  'snapshot': '快照',
  'relations': '关系',
  'incoming': '入边',
  'outgoing': '出边',
  'provenance': '来源',
  'evidence': '证据要求',
  'questions': '关联问题',
  'rules': '关联规则',
  'aliases': '别名',
  'unresolved': '未解析',
  'empty': '空',
  'packs.select': '选择包',
  'packs.available': '可用包',
  'packs.loaded': '已加载',
  'packs.none': '暂无可用包',
  'refresh': '刷新',
}

/** English dictionary. */
export const en: Record<OntologyKey, string> = {
  'view.ontology': 'Ontology',
  'search.placeholder': 'Search concept / alias (e.g. "毛利率")',
  'search.button': 'Resolve',
  'search.unresolved': 'No match found',
  'packs': 'Loaded packs',
  'noPacks': 'No semantic packs are loaded. A pack provider must be registered with the semantic service and a complete SemanticPack loaded.',
  'loading': 'Loading…',
  'error': 'Error',
  'browse': 'Browse',
  'detail': 'Detail',
  'graph': 'Graph',
  'type': 'Type',
  'namespace': 'Namespace',
  'query': 'Query',
  'prev': 'Prev',
  'next': 'Next',
  'count': 'Count',
  'snapshot': 'Snapshot',
  'relations': 'Relations',
  'incoming': 'Incoming',
  'outgoing': 'Outgoing',
  'provenance': 'Provenance',
  'evidence': 'Evidence',
  'questions': 'Questions',
  'rules': 'Rules',
  'aliases': 'Aliases',
  'unresolved': 'Unresolved',
  'empty': 'Empty',
  'packs.select': 'Select Pack',
  'packs.available': 'Available Packs',
  'packs.loaded': 'Loaded',
  'packs.none': 'No packs available',
  'refresh': 'Refresh',
}
