export class UIManager {
  constructor(containerElement) {
    if (!containerElement) {
      throw new Error('Container element is required')
    }
    
    this.containerElement = containerElement
    this.appContainer = null
    this.panelContainer = null
    this.sceneContainer = null
  }

  createLayout() {
    // Create main app container
    this.appContainer = document.createElement('div')
    this.appContainer.className = 'app-container'
    
    // Create component panel container (left side, 20%)
    this.panelContainer = document.createElement('div')
    this.panelContainer.className = 'component-panel'
    
    // Create scene container (right side, 80%)
    this.sceneContainer = document.createElement('div')
    this.sceneContainer.className = 'scene-container'
    
    // Append to app container
    this.appContainer.appendChild(this.panelContainer)
    this.appContainer.appendChild(this.sceneContainer)
    
    // Append to root container
    this.containerElement.appendChild(this.appContainer)
  }

  getSceneContainer() {
    return this.sceneContainer
  }

  getPanelContainer() {
    return this.panelContainer
  }

  destroy() {
    if (this.appContainer && this.appContainer.parentNode) {
      this.appContainer.parentNode.removeChild(this.appContainer)
    }
  }
}
