import * as THREE from 'three'

export class RaycastHelper {
  constructor(camera, groundPlane) {
    if (!camera || !groundPlane) {
      throw new Error('Camera and ground plane are required')
    }
    
    this.camera = camera
    this.groundPlane = groundPlane
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
  }

  getIntersectionPoint(mouseX, mouseY, containerElement) {
    if (!containerElement) {
      throw new Error('Container element is required')
    }
    
    // Convert screen coordinates to NDC
    this.screenToNDC(mouseX, mouseY, containerElement)
    
    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    // Check intersection with ground plane
    const intersects = this.raycaster.intersectObject(this.groundPlane)
    
    if (intersects.length > 0) {
      return intersects[0].point.clone()
    }
    
    // Return default position if no intersection
    return new THREE.Vector3(0, 0, 0)
  }

  screenToNDC(mouseX, mouseY, containerElement) {
    const rect = containerElement.getBoundingClientRect()
    
    // Calculate relative position within container
    const x = mouseX - rect.left
    const y = mouseY - rect.top
    
    // Convert to NDC (-1 to 1)
    this.mouse.x = (x / rect.width) * 2 - 1
    this.mouse.y = -(y / rect.height) * 2 + 1
  }
}
