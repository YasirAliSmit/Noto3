import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
} from 'react-native-track-player';
import type { Station } from '../store/useRadioStore';

let isPlayerSetup = false;

export async function setupPlayer() {
  if (isPlayerSetup) {
    return;
  }

  try {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      compactCapabilities: [Capability.Play, Capability.Pause],
      alwaysPauseOnInterruption: true,
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
    });
    isPlayerSetup = true;
  } catch (error) {
    isPlayerSetup = false;
    throw error;
  }
}

export async function playStation(station: Station) {
  await setupPlayer();
  await TrackPlayer.reset();
  await TrackPlayer.add({
    id: station.id,
    url: station.url,
    title: station.name,
    artist: station.artist ?? 'Live Radio',
    artwork: station.artwork,
    genre: 'Radio',
  });
  await TrackPlayer.play();
}
