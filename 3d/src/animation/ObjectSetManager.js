import { ObjectSet } from './ObjectSet.js'

export class ObjectSetManager {
  constructor() {
    this.objectSets = new Map() // objectId -> ObjectSet
  }

  // Create object set when object is first placed
  createObjectSet(object) {
    if (this.objectSets.has(object.userData.id)) {
      throw new Error('Object set already exists')
    }

    const objectSet = new ObjectSet(object)
    this.objectSets.set(object.userData.id, objectSet)
    return objectSet
  }

  getObjectSet(objectId) {
    return this.objectSets.get(objectId)
  }

  getAllObjectSets() {
    return Array.from(this.objectSets.values())
  }

  hasObjectSet(objectId) {
    return this.objectSets.has(objectId)
  }

  removeObjectSet(objectId) {
    this.objectSets.delete(objectId)
  }

  // Add clip to appropriate object set
  addClipToObjectSet(clip) {
    const objectSet = this.getObjectSet(clip.targetId)
    if (!objectSet) {
      throw new Error(`No object set found for object ${clip.targetId}`)
    }
    objectSet.addClip(clip)
  }

  // Check if object is locked (cannot be moved unless recording)
  isObjectLocked(objectId) {
    const objectSet = this.getObjectSet(objectId)
    return objectSet ? objectSet.isLocked : false
  }

  // Unlock object for recording
  unlockObject(objectId) {
    const objectSet = this.getObjectSet(objectId)
    if (objectSet) {
      objectSet.unlock()
    }
  }

  // Lock object after recording
  lockObject(objectId) {
    const objectSet = this.getObjectSet(objectId)
    if (objectSet) {
      objectSet.lock()
    }
  }

  // Reset object to initial state
  resetObjectToInitial(object) {
    const objectSet = this.getObjectSet(object.userData.id)
    if (objectSet) {
      objectSet.resetToInitialState(object)
    }
  }

  // Get all clips that are already used in timeline
  getUsedClipIds(animationPlayer) {
    const usedClipIds = new Set()
    
    animationPlayer.getTracks().forEach(track => {
      track.clips.forEach(timelineClip => {
        usedClipIds.add(timelineClip.sourceClipId)
      })
    })
    
    return Array.from(usedClipIds)
  }

  // Validate if clip can be placed on timeline
  canPlaceClip(clipId, animationPlayer) {
    // Find which object set this clip belongs to
    let targetObjectSet = null
    let targetClip = null

    for (const objectSet of this.objectSets.values()) {
      const clip = objectSet.getClip(clipId)
      if (clip) {
        targetObjectSet = objectSet
        targetClip = clip
        break
      }
    }

    if (!targetObjectSet || !targetClip) {
      return { canPlace: false, reason: '素材不存在' }
    }

    // Check if clip is already used
    const usedClipIds = this.getUsedClipIds(animationPlayer)
    if (!targetObjectSet.canUseClip(clipId, usedClipIds)) {
      return { canPlace: false, reason: '素材已被使用' }
    }

    // Check if previous clips are placed
    const previousClipIds = usedClipIds.filter(id => {
      return targetObjectSet.getClip(id) !== undefined
    })

    if (!targetObjectSet.validateClipOrder(clipId, previousClipIds)) {
      return { canPlace: false, reason: '必须按录制顺序放置素材' }
    }

    return { canPlace: true }
  }
}
