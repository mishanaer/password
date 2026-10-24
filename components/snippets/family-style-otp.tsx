'use client';

import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { OTPInput, type SlotProps } from 'input-otp';
import { cn } from '@/components/richbox/lib/utils';

export interface FamilyStyleOTPProps {
  length?: 4 | 5 | 6;
  speed?: number;
  mask?: boolean;
  captureUnfocusedInput?: boolean;
}

const springTransition = (speed: number) => ({
  type: 'spring' as const, visualDuration: 0.18 / speed, bounce: 0.15,
});
const fadeTransition = (speed: number) => ({
  type: 'tween' as const, duration: 0.08 / speed, ease: 'easeOut' as const,
});

// Digit entry uses a light spring; opacity and exit ease out.
function AnimatedNumber({ value, speed, mask }: { value: string | null; speed: number; mask: boolean }) {
  return (
    <div className="relative flex h-[40px] w-[32px] items-center justify-center overflow-hidden">
      <AnimatePresence key={mask ? 'masked' : 'plain'} initial={false} mode="wait">
        <motion.span
          key={value}
          initial={{ opacity: 0.25, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{
            opacity: 0,
            y: 0,
            transition: fadeTransition(speed),
          }}
          transition={{
            y: springTransition(speed),
            opacity: fadeTransition(speed),
          }}
          className={cn('absolute', value === null && 'text-[var(--deslop-primary-40)]')}
        >
          {value === null ? '0' : mask ? '*' : value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function Slot(props: SlotProps & {
  isShaking: boolean;
  isVerifying: boolean;
  delay: number;
  speed: number;
  mask: boolean;
}) {
  return (
    <motion.div
      layout
      aria-hidden="true"
      className={cn(
        'relative flex h-[40px] w-[36px] items-center justify-center rounded-xl [corner-shape:superellipse(1.3)] bg-[var(--deslop-elevation-1)] text-base font-semibold text-foreground',
        props.isVerifying && 'fast-pulse text-[var(--deslop-primary-60)] duration-100',
      )}
      style={{ animationDelay: `${props.delay / props.speed}ms`, animationDuration: `${0.6 / props.speed}s` }}
    >
      <AnimatedNumber value={props.char} speed={props.speed} mask={props.mask} />
      {props.isActive ? (
        <motion.div
          layoutId="indicator"
          className={cn(
            'absolute inset-0 z-10 rounded-xl [corner-shape:superellipse(1.3)] border-3',
            props.isShaking ? 'border-[var(--accent-red)]' : 'border-[var(--accent-blue)]',
            props.isVerifying && 'border-none',
          )}
          transition={{ duration: 0.12 / props.speed, ease: 'easeInOut' }}
        />
      ) : null}
    </motion.div>
  );
}

/** Adapted from Smintfy/ui-snippet. See LICENSE for the original MIT license. */
export function FamilyStyleOTP({
  length = 6,
  speed = 1,
  mask = false,
  captureUnfocusedInput = false,
}: FamilyStyleOTPProps) {
  const correctCode = '123456'.slice(0, length);
  const [value, setValue] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [message, setMessage] = useState('');
  const otpRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const spring = springTransition(speed);
  const fade = fadeTransition(speed);
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

  const verifyCode = useCallback((code: string) => {
    if (timeoutRef.current !== null || code.length !== length) return;
    setIsVerifying(true);
    setMessage('');
    timeoutRef.current = setTimeout(() => {
      if (code === correctCode) {
        setMessage('Successfully verified');
      } else {
        setIsShaking(true);
        setMessage('Invalid validation code');
      }
      // Match upstream: both outcomes clear the digits and restore first-slot focus.
      setValue('');
      setIsVerifying(false);
      timeoutRef.current = null;
      otpRef.current?.focus();
      otpRef.current?.setSelectionRange(0, 0);
    }, 2000);
  }, [correctCode, length]);

  const handleChange = useCallback((nextValue: string) => {
    if (!/^\d*$/.test(nextValue)) {
      setIsShaking(true);
      return;
    }
    if (nextValue === value) return;
    // A pending result belongs to the old code, never to this edit.
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setIsVerifying(false);
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
      if (!input || document.activeElement === input) return;
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
          animate={isShaking ? { x: [0, -5, 5, -2.5, 2.5, 0] } : { x: 0 }}
          transition={{ duration: 0.5 / speed }}
          onAnimationComplete={() => setIsShaking(false)}
        >
          <OTPInput
            ref={otpRef}
            autoFocus
            aria-label={`${length}-digit verification code`}
            aria-describedby={`${id}-message`}
            aria-invalid={message === 'Invalid validation code'}
            aria-busy={isVerifying}
            value={value}
            maxLength={length}
            inputMode="numeric"
            type={mask ? 'password' : 'text'}
            autoComplete="one-time-code"
            pushPasswordManagerStrategy="none"
            containerClassName="group flex items-center"
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
                      initial={{ opacity: 0, y: 15, x: index * 40 + (length === 6 && index >= 3 ? 20 : 0) }}
                      animate={{ opacity: 1, y: 0, x: index * 40 + (length === 6 && index >= 3 ? 20 : 0) }}
                      exit={{ opacity: 0 }}
                      transition={{ x: spring, y: spring, opacity: fade }}
                    >
                      <Slot {...slot} isShaking={isShaking} isVerifying={isVerifying}
                        delay={index * 100} speed={speed} mask={mask} />
                    </motion.div>
                  ))}
                  {length === 6 ? (
                    <motion.div
                      key="separator"
                      aria-hidden="true"
                      className="absolute left-[124px] top-[19px] h-0.5 w-2 rounded-full bg-[var(--deslop-primary-20)]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={fade}
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
