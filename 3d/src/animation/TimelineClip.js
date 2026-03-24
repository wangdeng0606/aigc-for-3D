// Represents a clip instance on a timeline track
export class TimelineClip {
  constructor(sourceClip, trackId, startTime = 0) {
    this.id = this.generateClipId()
    this.sourceClipId = sourceClip.id
    this.sourceClip = sourceClip
    this.trackId = trackId
    this.startTime = startTime // When this clip starts on the timeline
    this.duration = sourceClip.duration
    this.trimStart = 0 // Trim from beginning of source
    this.trimEnd = 0 // Trim from end of source
  }

  generateClipId() {
    return `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getEndTime() {
    return this.startTime + this.getPlaybackDuration()
  }

  getPlaybackDuration() {
    return this.duration - this.trimStart - this.trimEnd
  }

  setStartTime(time) {
    this.startTime = Math.max(0, time)
  }

  // Check if this clip is active at a given time
  isActiveAt(time) {
    return time >= this.startTime && time < this.getEndTime()
  }

  // Get the frame data at a specific timeline time
  getFrameAtTime(time) {
    if (!this.isActiveAt(time)) {
      return null
    }

    // Calculate the time within the source clip
    const relativeTime = time - this.startTime + this.trimStart
    
    // Find the appropriate frame in the source clip
    const frames = this.sourceClip.frames
    if (frames.length === 0) {
      return null
    }

    // Find the two frames to interpolate between
    let frameIndex = 0
    for (let i = 0; i < frames.length - 1; i++) {
      if (frames[i].timestamp <= relativeTime && frames[i + 1].timestamp > relativeTime) {
        frameIndex = i
        break
      }
    }

    const frame1 = frames[frameIndex]
    const frame2 = frames[Math.min(frameIndex + 1, frames.length - 1)]

    // Calculate interpolation factor
    let t = 0
    if (frame2.timestamp !== frame1.timestamp) {
      t = (relativeTime - frame1.timestamp) / (frame2.timestamp - frame1.timestamp)
    }

    return { frame1, frame2, t }
  }
}
