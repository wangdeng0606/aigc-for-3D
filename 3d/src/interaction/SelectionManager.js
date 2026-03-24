import * as THREE from 'three'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'

export class SelectionManager {
  constructor(sceneManager, cameraManager, onSelectionChange) {
    if (!sceneManager || !cameraManager) {
      throw new Error('SceneManager and CameraManager are required')
    }
    
    this.sceneManager = sceneManager
    this.cameraManager = cameraManager
    this.onSelectionChange = onSelectionChange || (() => {})
    
    this.selectedObject = null
    this.transformControls = null
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    
    // Bind methods
    this.handleClick = this.handleClick.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
  }

  init() {
    // Create TransformControls
    this.transformControls = new TransformControls(
      this.sceneManager.getCamera(),
      this.sceneManager.getRenderer().domElement
    )
    
    // Set default mode to translate
    this.transformControls.setMode('translate')
    
    // Add to scene
    this.sceneManager.getScene().add(this.transformControls)
    
    // When transform controls are being used, disable orbit controls
    this.transformControls.addEventListener('dragging-changed', (event) => {
      const orbitControls = this.cameraManager.getControls()
      orbitControls.enabled = !event.value
    })
    
    // Add event listeners
    const canvas = this.sceneManager.getRenderer().domElement
    canvas.addEventListener('click', this.handleClick)
    window.addEventListener('keydown', this.handleKeyDown)
  }

  handleClick(event) {
    // Don't process click if it's on the property panel or timeline
    const target = event.target
    if (target.closest('.property-panel') || target.closest('.timeline')) {
      return
    }

    // Calculate mouse position in normalized device coordinates
    const canvas = this.sceneManager.getRenderer().domElement
    const rect = canvas.getBoundingClientRect()
    
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.sceneManager.getCamera())
    
    // Get all scene objects (exclude ground plane, lights, grid, transform controls)
    const scene = this.sceneManager.getScene()
    const selectableObjects = scene.children.filter(obj => {
      return obj.type === 'Mesh' && 
             obj.userData.id && 
             obj !== this.sceneManager.getGroundPlane()
    })
    
    // Check for intersections
    const intersects = this.raycaster.intersectObjects(selectableObjects, false)
    
    if (intersects.length > 0) {
      // Select the first intersected object
      this.selectObject(intersects[0].object)
    } else {
      // Deselect if clicking on empty space (but not on UI elements)
      this.deselectObject()
    }
  }

  handleKeyDown(event) {
    // Don't process keyboard shortcuts if user is typing in an input field
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return
    }

    if (!this.selectedObject) {
      return
    }
    
    // Switch transform modes with keyboard
    switch (event.key.toLowerCase()) {
      case 'g':
        // G for translate (grab)
        this.transformControls.setMode('translate')
        break
      case 'r':
        // R for rotate
        this.transformControls.setMode('rotate')
        break
      case 's':
        // S for scale
        this.transformControls.setMode('scale')
        break
      case 'delete':
      case 'backspace':
        // Delete selected object
        event.preventDefault() // Prevent browser back navigation
        this.deleteSelectedObject()
        break
      case 'escape':
        // Deselect
        this.deselectObject()
        break
    }
  }

  selectObject(object) {
    if (this.selectedObject === object) {
      return
    }
    
    // Check if object position is confirmed and locked
    const positionConfirmed = object.userData.positionConfirmed === true
    
    if (positionConfirmed && window.app && window.app.objectSetManager) {
      // Position is confirmed, check if it's locked
      const isLocked = window.app.objectSetManager.isObjectLocked(object.userData.id)
      const isRecording = window.app.animationRecorder && window.app.animationRecorder.isCurrentlyRecording()
      
      if (isLocked && !isRecording) {
        // Object is locked, cannot select for editing
        console.log('物体已锁定，只能在录制时移动')
        return
      }
    }
    // If position is not confirmed, allow free selection and movement
    
    // Deselect previous object
    if (this.selectedObject) {
      this.deselectObject()
    }
    
    // Select new object
    this.selectedObject = object
    this.transformControls.attach(object)
    
    // Notify selection change
    this.onSelectionChange(object)
  }

  deselectObject() {
    if (!this.selectedObject) {
      return
    }
    
    this.transformControls.detach()
    this.selectedObject = null
    
    // Notify selection change
    this.onSelectionChange(null)
  }

  deleteSelectedObject() {
    if (!this.selectedObject) {
      return
    }
    
    const objectToDelete = this.selectedObject
    this.deselectObject()
    
    // Remove from scene
    this.sceneManager.removeObject(objectToDelete)
    
    // Dispose geometry and material
    if (objectToDelete.geometry) {
      objectToDelete.geometry.dispose()
    }
    if (objectToDelete.material) {
      objectToDelete.material.dispose()
    }
  }

  getSelectedObject() {
    return this.selectedObject
  }

  destroy() {
    // Remove event listeners
    const canvas = this.sceneManager.getRenderer().domElement
    canvas.removeEventListener('click', this.handleClick)
    window.removeEventListener('keydown', this.handleKeyDown)
    
    // Remove transform controls from scene
    if (this.transformControls) {
      this.sceneManager.getScene().remove(this.transformControls)
      this.transformControls.dispose()
    }
  }
}
