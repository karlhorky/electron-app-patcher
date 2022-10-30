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
  console.log('    $ yarn patch signal');
  process.exit(1);
}

const patchFile = `./patches/${process.argv[2]!}.ts`;

if (!existsSync(patchFile)) {
  console.log(`Patch file ${patchFile} not found`);
  process.exit(1);
}

export type PatchConfig = {
  resourcesPath: string;
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

if (!patch.resourcesPath || !existsSync(patch.resourcesPath)) {
  console.log(
    `Directory does not exist at resourcesPath ${patch.resourcesPath}`,
  );
  process.exit(1);
}

const appAsarPath = `${patch.resourcesPath}/app.asar`;
const appAsarBakPath = `${patch.resourcesPath}/app.asar.bak`;

if (!existsSync(appAsarPath)) {
  console.log(
    `resourcesPath directory ${patch.resourcesPath} doesn't contain app.asar, patch already applied?`,
  );
  process.exit(1);
}

if (process.argv[3] === 'restore-backup') {
  console.log('Restoring backup of app.asar');
  createReadStream(appAsarBakPath).pipe(createWriteStream(appAsarPath));
  process.exit(0);
} else if (process.argv[3] === 'delete-backup') {
  console.log('Deleting backup of app.asar');
  rmSync(appAsarBakPath);
  process.exit(0);
}

// Create a backup of the app.asar file if one doesn't already exist.
if (!existsSync(appAsarBakPath)) {
  console.log('Creating a backup of app.asar');
  createReadStream(appAsarPath).pipe(createWriteStream(appAsarBakPath));
}

const appPath = `${patch.resourcesPath}/app`;

await execP(`yarn asar extract ${appAsarPath} ${appPath}`);

for (const { filePath: relativeFilePath, transform } of patch.transforms) {
  const filePath = `${appPath}/${relativeFilePath}`;
  console.log(`Processing ${relativeFilePath}...`);
  const newContents = transform(readFileSync(filePath, 'utf8'));
  writeFileSync(filePath, newContents);
}

console.log('Repacking app.asar to enable patch...');

await execP(`yarn asar pack ${appPath} ${appAsarPath}`);

// TODO: get hash, edit Info.plist
const fileHash = createHash('SHA256')
  .update(
    getRawHeader('/Applications/Signal.app/Contents/Resources/app.asar')
      .headerString,
  )
  .digest('hex');

console.log('Updating hash in Info.plist to bypass asar integrity check...');
const plistPath = `${patch.resourcesPath}/../Info.plist`;
writeFileSync(
  plistPath,
  readFileSync(plistPath, 'utf8').replace(
    /(<key>ElectronAsarIntegrity<\/key><dict><key>Resources\/app.asar<\/key><dict><key>algorithm<\/key><string>SHA256<\/string><key>hash<\/key><string>)[a-f0-9]{64}(<\/string><\/dict><\/dict>)/,
    `$1${fileHash}$2`,
  ),
);

console.log('Done!');
