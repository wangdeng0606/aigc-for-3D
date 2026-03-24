import { UIManager } from './ui/UIManager.js'
import { ComponentPanel } from './ui/ComponentPanel.js'
import { PropertyPanel } from './ui/PropertyPanel.js'
import { TimelinePro } from './ui/TimelinePro.js'
import { CameraViewSwitcher } from './ui/CameraViewSwitcher.js'
import { SceneManager } from './scene/SceneManager.js'
import { CameraManager } from './scene/CameraManager.js'
import { RenderLoop } from './scene/RenderLoop.js'
import { RaycastHelper } from './interaction/RaycastHelper.js'
import { DragSystem } from './interaction/DragSystem.js'
import { SelectionManager } from './interaction/SelectionManager.js'
import { AnimationRecorder } from './animation/AnimationRecorder.js'
import { AnimationPlayer } from './animation/AnimationPlayer.js'
import { ObjectSetManager } from './animation/ObjectSetManager.js'
import { CameraViewManager } from './camera/CameraViewManager.js'

export class Application {
  constructor(containerElement) {
    if (!containerElement) {
      throw new Error('Container element is required')
    }
    
    this.containerElement = containerElement
    
    // Modules
    this.uiManager = null
    this.componentPanel = null
    this.propertyPanel = null
    this.timeline = null
    this.cameraViewSwitcher = null
    this.sceneManager = null
    this.cameraManager = null
    this.renderLoop = null
    this.raycastHelper = null
    this.dragSystem = null
    this.selectionManager = null
    this.animationRecorder = null
    this.animationPlayer = null
    this.objectSetManager = null
    this.cameraViewManager = null
    
    // Resize handling
    this.resizeTimeout = null
    this.handleResizeBound = this.handleResize.bind(this)
  }

  init() {
    try {
      // Initialize UI
      this.uiManager = new UIManager(this.containerElement)
      this.uiManager.createLayout()
      
      // Initialize Scene
      this.sceneManager = new SceneManager(this.uiManager.getSceneContainer())
      this.sceneManager.init()
      
      // Initialize Camera
      this.cameraManager = new CameraManager(
        this.sceneManager.getCamera(),
        this.sceneManager.getRenderer(),
        this.sceneManager.getScene()
      )
      this.cameraManager.init()
      
      // Disable camera controls initially (until first view is created)
      this.cameraManager.disableControls()
      
      // Initialize Render Loop
      this.renderLoop = new RenderLoop(this.sceneManager, this.cameraManager)
      this.renderLoop.start()
      
      // Initialize Raycast Helper
      this.raycastHelper = new RaycastHelper(
        this.sceneManager.getCamera(),
        this.sceneManager.getGroundPlane()
      )
      
      // Initialize Drag System
      this.dragSystem = new DragSystem(this.sceneManager, this.raycastHelper)
      
      // Initialize Property Panel
      this.propertyPanel = new PropertyPanel(this.uiManager.getSceneContainer())
      this.propertyPanel.init()
      
      // Initialize Selection Manager
      this.selectionManager = new SelectionManager(
        this.sceneManager,
        this.cameraManager,
        (selectedObject) => {
          // Show/hide property panel based on selection
          if (selectedObject) {
            this.propertyPanel.show(selectedObject)
          } else {
            this.propertyPanel.hide()
          }
        }
      )
      this.selectionManager.init()
      
      // Initialize Component Panel
      this.componentPanel = new ComponentPanel(
        this.uiManager.getPanelContainer(),
        (geometryType, event) => {
          this.dragSystem.startDrag(geometryType, event)
        }
      )
      this.componentPanel.render()
      
      // Initialize Animation System
      this.objectSetManager = new ObjectSetManager()
      this.cameraViewManager = new CameraViewManager()
      this.animationRecorder = new AnimationRecorder()
      this.animationPlayer = new AnimationPlayer(this.sceneManager)
      
      // Initialize Camera View Switcher
      this.cameraViewSwitcher = new CameraViewSwitcher(
        this.uiManager.getSceneContainer(),
        this.cameraViewManager,
        (view, index) => {
          console.log('Switched to view:', view.name)
        },
        (view, index) => {
          console.log('Edited view:', view.name)
        }
      )
      this.cameraViewSwitcher.init()
      
      // Initialize Timeline
      this.timeline = new TimelinePro(
        this.containerElement,
        this.animationPlayer,
        this.animationRecorder
      )
      this.timeline.init()
      
      // Add resize listener
      window.addEventListener('resize', this.handleResizeBound)
      
      console.log('Application initialized successfully')
    } catch (error) {
      console.error('Failed to initialize application:', error)
      throw error
    }
  }

  handleResize() {
    // Debounce resize events
    clearTimeout(this.resizeTimeout)
    this.resizeTimeout = setTimeout(() => {
      const sceneContainer = this.uiManager.getSceneContainer()
      const width = sceneContainer.clientWidth
      const height = sceneContainer.clientHeight
      
      if (width > 0 && height > 0) {
        // Update scene manager
        this.sceneManager.resize(width, height)
        
        // Update camera aspect
        this.cameraManager.updateAspect(width / height)
      }
    }, 100)
  }

  destroy() {
    // Stop render loop
    if (this.renderLoop) {
      this.renderLoop.stop()
    }
    
    // Clean up timeline
    if (this.timeline) {
      this.timeline.destroy()
    }
    
    // Clean up animation player
    if (this.animationPlayer) {
      this.animationPlayer.pause()
    }
    
    // Clean up selection manager
    if (this.selectionManager) {
      this.selectionManager.destroy()
    }
    
    // Clean up property panel
    if (this.propertyPanel) {
      this.propertyPanel.destroy()
    }
    
    // Clean up drag system
    if (this.dragSystem) {
      this.dragSystem.destroy()
    }
    
    // Clean up camera manager
    if (this.cameraManager) {
      this.cameraManager.destroy()
    }
    
    // Clean up scene manager
    if (this.sceneManager) {
      this.sceneManager.destroy()
    }
    
    // Clean up UI
    if (this.uiManager) {
      this.uiManager.destroy()
    }
    
    // Remove resize listener
    window.removeEventListener('resize', this.handleResizeBound)
    
    // Clear timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout)
    }
  }
}
