export class Timeline {
  constructor(containerElement, animationPlayer, animationRecorder) {
    if (!containerElement || !animationPlayer || !animationRecorder) {
      throw new Error('Container, AnimationPlayer and AnimationRecorder are required')
    }

    this.containerElement = containerElement
    this.animationPlayer = animationPlayer
    this.animationRecorder = animationRecorder
    
    this.timeline = null
    this.playButton = null
    this.recordButton = null
    this.stopButton = null
    this.timeDisplay = null
    this.progressBar = null
    this.progressFill = null
    this.playhead = null
    this.trackList = null
    this.speedSelect = null
    
    this.isDraggingPlayhead = false
    this.updateInterval = null
  }

  init() {
    // Create timeline container
    this.timeline = document.createElement('div')
    this.timeline.className = 'timeline'

    // Create controls bar
    const controlsBar = document.createElement('div')
    controlsBar.className = 'timeline-controls'

    // Record button
    this.recordButton = document.createElement('button')
    this.recordButton.className = 'timeline-btn record-btn'
    this.recordButton.innerHTML = '● 录制 (K)'
    this.recordButton.addEventListener('click', () => this.handleRecord())

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

    controlsBar.appendChild(this.recordButton)
    controlsBar.appendChild(this.playButton)
    controlsBar.appendChild(this.stopButton)
    controlsBar.appendChild(this.timeDisplay)
    controlsBar.appendChild(speedLabel)
    controlsBar.appendChild(this.speedSelect)

    // Create progress bar
    const progressContainer = document.createElement('div')
    progressContainer.className = 'timeline-progress-container'

    this.progressBar = document.createElement('div')
    this.progressBar.className = 'timeline-progress'

    this.progressFill = document.createElement('div')
    this.progressFill.className = 'timeline-progress-fill'

    this.playhead = document.createElement('div')
    this.playhead.className = 'timeline-playhead'

    this.progressBar.appendChild(this.progressFill)
    this.progressBar.appendChild(this.playhead)
    progressContainer.appendChild(this.progressBar)

    // Progress bar click to seek
    this.progressBar.addEventListener('mousedown', (e) => {
      this.isDraggingPlayhead = true
      this.handleProgressClick(e)
    })

    document.addEventListener('mousemove', (e) => {
      if (this.isDraggingPlayhead) {
        this.handleProgressClick(e)
      }
    })

    document.addEventListener('mouseup', () => {
      this.isDraggingPlayhead = false
    })

    // Create track list
    this.trackList = document.createElement('div')
    this.trackList.className = 'timeline-tracks'

    // Assemble timeline
    this.timeline.appendChild(controlsBar)
    this.timeline.appendChild(progressContainer)
    this.timeline.appendChild(this.trackList)

    // Append to container
    this.containerElement.appendChild(this.timeline)

    // Add keyboard listener
    window.addEventListener('keydown', (e) => this.handleKeyPress(e))

    // Start update loop
    this.startUpdateLoop()
  }

  handleRecord() {
    if (this.animationRecorder.isCurrentlyRecording()) {
      // Stop recording
      const track = this.animationRecorder.stopRecording()
      if (track) {
        this.animationPlayer.addTrack(track)
        this.updateTrackList()
      }
      this.recordButton.innerHTML = '● 录制 (K)'
      this.recordButton.classList.remove('recording')
    } else {
      // Start recording - need to select target first
      this.showRecordTargetDialog()
    }
  }

  showRecordTargetDialog() {
    const dialog = document.createElement('div')
    dialog.className = 'record-dialog'
    dialog.innerHTML = `
      <div class="record-dialog-content">
        <h3>选择录制目标</h3>
        <button class="record-target-btn" data-type="selected">录制选中物体</button>
        <button class="record-target-btn" data-type="camera">录制相机运动</button>
        <button class="record-target-btn cancel">取消</button>
      </div>
    `

    document.body.appendChild(dialog)

    dialog.addEventListener('click', (e) => {
      if (e.target.classList.contains('record-target-btn')) {
        const type = e.target.dataset.type
        
        if (type === 'selected') {
          // Record selected object
          const selectedObject = window.app.selectionManager.getSelectedObject()
          if (selectedObject) {
            this.startRecording(selectedObject, 'object')
          } else {
            alert('请先选择一个物体')
          }
        } else if (type === 'camera') {
          // Record camera
          const camera = window.app.sceneManager.getCamera()
          this.startRecording(camera, 'camera')
        }
        
        document.body.removeChild(dialog)
      } else if (e.target.classList.contains('cancel')) {
        document.body.removeChild(dialog)
      }
    })
  }

  startRecording(target, type) {
    this.animationRecorder.startRecording(target, type)
    this.recordButton.innerHTML = '■ 停止录制 (K)'
    this.recordButton.classList.add('recording')
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

  handleProgressClick(e) {
    const rect = this.progressBar.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const maxDuration = this.animationPlayer.getMaxDuration()
    this.animationPlayer.seek(percentage * maxDuration)
  }

  handleKeyPress(e) {
    // Don't trigger shortcuts if user is typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return
    }

    if (e.key.toLowerCase() === 'k') {
      e.preventDefault()
      this.handleRecord()
    } else if (e.key === ' ') {
      e.preventDefault()
      this.handlePlayPause()
    }
  }

  updateTrackList() {
    this.trackList.innerHTML = ''

    const tracks = this.animationPlayer.getTracks()
    
    if (tracks.length === 0) {
      const emptyMsg = document.createElement('div')
      emptyMsg.className = 'timeline-empty'
      emptyMsg.textContent = '暂无轨道，按 K 键开始录制'
      this.trackList.appendChild(emptyMsg)
      return
    }

    tracks.forEach(track => {
      const trackItem = document.createElement('div')
      trackItem.className = 'timeline-track'

      const trackInfo = document.createElement('div')
      trackInfo.className = 'track-info'
      trackInfo.innerHTML = `
        <span class="track-name">${track.targetName}</span>
        <span class="track-type">${track.targetType === 'camera' ? '相机' : '物体'}</span>
        <span class="track-duration">${(track.duration / 1000).toFixed(2)}s</span>
      `

      const trackDelete = document.createElement('button')
      trackDelete.className = 'track-delete'
      trackDelete.textContent = '×'
      trackDelete.addEventListener('click', () => {
        this.animationPlayer.removeTrack(track.id)
        this.updateTrackList()
      })

      trackItem.appendChild(trackInfo)
      trackItem.appendChild(trackDelete)
      this.trackList.appendChild(trackItem)
    })
  }

  startUpdateLoop() {
    this.updateInterval = setInterval(() => {
      this.updateDisplay()
      
      // Record frame if recording
      if (this.animationRecorder.isCurrentlyRecording()) {
        this.animationRecorder.recordFrame()
      }
    }, 1000 / 60) // 60 FPS
  }

  updateDisplay() {
    const currentTime = this.animationPlayer.getCurrentTime()
    const maxDuration = this.animationPlayer.getMaxDuration()

    // Update time display
    this.timeDisplay.textContent = `${(currentTime / 1000).toFixed(1)}s / ${(maxDuration / 1000).toFixed(1)}s`

    // Update progress bar
    if (maxDuration > 0) {
      const percentage = (currentTime / maxDuration) * 100
      this.progressFill.style.width = `${percentage}%`
      this.playhead.style.left = `${percentage}%`
    } else {
      this.progressFill.style.width = '0%'
      this.playhead.style.left = '0%'
    }

    // Update recording time
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
