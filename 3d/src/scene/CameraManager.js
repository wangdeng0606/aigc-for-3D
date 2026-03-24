import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export class CameraManager {
  constructor(camera, renderer, scene) {
    if (!camera || !renderer || !scene) {
      throw new Error('Camera, renderer, and scene are required')
    }
    
    this.camera = camera
    this.renderer = renderer
    this.scene = scene
    this.controls = null
  }

  init() {
    // Create OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    
    // Enable damping for smooth camera movements
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    
    // Set camera constraints
    // Prevent camera from going below the ground plane
    this.controls.minPolarAngle = 0
    this.controls.maxPolarAngle = Math.PI / 2
    
    // Set reasonable zoom limits
    this.controls.minDistance = 2
    this.controls.maxDistance = 50
  }

  update() {
    if (this.controls) {
      this.controls.update()
    }
  }

  updateAspect(aspect) {
    if (aspect <= 0) {
      throw new Error('Invalid aspect ratio')
    }
    
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
  }

  getControls() {
    return this.controls
  }

  enableControls() {
    if (this.controls) {
      this.controls.enabled = true
    }
  }

  disableControls() {
    if (this.controls) {
      this.controls.enabled = false
    }
  }

  isControlsEnabled() {
    return this.controls ? this.controls.enabled : false
  }

  destroy() {
    if (this.controls) {
      this.controls.dispose()
    }
  }
}
