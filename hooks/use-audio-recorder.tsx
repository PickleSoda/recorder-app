import { useEffect, useRef, useState } from 'react'
import { audioBufferToWav } from '@/lib/towav'

export type ReactMediaRecorderRenderProps = {
  startRecording: () => void;          // Start recording
  stopRecording: () => void;           // Stop recording
  pauseRecording?: () => void;         // Pause recording
  resumeRecording?: () => void;        // Resume recording
  cancelRecording?: () => void;        // Cancel recording
  blob: Blob | null;                   // Audio data blob
  status?: RecordStatus
  previewAudioStream?: MediaStream | null
  mediaChunks?: Blob[]
  fileSize?: number
  duration?: number
}

// Recording configuration
export type recorderConfig = {
  sampleBits?: 8 | 16 | 32             // Sample bit depth
  sampleRate?: number                  // Sample rate
  channelsCount?: number              // Number of audio channels
}

export enum RecordStatus {
  Idle,
  Recording,
  Stopped,
  Paused,
  Canceled,
  PermissionDenied,
  RecorderError
}

export const useAudioRecorder = (recorderConfig?: recorderConfig): ReactMediaRecorderRenderProps => {
  const audioContext = useRef<AudioContext | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const mediaStream = useRef<MediaStream | null>(null)
  const mediaChunks = useRef<Blob[]>([])

  const fileSize = useRef<number>(0)     // File size in bytes
  const duration = useRef<number>(0)     // Recording duration

  const [status, setStatus] = useState<RecordStatus>(RecordStatus.Idle)
  const [mediaBLob, setMediaBlob] = useState<Blob | null>(null)

  useEffect(() => {
    // Check if browser supports MediaRecorder
    if (!window.MediaRecorder) {
      setStatus(RecordStatus.RecorderError)
    }
  }, [])

  const startRecording = async () => {
    // Reset previous blob
    setMediaBlob(null)

    // Initialize audio context
    if (!audioContext.current) {
      audioContext.current = new AudioContext({
        sampleRate: recorderConfig?.sampleRate || 16000
      })
    }

    // Get user media stream
    if (!mediaStream.current) {
      try {
        mediaStream.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: recorderConfig?.channelsCount || 2,
            sampleRate: recorderConfig?.sampleRate || 16000,
          }
        })
      } catch (e) {
        console.error(e)
        setStatus(RecordStatus.PermissionDenied)
      }
    }

    // If media stream still missing
    if (!mediaStream.current) {
      setStatus(RecordStatus.PermissionDenied)
      return
    }

    // Restart if stream has ended
    const isSteamEnded = mediaStream.current.getTracks().some((track) => track.readyState === 'ended')
    if (isSteamEnded) {
      mediaStream.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: recorderConfig?.channelsCount || 2,
          sampleRate: recorderConfig?.sampleRate || 16000,
        }
      })
    }

    // Create MediaRecorder instance
    mediaRecorder.current = new MediaRecorder(mediaStream.current)

    // When data is available
    mediaRecorder.current.ondataavailable = async ({ data }: BlobEvent) => {
      if (RecordStatus.Canceled === status) {
        return
      }

      if (audioContext.current) {
        audioContext.current.decodeAudioData(
          await data.arrayBuffer(),
          (audioBuffer: AudioBuffer) => {
            // Convert AudioBuffer to WAV format
            const wavArrayBuffer = audioBufferToWav(audioBuffer, {
              bitDepth: recorderConfig?.sampleBits || 16
            })
            const wavBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' })
            setMediaBlob(wavBlob)
          },
          (err: unknown) => {
            console.log(err)
            setStatus(RecordStatus.RecorderError)
          }
        )
      }
    }

    mediaRecorder.current.onstop = () => {
      setStatus(RecordStatus.Stopped)
    }

    mediaRecorder.current.start()
    setStatus(RecordStatus.Recording)
  }

  const pauseRecording = () => {
    if (!mediaRecorder.current || mediaRecorder.current.state !== 'recording') {
      return
    }
    mediaRecorder.current.pause()
    setStatus(RecordStatus.Paused)
  }

  const resumeRecording = () => {
    if (!mediaRecorder.current || mediaRecorder.current.state !== 'paused') {
      return
    }
    mediaRecorder.current.resume() // Fixed: should call `resume()`, not `pause()`
    setStatus(RecordStatus.Recording)
  }

  const stopRecording = () => {
    if (!mediaRecorder.current) {
      return
    }

    // Stop all audio tracks
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach((track) => track.stop());
    }

    // Stop media recorder
    if (mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }

    setStatus(RecordStatus.Stopped)
  }

  const cancelRecording = () => {
    if (!mediaRecorder.current) {
      return
    }

    // Stop audio tracks
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach((track) => track.stop());
    }

    setStatus(RecordStatus.Canceled)

    // Stop recorder
    if (mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
  }

  return {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    blob: mediaBLob,
    mediaChunks: mediaChunks.current,
    fileSize: fileSize.current,
    duration: duration.current,
    status,
    previewAudioStream: mediaStream.current
      ? new MediaStream(mediaStream.current.getAudioTracks())
      : null
  }
}
