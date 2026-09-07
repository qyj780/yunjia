export const METHOD = 'three-number-v1' as const;
// 每个三爻数组均从下往上排列：初爻、二爻、三爻。
const trigrams = [
  { name: '乾', image: '天', lines: [1, 1, 1] },
  { name: '兑', image: '泽', lines: [1, 1, 0] },
  { name: '离', image: '火', lines: [1, 0, 1] },
  { name: '震', image: '雷', lines: [1, 0, 0] },
  { name: '巽', image: '风', lines: [0, 1, 1] },
  { name: '坎', image: '水', lines: [0, 1, 0] },
  { name: '艮', image: '山', lines: [0, 0, 1] },
  { name: '坤', image: '地', lines: [0, 0, 0] },
];
// 行为上卦，列为下卦，均按乾兑离震巽坎艮坤排列。
const names = [
  ['乾为天','天泽履','天火同人','天雷无妄','天风姤','天水讼','天山遁','天地否'],
  ['泽天夬','兑为泽','泽火革','泽雷随','泽风大过','泽水困','泽山咸','泽地萃'],
  ['火天大有','火泽睽','离为火','火雷噬嗑','火风鼎','火水未济','火山旅','火地晋'],
  ['雷天大壮','雷泽归妹','雷火丰','震为雷','雷风恒','雷水解','雷山小过','雷地豫'],
  ['风天小畜','风泽中孚','风火家人','风雷益','巽为风','风水涣','风山渐','风地观'],
  ['水天需','水泽节','水火既济','水雷屯','水风井','坎为水','水山蹇','水地比'],
  ['山天大畜','山泽损','山火贲','山雷颐','山风蛊','山水蒙','艮为山','山地剥'],
  ['地天泰','地泽临','地火明夷','地雷复','地风升','地水师','地山谦','坤为地'],
];
export function validNumbers(value: unknown): value is number[] { return Array.isArray(value) && value.length === 3 && value.every(n => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 100); }
function describe(lines: number[]) {
  const lower = trigrams.findIndex(t => t.lines.every((n, i) => n === lines[i]));
  const upper = trigrams.findIndex(t => t.lines.every((n, i) => n === lines[i + 3]));
  return { name: names[upper][lower], upper: trigrams[upper].name, lower: trigrams[lower].name, lines };
}
export function divine(numbers: number[]) {
  if (!validNumbers(numbers)) throw new Error('需要三个 1～100 的整数');
  const upper = (numbers[0] - 1) % 8;
  const lower = (numbers[1] - 1) % 8;
  const moving = (numbers[2] - 1) % 6 + 1;
  const lines = [...trigrams[lower].lines, ...trigrams[upper].lines];
  const changed = lines.map((n, i) => i === moving - 1 ? 1 - n : n);
  return {
    method: METHOD, original: describe(lines), changed: describe(changed),
    mutual: describe([lines[1], lines[2], lines[3], lines[2], lines[3], lines[4]]),
    moving, body: moving <= 3 ? trigrams[upper].name : trigrams[lower].name,
    use: moving <= 3 ? trigrams[lower].name : trigrams[upper].name,
    rule: '第一数除以8取上卦，第二数除以8取下卦（余0为坤）；第三数除以6取动爻（余0为第6爻）。爻位自下而上。',
  };
}
