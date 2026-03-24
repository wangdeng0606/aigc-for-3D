import * as THREE from 'three'
import { generateUniqueId } from '../utils/idGenerator.js'

export class DragSystem {
  constructor(sceneManager, raycastHelper) {
    if (!sceneManager || !raycastHelper) {
      throw new Error('SceneManager and RaycastHelper are required')
    }
    
    this.sceneManager = sceneManager
    this.raycastHelper = raycastHelper
    
    // Drag state
    this.isDragging = false
    this.currentGeometryType = null
    this.startEvent = null
    
    // Bind methods
    this.onDragMove = this.onDragMove.bind(this)
    this.onDragEnd = this.onDragEnd.bind(this)
  }

  startDrag(geometryType, event) {
    if (!geometryType) {
      throw new Error('Geometry type is required')
    }
    
    this.isDragging = true
    this.currentGeometryType = geometryType
    this.startEvent = event
    
    // Add event listeners
    document.addEventListener('mousemove', this.onDragMove)
    document.addEventListener('mouseup', this.onDragEnd)
    
    // Change cursor
    document.body.style.cursor = 'grabbing'
  }

  onDragMove(event) {
    // Optional: Add visual feedback during drag
    // For now, we just update cursor position
  }

  onDragEnd(event) {
    if (!this.isDragging) {
      return
    }
    
    // Create geometry
    const geometry = this.createGeometry(this.currentGeometryType)
    
    // Calculate position using raycast
    const sceneContainer = this.sceneManager.getRenderer().domElement.parentElement
    const position = this.raycastHelper.getIntersectionPoint(
      event.clientX,
      event.clientY,
      sceneContainer
    )
    
    // Place geometry
    this.placeGeometry(geometry, position)
    
    // Mark as not confirmed yet
    geometry.userData.positionConfirmed = false
    
    // Auto-select the object so user can adjust position
    if (window.app && window.app.selectionManager) {
      window.app.selectionManager.selectObject(geometry)
    }
    
    // Clean up
    this.cleanup()
  }

  // This method is no longer called immediately after drag
  // It will be called from PropertyPanel when user first sets the name
  showPositionConfirmDialog(geometry) {
    const dialog = document.createElement('div')
    dialog.className = 'position-confirm-dialog'
    dialog.innerHTML = `
      <div class="position-confirm-content">
        <h3>确认物体位置</h3>
        <p>物体名称: <strong>${geometry.userData.name || '未命名'}</strong></p>
        <p class="hint">确认后物体将被锁定，只能在录制时移动</p>
        <div class="confirm-buttons">
          <button class="confirm-btn confirm">确认位置</button>
          <button class="confirm-btn cancel">取消</button>
        </div>
      </div>
    `

    document.body.appendChild(dialog)

    const handleConfirm = () => {
      // Mark position as confirmed
      geometry.userData.positionConfirmed = true
      
      // Create object set with current position as initial state
      window.app.objectSetManager.createObjectSet(geometry)
      
      // Create track for this object
      const track = window.app.animationPlayer.addTrack(geometry.userData.name || '未命名物体')
      track.objectId = geometry.userData.id
      track.trackType = 'object'
      
      // Update track editor to show new track
      if (window.app.timeline) {
        window.app.timeline.updateTrackEditor()
      }
      
      // Deselect and disable transform controls
      window.app.selectionManager.deselectObject()
      
      document.body.removeChild(dialog)
    }

    const handleCancel = () => {
      // Don't create object set, user can continue editing
      document.body.removeChild(dialog)
    }

    dialog.addEventListener('click', (e) => {
      if (e.target.classList.contains('confirm')) {
        handleConfirm()
      } else if (e.target.classList.contains('cancel')) {
        handleCancel()
      }
    })
  }

  createGeometry(geometryType) {
    const geometries = {
      'box': () => new THREE.BoxGeometry(1, 1, 1),
      'sphere': () => new THREE.SphereGeometry(0.5, 32, 32),
      'cylinder': () => new THREE.CylinderGeometry(0.5, 0.5, 1, 32),
      'cone': () => new THREE.ConeGeometry(0.5, 1, 32),
      'torus': () => new THREE.TorusGeometry(0.5, 0.2, 16, 100)
    }
    
    if (!geometries[geometryType]) {
      throw new Error(`Unknown geometry type: ${geometryType}`)
    }
    
    const geometry = geometries[geometryType]()
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      metalness: 0.3,
      roughness: 0.4
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    
    // Add metadata
    mesh.userData.id = generateUniqueId()
    mesh.userData.type = geometryType
    mesh.userData.createdAt = Date.now()
    
    return mesh
  }

  placeGeometry(geometry, position) {
    if (!geometry || !position) {
      throw new Error('Geometry and position are required')
    }
    
    // Set position
    geometry.position.copy(position)
    
    // Adjust Y position based on geometry type to sit on ground
    const adjustments = {
      'box': 0.5,
      'sphere': 0.5,
      'cylinder': 0.5,
      'cone': 0.5,
      'torus': 0.2
    }
    
    const adjustment = adjustments[geometry.userData.type] || 0
    geometry.position.y += adjustment
    
    // Add to scene
    this.sceneManager.addObject(geometry)
  }

  cleanup() {
    this.isDragging = false
    this.currentGeometryType = null
    this.startEvent = null
    
    // Remove event listeners
    document.removeEventListener('mousemove', this.onDragMove)
    document.removeEventListener('mouseup', this.onDragEnd)
    
    // Restore cursor
    document.body.style.cursor = 'default'
  }

  destroy() {
    this.cleanup()
  }
}
