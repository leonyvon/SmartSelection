/**
 * 主窗口入口
 */

import { Provider } from 'react-redux'
import { store } from './store'
import App from './App'
import { createRoot } from 'react-dom/client'
import './styles.css'

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <Provider store={store}>
      <App />
    </Provider>
  )
}
