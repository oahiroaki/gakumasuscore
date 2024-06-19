import { useEffect, useRef, useState } from "react"
import StatusInputComponent from "./StatusInputComponent"
import {calcurateFinalResult, requireExaminationScore } from "./FinalResult"
import sampleImage from "./images/IMG_3877.jpg"
import { loadStatusFromOcrResponse } from "./loadStatusFromImage"
import PositionInputComponent from "./PositionInputComponent"
import LoadingComponent from "./LoadingComponent"
import requiredResult from "./requiredResult"

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

      const results = await loadStatusFromOcrResponse(response)
      if (results.vocal > 0) {
        setVocal(results.vocal.toString(10))
      }
      if (results.dance > 0) {
        setDance(results.dance.toString(10))
      }
      if (results.visual > 0) {
        setVisual(results.visual.toString(10))
      }
    } catch (err) {
      console.error(err)
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="md:max-w-[768px] m-auto">
      {loading && <LoadingComponent /> }
      <main className="w-full p-2">
        <div className="">
          <div className="my-2 font-bold">最終試験開始前のステータス</div>
          <div className="w-full flex flex-col md:flex-row md:gap-4">
            <StatusInputComponent label="ボーカル" value={vocal} setValue={setVocal} type="vocal" />
            <StatusInputComponent label="ダンス" value={dance} setValue={setDance} type="dance" />
            <StatusInputComponent label="ビジュアル" value={visual} setValue={setVisual} type="visual" />
          </div>

          <div className="my-2 font-bold">スクリーンショットからステータス反映</div>
          <div className="">
            <div className="flex flex-row flex-nowrap gap-2 px-2">
              <div className="w-28">
                <img src={sampleImage} className="w-28" />
              </div>
              <div className="w-full text-gray-700 text-xs">
                左のような最終試験前のスクリーンショットを選択してください。うまく読み込めないときもあります。
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <input type="file" accept="image/*" ref={inputImageRef} onChange={() => loadStatusFromImage()} />
            </div>
          </div>

          <div className="my-2 font-bold">最終試験の結果</div>
          <div className="">
            <div className="w-full text-gray-700 text-xs mb-2">
              1位の場合、試験クリア時ボーナスで各ステータスに自動で+30されます。<br/>
              点数は、最終プロデュース評価を計算する場合のみ入力してください。
            </div>
            <div className="w-full flex flex-col gap-2 md:gap-4 md:flex-row md:justify-baseline md:items-baseline">
              <PositionInputComponent label="順位" position={position} setPosition={setPosition} />
              <StatusInputComponent label="点数" value={score} setValue={setScore} />
            </div>
          </div>
        </div>

        <div className="text-gray-700 w-full border-t mt-2">
          <div className="my-2 font-bold">計算結果</div>
          <div className="w-full overflow-x-auto">
            <table className="table-auto w-full max-w-xl">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 whitespace-nowrap text-xs md:text-base">ランク</th>
                  <th className="px-4 py-2 whitespace-nowrap text-xs md:text-base">必要な最終評価の値</th>
                  <th className="px-4 py-2 whitespace-nowrap text-xs md:text-base">必要な最終試験の点数</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-x">
                  <td className="px-4 py-2 text-center">S</td>
                  <td className="px-4 py-2 text-right">{requiredResult.S}</td>
                  <td className="px-4 py-2 text-right">{results.requiredFinalExaminaionScore.S.score}</td>
                </tr>
                <tr className="border-b border-x">
                  <td className="px-4 py-2 text-center">A+</td>
                  <td className="px-4 py-2 text-right">{requiredResult["A+"]}</td>
                  <td className="px-4 py-2 text-right">{results.requiredFinalExaminaionScore["A+"].score}</td>
                </tr>
                <tr className="border-b border-x">
                  <td className="px-4 py-2 text-center">A</td>
                  <td className="px-4 py-2 text-right">{requiredResult.A}</td>
                  <td className="px-4 py-2 text-right">{results.requiredFinalExaminaionScore.A.score}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 mt-2">
            <div className="whitespace-nowrap font-bold">最終プロデュース評価</div>
            <div>{results.finalPoint}</div>
          </div>
        </div>
      </main>
      <div className="text-sm text-gray-500 text-center w-full py-1">
        author: <a href="https://x.com/oahiroaki">@oahiroaki</a>
      </div>
    </div>
  )
}

export default App
