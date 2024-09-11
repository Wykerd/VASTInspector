import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './globals.css'
import Inspector from './lib/Inspector.tsx'
import { InspectionPaneProvider } from './lib/InspectionPaneProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Inspector>
      <InspectionPaneProvider>
        <App />
      </InspectionPaneProvider>
    </Inspector>
  </StrictMode>,
)
