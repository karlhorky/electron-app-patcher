# Electron App Patcher

## Install

```bash
$ yarn
```

## Use

```bash
$ yarn patch signal # Or other patches you added in your `patches` folder
yarn run v1.22.19
$ node --loader ts-node/esm index.ts signal
Processing preload.bundle.js...
Repacking app.asar to enable patch...
Updating hash in Info.plist to bypass asar integrity check...
Done!
✨  Done in 6.66s.
```

### Restore `app.asar` backup

```bash
$ yarn patch signal restore-backup
```

### Delete `app.asar` backup

```bash
$ yarn patch signal delete-backup
```

## Troubleshooting

### macOS Security Warning

Newer versions of macOS may prevent the app where you run the script from modifying apps on your computer and require you to allow access manually:

<figure>
  <img src="macos-security-prevented-modifying-apps.png" alt="" />
  <figcaption>
    Screenshot of security notification in macOS showing the message `"Visual Studio Code" was prevented from modifying apps on your Mac`.
  </figcaption>
</figure>

## Credit

Credit for the original script goes to [@degecko](https://github.com/degecko):

- https://www.codepicky.com/hacking-electron-restyle-skype
- https://github.com/codepicky/skype-patch
