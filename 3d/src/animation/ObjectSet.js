import * as THREE from 'three'

// Represents a 3D object with its initial state and animation clips
export class ObjectSet {
  constructor(object) {
    this.id = object.userData.id
    this.name = object.userData.name || '未命名物体'
    this.objectId = object.userData.id
    this.type = object.userData.type
    
    // Store initial state
    this.initialState = {
      position: object.position.clone(),
      rotation: object.rotation.clone(),
      scale: object.scale.clone()
    }
    
    // Animation clips for this object
    this.clips = [] // Array of recorded clips
    this.isLocked = true // Locked by default, can only move during recording
  }

  addClip(clip) {
    // Validate clip belongs to this object
    if (clip.targetId !== this.objectId) {
      throw new Error('Clip does not belong to this object')
    }
    
    this.clips.push(clip)
  }

  getClips() {
    return this.clips
  }

  getClip(clipId) {
    return this.clips.find(c => c.id === clipId)
  }

  getClipIndex(clipId) {
    return this.clips.findIndex(c => c.id === clipId)
  }

  // Check if a clip can be used (not already in timeline)
  canUseClip(clipId, usedClipIds) {
    return !usedClipIds.includes(clipId)
  }

  // Validate clip order - clips must be placed in recording order
  validateClipOrder(clipId, previousClipIds) {
    const clipIndex = this.getClipIndex(clipId)
    if (clipIndex === -1) return false
    
    // Check if all previous clips are already placed
    for (let i = 0; i < clipIndex; i++) {
      const prevClip = this.clips[i]
      if (!previousClipIds.includes(prevClip.id)) {
        return false // Previous clip not placed yet
      }
    }
    
    return true
  }

  resetToInitialState(object) {
    object.position.copy(this.initialState.position)
    object.rotation.copy(this.initialState.rotation)
    object.scale.copy(this.initialState.scale)
  }

  lock() {
    this.isLocked = true
  }

  unlock() {
    this.isLocked = false
  }
}
