interface PositionInputComponentProps {
  label: string
  position: string
  setPosition: (value: string)  => void 
}

function PositionInputComponent(props: PositionInputComponentProps) {
  return (
    <div className="flex flex-row items-baseline justify-start md:flex-col">
      <div className="w-24 pr-2 md:px-0 text-right text-sm md:text-left">
        <label className="text-gray-700" htmlFor="position">{props.label}</label>
      </div>
      <div>
        <select id="position"
          className="
            w-40 text-gray-700 rounded appearance-none p-1
            bg-white border-2 border-gray-200
            focus:outline-none focus:border-gray-400
          "
          value={props.position}
          onChange={(event) => props.setPosition(event.target.value)}
        >
          <option value="1">1位</option>
          <option value="2">2位</option>
          <option value="3">3位</option>
        </select>
      </div>
    </div>
  )
}

export default PositionInputComponent