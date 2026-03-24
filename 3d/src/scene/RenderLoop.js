export class RenderLoop {
  constructor(sceneManager, cameraManager) {
    if (!sceneManager || !cameraManager) {
      throw new Error('SceneManager and CameraManager are required')
    }
    
    this.sceneManager = sceneManager
    this.cameraManager = cameraManager
    this.animationId = null
    this.isRunning = false
  }

  start() {
    if (this.isRunning) {
      return
    }
    
    this.isRunning = true
    this.animate()
  }

  stop() {
    if (!this.isRunning) {
      return
    }
    
    this.isRunning = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  animate() {
    if (!this.isRunning) {
      return
    }
    
    this.animationId = requestAnimationFrame(() => this.animate())
    
    // Update camera controls
    this.cameraManager.update()
    
    // Render scene
    this.sceneManager.render()
  }
}
