// Represents a timeline track that can contain multiple clips
export class TimelineTrack {
  constructor(name = '轨道') {
    this.id = this.generateTrackId()
    this.name = name
    this.clips = []
    this.muted = false
    this.locked = false
  }

  generateTrackId() {
    return `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  addClip(clip) {
    clip.trackId = this.id
    this.clips.push(clip)
    this.sortClips()
  }

  removeClip(clipId) {
    const index = this.clips.findIndex(c => c.id === clipId)
    if (index !== -1) {
      this.clips.splice(index, 1)
    }
  }

  getClip(clipId) {
    return this.clips.find(c => c.id === clipId)
  }

  sortClips() {
    this.clips.sort((a, b) => a.startTime - b.startTime)
  }

  getActiveClipsAt(time) {
    return this.clips.filter(clip => clip.isActiveAt(time))
  }

  getDuration() {
    if (this.clips.length === 0) {
      return 0
    }
    return Math.max(...this.clips.map(c => c.getEndTime()))
  }
}
