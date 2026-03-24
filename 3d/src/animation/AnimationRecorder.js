export class AnimationRecorder {
  constructor() {
    this.isRecording = false
    this.recordingStartTime = 0
    this.currentTrack = null
    this.recordedFrames = []
    this.targetObject = null
    this.targetType = 'object' // 'object' or 'camera'
  }

  startRecording(target, targetType = 'object') {
    if (this.isRecording) {
      throw new Error('Already recording')
    }

    // Set recording flag FIRST before unlocking/selecting
    this.isRecording = true
    this.recordingStartTime = Date.now()
    this.recordedFrames = []
    this.targetObject = target
    this.targetType = targetType

    // Unlock object if it's an object type
    if (targetType === 'object' && window.app && window.app.objectSetManager) {
      window.app.objectSetManager.unlockObject(target.userData.id)
      // Allow transform controls - now isRecording is true, so selection will work
      window.app.selectionManager.selectObject(target)
    }

    // Record initial state
    this.recordFrame()
  }

  recordFrame() {
    if (!this.isRecording || !this.targetObject) {
      return
    }

    const timestamp = Date.now() - this.recordingStartTime

    if (this.targetType === 'object') {
      // Record object transform
      this.recordedFrames.push({
        timestamp,
        position: this.targetObject.position.clone(),
        rotation: this.targetObject.rotation.clone(),
        scale: this.targetObject.scale.clone()
      })
    } else if (this.targetType === 'camera') {
      // Record camera transform
      this.recordedFrames.push({
        timestamp,
        position: this.targetObject.position.clone(),
        rotation: this.targetObject.rotation.clone(),
        target: this.targetObject.userData.lookAtTarget 
          ? this.targetObject.userData.lookAtTarget.clone() 
          : null
      })
    }
  }

  stopRecording() {
    if (!this.isRecording) {
      return null
    }

    this.isRecording = false

    // Create track data
    const track = {
      id: this.generateTrackId(),
      targetId: this.targetObject.userData.id || 'camera',
      targetType: this.targetType,
      targetName: this.targetObject.userData.name || (this.targetType === 'camera' ? '相机' : '未命名'),
      duration: this.recordedFrames.length > 0 
        ? this.recordedFrames[this.recordedFrames.length - 1].timestamp 
        : 0,
      frames: this.recordedFrames,
      createdAt: Date.now()
    }

    // Lock object after recording
    if (this.targetType === 'object' && window.app && window.app.objectSetManager) {
      window.app.objectSetManager.lockObject(this.targetObject.userData.id)
      // Deselect to remove transform controls
      window.app.selectionManager.deselectObject()
    }

    // Reset state
    this.recordedFrames = []
    this.targetObject = null

    return track
  }

  generateTrackId() {
    return `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  isCurrentlyRecording() {
    return this.isRecording
  }

  getRecordingDuration() {
    if (!this.isRecording) {
      return 0
    }
    return Date.now() - this.recordingStartTime
  }
}
