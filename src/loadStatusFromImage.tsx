import OcrResponse from "./OcrResponse"

export interface StatusResult {
  vocal: number
  dance: number
  visual: number
}

export async function loadStatusFromOcrResponse(response: Response): Promise<StatusResult> {
  const data: OcrResponse = await response.json()
  console.debug(data)
  
  // OCR結果のxxxx%の部分にマッチさせて、y軸の位置で上からVocal, Dance, Visualのステータスがある位置を判定する
  const positionList: Array<{minHeight: number, maxHeight: number}> = []
  data.readResult.blocks[0].lines.forEach(line => {
    if (/[0-9]+%/.test(line.text)) {
      const heights = line.boundingPolygon.map(bp => bp.y)
      const maxHeight = Math.max.apply(null, heights)
      const minHeight = Math.min.apply(null, heights)
      positionList.push({minHeight, maxHeight})
    }
  })
  // 上からソート
  positionList.sort((a, b) => (a.maxHeight > b.maxHeight) ? 1 : -1)
  
  const statsList: Array<{status: number, minHeight: number, maxHeight: number}> = []
  data.readResult.blocks[0].lines.forEach(line => {
    if (/[0-9]{2,4}/.test(line.text)) {
      line.words.forEach(word => {
        if (/^[0-9]{2,4}$/.test(word.text)) {
          const heights = word.boundingPolygon.map(bp => bp.y)
          const maxHeight = Math.max.apply(null, heights)
          const minHeight = Math.min.apply(null, heights)
          const statusValue = parseInt(word.text, 10)
          statsList.push({status: statusValue, minHeight, maxHeight})
        }    
      })
    }
  })
  
  if (positionList.length === 0 || statsList.length === 0) {
    throw Error("ステータスを読み取れません")
  }
  
  const results = {
    vocal: 0,
    dance: 0,
    visual: 0,
  }
  const gap = Math.floor(data.metadata.height / 100)
  positionList.forEach((position, index) => {
    statsList.forEach(stats => {
      // OCRで読み取った数値の位置が、xxxx%の位置と比較して、画像全体の高さから調整したgap内に入っているか判定する
      if (position.minHeight - gap < stats.minHeight && stats.minHeight < position.minHeight + gap
        && position.maxHeight - gap < stats.maxHeight && stats.maxHeight < position.maxHeight + gap
      ) {
        switch (index) {
          case 0: results.vocal = stats.status; break
          case 1: results.dance = stats.status; break
          case 2: results.visual = stats.status; break
          default: break
        }
      }
    })
  })
  
  console.debug(positionList, statsList)
  console.debug(results)

  return results
}

