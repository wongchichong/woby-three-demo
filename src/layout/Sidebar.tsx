/** @jsxImportSource woby */

import { $, $$, type Observable, useEffect, useRef } from 'woby'
import { categories, type DemoEntry, type CategoryEntry } from '../registry'
import { SearchBar } from './SearchBar'
import { CategoryGroup } from './CategoryGroup'

export const Sidebar = (props: {
    activeDemo: Observable<DemoEntry | null>
    searchQuery: Observable<string>
}) => {
    const { activeDemo, searchQuery } = props

    // Preserve scroll position
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const savedScrollTop = $(0)

    const filteredCategories = () => {
        const query = $$(searchQuery).toLowerCase().trim()
        if (!query) return categories

        return categories
            .map(cat => ({
                ...cat,
                demos: cat.demos.filter(d =>
                    d.name.toLowerCase().includes(query) ||
                    d.id.toLowerCase().includes(query)
                )
            }))
            .filter(cat => cat.demos.length > 0)
    }

    const handleDemoSelect = (demo: DemoEntry) => {
        // Save scroll position before changing demo
        if (scrollContainerRef.current) {
            savedScrollTop(scrollContainerRef.current.scrollTop)
        }
        activeDemo(demo)
        // Update URL hash
        window.location.hash = demo.id
    }

    // Restore scroll position after render
    useEffect(() => {
        if (scrollContainerRef.current) {
            const saved = $$(savedScrollTop)
            if (saved > 0) {
                // Use requestAnimationFrame to ensure DOM is ready
                requestAnimationFrame(() => {
                    if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollTop = saved
                    }
                })
            }
        }
    })

    return (
        <div style="width: 288px; flex-shrink: 0; display: flex; flex-direction: column; border-right: 1px solid #374151; background-color: #1f2937; height: 100%;">
            {/* Header */}
            <div style="padding: 1rem; border-bottom: 1px solid #374151;">
                <h1 style="font-size: 1.125rem; font-weight: bold; color: #f3f4f6;">@woby/three</h1>
                <p style="font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem;">Three.js Examples</p>
            </div>

            {/* Search */}
            <SearchBar value={searchQuery} />

            {/* Demo List */}
            <div ref={scrollContainerRef} style="flex: 1; overflow-y: auto; padding: 0 0.75rem; padding-top: 0.5rem; padding-bottom: 0.5rem;">
                {() => filteredCategories().map(category => (
                    <CategoryGroup
                        category={category}
                        activeDemo={$$(activeDemo)}
                        onDemoSelect={handleDemoSelect}
                    />
                ))}
            </div>

            {/* Footer */}
            <div style="padding: 0.75rem; border-top: 1px solid #374151; font-size: 0.75rem; color: #6b7280; text-align: center;">
                {() => categories.reduce((sum, cat) => sum + cat.demos.length, 0)} demos
            </div>
        </div>
    )
}
