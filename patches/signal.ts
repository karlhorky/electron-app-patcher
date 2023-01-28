import { PatchConfig } from '../';

export const patchConfig: PatchConfig = {
  appPath: '/Applications/Signal.app',
  transforms: [
    // Patch to focus message composition input when key is pressed
    // PR: https://github.com/signalapp/Signal-Desktop/pull/4998
    {
      filePath: 'preload.bundle.js',
      transform: (content) => {
        return content.replace(
          /(^ {2,6}if \(isSignalConversation2\) \{\n {4,8}return \/\* @__PURE__ \*\/)/m,
          `
  // Patch to focus message composition input when key is pressed
  (0, import_react.useEffect)(() => {
    const handler = (e) => {
      const { key } = e;

      if (key.length !== 1) {
        return;
      }

      const panels = document.querySelectorAll('.conversation .panel');
      if (panels && panels.length > 1) {
        return;
      }

      if (document.activeElement?.nodeName.toLowerCase() === 'input') {
        return;
      }

      inputApiRef.current?.focus();
    };

    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  });
  // End patch

$1`,
        );
      },
    },
  ],
};
