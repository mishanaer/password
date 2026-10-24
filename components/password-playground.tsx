'use client';

import { useState, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Password } from '@/components/password';
import { Button } from '@/components/richbox/components/ui/button';

export function PasswordPlayground() {
  const [length, setLength] = useState<4 | 5 | 6>(6);
  const [speed, setSpeed] = useState(1);
  const [mask, setMask] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const dark = mounted && resolvedTheme === 'dark';

  return (
    <main>
      <section className="workspace" aria-label="Password playground">
        <div className="preview">
          <div className="otp-stage">
            <Password
              length={length}
              speed={speed}
              mask={mask}
              captureUnfocusedInput
            />
          </div>
        </div>
        <aside aria-label="Password settings">
          <div className="grid gap-5">
            <div className="size-setting">
              <label id="otp-length-label"><span>Code length</span></label>
              <div role="group" aria-labelledby="otp-length-label" className="grid grid-cols-3 gap-2">
                {([4, 5, 6] as const).map((value) => (
                  <Button key={value} variant="tertiary" active={length === value}
                    aria-pressed={length === value} onClick={() => setLength(value)}>
                    {value}
                  </Button>
                ))}
              </div>
            </div>
            <div className="size-setting">
              <label id="otp-speed-label"><span>Animation speed</span></label>
              <div role="group" aria-labelledby="otp-speed-label" className="grid grid-cols-2 gap-2">
                {[0.5, 1].map((value) => (
                  <Button key={value} variant="tertiary" active={speed === value}
                    aria-pressed={speed === value} onClick={() => setSpeed(value)}>
                    {value}×
                  </Button>
                ))}
              </div>
            </div>
            <Button variant="tertiary" active={mask} aria-pressed={mask}
              onClick={() => setMask((value) => !value)}>
              Mask
            </Button>
            <Button variant="tertiary"
              aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}
              onClick={() => setTheme(dark ? 'light' : 'dark')}>
              {dark ? 'Dark theme' : 'Light theme'}
            </Button>
            <Button variant="primary" asChild>
              <a href="https://github.com/mishanaer/password" target="_blank" rel="noopener noreferrer">GitHub</a>
            </Button>
          </div>
        </aside>
      </section>
    </main>
  );
}
