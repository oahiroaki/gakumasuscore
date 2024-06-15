import { useEffect, useState } from "react"
import StatusInputComponent from "./StatusInputComponent"
import {calcurateFinalResult, requireExaminationScore } from "./FinalResult"

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
        "S": {score: toString(sScore), diff: toString(Math.max(sScore - finalPoint, 0))},
        "A+": {score: toString(aPlusScore), diff: toString(Math.max(aPlusScore - finalPoint, 0))},
        "A": {score: toString(aScore), diff: toString(Math.max(aScore - finalPoint, 0))},
      }
    })
  }, [vocal, dance, visual, score, position])

  return (
    <div className="max-w-[800px] p-2 m-auto">
      <main className="w-full flex flex-wrap">
        <div className="">
          <div className="my-4 font-bold">最終試験開始時のステータス</div>
          <div className="w-full flex gap-4">
            <StatusInputComponent label="ボーカル" value={vocal} setValue={setVocal} type="vocal" />
            <StatusInputComponent label="ダンス" value={dance} setValue={setDance} type="dance" />
            <StatusInputComponent label="ビジュアル" value={visual} setValue={setVisual} type="visual" />
          </div>

          <div className="my-4 font-bold">最終試験の結果</div>
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
        </div>

        <div className="text-gray-700 w-full border-t">
          <div className="flex gap-2 my-4">
            <div className="whitespace-nowrap font-bold">クリア時の最終ポイント</div>
            <div>{results.finalPoint}</div>
          </div>
          <div className="overflow-x-auto">
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
