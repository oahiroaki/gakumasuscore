import { useState } from "react"
import { Tooltip } from "react-tooltip"
import { GameMode } from "./GameMode"

interface StatusInputComponentProps {
  label: string
  mode: GameMode
  value: string
  setValue: (value: string) => void
  type?: "vocal" | "dance" | "visual"
}

function StatusInputComponent(props: StatusInputComponentProps) {
  const [errorMessage, setErrorMessage] = useState<string>("")

  function changeValue(event: React.ChangeEvent<HTMLInputElement>): void {
    setErrorMessage("")
    const maxStatus = (props.mode == GameMode.MASTER) ? 1800 : 1500
    const value = event.target.value
    if (value == "" || !/[1-9][0-9]*/.test(value)) {
      setErrorMessage("1以上の整数を入力してください")
    } else if (props.type != null && parseInt(value, 10) > maxStatus) {
      setErrorMessage(maxStatus + "以下で入力してください")
    }
    props.setValue(value)
  }

  function className() {
    let className = "w-full text-right bg-white appearance-none border-2 rounded p-1 text-gray-700 focus:outline-none"
    if (props.type === "visual") {
      className += " border-yellow-200 focus:border-yellow-400"
    } else if (props.type === "dance") {
      className += " border-blue-200 focus:border-blue-400"
    } else if (props.type === "vocal") {
      className += " border-red-200 focus:border-red-400"
    } else {
      className += " border-gray-200 focus:border-gray-400"
    }
    if (errorMessage != null && errorMessage !== "") {
      className += " bg-red-200"
    }
    return className
  }

  return (
    <div className="flex flex-row items-baseline justify-start md:flex-col">
      <div className="w-24 text-sm text-right pr-2 md:text-left md:px-0">
        <label className="block text-gray-500" htmlFor={props.label}>{props.label}</label>
      </div>
      <div className="w-44">
        <input
          className={className()} type="number" onChange={changeValue} value={props.value}
          data-tooltip-id="my-tooltip" data-tooltip-content={errorMessage}
        />
        <Tooltip id="my-tooltip" />
      </div>
    </div>
  )
}

export default StatusInputComponent