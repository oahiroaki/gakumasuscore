import { useState } from "react"

interface StatusInputComponentProps {
  label: string
  value: string
  setValue: (value: string) => void
  type?: "vocal" | "dance" | "visual"
}

function StatusInputComponent(props: StatusInputComponentProps) {
  const [errorMessage, setErrorMessage] = useState<string>('')

  function changeValue(event: React.ChangeEvent<HTMLInputElement>): void {
    setErrorMessage("")
    const value = event.target.value
    if (value == "" || !/[1-9][0-9]*/.test(value)) {
      setErrorMessage("1以上の整数を入力してください")
    } else if (props.type != null && parseInt(value, 10) > 1500) {
      setErrorMessage("1500以下で入力してください")
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
    return className
  }

  return (
    <div className="flex flex-row items-baseline justify-start md:flex-col">
      <div className="w-24 text-right text-sm md:text-left pr-4 md:px-0">
        <label className="block text-gray-500" htmlFor={props.label}>{props.label}</label>
      </div>
      <div className="w-44">
        <input className={className()} type="number" onChange={changeValue} value={props.value} />
        <div className="h-4 text-red-500 text-xs">
          {errorMessage}
        </div>
      </div>
    </div>
  )
}

export default StatusInputComponent