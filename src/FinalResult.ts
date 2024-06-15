import requiredResult from "./requiredResult"

export interface FinalResultParameter {
  /** 試験順位 */
  examinationPosition: number,
  /** ステータス合計値 */
  statusSummary: number,
  /** 試験スコア */
  examinationScore: number,
}

function positionScoreResult(position: number): number {
  switch (position) {
    case 1: return 1700
    case 2: return 900
    case 3: return 500
    default: return 0
  }
}

function statusScoreResult(statusSummary: number) {
  return Math.floor(2.3 * statusSummary)
}

function examinationScoreResult(examinationScore: number): number {
  if (examinationScore <= 0) {
    throw Error('試験スコアが不正')
  }

  if (examinationScore <= 1 && examinationScore <= 5000) {
    return examinationScore * 0.3
  } else if (5000 < examinationScore && examinationScore <= 10000) {
    return Math.floor(5000 * 0.3 + (examinationScore - 5000) * 0.15)
  } else if (10000 < examinationScore && examinationScore <= 20000) {
    return Math.floor(5000 * 0.3 + 5000 * 0.15 + (examinationScore - 10000) * 0.08)
  } else if (20000 < examinationScore && examinationScore <= 30000) {
    return Math.floor(5000 * 0.3 + 5000 * 0.15 + 10000 * 0.08 + (examinationScore - 20000) * 0.04)
  } else if (30000 < examinationScore && examinationScore <= 40000) {
    return Math.floor(5000 * 0.3 + 5000 * 0.15 + 10000 * 0.08 + 10000 * 0.04 + (examinationScore - 30000) * 0.02)
  } else {
    return Math.floor(5000 * 0.3 + 5000 * 0.15 + 10000 * 0.08 + 10000 * 0.04 + 10000 * 0.02 +  (examinationScore - 40000) * 0.01)
  }
}

/**
 * 最終ポイント計算
 * 
 */
export function calcurateFinalResult(parameter: FinalResultParameter) {
  return Math.floor(
    positionScoreResult(parameter.examinationPosition)
    + statusScoreResult(parameter.statusSummary)
    + examinationScoreResult(parameter.examinationScore)
  )
}

/**
 * 目標のランクに必要な最終試験の点数
 * 
 * @param targetRank 目標ランク
 * @param statusSummary ステータス合計
 */
export function requireExaminationScore(targetRank: string, statusSummary: number, position: number) {
  // 目標とする最終ポイント
  let targetResult = 0
  switch (targetRank) {
    case 'A': targetResult = requiredResult['A']; break
    case 'A+': targetResult = requiredResult['A+']; break
    case 'S': targetResult = requiredResult['S']; break
    default: throw Error('Unknown target rank.')
  }

  // 目標の最終ポイントから、ステータスで決まる分と順位点の分を引く
  const remainResult = targetResult - statusScoreResult(statusSummary) - positionScoreResult(position)

  // 最終試験の点数によって決まる分から逆算する
  if (0 < remainResult && remainResult <= 1500) {
    // 1点〜5000点
    return Math.ceil(remainResult / 0.3)
  } else if (1500 < remainResult && remainResult <= 2250) {
    // 5001点〜10000点
    return Math.ceil((remainResult - 1500) / 0.15) + 5000
  } else if (2250 < remainResult && remainResult <= 3050) {
    // 10001点〜20000点
    return Math.ceil((remainResult - 2250) / 0.08) + 10000
  } else if (3050 < remainResult && remainResult <= 3450) {
    // 20001点〜30000点
    return Math.ceil((remainResult - 3050) / 0.04) + 20000
  } else if (3450 < remainResult && remainResult <= 3650) {
    // 30001点〜40000点
    return Math.ceil((remainResult - 3450) / 0.02) + 30000
  } else {
    // 40001点〜
    return Math.ceil((remainResult - 3650) / 0.01) + 40000
  }
}