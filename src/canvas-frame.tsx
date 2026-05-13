/** @jsxImportSource woby */

import { $, $$, render, useEffect } from 'woby'
import './input.css'

export const CanvasFrame = () => {
    const activeDemo = $<string | null>(null)

    // Listen for messages from parent frame
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'LOAD_DEMO') {
                activeDemo(event.data.demoId)
            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    })

    return (
        <div class="h-screen w-screen overflow-hidden bg-black">
            <div class="flex items-center justify-center h-full text-gray-500">
                <div class="text-center">
                    <p class="text-lg font-medium">Canvas Frame</p>
                    <p class="text-sm mt-2">Demo: {activeDemo() || 'None selected'}</p>
                </div>
            </div>
        </div>
    )
}

render(CanvasFrame, document.body)

export default CanvasFrame
