export const GEOMETRY_CONFIGS = [
  { type: 'box', label: '立方体', icon: '□' },
  { type: 'sphere', label: '球体', icon: '○' },
  { type: 'cylinder', label: '圆柱体', icon: '⬭' },
  { type: 'cone', label: '圆锥体', icon: '△' },
  { type: 'torus', label: '圆环', icon: '◯' }
]

export class ComponentPanel {
  constructor(containerElement, onDragStart) {
    if (!containerElement) {
      throw new Error('Container element is required')
    }
    if (typeof onDragStart !== 'function') {
      throw new Error('onDragStart callback is required')
    }
    
    this.containerElement = containerElement
    this.onDragStart = onDragStart
  }

  render() {
    // Clear container
    this.containerElement.innerHTML = ''
    
    // Create title
    const title = document.createElement('h2')
    title.textContent = '组件库'
    title.style.marginBottom = '20px'
    title.style.fontSize = '18px'
    title.style.color = '#333'
    this.containerElement.appendChild(title)
    
    // Create component items
    GEOMETRY_CONFIGS.forEach(config => {
      const item = this.createComponentItem(config)
      this.containerElement.appendChild(item)
    })
  }

  createComponentItem(config) {
    const item = document.createElement('div')
    item.className = 'component-item'
    item.dataset.type = config.type
    
    // Create icon
    const icon = document.createElement('span')
    icon.className = 'component-icon'
    icon.textContent = config.icon
    
    // Create label
    const label = document.createElement('span')
    label.className = 'component-label'
    label.textContent = config.label
    
    // Append to item
    item.appendChild(icon)
    item.appendChild(label)
    
    // Add mousedown event listener
    item.addEventListener('mousedown', (event) => {
      this.handleMouseDown(event, config.type)
    })
    
    return item
  }

  handleMouseDown(event, geometryType) {
    event.preventDefault()
    this.onDragStart(geometryType, event)
  }

  getGeometryConfig(geometryType) {
    return GEOMETRY_CONFIGS.find(config => config.type === geometryType)
  }
}
