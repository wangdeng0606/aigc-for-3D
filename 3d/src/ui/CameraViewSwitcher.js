export class CameraViewSwitcher {
  constructor(containerElement, cameraViewManager, onViewSwitch, onViewEdit) {
    if (!containerElement || !cameraViewManager) {
      throw new Error('Container and CameraViewManager are required')
    }

    this.containerElement = containerElement
    this.cameraViewManager = cameraViewManager
    this.onViewSwitch = onViewSwitch || (() => {})
    this.onViewEdit = onViewEdit || (() => {})
    
    this.switcher = null
  }

  init() {
    // Create switcher container
    this.switcher = document.createElement('div')
    this.switcher.className = 'camera-view-switcher'

    // Add new view button
    const addBtn = document.createElement('button')
    addBtn.className = 'view-btn add-view-btn'
    addBtn.innerHTML = '+ 新增视角'
    addBtn.addEventListener('click', () => this.handleAddView())

    this.switcher.appendChild(addBtn)

    // Append to container
    this.containerElement.appendChild(this.switcher)

    // Update to show existing views
    this.update()
  }

  handleAddView() {
    // Create new view
    const view = this.cameraViewManager.createView()
    
    // Show camera setup dialog
    this.showCameraSetupDialog(view)
  }

  showCameraSetupDialog(view) {
    const dialog = document.createElement('div')
    dialog.className = 'camera-setup-dialog'
    dialog.innerHTML = `
      <div class="camera-setup-content">
        <h3>设置相机视角</h3>
        
        <div class="setup-field">
          <label>视角名称</label>
          <input type="text" class="setup-input" id="view-name" value="${view.name}" />
        </div>
        
        <div class="setup-field">
          <label>相机类型</label>
          <select class="setup-select" id="camera-type">
            <option value="perspective" selected>透视相机 (Perspective)</option>
            <option value="orthographic">正交相机 (Orthographic)</option>
          </select>
        </div>
        
        <div class="setup-field">
          <label>焦距 (mm)</label>
          <select class="setup-select" id="focal-length">
            <option value="24">24mm (广角)</option>
            <option value="35">35mm (标准广角)</option>
            <option value="50" selected>50mm (标准)</option>
            <option value="85">85mm (人像)</option>
            <option value="135">135mm (长焦)</option>
            <option value="200">200mm (远摄)</option>
          </select>
        </div>
        
        <div class="setup-field">
          <label>光圈 (f-stop)</label>
          <select class="setup-select" id="aperture">
            <option value="1.4">f/1.4 (大光圈)</option>
            <option value="2.8" selected>f/2.8</option>
            <option value="5.6">f/5.6</option>
            <option value="11">f/11</option>
            <option value="16">f/16 (小光圈)</option>
          </select>
        </div>
        
        <div class="setup-hint">
          <p>💡 提示: 调整好相机参数后，使用鼠标调整视角位置，然后点击确认锁定</p>
        </div>
        
        <div class="setup-buttons">
          <button class="setup-btn confirm">确认并锁定视角</button>
          <button class="setup-btn cancel">取消</button>
        </div>
      </div>
    `

    document.body.appendChild(dialog)

    // Temporarily enable orbit controls for setup
    if (window.app && window.app.cameraManager) {
      window.app.cameraManager.enableControls()
    }

    // Apply settings in real-time
    const applySettings = () => {
      const name = document.getElementById('view-name').value
      const type = document.getElementById('camera-type').value
      const focalLength = parseFloat(document.getElementById('focal-length').value)
      const aperture = parseFloat(document.getElementById('aperture').value)

      view.name = name
      view.settings.type = type
      view.settings.focalLength = focalLength
      view.settings.aperture = aperture
      view.updateFOVFromFocalLength()

      // Apply to camera
      if (window.app && window.app.sceneManager) {
        const camera = window.app.sceneManager.getCamera()
        camera.fov = view.settings.fov
        camera.updateProjectionMatrix()
      }
    }

    // Listen to changes
    dialog.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('change', applySettings)
      el.addEventListener('input', applySettings)
    })

    // Apply initial settings
    applySettings()

    const handleConfirm = () => {
      // Save current camera state
      if (window.app && window.app.sceneManager && window.app.cameraManager) {
        const camera = window.app.sceneManager.getCamera()
        const controls = window.app.cameraManager.getControls()
        view.saveFromCamera(camera, controls)
      }

      // Confirm view
      view.confirm()

      // Set as active view
      const viewIndex = this.cameraViewManager.getAllViews().indexOf(view)
      this.cameraViewManager.setActiveView(viewIndex)

      // Lock camera controls after confirming
      if (window.app && window.app.cameraManager) {
        window.app.cameraManager.disableControls()
      }

      // Update UI
      this.update()

      // Notify
      this.onViewSwitch(view, viewIndex)

      document.body.removeChild(dialog)
    }

    const handleCancel = () => {
      // Remove the view if not confirmed
      const viewIndex = this.cameraViewManager.getAllViews().indexOf(view)
      this.cameraViewManager.removeView(viewIndex)

      // Re-lock controls if there are confirmed views
      if (window.app && window.app.cameraManager && this.cameraViewManager.hasViews()) {
        window.app.cameraManager.disableControls()
      }

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

  showEditDialog(view, viewIndex) {
    const dialog = document.createElement('div')
    dialog.className = 'camera-setup-dialog'
    dialog.innerHTML = `
      <div class="camera-setup-content">
        <h3>编辑相机视角</h3>
        
        <div class="setup-field">
          <label>视角名称</label>
          <input type="text" class="setup-input" id="view-name" value="${view.name}" />
        </div>
        
        <div class="setup-field">
          <label>相机类型</label>
          <select class="setup-select" id="camera-type">
            <option value="perspective" ${view.settings.type === 'perspective' ? 'selected' : ''}>透视相机 (Perspective)</option>
            <option value="orthographic" ${view.settings.type === 'orthographic' ? 'selected' : ''}>正交相机 (Orthographic)</option>
          </select>
        </div>
        
        <div class="setup-field">
          <label>焦距 (mm)</label>
          <select class="setup-select" id="focal-length">
            <option value="24" ${view.settings.focalLength === 24 ? 'selected' : ''}>24mm (广角)</option>
            <option value="35" ${view.settings.focalLength === 35 ? 'selected' : ''}>35mm (标准广角)</option>
            <option value="50" ${view.settings.focalLength === 50 ? 'selected' : ''}>50mm (标准)</option>
            <option value="85" ${view.settings.focalLength === 85 ? 'selected' : ''}>85mm (人像)</option>
            <option value="135" ${view.settings.focalLength === 135 ? 'selected' : ''}>135mm (长焦)</option>
            <option value="200" ${view.settings.focalLength === 200 ? 'selected' : ''}>200mm (远摄)</option>
          </select>
        </div>
        
        <div class="setup-field">
          <label>光圈 (f-stop)</label>
          <select class="setup-select" id="aperture">
            <option value="1.4" ${view.settings.aperture === 1.4 ? 'selected' : ''}>f/1.4 (大光圈)</option>
            <option value="2.8" ${view.settings.aperture === 2.8 ? 'selected' : ''}>f/2.8</option>
            <option value="5.6" ${view.settings.aperture === 5.6 ? 'selected' : ''}>f/5.6</option>
            <option value="11" ${view.settings.aperture === 11 ? 'selected' : ''}>f/11</option>
            <option value="16" ${view.settings.aperture === 16 ? 'selected' : ''}>f/16 (小光圈)</option>
          </select>
        </div>
        
        <div class="setup-buttons">
          <button class="setup-btn confirm">保存</button>
          <button class="setup-btn cancel">取消</button>
        </div>
      </div>
    `

    document.body.appendChild(dialog)

    const handleConfirm = () => {
      const name = document.getElementById('view-name').value
      const type = document.getElementById('camera-type').value
      const focalLength = parseFloat(document.getElementById('focal-length').value)
      const aperture = parseFloat(document.getElementById('aperture').value)

      view.name = name
      view.settings.type = type
      view.settings.focalLength = focalLength
      view.settings.aperture = aperture
      view.updateFOVFromFocalLength()

      // Update UI
      this.update()

      // Notify
      this.onViewEdit(view, viewIndex)

      document.body.removeChild(dialog)
    }

    const handleCancel = () => {
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

  update() {
    if (!this.switcher) return

    // Clear existing view buttons (keep add button)
    const addBtn = this.switcher.querySelector('.add-view-btn')
    this.switcher.innerHTML = ''
    this.switcher.appendChild(addBtn)

    // Add view buttons
    const views = this.cameraViewManager.getAllViews()
    const activeIndex = this.cameraViewManager.getActiveViewIndex()

    views.forEach((view, index) => {
      const viewBtn = document.createElement('button')
      viewBtn.className = 'view-btn'
      viewBtn.textContent = view.name
      
      if (index === activeIndex) {
        viewBtn.classList.add('active')
      }

      // Left click to switch view
      viewBtn.addEventListener('click', () => {
        this.cameraViewManager.setActiveView(index)
        
        // Apply view to camera
        if (window.app && window.app.sceneManager) {
          const camera = window.app.sceneManager.getCamera()
          view.applyToCamera(camera)
          
          // Keep controls disabled when switching views
          if (window.app.cameraManager) {
            window.app.cameraManager.disableControls()
          }
        }
        
        this.update()
        this.onViewSwitch(view, index)
      })

      // Right click to edit
      viewBtn.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        this.showEditDialog(view, index)
      })

      this.switcher.insertBefore(viewBtn, addBtn)
    })
  }

  destroy() {
    if (this.switcher && this.switcher.parentNode) {
      this.switcher.parentNode.removeChild(this.switcher)
    }
  }
}
