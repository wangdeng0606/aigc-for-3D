import { CameraView } from './CameraView.js'

export class CameraViewManager {
  constructor() {
    this.views = [] // Array of CameraView
    this.activeViewIndex = -1 // -1 means no view active (black screen)
  }

  // Create a new camera view
  createView(name) {
    const viewNumber = this.views.length + 1
    const view = new CameraView(name || `视角${viewNumber}`)
    this.views.push(view)
    return view
  }

  // Get view by index
  getView(index) {
    return this.views[index]
  }

  // Get view by ID
  getViewById(id) {
    return this.views.find(v => v.id === id)
  }

  // Get all views
  getAllViews() {
    return this.views
  }

  // Set active view
  setActiveView(index) {
    if (index >= 0 && index < this.views.length) {
      this.activeViewIndex = index
      return this.views[index]
    }
    return null
  }

  // Get active view
  getActiveView() {
    if (this.activeViewIndex >= 0 && this.activeViewIndex < this.views.length) {
      return this.views[this.activeViewIndex]
    }
    return null
  }

  // Get active view index
  getActiveViewIndex() {
    return this.activeViewIndex
  }

  // Remove view
  removeView(index) {
    if (index >= 0 && index < this.views.length) {
      this.views.splice(index, 1)
      
      // Adjust active view index
      if (this.activeViewIndex >= this.views.length) {
        this.activeViewIndex = this.views.length - 1
      }
    }
  }

  // Check if any view exists
  hasViews() {
    return this.views.length > 0
  }

  // Check if active view is confirmed
  isActiveViewConfirmed() {
    const activeView = this.getActiveView()
    return activeView ? activeView.isConfirmed() : false
  }
}
