/**
 * Let go of a control the moment the pointer does.
 *
 * A button keeps the focus a click gave it, and the emphasised treatment then
 * sits on it after the pointer has moved on — a control that looks live when
 * nothing is on it. Browsers disagree about when that happens (some never focus
 * a button on click, some do and apply `:focus-visible` with it), so this does
 * not try to detect the case: it drops focus on `pointerup`, which by
 * definition only fires for a pointer.
 *
 * A keyboard activation fires no pointer event at all, so the focus ring
 * survives for the people who need to see where they are.
 */
export function release(event: React.PointerEvent<HTMLElement>) {
  event.currentTarget.blur();
}
