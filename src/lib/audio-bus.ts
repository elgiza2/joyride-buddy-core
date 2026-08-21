/**
 * Keeps exactly one record spinning at a time.
 * Any player that starts asks every other registered player to stop.
 */
type Stopper = () => void;

const players = new Set<Stopper>();

export function registerPlayer(stop: Stopper) {
  players.add(stop);
  return () => players.delete(stop);
}

export function stopOthers(self: Stopper) {
  for (const stop of players) if (stop !== self) stop();
}
