import { useState } from "react"
import StatusInputComponent from "./StatusInputComponent"
import {calcurateFinalResult, requireExaminationScore } from "./FinalResult"

function App() {
  const [vocal, setVocal] = useState<number>(1000)
  const [dance, setDance] = useState<number>(1000)
  const [visual, setVisual] = useState<number>(1000)
  const [score, setScore] = useState<number>(10000)
  const [position, setPosition] = useState<number>(1)
  const [result, setResult] = useState<number>(0)

  function calculate() {
    const result = calcurateFinalResult({
      examinationPosition: position,
      statusSummary: vocal + dance + visual,
      examinationScore: score,
    })
    setResult(result)
  }

  function showRequiredFinalExaminationScore(rank: string): number {
    return requireExaminationScore(rank, dance + vocal + visual, position)
  }

  return (
    <div className="w-[320px] md:w-[640px] m-auto">
      <main className="w-[320px] flex">
        <form className="border border-black">
          <div className="w-full flex flex-nowrap flex-col gap-2">
            <div className="font-bold">最終試験開始時ステータス</div>
            <StatusInputComponent label="ボーカル" value={vocal} setValue={setVocal} />
            <StatusInputComponent label="ダンス" value={dance} setValue={setDance} />
            <StatusInputComponent label="ビジュアル" value={visual} setValue={setVisual} />
            <input type="checkbox"></input>
          </div>

          <div className="w-full flex flex-nowrap flex-col gap-2">
            <div className="font-bold">最終試験結果</div>
            <StatusInputComponent label="点数" value={score} setValue={setScore} />
            <div className="flex flex-row flex-nowrap items-baseline justify-start">
              <div className="w-16 text-right pr-4">
                <label className="text-gray-500 font-bold" htmlFor="position">順位</label>
              </div>
              <div>
                <select id="position"
                  className="w-32
                    text-gray-700 rounded appearance-none p-2
                    bg-white border-2 border-gray-200 leading-tight
                    focus:outline-none focus:bg-white focus:border-purple-500
                  "
                  value={position}
                  onChange={(event) => setPosition(parseInt(event.target.value, 10))}
                >
                  <option value="1">1位</option>
                  <option value="2">2位</option>
                  <option value="3">3位</option>
                </select>
              </div>
            </div>
          </div>
        </form>

        <div className="w-[320px] p-4 text-gray-700">
          <div className="flex w-full">
            <div className="w-24 font-bold">リザルト</div>
            <div>{result}</div>
          </div>
          <table className="table-auto">
            <thead>
              <tr>
                <th>ランク</th>
                <th>必要な最終試験の点数</th>
                <th>不足している点数</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>S</td>
                <td>{showRequiredFinalExaminationScore('S')}</td>
                <td>{Math.max(showRequiredFinalExaminationScore('S') - score, 0)}</td>
              </tr>
              <tr>
                <td>A+</td>
                <td>{showRequiredFinalExaminationScore('A+')}</td>
                <td>{Math.max(showRequiredFinalExaminationScore('A+') - score, 0)}</td>
              </tr>
              <tr>
                <td>A</td>
                <td>{showRequiredFinalExaminationScore('A')}</td>
                <td>{Math.max(showRequiredFinalExaminationScore('A') - score, 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
      <footer>
        <div className="">
          <button
            className="text-gray-100 bg-purple-500 rounded px-4 py-2"
            onClick={calculate}
          >
            Calculate
          </button>
        </div>
      </footer>
    </div>
  )
}

export default App
