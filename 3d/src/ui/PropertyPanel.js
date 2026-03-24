export class PropertyPanel {
  constructor(containerElement) {
    if (!containerElement) {
      throw new Error('Container element is required')
    }
    
    this.containerElement = containerElement
    this.panel = null
    this.nameInput = null
    this.currentObject = null
  }

  init() {
    // Create property panel
    this.panel = document.createElement('div')
    this.panel.className = 'property-panel'
    this.panel.style.display = 'none' // Hidden by default
    
    // Create header
    const header = document.createElement('div')
    header.className = 'property-panel-header'
    header.textContent = '物体属性'
    
    // Create close button
    const closeBtn = document.createElement('button')
    closeBtn.className = 'property-panel-close'
    closeBtn.textContent = '×'
    closeBtn.addEventListener('click', () => {
      this.hide()
    })
    header.appendChild(closeBtn)
    
    // Create content
    const content = document.createElement('div')
    content.className = 'property-panel-content'
    
    // Name field
    const nameField = document.createElement('div')
    nameField.className = 'property-field'
    
    const nameLabel = document.createElement('label')
    nameLabel.textContent = '名称'
    nameLabel.className = 'property-label'
    
    this.nameInput = document.createElement('input')
    this.nameInput.type = 'text'
    this.nameInput.className = 'property-input'
    this.nameInput.placeholder = '点击输入名称'
    this.nameInput.addEventListener('input', () => {
      this.updateObjectName()
    })
    this.nameInput.addEventListener('blur', () => {
      // When user finishes editing name, check if position needs confirmation
      this.checkPositionConfirmation()
      // Remove focus styling when user clicks away
      this.nameInput.classList.remove('focused')
    })
    this.nameInput.addEventListener('focus', () => {
      // Add focus styling
      this.nameInput.classList.add('focused')
    })
    this.nameInput.addEventListener('keydown', (e) => {
      // When user presses Enter, trigger blur to confirm
      if (e.key === 'Enter') {
        this.nameInput.blur()
      }
    })
    
    nameField.appendChild(nameLabel)
    nameField.appendChild(this.nameInput)
    
    // Type field (read-only)
    const typeField = document.createElement('div')
    typeField.className = 'property-field'
    
    const typeLabel = document.createElement('label')
    typeLabel.textContent = '类型'
    typeLabel.className = 'property-label'
    
    this.typeText = document.createElement('div')
    this.typeText.className = 'property-text'
    
    typeField.appendChild(typeLabel)
    typeField.appendChild(this.typeText)
    
    // ID field (read-only)
    const idField = document.createElement('div')
    idField.className = 'property-field'
    
    const idLabel = document.createElement('label')
    idLabel.textContent = 'ID'
    idLabel.className = 'property-label'
    
    this.idText = document.createElement('div')
    this.idText.className = 'property-text property-id'
    
    idField.appendChild(idLabel)
    idField.appendChild(this.idText)
    
    // Keyboard shortcuts hint
    const hintsField = document.createElement('div')
    hintsField.className = 'property-hints'
    hintsField.innerHTML = `
      <div class="hint-title">快捷键</div>
      <div class="hint-item"><kbd>G</kbd> 移动</div>
      <div class="hint-item"><kbd>R</kbd> 旋转</div>
      <div class="hint-item"><kbd>S</kbd> 缩放</div>
      <div class="hint-item"><kbd>Delete</kbd> 删除</div>
      <div class="hint-item"><kbd>Esc</kbd> 取消选择</div>
    `
    
    // Append fields to content
    content.appendChild(nameField)
    content.appendChild(typeField)
    content.appendChild(idField)
    content.appendChild(hintsField)
    
    // Append to panel
    this.panel.appendChild(header)
    this.panel.appendChild(content)
    
    // Append to container
    this.containerElement.appendChild(this.panel)
  }

  show(object) {
    if (!object) {
      this.hide()
      return
    }
    
    this.currentObject = object
    
    // Update fields
    this.nameInput.value = object.userData.name || ''
    this.typeText.textContent = this.getTypeName(object.userData.type)
    this.idText.textContent = object.userData.id
    
    // Show panel
    this.panel.style.display = 'block'
    
    // Don't auto-focus name input to avoid interfering with keyboard shortcuts
    // User can click to focus if they want to edit
  }

  hide() {
    this.currentObject = null
    this.panel.style.display = 'none'
  }

  updateObjectName() {
    if (!this.currentObject) {
      return
    }
    
    const newName = this.nameInput.value.trim()
    this.currentObject.userData.name = newName
  }

  checkPositionConfirmation() {
    if (!this.currentObject) {
      return
    }

    // Check if object has a name and position is not confirmed yet
    const hasName = this.currentObject.userData.name && this.currentObject.userData.name.trim() !== ''
    const positionConfirmed = this.currentObject.userData.positionConfirmed === true

    if (hasName && !positionConfirmed) {
      // Show confirmation dialog
      if (window.app && window.app.dragSystem) {
        window.app.dragSystem.showPositionConfirmDialog(this.currentObject)
      }
    }
  }

  getTypeName(type) {
    const typeNames = {
      'box': '立方体',
      'sphere': '球体',
      'cylinder': '圆柱体',
      'cone': '圆锥体',
      'torus': '圆环'
    }
    return typeNames[type] || type
  }

  destroy() {
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel)
    }
  }
}
