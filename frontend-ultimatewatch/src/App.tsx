import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="flex items-center justify-center gap-8">
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="w-20 h-20" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="w-20 h-20" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="bg-yellow-600 mt-5 p-8 rounded-xl shadow-md flex flex-col items-center gap-4 mb-6">
        <button
          onClick={() => setCount((count) => count + 1)}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          count is {count}
        </button>
        <p className="text-center text-gray-600">
          Edit <code className="bg-gray-100 px-1 rounded">src/App.tsx</code> and save to test HMR
        </p>
      </div>

      {/* Pie de página */}
      <p className="text-gray-500 text-center">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
