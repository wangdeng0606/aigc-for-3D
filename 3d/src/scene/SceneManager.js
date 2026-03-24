import * as THREE from 'three'

export class SceneManager {
  constructor(containerElement) {
    if (!containerElement) {
      throw new Error('Container element is required')
    }
    
    this.containerElement = containerElement
    this.scene = null
    this.renderer = null
    this.camera = null
    this.groundPlane = null
  }

  init() {
    // Check WebGL support
    if (!this.isWebGLAvailable()) {
      throw new Error('WebGL is not available in this browser')
    }

    // Create scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xffffff)

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.containerElement.clientWidth / this.containerElement.clientHeight,
      0.1,
      1000
    )
    this.camera.position.set(5, 5, 5)
    this.camera.lookAt(0, 0, 0)

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(
      this.containerElement.clientWidth,
      this.containerElement.clientHeight
    )
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.containerElement.appendChild(this.renderer.domElement)

    // Add lights
    this.addLights()

    // Add grid helper
    this.addGridHelper()

    // Create ground plane for raycasting
    this.createGroundPlane()
  }

  isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas')
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      )
    } catch (e) {
      return false
    }
  }

  addLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 7.5)
    this.scene.add(directionalLight)
  }

  addGridHelper() {
    const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc)
    this.scene.add(gridHelper)
  }

  createGroundPlane() {
    // Create an invisible plane for raycasting
    const geometry = new THREE.PlaneGeometry(100, 100)
    const material = new THREE.MeshBasicMaterial({
      visible: false
    })
    this.groundPlane = new THREE.Mesh(geometry, material)
    this.groundPlane.rotation.x = -Math.PI / 2
    this.groundPlane.position.y = 0
    this.scene.add(this.groundPlane)
  }

  addObject(mesh) {
    if (!mesh) {
      throw new Error('Mesh is required')
    }
    this.scene.add(mesh)
  }

  removeObject(mesh) {
    if (!mesh) {
      throw new Error('Mesh is required')
    }
    this.scene.remove(mesh)
  }

  getScene() {
    return this.scene
  }

  getRenderer() {
    return this.renderer
  }

  getCamera() {
    return this.camera
  }

  getGroundPlane() {
    return this.groundPlane
  }

  resize(width, height) {
    if (width <= 0 || height <= 0) {
      throw new Error('Invalid dimensions')
    }

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  destroy() {
    if (this.renderer) {
      this.renderer.dispose()
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
      }
    }
  }
}
