/** Shared copy for iris photo capture UI and camera modal. */

export type IridologyPhotoStep = {
  title: string;
  detail: string;
};

export const IRIDOLOGY_PHOTO_STEPS: IridologyPhotoStep[] = [
  {
    title: 'Find soft daylight',
    detail: 'Stand near a window with indirect light. Avoid direct sun, flash, and overhead LEDs that create glare on the cornea.',
  },
  {
    title: 'Remove contacts & glasses',
    detail: 'Contact lenses and smudged glasses add artifacts. Take glasses off unless you need them to see the screen.',
  },
  {
    title: 'Fill the frame with the iris',
    detail: 'Pull the upper eyelid up gently. The colored iris should cover most of the photo — not your whole face.',
  },
  {
    title: 'Hold steady for 2 seconds',
    detail: 'Blur hides fiber detail. Rest your phone on something stable or use both hands before tapping capture.',
  },
  {
    title: 'One eye at a time',
    detail: 'Close the other eye. For left/right comparison, repeat with matching light and distance.',
  },
];

export const IRIDOLOGY_PHOTO_DOS = [
  'Use the front camera or mirror + rear camera in bright light',
  'Keep 4–8 inches (10–20 cm) from the eye',
  'Look straight ahead — do not roll the eye',
  'Wipe the lens clean before shooting',
];

export const IRIDOLOGY_PHOTO_DONTS = [
  'No flash — it washes out iris fibers',
  'No filters or beauty mode',
  'No extreme zoom (digital zoom blurs detail)',
  'Do not photograph if the eye is red, painful, or vision is changing — see a doctor',
];

export function iridologyEyeCaptureLabel(eye: 'left' | 'right'): string {
  return eye === 'left' ? 'Left eye — close your right eye' : 'Right eye — close your left eye';
}
