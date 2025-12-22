import { Spinner } from "./ui/spinner"

const Loading = () => {
  return (
    <div className="flex items-center justify-center h-screen">
        <h1 className="tracking-wider mr-2">Loading</h1>
        <Spinner/>
    </div>
  )
}

export default Loading