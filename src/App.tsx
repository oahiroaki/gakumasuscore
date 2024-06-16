import { useEffect, useRef, useState } from "react"
import StatusInputComponent from "./StatusInputComponent"
import {calcurateFinalResult, requireExaminationScore } from "./FinalResult"
import OcrResponse from "./OcrResponse"
import sampleImage from "./images/IMG_3877.jpg"

function App() {
  const [vocal, setVocal] = useState<string>("1000")
  const [dance, setDance] = useState<string>("1000")
  const [visual, setVisual] = useState<string>("1000")
  const [score, setScore] = useState<string>("10000")
  const [position, setPosition] = useState<string>("1")
  const defaultResults = {
    finalPoint: "",
    requiredFinalExaminaionScore: {
      "A": {score: "", diff: ""},
      "A+": {score: "", diff: ""},
      "S": {score: "", diff: ""},
    }  
  }
  const [results, setResults] = useState(defaultResults)
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(false)
  const inputImageRef = useRef<HTMLInputElement>(null)

  function toString(value: number): string {
    return value != null ? value.toString() : ""
  }

  useEffect(() => {
    if (![vocal, dance, score, position].every((value) => /[1-9][0-9]*/.test(value))) {
      return
    }

    const examinationPosition = parseInt(position, 10)
    const examinationScore = parseInt(score, 10)
    const status = {
      vocal: parseInt(vocal, 10),
      dance: parseInt(dance, 10),
      visual: parseInt(visual, 10),
    }

    const finalPoint = calcurateFinalResult({examinationPosition, examinationScore, status})
    const aScore = requireExaminationScore("A", status, examinationPosition)
    const aPlusScore = requireExaminationScore("A+", status, examinationPosition)
    const sScore = requireExaminationScore("S", status, examinationPosition)

    setResults({
      finalPoint: toString(finalPoint),
      requiredFinalExaminaionScore: {
        "S": {score: toString(sScore), diff: toString(Math.max(sScore - examinationScore, 0))},
        "A+": {score: toString(aPlusScore), diff: toString(Math.max(aPlusScore - examinationScore, 0))},
        "A": {score: toString(aScore), diff: toString(Math.max(aScore - examinationScore, 0))},
      }
    })
  }, [vocal, dance, visual, score, position])


  async function loadStatusFromImage() {
    setButtonDisabled(true)

    if (inputImageRef.current == null || inputImageRef.current.files == null || inputImageRef.current.files.length === 0) {
      setButtonDisabled(false)
      return
    }

    const inputImageFile = inputImageRef.current.files[0]
    const arrayBuffer = await inputImageRef.current.files[0].arrayBuffer()
    const inputImageBlob = new Blob([arrayBuffer], {type: inputImageFile.type})
    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        body: inputImageBlob
      })
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
      positionList.sort((a, b) => {
        if (a.maxHeight > b.maxHeight) {
          return 1
        } else {
          return -1
        }
      })

      const statsList: Array<{status: number, minHeight: number, maxHeight: number}> = []
      data.readResult.blocks[0].lines.forEach(line => {
        if (/^[0-9]{2,4}$/.test(line.text)) {
          const heights = line.boundingPolygon.map(bp => bp.y)
          const maxHeight = Math.max.apply(null, heights)
          const minHeight = Math.min.apply(null, heights)
          statsList.push({status: parseInt(line.text, 10), minHeight, maxHeight})
        }
      })

      if (positionList.length === 0 || statsList.length === 0) {
        setButtonDisabled(false)
        return
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

      if (results.vocal > 0) {
        setVocal(results.vocal.toString(10))
      }
      if (results.dance > 0) {
        setDance(results.dance.toString(10))
      }
      if (results.visual > 0) {
        setVisual(results.visual.toString(10))
      }

      setButtonDisabled(false)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="max-w-[800px] p-2 m-auto">
      <main className="w-full flex flex-wrap">
        <div className="">
          <div className="my-2 font-bold">最終試験開始時のステータス</div>
          <div className="w-full flex gap-4">
            <StatusInputComponent label="ボーカル" value={vocal} setValue={setVocal} type="vocal" />
            <StatusInputComponent label="ダンス" value={dance} setValue={setDance} type="dance" />
            <StatusInputComponent label="ビジュアル" value={visual} setValue={setVisual} type="visual" />
          </div>

          <div className="my-2 font-bold">最終試験の結果</div>
          <div className="w-full flex gap-4 items-baseline">
            <StatusInputComponent label="点数" value={score} setValue={setScore} />
            <div className="">
              <div className="w-16">
                <label className="text-gray-700" htmlFor="position">順位</label>
              </div>
              <div>
                <select id="position"
                  className="
                    w-32
                    text-gray-700 rounded appearance-none p-2
                    bg-white border-2 border-gray-200 leading-tight
                    focus:outline-none focus:border-gray-400
                  "
                  value={position}
                  onChange={(event) => setPosition(event.target.value)}
                >
                  <option value="1">1位</option>
                  <option value="2">2位</option>
                  <option value="3">3位</option>
                </select>
              </div>
            </div>
          </div>

          <div className="my-2 font-bold">画面キャプチャからステータス反映</div>
          <div className="flex flex-col gap-4">
            <div className="w-full text-gray-700 text-sm">下のような最終試験前のキャプチャを選択して、キャプチャから読み込むボタンを押してください。</div>
            <div className="flex gap-4">
              <img src={sampleImage} className="w-28" />
              <div className="flex flex-col gap-4">
                <input type="file" accept="image/*" ref={inputImageRef} />
                <div>
                  <button
                    className="border-2 border-green-200 bg-green-100 hover:opacity-80 rounded px-3 py-1"
                    onClick={() => loadStatusFromImage()}
                    disabled={buttonDisabled}
                  >
                    キャプチャから読み込む
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-gray-700 w-full border-t mt-2">
          <div className="my-2 font-bold">計算結果</div>
          <div className="flex gap-2">
            <div className="whitespace-nowrap font-bold">最終プロデュース評価</div>
            <div>{results.finalPoint}</div>
          </div>
          <div className="mt-2 overflow-x-auto">
            <table className="table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 whitespace-nowrap">ランク</th>
                  <th className="px-4 py-2 whitespace-nowrap">必要な最終試験の点数</th>
                  <th className="px-4 py-2 whitespace-nowrap">不足している点数</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-x">
                  <td className="px-4 py-2 text-center">S</td>
                  <td className="px-4 py-2 text-right">{results.requiredFinalExaminaionScore.S.score}</td>
                  <td className="px-4 py-2 text-right">{results.requiredFinalExaminaionScore.S.diff}</td>
                </tr>
                <tr className="border-b border-x">
                  <td className="px-4 py-2 text-center">A+</td>
                  <td className="px-4 py-2 text-right">{results.requiredFinalExaminaionScore["A+"].score}</td>
                  <td className="px-4 py-2 text-right">{results.requiredFinalExaminaionScore["A+"].diff}</td>
                </tr>
                <tr className="border-b border-x">
                  <td className="px-4 py-2 text-center">A</td>
                  <td className="px-4 py-2 text-right">{results.requiredFinalExaminaionScore.A.score}</td>
                  <td className="px-4 py-2 text-right">{results.requiredFinalExaminaionScore.A.diff}</td>
                </tr>
              </tbody>
            </table>

          </div>
        </div>
      </main>
      <footer>
        <div className="">
        </div>
      </footer>
    </div>
  )
}

export default App
