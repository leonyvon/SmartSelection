/**
 * 工具栏窗口入口
 */

import { Provider } from 'react-redux'
import { store } from '@renderer/store'
import SelectionToolbar from './SelectionToolbar'
import { createRoot } from 'react-dom/client'
import './styles.css'

// 渲染
const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <Provider store={store}>
      <SelectionToolbar />
    </Provider>
  )
}
