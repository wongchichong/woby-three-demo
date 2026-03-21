# 🧪 Three.js Custom Element Test Instructions

## **Objective**
Verify that the new Three.js-specific `customElement()` implementation correctly creates BoxGeometry with proper ordering, fixing the `[null,null]` constructor parameter issue.

---

## **Prerequisites**

### **Modified Files:**
1. ✅ `@woby/three/code/lib/three/registerCustomElement.tsx` - New Three.js custom element registry
2. ✅ `@woby/three/code/src/geometries/BoxGeometry.ts` - Uses new customElement import  
3. ⚠️ `@woby/three/code/src/objects/Mesh.ts` - **MUST apply changes** (see Step 1)

### **Environment Setup:**
```bash
cd d:\Developments\tslib\@woby\three-demo
pnpm dev
```
- Open browser to `http://localhost:5173` (or configured port)
- Ensure DevTools MCP is enabled
- Clear browser cache before testing

---

## **Test Steps**

### **Step 1: Apply Mesh.ts Changes**

Edit file: `d:\Developments\tslib\@woby\three\code\src\objects\Mesh.ts`

**Line 13 - REPLACE:**
```typescript
import { customElement, defaults, $ } from 'woby'
```

**WITH:**
```typescript
import { customElement } from '../../lib/three/registerCustomElement'
import { defaults, $ } from 'woby'
```

---

### **Step 2: Clear Cache & Reload**

1. Open browser DevTools → Network tab
2. ✅ Check "Disable cache"
3. Hard reload: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

---

### **Step 3: Test BOTH Versions**

#### **Test A: camelCase Version (Control Group)**

1. Navigate to Box3 demo page
2. Click **"3 Boxes + Click"** button (camelCase version)
3. **Capture console logs** - Expected output:

```
[getInstance] Creating instance for: three-box-geometry -> BoxGeometry consParams: [array Array] isArray: true JSON: [1,1,1,1,1,1]
[getInstance] Created instance: [object _BoxGeometry] type: BoxGeometry

[getInstance] Creating instance for: three-mesh -> Mesh consParams: [function Function]
[getInstance] Created instance: [object Mesh] geometry: [object _BoxGeometry] geometry.type: BoxGeometry ✓
```

**✅ Success Criteria:**
- BoxGeometry created FIRST with params `[1,1,1,1,1,1]`
- Mesh created AFTER with function-based lazy evaluation
- Final mesh has `geometry.type: "BoxGeometry"`

---

#### **Test B: Kebab-case Version (Test Group)**

1. Navigate to Box3 demo page
2. Click **"3 Boxes + Click (Custom Element)"** button (kebab-case version)
3. **Capture console logs** - Expected NEW output:

```
[customElement] Registering Three.js custom element: three-box-geometry
[customElement] Registering Three.js custom element: three-mesh

[ThreeJSCustomElement.render] Rendering: three-box-geometry props: {...}
[ThreeJSCustomElement.render] Final props: {width: 1, height: 1, depth: 1, ...}

[ThreeJSCustomElement.render] Rendering: three-mesh props: {...}

[getInstance] Creating instance for: three-box-geometry -> BoxGeometry 
consParams: [array Array] JSON: [1,1,1,1,1,1]
[getInstance] Created instance: [object _BoxGeometry] type: BoxGeometry

[getInstance] Creating instance for: three-mesh -> Mesh 
consParams: [array Array] JSON: [BoxGeometry, null/material]
[getInstance] Created instance: [object Mesh] geometry: [object _BoxGeometry] geometry.type: BoxGeometry ✓
```

**✅ Success Criteria:**
- Shows `[customElement]` registration logs
- Shows `[ThreeJSCustomElement.render]` render logs
- BoxGeometry created BEFORE Mesh
- Mesh constructor params show geometry object (NOT `[null,null]`)
- All 3 meshes have `geometry.type: "BoxGeometry"`

---

### **Step 4: Verify Fix**

#### **Expected Results (PASS):**
- ✅ **Kebab-case version** now shows BoxGeometry created BEFORE Mesh
- ✅ **Mesh constructor params** show geometry object (not `[null,null]`)
- ✅ **All 3 meshes** have `geometry.type: "BoxGeometry"` (not BufferGeometry)
- ✅ Console shows `[ThreeJSCustomElement.render]` logs confirming lazy evaluation
- ✅ Both camelCase and kebab-case produce similar geometry results

#### **Failure Indicators (FAIL):**
- ❌ Still seeing `[getInstance] JSON: [null,null]` for Mesh
- ❌ BoxGeometry created AFTER Mesh (wrong order)
- ❌ No `[ThreeJSCustomElement.render]` logs at all
- ❌ Meshes still have `geometry.type: "BufferGeometry"`
- ❌ Error: `customElements.define` called on non-HTMLElement

---

## **Debug Commands**

If test fails, run these in browser console:

```javascript
// Check if custom elements are registered
console.log('Registry size:', window.threeCustomElementsRegistry?.size)
console.log('Registered elements:', Array.from(window.threeCustomElementsRegistry?.keys() || []))

// Check specific element
console.log('three-mesh registered:', window.threeCustomElementsRegistry?.has('three-mesh'))
console.log('three-box-geometry registered:', window.threeCustomElementsRegistry?.has('three-box-geometry'))

// Force log dump (if needed)
window.addEventListener('message', (e) => {
  if (e.data.type === 'custom-element-log') {
    console.log('Custom Element Log:', e.data.payload)
  }
})
```

---

## **Comparison Matrix**

| Aspect | Old Implementation | New Implementation |
|--------|-------------------|-------------------|
| **Base Class** | Extends HTMLElement | Pure function component |
| **Instantiation** | Browser calls `new CustomElementClass()` | createElement calls function |
| **Shadow DOM** | Yes (creates shadowRoot) | No (returns Three.js object) |
| **Children Processing** | Via shadow DOM slot | Via @woby/three reconciler |
| **Execution Timing** | Immediate in constructor | Lazy when parent needs it |
| **Console Logs** | None (browser native) | `[ThreeJSCustomElement.*]` prefix |
| **Constructor Params** | `[null,null]` ❌ | `[BoxGeometry, material]` ✅ |
| **Geometry Type** | BufferGeometry ❌ | BoxGeometry ✅ |

---

## **Test Report Template**

Please provide the following information:

### **1. Environment Info**
- Browser: Chrome / Firefox / Safari / Edge
- Browser Version: 
- OS: Windows / macOS / Linux
- Node Version: 
- Build Tool: Vite / Webpack / Other

### **2. Console Logs**

**camelCase Version:**
```
[Paste console logs here]
```

**Kebab-case Version:**
```
[Paste console logs here]
```

### **3. Verification Results**

- [ ] BoxGeometry created before Mesh
- [ ] Mesh constructor params NOT `[null,null]`
- [ ] All meshes have `geometry.type: "BoxGeometry"`
- [ ] `[ThreeJSCustomElement.render]` logs appear
- [ ] No TypeScript compilation errors
- [ ] No runtime errors in console

### **4. Screenshots** (Optional but helpful)
- [ ] Console log screenshot (camelCase)
- [ ] Console log screenshot (kebab-case)
- [ ] Visual result (3 boxes rendered)
- [ ] DevTools Elements panel showing scene graph

### **5. Additional Notes**
[Any unexpected behavior, errors, or observations]

---

## **Troubleshooting**

### **Issue: No `[ThreeJSCustomElement]` logs**
**Solution:** Check if Mesh.ts and BoxGeometry.ts imports are updated correctly

### **Issue: Still getting `[null,null]`**
**Solution:** 
1. Hard refresh browser (`Ctrl+Shift+R`)
2. Check Vite build output for errors
3. Verify `registerCustomElement.tsx` is being imported

### **Issue: TypeScript compilation errors**
**Solution:** Type errors are expected for `defaults.boxGeometry` - this is a type augmentation issue, not a runtime issue. Code will work despite type warnings.

### **Issue: Module not found 'soby'**
**Solution:** This is a build-time resolution issue. Run `pnpm install` and ensure dependencies are linked properly.

---

## **Next Steps After Testing**

### **If Tests PASS:**
1. ✅ Document the new pattern in README
2. ✅ Update other Three.js components to use new customElement
3. ✅ Remove old Woby customElement imports from all components
4. ✅ Add unit tests for registerCustomElement module

### **If Tests FAIL:**
1. ❌ Collect full console output
2. ❌ Capture network tab HAR file
3. ❌ Create minimal reproduction case
4. ❌ Report findings with exact error messages

---

## **Key Architecture Differences**

### **Woby's customElement (UI Components)**
```typescript
class CustomElement extends HTMLElement {
  constructor(props) {
    super()
    this.attachShadow({ mode: 'open' })
    // Creates DOM elements immediately
  }
}
customElements.define('my-element', CustomElement)
```

### **Three.js customElement (3D Objects)**
```typescript
const ThreeJSCustomElement = (props) => {
  // Returns Three.js object lazily
  return new THREE.Mesh(geometry, material)
}
registerThreeCustomElement({
  tagName: 'three-mesh',
  create: ThreeJSCustomElement
})
```

---

**Ready to test!** Report your findings with console logs and screenshots. 🔍
