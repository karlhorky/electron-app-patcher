// Credit for the original script goes to @degecko:
// https://www.codepicky.com/hacking-electron-restyle-skype
// https://github.com/codepicky/skype-patch
import { exec } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  createReadStream,
  createWriteStream,
  existsSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { promisify } from 'node:util';
import { getRawHeader } from '@electron/asar';

const execP = promisify(exec);

if (process.argv.length < 3) {
  console.log(
    'Please specify a patch name inside the `patches` directory, eg. for patches/signal.ts, run:',
  );
  console.log('    $ pnpm patch signal');
  process.exit(1);
}

const patchFile = `./patches/${process.argv[2]!}.ts`;

if (!existsSync(patchFile)) {
  console.log(`Patch file ${patchFile} not found`);
  process.exit(1);
}

export type PatchConfig = {
  appPath: string;
  transforms: {
    filePath: string;
    transform: (content: string) => string;
  }[];
};

const {
  patchConfig: patch,
}: {
  patchConfig: PatchConfig;
} = await import(patchFile);

const resourcesPath = `${patch.appPath}/Contents/Resources`;

if (!patch.appPath || !existsSync(patch.appPath)) {
  console.log(
    `Directory does not exist at app path ${patch.appPath} or resources path ${resourcesPath}`,
  );
  process.exit(1);
}

const appAsarPath = `${resourcesPath}/app.asar`;
const appAsarBakPath = `${resourcesPath}/app.asar.bak`;

if (!existsSync(appAsarPath)) {
  console.log(
    `Resources path directory ${resourcesPath} doesn't contain app.asar`,
  );
  process.exit(1);
}

if (process.argv[3] === 'restore-backup') {
  console.log('Restoring backup of app.asar...');
  createReadStream(appAsarBakPath).pipe(createWriteStream(appAsarPath));
  console.log('Done!');
  process.exit(0);
} else if (process.argv[3] === 'delete-backup') {
  console.log('Deleting backup of app.asar...');
  rmSync(appAsarBakPath);
  console.log('Done!');
  process.exit(0);
}

// Create a backup of the app.asar file if one doesn't already exist.
if (!existsSync(appAsarBakPath)) {
  console.log('Creating a backup of app.asar...');
  createReadStream(appAsarPath).pipe(createWriteStream(appAsarBakPath));
}

const appPath = `${resourcesPath}/app`;

await execP(`pnpm asar extract ${appAsarPath} ${appPath}`);

for (const { filePath: relativeFilePath, transform } of patch.transforms) {
  const filePath = `${appPath}/${relativeFilePath}`;
  console.log(`Processing ${relativeFilePath}...`);
  const newContent = transform(readFileSync(filePath, 'utf8'));
  writeFileSync(filePath, newContent);
}

console.log('Repacking app.asar to enable patch...');

await execP(`pnpm asar pack ${appPath} ${appAsarPath}`);

const fileHash = createHash('SHA256')
  .update(getRawHeader(appAsarPath).headerString)
  .digest('hex');

console.log('Updating hash in Info.plist for asar integrity check...');
const plistPath = `${patch.appPath}/Contents/Info.plist`;
const plistContent = readFileSync(plistPath, 'utf8');
const asarIntegrityRegex =
  /(<key>ElectronAsarIntegrity<\/key>\s*<dict>\s*<key>Resources\/app.asar<\/key>\s*<dict>\s*<key>algorithm<\/key>\s*<string>SHA256<\/string>\s*<key>hash<\/key>\s*<string>)[a-f0-9]{64}(<\/string>\s*<\/dict>\s*<\/dict>)/;
if (!asarIntegrityRegex.test(plistContent)) {
  throw new Error(`Failed to match ElectronAsarIntegrity key search pattern, open Info.plist with:

  code ${plistPath}
`);
}
writeFileSync(
  plistPath,
  plistContent.replace(asarIntegrityRegex, `$1${fileHash}$2`),
);

// Sign app with self-signed certificate
// https://stackoverflow.com/a/27474942/1268612
// https://stackoverflow.com/a/54003560/1268612
console.log('Signing app with self-signed certificate...');
await execP(
  `codesign --force --verbose=4 --sign electron-app-patcher-self-signed-cert ${patch.appPath}`,
);

console.log('Done!');
