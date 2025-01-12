import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="flex space-x-4 justify-center">
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="h-24 hover:drop-shadow-lg" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="h-24 animate-spin hover:drop-shadow-lg" alt="React logo" />
          </a>
        </div>
        <div className="mt-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Vite + React + Tailwind</h1>
          <div className="space-y-4">
            <button
              onClick={() => setCount((count) => count + 1)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              count is {count}
            </button>
            <p className="text-gray-600">
              Edit <code className="bg-gray-200 px-2 py-1 rounded">src/App.tsx</code> and save to test HMR
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
