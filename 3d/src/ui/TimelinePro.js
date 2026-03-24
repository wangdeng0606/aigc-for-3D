export class TimelinePro {
  constructor(containerElement, animationPlayer, animationRecorder) {
    if (!containerElement || !animationPlayer || !animationRecorder) {
      throw new Error('Container, AnimationPlayer and AnimationRecorder are required')
    }

    this.containerElement = containerElement
    this.animationPlayer = animationPlayer
    this.animationRecorder = animationRecorder
    
    this.timeline = null
    this.trackEditor = null
    this.playButton = null
    this.stopButton = null
    this.timeDisplay = null
    this.playhead = null
    this.speedSelect = null
    this.masterTimeline = null
    this.masterHandle = null
    this.masterTimeText = null
    
    this.isDraggingMaster = false
    this.isDraggingPlayhead = false
    this.updateInterval = null
    
    this.pixelsPerSecond = 100 // Timeline zoom level
  }

  init() {
    // Create timeline container
    this.timeline = document.createElement('div')
    this.timeline.className = 'timeline-pro'

    // Create top controls bar
    const controlsBar = this.createControlsBar()

    // Create main content area
    const mainContent = document.createElement('div')
    mainContent.className = 'timeline-main'

    // Master timeline scrubber
    this.masterTimeline = this.createMasterTimeline()

    // Track Editor
    this.trackEditor = this.createTrackEditor()

    mainContent.appendChild(this.masterTimeline)
    mainContent.appendChild(this.trackEditor)

    // Assemble timeline
    this.timeline.appendChild(controlsBar)
    this.timeline.appendChild(mainContent)

    // Append to container
    this.containerElement.appendChild(this.timeline)

    // Add keyboard listener
    window.addEventListener('keydown', (e) => this.handleKeyPress(e))

    // Start update loop
    this.startUpdateLoop()
  }

  createControlsBar() {
    const controlsBar = document.createElement('div')
    controlsBar.className = 'timeline-controls'

    // Play/Pause button
    this.playButton = document.createElement('button')
    this.playButton.className = 'timeline-btn play-btn'
    this.playButton.innerHTML = '▶ 播放'
    this.playButton.addEventListener('click', () => this.handlePlayPause())

    // Stop button
    this.stopButton = document.createElement('button')
    this.stopButton.className = 'timeline-btn stop-btn'
    this.stopButton.innerHTML = '■ 停止'
    this.stopButton.addEventListener('click', () => this.handleStop())

    // Time display
    this.timeDisplay = document.createElement('div')
    this.timeDisplay.className = 'timeline-time'
    this.timeDisplay.textContent = '0.0s / 0.0s'

    // Speed control
    const speedLabel = document.createElement('label')
    speedLabel.textContent = '速度:'
    speedLabel.className = 'timeline-label'

    this.speedSelect = document.createElement('select')
    this.speedSelect.className = 'timeline-speed'
    const speeds = [
      { value: 0.25, label: '0.25x' },
      { value: 0.5, label: '0.5x' },
      { value: 1.0, label: '1x' },
      { value: 1.5, label: '1.5x' },
      { value: 2.0, label: '2x' }
    ]
    speeds.forEach(speed => {
      const option = document.createElement('option')
      option.value = speed.value
      option.textContent = speed.label
      if (speed.value === 1.0) option.selected = true
      this.speedSelect.appendChild(option)
    })
    this.speedSelect.addEventListener('change', (e) => {
      this.animationPlayer.setPlaybackSpeed(parseFloat(e.target.value))
    })

    // Hint text
    const hintText = document.createElement('div')
    hintText.className = 'timeline-label'
    hintText.textContent = '提示: 选中物体按K录制 | 按F录制相机'
    hintText.style.fontSize = '12px'
    hintText.style.color = '#888'

    controlsBar.appendChild(this.playButton)
    controlsBar.appendChild(this.stopButton)
    controlsBar.appendChild(this.timeDisplay)
    controlsBar.appendChild(speedLabel)
    controlsBar.appendChild(this.speedSelect)
    controlsBar.appendChild(hintText)

    return controlsBar
  }

  createMasterTimeline() {
    const master = document.createElement('div')
    master.className = 'master-timeline'

    // Time display
    const timeText = document.createElement('div')
    timeText.className = 'master-timeline-time'
    timeText.textContent = '0.0s'
    this.masterTimeText = timeText

    // Track
    const track = document.createElement('div')
    track.className = 'master-timeline-track'

    // Handle
    this.masterHandle = document.createElement('div')
    this.masterHandle.className = 'master-timeline-handle'

    // Drag master handle
    this.masterHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation()
      this.isDraggingMaster = true
    })

    // Click on master timeline to seek
    master.addEventListener('mousedown', (e) => {
      if (e.target === master || e.target === track) {
        this.handleMasterClick(e)
      }
    })

    document.addEventListener('mousemove', (e) => {
      if (this.isDraggingMaster) {
        this.handleMasterDrag(e)
      }
    })

    document.addEventListener('mouseup', () => {
      this.isDraggingMaster = false
    })

    master.appendChild(timeText)
    master.appendChild(track)
    master.appendChild(this.masterHandle)

    return master
  }

  handleMasterClick(e) {
    const rect = this.masterTimeline.getBoundingClientRect()
    const x = e.clientX - rect.left - 150 // Subtract header width
    const maxDuration = this.animationPlayer.getMaxDuration()
    const trackWidth = rect.width - 150 - 20 // Subtract header and padding
    const time = Math.max(0, Math.min((x / trackWidth) * maxDuration, maxDuration))
    this.animationPlayer.seek(time)
  }

  handleMasterDrag(e) {
    const rect = this.masterTimeline.getBoundingClientRect()
    const x = e.clientX - rect.left - 150
    const maxDuration = this.animationPlayer.getMaxDuration()
    const trackWidth = rect.width - 150 - 20
    const time = Math.max(0, Math.min((x / trackWidth) * maxDuration, maxDuration))
    this.animationPlayer.seek(time)
  }

  createTrackEditor() {
    const editor = document.createElement('div')
    editor.className = 'track-editor'

    // Timeline ruler
    const ruler = document.createElement('div')
    ruler.className = 'timeline-ruler'
    ruler.id = 'timeline-ruler'

    // Tracks container wrapper (for playhead overlay)
    const tracksWrapper = document.createElement('div')
    tracksWrapper.className = 'tracks-wrapper'
    tracksWrapper.id = 'tracks-wrapper'

    // Playhead that spans across all tracks
    this.playhead = document.createElement('div')
    this.playhead.className = 'timeline-playhead'

    // Tracks container
    const tracksContainer = document.createElement('div')
    tracksContainer.className = 'tracks-container'
    tracksContainer.id = 'tracks-container'

    // Click on tracks area to seek
    tracksWrapper.addEventListener('mousedown', (e) => {
      if (e.target === tracksWrapper || e.target === tracksContainer) {
        this.isDraggingPlayhead = true
        this.handleTracksClick(e)
      }
    })

    document.addEventListener('mousemove', (e) => {
      if (this.isDraggingPlayhead) {
        this.handleTracksClick(e)
      }
    })

    document.addEventListener('mouseup', () => {
      this.isDraggingPlayhead = false
    })

    tracksWrapper.appendChild(this.playhead)
    tracksWrapper.appendChild(tracksContainer)

    editor.appendChild(ruler)
    editor.appendChild(tracksWrapper)

    return editor
  }

  handleTracksClick(e) {
    const tracksWrapper = document.getElementById('tracks-wrapper')
    if (!tracksWrapper) return

    const rect = tracksWrapper.getBoundingClientRect()
    const x = e.clientX - rect.left
    
    // Subtract track header width (150px)
    const adjustedX = x - 150
    if (adjustedX < 0) return // Clicked on track header area
    
    const time = (adjustedX / this.pixelsPerSecond) * 1000
    
    this.animationPlayer.seek(Math.max(0, time))
  }

  handleKeyPress(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return
    }

    if (e.key.toLowerCase() === 'k') {
      e.preventDefault()
      this.handleRecordObject()
    } else if (e.key.toLowerCase() === 'f') {
      e.preventDefault()
      this.handleRecordCamera()
    } else if (e.key === ' ') {
      e.preventDefault()
      this.handlePlayPause()
    }
  }

  handleRecordObject() {
    if (this.animationRecorder.isCurrentlyRecording()) {
      // Stop recording
      const sourceClip = this.animationRecorder.stopRecording()
      if (sourceClip && sourceClip.targetType === 'object') {
        // Add clip to the object's track
        this.addClipToObjectTrack(sourceClip)
      }
    } else {
      // Start recording selected object
      const selectedObject = window.app.selectionManager.getSelectedObject()
      if (!selectedObject) {
        alert('请先选择一个物体')
        return
      }
      
      // Check if object has confirmed position
      if (!selectedObject.userData.positionConfirmed) {
        alert('请先给物体命名并确认位置')
        return
      }
      
      this.animationRecorder.startRecording(selectedObject, 'object')
    }
  }

  handleRecordCamera() {
    if (this.animationRecorder.isCurrentlyRecording()) {
      // Stop recording
      const sourceClip = this.animationRecorder.stopRecording()
      if (sourceClip && sourceClip.targetType === 'camera') {
        // Add clip to camera track
        this.addClipToCameraTrack(sourceClip)
      }
      
      // Disable camera controls after recording
      if (window.app && window.app.cameraManager) {
        window.app.cameraManager.disableControls()
      }
    } else {
      // Check if there's an active camera view
      if (window.app && window.app.cameraViewManager) {
        if (!window.app.cameraViewManager.hasViews()) {
          alert('请先创建一个视角')
          return
        }
      }
      
      // Enable camera controls for recording
      if (window.app && window.app.cameraManager) {
        window.app.cameraManager.enableControls()
      }
      
      // Start recording camera
      const camera = window.app.sceneManager.getCamera()
      this.animationRecorder.startRecording(camera, 'camera')
    }
  }

  addClipToObjectTrack(sourceClip) {
    // Find or create track for this object
    let track = this.animationPlayer.getTracks().find(t => t.objectId === sourceClip.targetId)
    
    if (!track) {
      // Create new track for this object
      track = this.animationPlayer.addTrack(sourceClip.targetName)
      track.objectId = sourceClip.targetId
      track.trackType = 'object'
    }
    
    // Add source clip to player
    this.animationPlayer.addSourceClip(sourceClip)
    
    // Calculate start time (after last clip on this track)
    const lastClip = track.clips[track.clips.length - 1]
    const startTime = lastClip ? lastClip.startTime + lastClip.getPlaybackDuration() : 0
    
    // Add clip to track
    this.animationPlayer.addClipToTrack(sourceClip.id, track.id, startTime)
    
    // Update UI
    this.updateTrackEditor()
  }

  addClipToCameraTrack(sourceClip) {
    // Find or create camera track
    let track = this.animationPlayer.getTracks().find(t => t.trackType === 'camera')
    
    if (!track) {
      track = this.animationPlayer.addTrack('相机')
      track.trackType = 'camera'
    }
    
    // Add source clip to player
    this.animationPlayer.addSourceClip(sourceClip)
    
    // Calculate start time
    const lastClip = track.clips[track.clips.length - 1]
    const startTime = lastClip ? lastClip.startTime + lastClip.getPlaybackDuration() : 0
    
    // Add clip to track
    this.animationPlayer.addClipToTrack(sourceClip.id, track.id, startTime)
    
    // Update UI
    this.updateTrackEditor()
  }

  handlePlayPause() {
    if (this.animationPlayer.isCurrentlyPlaying()) {
      this.animationPlayer.pause()
      this.playButton.innerHTML = '▶ 播放'
    } else {
      this.animationPlayer.play()
      this.playButton.innerHTML = '⏸ 暂停'
    }
  }

  handleStop() {
    this.animationPlayer.stop()
    this.playButton.innerHTML = '▶ 播放'
  }

  updateTrackEditor() {
    const tracksContainer = document.getElementById('tracks-container')
    if (!tracksContainer) return

    tracksContainer.innerHTML = ''

    const tracks = this.animationPlayer.getTracks()

    if (tracks.length === 0) {
      const emptyMsg = document.createElement('div')
      emptyMsg.className = 'tracks-empty'
      emptyMsg.textContent = '拖拽物体到场景开始创建轨道'
      tracksContainer.appendChild(emptyMsg)
      return
    }

    tracks.forEach(track => {
      const trackRow = this.createTrackRow(track)
      tracksContainer.appendChild(trackRow)
    })

    this.updateRuler()
  }

  createTrackRow(track) {
    const trackRow = document.createElement('div')
    trackRow.className = 'track-row'
    trackRow.dataset.trackId = track.id

    // Track header
    const trackHeader = document.createElement('div')
    trackHeader.className = 'track-header'

    const trackName = document.createElement('div')
    trackName.className = 'track-name'
    trackName.textContent = track.name

    const deleteTrackBtn = document.createElement('button')
    deleteTrackBtn.className = 'track-delete-btn'
    deleteTrackBtn.textContent = '×'
    deleteTrackBtn.addEventListener('click', () => {
      // Delete track and associated object if it's an object track
      if (track.objectId) {
        const scene = window.app.sceneManager.getScene()
        const object = scene.children.find(obj => obj.userData.id === track.objectId)
        if (object) {
          window.app.selectionManager.deleteSelectedObject()
        }
      }
      this.animationPlayer.removeTrack(track.id)
      this.updateTrackEditor()
    })

    trackHeader.appendChild(trackName)
    trackHeader.appendChild(deleteTrackBtn)

    // Track timeline
    const trackTimeline = document.createElement('div')
    trackTimeline.className = 'track-timeline'

    // Render clips on this track
    track.clips.forEach(clip => {
      const clipElement = this.createClipElement(clip)
      trackTimeline.appendChild(clipElement)
    })

    trackRow.appendChild(trackHeader)
    trackRow.appendChild(trackTimeline)

    return trackRow
  }

  createClipElement(clip) {
    const clipEl = document.createElement('div')
    clipEl.className = 'timeline-clip'
    clipEl.dataset.clipId = clip.id
    clipEl.dataset.trackId = clip.trackId

    const left = (clip.startTime / 1000) * this.pixelsPerSecond
    const width = (clip.getPlaybackDuration() / 1000) * this.pixelsPerSecond

    clipEl.style.left = `${left}px`
    clipEl.style.width = `${width}px`

    clipEl.innerHTML = `
      <div class="clip-label">${clip.sourceClip.targetName}</div>
      <div class="clip-time">${(clip.getPlaybackDuration() / 1000).toFixed(1)}s</div>
    `

    return clipEl
  }

  updateRuler() {
    const ruler = document.getElementById('timeline-ruler')
    if (!ruler) return

    ruler.innerHTML = ''

    const maxDuration = this.animationPlayer.getMaxDuration()
    const seconds = Math.ceil(maxDuration / 1000)

    for (let i = 0; i <= seconds; i++) {
      const mark = document.createElement('div')
      mark.className = 'ruler-mark'
      mark.style.left = `${i * this.pixelsPerSecond}px`
      mark.textContent = `${i}s`
      ruler.appendChild(mark)
    }
  }

  startUpdateLoop() {
    this.updateInterval = setInterval(() => {
      this.updateDisplay()
      
      if (this.animationRecorder.isCurrentlyRecording()) {
        this.animationRecorder.recordFrame()
      }
    }, 1000 / 60)
  }

  updateDisplay() {
    const currentTime = this.animationPlayer.getCurrentTime()
    const maxDuration = this.animationPlayer.getMaxDuration()

    this.timeDisplay.textContent = `${(currentTime / 1000).toFixed(1)}s / ${(maxDuration / 1000).toFixed(1)}s`

    // Update playhead position based on time
    // Add 150px offset for track header width
    const left = 150 + (currentTime / 1000) * this.pixelsPerSecond
    this.playhead.style.left = `${left}px`

    // Update master timeline
    if (this.masterTimeText) {
      this.masterTimeText.textContent = `${(currentTime / 1000).toFixed(1)}s`
    }

    if (this.masterHandle && maxDuration > 0) {
      const rect = this.masterTimeline.getBoundingClientRect()
      const trackWidth = rect.width - 150 - 20
      const handleLeft = 150 + (currentTime / maxDuration) * trackWidth
      this.masterHandle.style.left = `${handleLeft}px`
    }

    if (this.animationRecorder.isCurrentlyRecording()) {
      const recordingTime = this.animationRecorder.getRecordingDuration()
      this.timeDisplay.textContent = `录制中: ${(recordingTime / 1000).toFixed(1)}s`
    }
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }

    if (this.timeline && this.timeline.parentNode) {
      this.timeline.parentNode.removeChild(this.timeline)
    }
  }
}
