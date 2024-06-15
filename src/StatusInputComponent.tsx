interface StatusInputComponentProps {
  label: string
  value: number
  setValue: (value: number) => void
}

function StatusInputComponent(props: StatusInputComponentProps) {
  function changeValue(event: React.ChangeEvent<HTMLInputElement>): void {
    props.setValue(parseInt(event.target.value, 10))
  }

  return (
    <div className="w-80 flex flex-row flex-nowrap items-baseline justify-start">    
      <div className="w-24 text-right pr-4">
        <label className="block text-gray-500 font-bold" htmlFor={props.label}>{props.label}</label>
      </div>
      <div className="">
        <input
          className="w-full text-right
            bg-white appearance-none border-2 border-gray-200
            rounded p-2
            text-gray-700 leading-tight
            focus:outline-none focus:bg-white focus:border-purple-500
          "
          type="number"
          onChange={changeValue}
          value={props.value}
        />
      </div>
    </div>
  )
}

export default StatusInputComponent