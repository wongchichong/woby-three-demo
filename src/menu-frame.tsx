/** @jsxImportSource woby */

import { $, $$, render, useEffect } from 'woby'
import './input.css'
import { Sidebar } from './layout/Sidebar'
import { allDemos } from './registry'
import type { DemoEntry } from './registry'

export const MenuFrame = () => {
    const activeDemo = $<DemoEntry | null>(null)
    const searchQuery = $('')

    // Send demo selection to parent
    useEffect(() => {
        const demo = $$(activeDemo)
        if (demo) {
            window.parent.postMessage({
                type: 'LOAD_DEMO',
                demoId: demo.id
            }, '*')
        }
    })

    return (
        <div class="h-screen w-screen overflow-hidden bg-gray-900">
            <Sidebar
                activeDemo={activeDemo}
                searchQuery={searchQuery}
            />
        </div>
    )
}

render(MenuFrame, document.body)

export default MenuFrame
