import { Spinner } from "./ui/spinner"

const Loading = ({spinnerAction}: {spinnerAction: string}) => {
  return (
    <div className="flex items-center justify-center h-screen">
        <Spinner/>
        <h1 className="tracking-wider mr-2">{spinnerAction}</h1>
    </div>
  )
}

export default Loading