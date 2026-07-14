import { useState } from 'react'
import './App.css'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="app">
      <h1>gptur-webapp-2026</h1>
      <p>Your Vite + React app is live on Azure Static Web Apps.</p>
      <button onClick={() => setCount((c) => c + 1)}>
        count is {count}
      </button>
      <p className="hint">Edit <code>src/App.jsx</code> and push to deploy.</p>
    </main>
  )
}
