'use client';

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { OTPInput, type SlotProps } from 'input-otp';
import { cn } from '@/components/richbox/lib/utils';

export interface PasswordProps {
  length?: 4 | 5 | 6;
  speed?: number;
  mask?: boolean;
  captureUnfocusedInput?: boolean;
}

// With reduced motion, every change applies instantly, fades included.
const INSTANT = { duration: 0 } as const;

const springTransition = (speed: number, reduceMotion: boolean, visualDuration = 0.18) => (
  reduceMotion ? INSTANT : { type: 'spring' as const, visualDuration: visualDuration / speed, bounce: 0.15 }
);
const fadeTransition = (speed: number, reduceMotion: boolean) => (
  reduceMotion ? INSTANT : { type: 'tween' as const, duration: 0.08 / speed, ease: 'easeOut' as const }
);

function blurIOSSelection(input: HTMLInputElement | null) {
  // iOS paints selection handles above CSS. Dismiss them once editing is locked.
  if (CSS.supports('-webkit-touch-callout', 'none')) input?.blur();
}

// Motion runs opacity on the browser's animation engine (WAAPI) unless the element has onUpdate.
// In motion-dom 12.43 the element shows its stale inline opacity for one frame after that animation
// ends: a fade-out flashes back to full, a fade-in dips back to its start. Passing onUpdate keeps
// these small fades on Motion's own frame loop, which writes every frame.
const keepOnMainThread = () => {};

// Digit entry uses a light spring; opacity and exit ease out.
function AnimatedNumber({ value, speed, mask, reduceMotion }: {
  value: string | null;
  speed: number;
  mask: boolean;
  reduceMotion: boolean;
}) {
  return (
    <div className="relative flex h-[40px] w-[32px] items-center justify-center overflow-hidden">
      <AnimatePresence key={mask ? 'masked' : 'plain'} initial={false} mode="wait">
        <motion.span
          key={value}
          initial={reduceMotion ? false : { opacity: 0.25, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{
            opacity: 0,
            y: 0,
            transition: fadeTransition(speed, reduceMotion),
          }}
          transition={{
            y: springTransition(speed, reduceMotion, 0.15),
            opacity: fadeTransition(speed, reduceMotion),
          }}
          className={cn('absolute', value === null && 'text-[var(--deslop-primary-40)]')}
          onUpdate={keepOnMainThread}
        >
          {value === null ? '0' : mask ? (
            <svg
              viewBox="0 0 12 12"
              className="block size-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M6 1v10M1.67 3.5l8.66 5M1.67 8.5l8.66-5" />
            </svg>
          ) : value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function Slot(props: SlotProps & {
  isShaking: boolean;
  isVerifying: boolean;
  delay: number;
  pulseRepeatDelay: number;
  speed: number;
  mask: boolean;
  reduceMotion: boolean;
}) {
  const pulse = props.isVerifying && !props.reduceMotion;
  return (
    <motion.div
      layout
      aria-hidden="true"
      className={cn(
        'relative flex h-[40px] w-[36px] items-center justify-center rounded-xl [corner-shape:superellipse(1.3)] bg-[var(--deslop-elevation-1)] text-base font-semibold text-foreground',
        props.isVerifying && 'text-[var(--deslop-primary-60)]',
      )}
      animate={{ opacity: pulse ? [1, 0.4, 1] : 1 }}
      transition={{
        opacity: pulse ? {
          type: 'tween',
          duration: 0.6 / props.speed,
          delay: props.delay / props.speed / 1000,
          ease: [0.42, 0, 0.58, 1],
          times: [0, 0.5, 1],
          repeat: Infinity,
          repeatDelay: props.pulseRepeatDelay / props.speed,
        } : { duration: 0 },
      }}
    >
      <AnimatedNumber value={props.char} speed={props.speed} mask={props.mask} reduceMotion={props.reduceMotion} />
      {props.isActive ? (
        <motion.div
          layoutId="indicator"
          className={cn(
            'absolute inset-0 z-10 rounded-xl [corner-shape:superellipse(1.3)] border-3',
            props.isShaking ? 'border-[var(--accent-red)]' : 'border-[var(--accent-blue)]',
            props.isVerifying && 'border-none',
          )}
          style={{ transition: `border-color ${props.isShaking || props.reduceMotion ? 0 : 150 / props.speed}ms ease-out` }}
          transition={props.reduceMotion ? INSTANT : { duration: 0.12 / props.speed, ease: 'easeInOut' }}
        />
      ) : null}
    </motion.div>
  );
}

/** Adapted from Smintfy/ui-snippet. See LICENSE for the original MIT license. */
export function Password({
  length = 6,
  speed = 1,
  mask = false,
  captureUnfocusedInput = false,
}: PasswordProps) {
  const correctCode = '123456'.slice(0, length);
  const [value, setValue] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [message, setMessage] = useState('');
  const otpRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const reduceMotion = useReducedMotion() ?? false;
  const spring = springTransition(speed, reduceMotion);
  const fade = fadeTransition(speed, reduceMotion);
  // Keep each cell at 36×40; animate spacing and row width without scaling it.
  const rowWidth = length * 36 + (length - 1) * 4 + (length === 6 ? 20 : 0);

  useLayoutEffect(() => {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setValue('');
    setIsVerifying(false);
    setIsShaking(false);
    setMessage('');
    otpRef.current?.focus();
    otpRef.current?.setSelectionRange(0, 0);
  }, [length]);

  useEffect(() => () => {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
  }, []);

  // Clear the error after the shake. A timer rather than onAnimationComplete,
  // so it also clears when reduced motion skips the shake.
  useEffect(() => {
    if (!isShaking) return;
    const timeout = setTimeout(() => setIsShaking(false), 500 / speed);
    return () => clearTimeout(timeout);
  }, [isShaking, speed]);

  const verifyCode = useCallback((code: string) => {
    if (timeoutRef.current !== null || code.length !== length) return;
    setIsVerifying(true);
    blurIOSSelection(otpRef.current);
    setMessage('');
    timeoutRef.current = setTimeout(() => {
      if (code === correctCode) {
        setMessage('Successfully verified');
      } else {
        setIsShaking(true);
        setMessage('Invalid validation code');
      }
      // Clear both outcomes; on iOS, wait for a tap before focusing again.
      setValue('');
      setIsVerifying(false);
      timeoutRef.current = null;
      if (!CSS.supports('-webkit-touch-callout', 'none')) {
        otpRef.current?.focus();
        otpRef.current?.setSelectionRange(0, 0);
      }
    }, 2000);
  }, [correctCode, length]);

  const handleChange = useCallback((nextValue: string) => {
    // Lock immediately, including events before React commits readOnly.
    if (timeoutRef.current !== null) return;
    if (!/^\d*$/.test(nextValue)) {
      setIsShaking(true);
      return;
    }
    if (nextValue === value) return;
    setValue(nextValue);
    setMessage('');
    if (nextValue.length === length) verifyCode(nextValue);
  }, [value, length, verifyCode]);

  useEffect(() => {
    if (!captureUnfocusedInput) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || event.metaKey || event.ctrlKey || event.altKey || !/^[0-9]$/.test(event.key)) return;
      const input = otpRef.current;
      const target = event.target;
      if (!input || timeoutRef.current !== null || document.activeElement === input) return;
      // Leave other editable controls and their keyboard behavior alone.
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select, [role="textbox"], [role="combobox"], [role="spinbutton"]'))) return;

      event.preventDefault();
      input.focus({ preventScroll: true });
      if (value.length < length) {
        handleChange(value + event.key);
        input.setSelectionRange(value.length + 1, value.length + 1);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [captureUnfocusedInput, handleChange, length, value]);

  return (
    <form
      className="flex w-fit flex-col"
      aria-label="Verification code"
      onSubmit={(event) => {
        event.preventDefault();
        verifyCode(value);
      }}
    >
      <LayoutGroup id={id}>
        <motion.div
          animate={isShaking && !reduceMotion ? { x: [0, -5, 5, -2.5, 2.5, 0] } : { x: 0 }}
          transition={{ duration: 0.5 / speed }}
        >
          <OTPInput
            ref={otpRef}
            autoFocus
            aria-label={`${length}-digit verification code`}
            aria-describedby={`${id}-message`}
            aria-invalid={message === 'Invalid validation code'}
            aria-busy={isVerifying}
            readOnly={isVerifying}
            value={value}
            maxLength={length}
            inputMode="numeric"
            type={mask ? 'password' : 'text'}
            autoComplete="one-time-code"
            pushPasswordManagerStrategy="none"
            containerClassName="group flex items-center"
            onFocus={(event) => {
              if (timeoutRef.current !== null) blurIOSSelection(event.currentTarget);
            }}
            onChange={handleChange}
            render={({ slots }) => (
              <motion.div
                className="relative h-10"
                initial={false}
                animate={{ width: rowWidth }}
                transition={spring}
              >
                <AnimatePresence initial={false}>
                  {slots.map((slot, index) => (
                    <motion.div
                      key={index}
                      className="absolute left-0 top-0"
                      // Transformed cell wrappers create separate stacking contexts.
                      // Keep the moving focus ring above neighboring cell surfaces.
                      style={{ zIndex: slot.isActive ? 1 : 0 }}
                      initial={reduceMotion ? false : { opacity: 0, y: 15, x: index * 40 + (length === 6 && index >= 3 ? 20 : 0) }}
                      animate={{ opacity: 1, y: 0, x: index * 40 + (length === 6 && index >= 3 ? 20 : 0) }}
                      exit={{ opacity: 0 }}
                      transition={{ x: spring, y: spring, opacity: fade }}
                      onUpdate={keepOnMainThread}
                    >
                      <Slot {...slot} isShaking={isShaking} isVerifying={isVerifying}
                        delay={index * 100} speed={speed} mask={mask} reduceMotion={reduceMotion}
                        // Start the next wave as soon as the last slot finishes.
                        pulseRepeatDelay={(length - 1) * 0.1} />
                    </motion.div>
                  ))}
                  {length === 6 ? (
                    <motion.div
                      key="separator"
                      aria-hidden="true"
                      className="absolute left-[124px] top-[19px] h-0.5 w-2 rounded-full bg-[var(--deslop-primary-20)]"
                      initial={reduceMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={fade}
                      onUpdate={keepOnMainThread}
                    />
                  ) : null}
                </AnimatePresence>
              </motion.div>
            )}
          />
        </motion.div>
      </LayoutGroup>
      <span id={`${id}-message`} role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {isVerifying ? 'Verifying your code…' : message}
      </span>
    </form>
  );
}
