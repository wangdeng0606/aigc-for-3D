import { TimelineTrack } from './TimelineTrack.js'
import { TimelineClip } from './TimelineClip.js'

export class AnimationPlayer {
  constructor(sceneManager) {
    this.sceneManager = sceneManager
    this.tracks = [] // Array of TimelineTrack
    this.sourceClips = [] // Library of recorded clips
    this.isPlaying = false
    this.currentTime = 0
    this.playbackSpeed = 1.0
    this.lastUpdateTime = 0
    this.animationFrameId = null
  }

  // Source clip management (素材库)
  addSourceClip(clip) {
    if (!clip || !clip.id) {
      throw new Error('Invalid clip')
    }
    this.sourceClips.push(clip)
    return clip.id
  }

  removeSourceClip(clipId) {
    const index = this.sourceClips.findIndex(c => c.id === clipId)
    if (index !== -1) {
      this.sourceClips.splice(index, 1)
    }
  }

  getSourceClips() {
    return this.sourceClips
  }

  getSourceClip(clipId) {
    return this.sourceClips.find(c => c.id === clipId)
  }

  // Track management (轨道管理)
  addTrack(name = '新轨道') {
    const track = new TimelineTrack(name)
    this.tracks.push(track)
    return track
  }

  removeTrack(trackId) {
    const index = this.tracks.findIndex(t => t.id === trackId)
    if (index !== -1) {
      this.tracks.splice(index, 1)
    }
  }

  getTracks() {
    return this.tracks
  }

  getTrack(trackId) {
    return this.tracks.find(t => t.id === trackId)
  }

  // Add a source clip to a track
  addClipToTrack(sourceClipId, trackId, startTime = 0) {
    const sourceClip = this.getSourceClip(sourceClipId)
    const track = this.getTrack(trackId)

    if (!sourceClip || !track) {
      throw new Error('Invalid source clip or track')
    }

    const timelineClip = new TimelineClip(sourceClip, trackId, startTime)
    track.addClip(timelineClip)
    return timelineClip
  }

  removeClipFromTrack(trackId, clipId) {
    const track = this.getTrack(trackId)
    if (track) {
      track.removeClip(clipId)
    }
  }

  getMaxDuration() {
    if (this.tracks.length === 0) {
      return 0
    }
    return Math.max(...this.tracks.map(t => t.getDuration()), 0)
  }

  play() {
    if (this.isPlaying) {
      return
    }

    this.isPlaying = true
    this.lastUpdateTime = Date.now()
    this.animate()
  }

  pause() {
    this.isPlaying = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  stop() {
    this.pause()
    this.currentTime = 0
    
    // Reset all objects to their initial state
    if (window.app && window.app.objectSetManager) {
      const scene = this.sceneManager.getScene()
      scene.children.forEach(object => {
        if (object.userData && object.userData.id) {
          window.app.objectSetManager.resetObjectToInitial(object)
        }
      })
    }
    
    this.updateAllTracks()
  }

  seek(time) {
    this.currentTime = Math.max(0, Math.min(time, this.getMaxDuration()))
    this.updateAllTracks()
  }

  setPlaybackSpeed(speed) {
    this.playbackSpeed = Math.max(0.1, Math.min(speed, 4.0))
  }

  animate() {
    if (!this.isPlaying) {
      return
    }

    const now = Date.now()
    const deltaTime = (now - this.lastUpdateTime) * this.playbackSpeed
    this.lastUpdateTime = now

    this.currentTime += deltaTime

    // Loop or stop at end
    const maxDuration = this.getMaxDuration()
    if (this.currentTime >= maxDuration) {
      this.currentTime = 0 // Loop
    }

    this.updateAllTracks()

    this.animationFrameId = requestAnimationFrame(() => this.animate())
  }

  updateAllTracks() {
    this.tracks.forEach(track => {
      if (!track.muted && !track.locked) {
        this.updateTrack(track, this.currentTime)
      }
    })
  }

  updateTrack(track, time) {
    const activeClips = track.getActiveClipsAt(time)

    activeClips.forEach(clip => {
      const frameData = clip.getFrameAtTime(time)
      if (!frameData) {
        return
      }

      const { frame1, frame2, t } = frameData

      // Get target object
      let targetObject = null
      if (clip.sourceClip.targetType === 'camera') {
        targetObject = this.sceneManager.getCamera()
      } else {
        const scene = this.sceneManager.getScene()
        targetObject = scene.children.find(obj => obj.userData.id === clip.sourceClip.targetId)
      }

      if (!targetObject) {
        return
      }

      // Interpolate and apply transform
      if (clip.sourceClip.targetType === 'object') {
        targetObject.position.lerpVectors(frame1.position, frame2.position, t)
        targetObject.rotation.x = this.lerpAngle(frame1.rotation.x, frame2.rotation.x, t)
        targetObject.rotation.y = this.lerpAngle(frame1.rotation.y, frame2.rotation.y, t)
        targetObject.rotation.z = this.lerpAngle(frame1.rotation.z, frame2.rotation.z, t)
        targetObject.scale.lerpVectors(frame1.scale, frame2.scale, t)
      } else if (clip.sourceClip.targetType === 'camera') {
        targetObject.position.lerpVectors(frame1.position, frame2.position, t)
        targetObject.rotation.x = this.lerpAngle(frame1.rotation.x, frame2.rotation.x, t)
        targetObject.rotation.y = this.lerpAngle(frame1.rotation.y, frame2.rotation.y, t)
        targetObject.rotation.z = this.lerpAngle(frame1.rotation.z, frame2.rotation.z, t)
      }
    })
  }

  lerpAngle(a, b, t) {
    let diff = b - a
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    return a + diff * t
  }

  getCurrentTime() {
    return this.currentTime
  }

  isCurrentlyPlaying() {
    return this.isPlaying
  }
}

