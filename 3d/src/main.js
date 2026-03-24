import { Application } from './Application.js'

// Application entry point
const container = document.getElementById('app')

if (!container) {
  throw new Error('Application container not found')
}

try {
  const app = new Application(container)
  app.init()
  
  // Expose app instance for debugging
  window.app = app
} catch (error) {
  console.error('Failed to initialize application:', error)
  container.innerHTML = `
    <div style="padding: 20px; color: red;">
      <h2>初始化失败</h2>
      <p>${error.message}</p>
    </div>
  `
}
