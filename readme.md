# Electron App Patcher

Patch an Electron app to apply your own changes (macOS only for now)

## Install

```bash
$ yarn
```

## Use

```bash
$ yarn patch signal # Or other patches you added in your `patches` folder
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
    <em>
      Screenshot of security notification in macOS showing the message <code>"Visual Studio Code" was prevented from modifying apps on your Mac</code>.
    </em>
  </figcaption>
  <br />
  <br />
</figure>

### Missing Notifications

If notifications do not appear after patching an app, you can create a self-signed certificate in your keychain and re-sign the app with this:

1. Open Keychain Access
2. Open the menu item Keychain Access > Certificate Assistant > Create a Certificate...
3. Choose a descriptive name for your certificate, for example `signal-self-signed-cert`
4. Under "Certificate Type", select "Code Signing"
5. Create the certificate

Then use the `codesign` command in your terminal to sign the patched app:

```bash
$ codesign --force --verbose=4 --sign <certificate name> <app path>
```

For example, for the certificate name `signal-self-signed-cert` and the app `Signal.app`, this would be:

```bash
$ codesign --force --verbose=4 --sign signal-self-signed-cert /Applications/Signal.app
```

After opening the newly re-signed app, you may receive a permissions prompt for access to confidential information in your keychain. Only allow access to information that you believe the app should have access to.

<figure>
  <img src="macos-resigned-app-permissions.png" alt="" />
  <figcaption>
    <em>
      Screenshot of security notification in macOS showing the message <code>Signal wants to use your confidential information stored in "Signal Safe Storage" in your keychain.</code>.
    </em>
  </figcaption>
  <br />
  <br />
</figure>

References:

1. https://stackoverflow.com/a/27474942/1268612
2. https://stackoverflow.com/a/54003560/1268612

## Credit

Credit for the original script goes to [@degecko](https://github.com/degecko):

- https://www.codepicky.com/hacking-electron-restyle-skype
- https://github.com/codepicky/skype-patch
