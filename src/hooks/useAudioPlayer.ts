import { useEffect, useRef, useState, useCallback } from "react";
import { Audio, AVPlaybackStatus } from "expo-av";

interface AudioPlayerState {
  isPlaying: boolean;
  isLoaded: boolean;
  durationMs: number;
  positionMs: number;
  progress: number;
}

export default function useAudioPlayer(source: number) {
  const sound = useRef<Audio.Sound | null>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoaded: false,
    durationMs: 0,
    positionMs: 0,
    progress: 0,
  });

  useEffect(() => {
    return () => {
      sound.current?.unloadAsync();
    };
  }, []);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    const duration = status.durationMillis ?? 0;
    const position = status.positionMillis ?? 0;

    setState({
      isPlaying: status.isPlaying,
      isLoaded: true,
      durationMs: duration,
      positionMs: position,
      progress: duration > 0 ? position / duration : 0,
    });

    if (status.didJustFinish) {
      sound.current?.setPositionAsync(0);
      setState((prev) => ({ ...prev, isPlaying: false, positionMs: 0, progress: 0 }));
    }
  }, []);

  const load = useCallback(async () => {
    if (sound.current) return;
    const { sound: s } = await Audio.Sound.createAsync(source, {
      shouldPlay: false,
    });
    s.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
    sound.current = s;
    const status = await s.getStatusAsync();
    if (status.isLoaded) {
      setState((prev) => ({
        ...prev,
        isLoaded: true,
        durationMs: status.durationMillis ?? 0,
      }));
    }
  }, [source, onPlaybackStatusUpdate]);

  const togglePlayPause = useCallback(async () => {
    if (!sound.current) {
      await load();
    }
    const status = await sound.current?.getStatusAsync();
    if (status?.isLoaded) {
      if (status.isPlaying) {
        await sound.current?.pauseAsync();
      } else {
        await sound.current?.playAsync();
      }
    }
  }, [load]);

  const seekTo = useCallback(async (fraction: number) => {
    if (!sound.current) return;
    const status = await sound.current.getStatusAsync();
    if (status.isLoaded && status.durationMillis) {
      await sound.current.setPositionAsync(fraction * status.durationMillis);
    }
  }, []);

  return { ...state, togglePlayPause, seekTo, load };
}
