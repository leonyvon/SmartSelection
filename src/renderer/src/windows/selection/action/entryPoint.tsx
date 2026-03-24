/**
 * 动作窗口入口
 */

import { Provider } from 'react-redux'
import { store } from '@renderer/store'
import SelectionActionApp from './SelectionActionApp'
import { createRoot } from 'react-dom/client'
import '../../../styles.css'

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <Provider store={store}>
      <SelectionActionApp />
    </Provider>
  )
}
