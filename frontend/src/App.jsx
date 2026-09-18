import Sidebar from "./components/layout/Sidebar"
import Topbar from "./components/layout/Topbar"
import Dashboard from "./pages/Dashboard"
import Workers from "./pages/Workers"
import MineMapPage from "./pages/MineMapPage"
import Alerts from "./pages/Alerts"
import Environment from "./pages/Environment"
import AIInsights from "./pages/AIInsights"
import Settings from "./pages/Settings"
import Analytics from "./pages/Analytics"
import { useState } from "react"
import { SocketProvider } from "./context/SocketContext"


function App() {

  const [activePage, setActivePage] =
    useState("Overview")

  const pages = {
    Overview: <Dashboard />,
    Workers: <Workers />,
    "Mine Map": <MineMapPage />,
    Alerts: <Alerts />,
    Environment: <Environment />,
    Analytics: <Analytics />,
    "AI Insights": <AIInsights />,
    Settings: <Settings />,
  }

  return (

    <SocketProvider>

      <div className="flex min-h-screen bg-[#090d12]">

        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
        />

        <div className="flex min-w-0 flex-1 flex-col">

          <Topbar
            activePage={activePage}
            onNavigate={setActivePage}
          />

          <div className="flex-1 overflow-auto pb-20 lg:pb-0">

            {pages[activePage]}

          </div>

        </div>

      </div>

    </SocketProvider>

  )
}


export default App
