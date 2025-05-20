import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.jsx"
import { BrowserRouter } from "react-router-dom"
import AppStore from "./context/AppStore.jsx"
import { CookiesProvider } from "react-cookie";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CookiesProvider>
      <AppStore>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppStore>
    </CookiesProvider>
  </StrictMode>
)
