import type { PatchConfig } from '../';

export const patchConfig: PatchConfig = {
  appPath: '/Applications/Signal.app',
  transforms: [
    // Patch to focus message composition input when key is
    // pressed PR:
    // - https://github.com/signalapp/Signal-Desktop/pull/4998
    {
      filePath: 'preload.bundle.js',
      transform: (content) => {
        // Match the
        // "(0,sr.useCallback)(()=>{Ir(!1),Kr.current&&Kr.current.submit()},[Kr,Ir]),",
        // which is a minified version of these lines:
        // - https://github.com/signalapp/Signal-Desktop/blob/9ad9b4da0f4447876490e2dbc462a2b7316dd128/ts/components/CompositionArea.tsx#L334-L339
        const pattern =
          /(\(0,([a-zA-Z$_]{1,3})\.useCallback\)\(\(\)=>\{([a-zA-Z$_]{1,3})\(!1\),([a-zA-Z$_]{1,3})\.current&&\4\.current\.submit\(\)\},\[\4,\3\]\)),/;

        if (!pattern.test(content)) {
          throw new Error(`Failed to match patch search pattern, open preload.bundle.js with:

  code /Applications/Signal.app/Contents/Resources/app/preload.bundle.js
`);
        }

        return content.replace(
          pattern,
          `$1;
  // Patch to focus message composition input when key is pressed
  (0, $2.useEffect)(() => {
    const handler = (keydownEvent) => {
      // Don't focus if any modifier keys are pressed (except shift)
      if (keydownEvent.metaKey || keydownEvent.ctrlKey || keydownEvent.altKey) {
        return;
      }

      // Only respond to single printable characters (a-z, 0-9,symbols, etc.)
      if (keydownEvent.key.length !== 1) {
        return;
      }

      const panels = document.querySelectorAll('.conversation .panel');
      if (panels && panels.length > 1) {
        return;
      }

      if (document.activeElement?.nodeName.toLowerCase() === 'input') {
        return;
      }

      $4.current?.focus();
    };

    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  });
  // End patch
let `,
        );
      },
    },
  ],
};
