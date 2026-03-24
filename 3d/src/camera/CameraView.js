import * as THREE from 'three'
import { generateUniqueId } from '../utils/idGenerator.js'

// Represents a camera view/shot with specific settings
export class CameraView {
  constructor(name = '视角1') {
    this.id = generateUniqueId()
    this.name = name
    this.confirmed = false
    
    // Camera settings
    this.settings = {
      type: 'perspective', // 'perspective' or 'orthographic'
      focalLength: 50, // mm (24, 35, 50, 85, 135, etc.)
      fov: 50, // Field of view in degrees
      aperture: 2.8, // f-stop (1.4, 2.8, 5.6, 11, 16, etc.)
      near: 0.1,
      far: 1000
    }
    
    // Camera transform (initial position)
    this.transform = {
      position: new THREE.Vector3(0, 5, 10),
      rotation: new THREE.Euler(0, 0, 0),
      target: new THREE.Vector3(0, 0, 0) // Look-at target
    }
    
    this.createdAt = Date.now()
  }

  // Apply this view to a Three.js camera
  applyToCamera(camera) {
    camera.position.copy(this.transform.position)
    camera.rotation.copy(this.transform.rotation)
    camera.lookAt(this.transform.target)
    
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = this.settings.fov
      camera.near = this.settings.near
      camera.far = this.settings.far
      camera.updateProjectionMatrix()
    }
  }

  // Save current camera state to this view
  saveFromCamera(camera, controls) {
    this.transform.position.copy(camera.position)
    this.transform.rotation.copy(camera.rotation)
    
    if (controls && controls.target) {
      this.transform.target.copy(controls.target)
    }
    
    if (camera instanceof THREE.PerspectiveCamera) {
      this.settings.fov = camera.fov
      this.settings.near = camera.near
      this.settings.far = camera.far
    }
  }

  // Calculate FOV from focal length (for 35mm full-frame sensor)
  static focalLengthToFOV(focalLength) {
    const sensorHeight = 24 // mm (35mm full-frame)
    return 2 * Math.atan(sensorHeight / (2 * focalLength)) * (180 / Math.PI)
  }

  // Update FOV based on focal length
  updateFOVFromFocalLength() {
    this.settings.fov = CameraView.focalLengthToFOV(this.settings.focalLength)
  }

  confirm() {
    this.confirmed = true
  }

  isConfirmed() {
    return this.confirmed
  }
}
