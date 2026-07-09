import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

/*
  ReactDOM.createRoot finds the <div id="root"> in index.html
  and hands control of it entirely to React.

  BrowserRouter gives the app URL-based navigation — so tapping a
  butterfly goes to /butterfly/42, and the back button works naturally.

  basename tells React Router that the app lives at /mariposas-cuba/
  on GitHub Pages. In local dev, basename is '/' so nothing changes.
*/
const basename = import.meta.env.PROD ? '/mariposas-cuba' : '/'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
