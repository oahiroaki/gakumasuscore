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
  const [loading, setLoading] = useState<boolean>(false)
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
    setLoading(true)

    if (inputImageRef.current == null || inputImageRef.current.files == null || inputImageRef.current.files.length === 0) {
      setLoading(false)
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
        setLoading(false)
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

      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div className="md:max-w-[768px] p-2 m-auto">
      <main className="w-full">
        <div className="">
          <div className="my-2 font-bold">最終試験開始時のステータス</div>
          <div className="w-full flex flex-wrap md:gap-4">
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

          <div className="my-2 font-bold">スクリーンショットからステータス反映</div>
          <div className="flex flex-col gap-4">
            <div className="w-full text-gray-700 text-sm">
              下のような最終試験前のスクリーンショットを選択して、スクショから読み込むボタンを押してください。<br/>
              うまく読み込めないときもあります。
            </div>
            <div className="flex gap-4 flex-wrap">
              <img src={sampleImage} className="w-28 ml-4" />
              <div className="flex flex-col gap-4">
                <input type="file" accept="image/*" ref={inputImageRef} />
                <div>
                  <button
                    className="border-2 border-gray-200 bg-gray-100 hover:opacity-80 rounded w-44 h-8 flex items-center justify-center"
                    onClick={() => loadStatusFromImage()}
                    disabled={loading}
                  >
                    {loading ? (
                      <div role="status">
                        <svg aria-hidden="true" className="w-6 h-6 text-gray-200 animate-spin fill-gray-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                          <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                        </svg>
                        <span className="sr-only">Loading...</span>
                      </div>
                    ) : (
                      <div>スクショから読み込む</div>
                    )}
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
                  <th className="px-4 py-2 whitespace-nowrap text-xs md:text-base">ランク</th>
                  <th className="px-4 py-2 whitespace-nowrap text-xs md:text-base">必要な最終試験の点数</th>
                  <th className="px-4 py-2 whitespace-nowrap text-xs md:text-base">不足している点数</th>
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
    </div>
  )
}

export default App
