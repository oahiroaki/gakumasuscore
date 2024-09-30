import { useCallback, useEffect, useRef, useState } from "react"
import {calcurateFinalResult, readActualStatus, requireExaminationScore } from "./FinalResult"
import sampleImage from "./images/IMG_3877.jpg"
import { loadStatusFromOcrResponse } from "./loadStatusFromImage"
import PositionInputComponent from "./PositionInputComponent"
import LoadingComponent from "./LoadingComponent"
import { GameMode } from "./GameMode"
import { Tooltip } from "react-tooltip"

function App() {
  const [vocal, setVocal] = useState<string>("1100")
  const [vocalErrorMessage, setVocalErrorMessage] = useState<string>("")
  const [dance, setDance] = useState<string>("1100")
  const [danceErrorMessage, setDanceErrorMessage] = useState<string>("")
  const [visual, setVisual] = useState<string>("1100")
  const [visualErrorMessage, setVisualErrorMessage] = useState<string>("")
  const [position, setPosition] = useState<string>("1")
  const [gameMode, setGameMode] = useState<string>("PRO")
 
  const defaultResults = {
    finalPoint: "",
    requiredFinalExaminaionScore: {
      "A": {score: "", diff: ""},
      "A+": {score: "", diff: ""},
      "S": {score: "", diff: ""},
      "S+": {score: "", diff: ""},
    }  
  }
  const [results, setResults] = useState(defaultResults)
  const [loading, setLoading] = useState<boolean>(false)
  const inputImageRef = useRef<HTMLInputElement>(null)

  function toString(value: number): string {
    return value != null ? value.toString() : ""
  }

  const cachedCheckInputStatus = useCallback(() => {
    const maxStatus = (parseGameMode(gameMode) === GameMode.MASTER) ? 1800 : 1500

    setVocalErrorMessage("")
    if (vocal == "" || !/[1-9][0-9]*/.test(vocal)) {
      setVocalErrorMessage("1以上の整数を入力してください")
    } else if (parseInt(vocal, 10) > maxStatus) {
      setVocalErrorMessage(maxStatus + "以下で入力してください")
    }
    setDanceErrorMessage("")
    if (dance == "" || !/[1-9][0-9]*/.test(dance)) {
      setDanceErrorMessage("1以上の整数を入力してください")
    } else if (parseInt(dance, 10) > maxStatus) {
      setDanceErrorMessage(maxStatus + "以下で入力してください")
    }
    setVisualErrorMessage("")
    if (visual == "" || !/[1-9][0-9]*/.test(visual)) {
      setVisualErrorMessage("1以上の整数を入力してください")
    } else if (parseInt(visual, 10) > maxStatus) {
      setVisualErrorMessage(maxStatus + "以下で入力してください")
    }
    return (vocalErrorMessage === "" && danceErrorMessage === "" && visualErrorMessage === "")
  }, [dance, danceErrorMessage, gameMode, visual, visualErrorMessage, vocal, vocalErrorMessage])

  useEffect(() => {
    if (!cachedCheckInputStatus()) {
      return
    }

    const examinationPosition = parseInt(position, 10)
    const examinationScore = 10000
    const status = {
      vocal: parseInt(vocal, 10),
      dance: parseInt(dance, 10),
      visual: parseInt(visual, 10),
    }

    // ステータスチェック
    try {
      const idolStatus = readActualStatus(status, parseGameMode(gameMode), examinationPosition)
      // 最終スコア計算
      const finalPoint = calcurateFinalResult({examinationPosition, examinationScore, status: idolStatus})
      console.log(finalPoint)
      // 目標ステータス計算
      const aScore = requireExaminationScore("A", idolStatus, examinationPosition)
      const aPlusScore = requireExaminationScore("A+", idolStatus, examinationPosition)
      const sScore = requireExaminationScore("S", idolStatus, examinationPosition)
      const sPlusScore = requireExaminationScore("S+", idolStatus, examinationPosition)
      setResults({
        finalPoint: toString(finalPoint),
        requiredFinalExaminaionScore: {
          "S+": {score: toString(sPlusScore), diff: toString(Math.max(sPlusScore - examinationScore, 0))},
          "S": {score: toString(sScore), diff: toString(Math.max(sScore - examinationScore, 0))},
          "A+": {score: toString(aPlusScore), diff: toString(Math.max(aPlusScore - examinationScore, 0))},
          "A": {score: toString(aScore), diff: toString(Math.max(aScore - examinationScore, 0))},
        }
      })  
    } catch(e) {
      console.log(e)
    }
  }, [vocal, dance, visual, position, gameMode, cachedCheckInputStatus])


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

  function parseGameMode(mode: string): GameMode {
    if (mode === "PRO") {
      return GameMode.PRO
    } else if (mode === "MASTER") {
      return GameMode.MASTER
    } else {
      throw new Error("不正なゲームモード")
    }
  }


  function changeValue(value: string, setValue: (value: string) => void, setError: (message: string) => void): void {
    setError("")
    const maxStatus = (parseGameMode(gameMode) === GameMode.MASTER) ? 1800 : 1500
    if (value == "" || !/[1-9][0-9]*/.test(value)) {
      setError("1以上の整数を入力してください")
    } else if (parseInt(value, 10) > maxStatus) {
      setError(maxStatus + "以下で入力してください")
    }
    setValue(value)
  }

  function className(type: string, errorMessage: string) {
    let className = "w-full text-right appearance-none border-2 rounded p-1 text-gray-700 focus:outline-none"
    if (type === "visual") {
      className += " border-yellow-200 focus:border-yellow-400"
    } else if (type === "dance") {
      className += " border-blue-200 focus:border-blue-400"
    } else if (type === "vocal") {
      className += " border-red-200 focus:border-red-400"
    } else {
      className += " border-gray-200 focus:border-gray-400"
    }
    if (errorMessage != null && errorMessage !== "") {
      className += " bg-red-200"
    } else {
      className += " bg-white"
    }
    return className
  }

  return (
    <div className="md:max-w-[768px] m-auto">
      {loading && <LoadingComponent /> }
      <main className="w-full p-2">
        <div className="">
          <div className="my-2 font-bold">ゲーム難易度</div>
          <div>
            <div className="w-full text-gray-700 text-xs mb-2">
              マスター or プロを選択してください。
            </div>
            <ul className="w-full flex flex-row flex-nowrap px-4 md:px-12 gap-2 items-center text-sm text-gray-700 bg-white">
              <li className="w-full border border-gray-200 rounded">
                <div className="flex px-2 gap-2 items-center">
                  <input
                    id="mode-pro"
                    type="radio" value="PRO" name="list-radio"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                    checked={gameMode === "PRO"}
                    onChange={(event) => setGameMode(event.target.value)}
                  />
                  <label htmlFor="mode-pro" className="w-full py-2 text-sm text-gray-700">プロ</label>
                </div>
              </li>
              <li className="w-full border border-gray-200 rounded">
                <div className="flex px-2 gap-2 items-center">
                  <input
                    id="mode-master"
                    type="radio" value="MASTER" name="list-radio"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                    checked={gameMode === "MASTER"}
                    onChange={(event) => setGameMode(event.target.value)}
                  />
                  <label htmlFor="mode-master" className="w-full py-2 text-sm text-gray-700">マスター</label>
                </div>
              </li>
            </ul>
          </div>

          <div className="my-2 font-bold">最終試験開始前のステータス</div>
          <div className="w-full flex flex-col gap-2 md:flex-row md:gap-4">
            <div className="flex flex-row items-baseline justify-start md:flex-col">
              <div className="w-24 text-sm text-right pr-2 md:text-left md:px-0">
                <label className="block text-gray-500" htmlFor="input-vocal">ボーカル</label>
              </div>
              <div className="w-44">
                <input id="input-vocal"
                  className={className("vocal", vocalErrorMessage)}
                  type="number" value={vocal}
                  onChange={event => changeValue(event.target.value, setVocal, setVocalErrorMessage)}
                  data-tooltip-id="vocal-error-tooltip" data-tooltip-content={vocalErrorMessage}
                />
              </div>
              <Tooltip id="vocal-error-tooltip" />
            </div>
            <div className="flex flex-row items-baseline justify-start md:flex-col">
              <div className="w-24 text-sm text-right pr-2 md:text-left md:px-0">
                <label className="block text-gray-500" htmlFor="input-dance">ダンス</label>
              </div>
              <div className="w-44">
                <input id="input-dance"
                  className={className("dance", danceErrorMessage)}
                  type="number" value={dance}
                  onChange={event => changeValue(event.target.value, setDance, setDanceErrorMessage)}
                  data-tooltip-id="dance-error-tooltip" data-tooltip-content={danceErrorMessage}
                />
              </div>
              <Tooltip id="dance-error-tooltip" />
            </div>
            <div className="flex flex-row items-baseline justify-start md:flex-col">
              <div className="w-24 text-sm text-right pr-2 md:text-left md:px-0">
                <label className="block text-gray-500" htmlFor="input-visual">ビジュアル</label>
              </div>
              <div className="w-44">
                <input id="input-dance"
                  className={className("visual", visualErrorMessage)}
                  type="number" value={visual}
                  onChange={event => changeValue(event.target.value, setVisual, setVisualErrorMessage)}
                  data-tooltip-id="visual-error-tooltip" data-tooltip-content={visualErrorMessage}
                />
              </div>
              <Tooltip id="visual-error-tooltip" />
            </div>
          </div>

          <div className="my-2 font-bold">最終試験の結果</div>
          <div className="">
            <div className="w-full text-gray-700 text-xs mb-2">
              1位の場合、試験クリア時ボーナスで各ステータスに自動で+30されます。
            </div>
            <div className="w-full flex flex-col gap-2 md:gap-4 md:flex-row md:justify-baseline md:items-baseline">
              <PositionInputComponent label="順位" position={position} setPosition={setPosition} />
            </div>
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
                  <td className="px-4 py-2 text-center">S+</td>
                  <td className="px-4 py-2 text-right">14500</td>
                  <td className="px-4 py-2 text-right">{results.requiredFinalExaminaionScore["S+"].score}</td>
                </tr>
                <tr className="border-b border-x">
                  <td className="px-4 py-2 text-center">S</td>
                  <td className="px-4 py-2 text-right">13000</td>
                  <td className="px-4 py-2 text-right">{results.requiredFinalExaminaionScore.S.score}</td>
                </tr>
                <tr className="border-b border-x">
                  <td className="px-4 py-2 text-center">A+</td>
                  <td className="px-4 py-2 text-right">11500</td>
                  <td className="px-4 py-2 text-right">{results.requiredFinalExaminaionScore["A+"].score}</td>
                </tr>
                <tr className="border-b border-x">
                  <td className="px-4 py-2 text-center">A</td>
                  <td className="px-4 py-2 text-right">10000</td>
                  <td className="px-4 py-2 text-right">{results.requiredFinalExaminaionScore.A.score}</td>
                </tr>
              </tbody>
            </table>
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
