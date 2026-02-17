import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
//import App from './App.jsx'
import ProvisionBle from "./ProvisionBle.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProvisionBle />
  </StrictMode>,
)
