const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const REPO_OWNER = 'nexuss0781';
const REPO_NAME = 'NexussAI';
const RELEASE_TAG = `v1.0.0-android-${Date.now()}`;
const RELEASE_NAME = `Nexuss AI Android Native App v1.0.0`;

// Read tokens
const EXPO_TOKEN = process.env.EXPO || process.env.EXPO_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB;

if (!GITHUB_TOKEN) {
  console.error('CRITICAL ERROR: GITHUB Personal Access Token is not set in environment variable "GITHUB"!');
  process.exit(1);
}

if (!EXPO_TOKEN) {
  console.warn('WARNING: EXPO access token (environment variable "EXPO" or "EXPO_TOKEN") is not set in this shell.');
  console.warn('The build script will attempt to proceed, but if EAS commands fail, please ensure EXPO is configured.');
}

// Ensure EXPO_TOKEN is exported for EAS CLI
if (EXPO_TOKEN) {
  process.env.EXPO_TOKEN = EXPO_TOKEN;
}

// Helper to make HTTPS requests
function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, headers: res.headers, data });
        } else {
          reject(new Error(`Request failed with status ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    if (body) {
      if (typeof body === 'string') {
        req.write(body);
      } else {
        req.write(body);
      }
    }
    req.end();
  });
}

// Download a file
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve());
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function run() {
  const nativeAppDir = __dirname;
  console.log(`[1/5] Initializing Expo project in ${nativeAppDir}...`);

  try {
    // 1. Initialise EAS project if needed
    console.log('Registering/linking Expo project with EAS...');
    try {
      execSync('npx -y eas-cli project:init --non-interactive --force', {
        cwd: nativeAppDir,
        stdio: 'inherit',
      });
    } catch (e) {
      console.log('EAS project init returned or already initialized:', e.message);
    }

    // 2. Run EAS build
    console.log('[2/5] Triggering EAS Cloud Android Build (APK preview)...');
    console.log('This will build a high-performance APK on Expo EAS servers...');
    
    // Trigger the EAS build
    const buildOutput = execSync('npx -y eas-cli build --platform android --profile preview --non-interactive --wait', {
      cwd: nativeAppDir,
      encoding: 'utf8',
    });

    console.log('EAS Build Output received successfully!');
    
    // Find the APK download URL from EAS output
    // EAS prints something like: "Android app: https://expo.dev/artifacts/eas/..."
    const apkUrlRegex = /(https:\/\/expo\.dev\/artifacts\/eas\/[^\s]+)/;
    const match = buildOutput.match(apkUrlRegex);
    let apkUrl = null;

    if (match && match[1]) {
      apkUrl = match[1];
      console.log(`Found APK download URL: ${apkUrl}`);
    } else {
      console.log('Could not parse APK URL directly from build output. Attempting to fetch build list...');
      const listOutput = execSync('npx -y eas-cli build:list --platform android --limit 1 --json --non-interactive', {
        cwd: nativeAppDir,
        encoding: 'utf8',
      });
      const builds = JSON.parse(listOutput);
      if (builds && builds.length > 0 && builds[0].artifacts && builds[0].artifacts.buildUrl) {
        apkUrl = builds[0].artifacts.buildUrl;
        console.log(`Successfully fetched APK url from EAS build history: ${apkUrl}`);
      } else {
        throw new Error('Could not retrieve compiled APK URL from EAS.');
      }
    }

    // 3. Download APK
    const apkLocalPath = path.join(nativeAppDir, 'NexussAI.apk');
    console.log(`[3/5] Downloading compiled APK to ${apkLocalPath}...`);
    await downloadFile(apkUrl, apkLocalPath);
    console.log('APK downloaded successfully!');

    // 4. Create GitHub Release
    console.log(`[4/5] Creating GitHub release ${RELEASE_TAG} on ${REPO_OWNER}/${REPO_NAME}...`);
    
    const releaseBody = JSON.stringify({
      tag_name: RELEASE_TAG,
      target_commitish: 'main',
      name: RELEASE_NAME,
      body: `Nexuss AI Native Android App.\n\n### Features:\n* Fully Native UI with dark cinematic design & neon glowing orb centerpiece.\n* Live OTA Updates (\`expo-updates\`) implemented so updates land live instantly without requiring user manual updates!\n* Connected to https://nexussai.wasmer.app/api/chat API backend.`,
      draft: false,
      prerelease: false
    });

    const createReleaseOpts = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/releases`,
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Nexuss-App-Builder',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(releaseBody)
      }
    };

    const releaseResponse = await request(createReleaseOpts, releaseBody);
    const releaseData = JSON.parse(releaseResponse.data);
    const releaseId = releaseData.id;
    console.log(`GitHub Release created successfully! ID: ${releaseId}`);

    // 5. Upload APK to Release
    console.log(`[5/5] Uploading APK asset to GitHub Release...`);
    const apkStats = fs.statSync(apkLocalPath);
    const apkStream = fs.readFileSync(apkLocalPath);

    const uploadOpts = {
      hostname: 'uploads.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/releases/${releaseId}/assets?name=NexussAI.apk`,
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Nexuss-App-Builder',
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': apkStats.size
      }
    };

    const uploadResponse = await request(uploadOpts, apkStream);
    console.log('APK uploaded to GitHub Release successfully!');
    console.log(`Download release link: https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${RELEASE_TAG}`);

    // Clean up
    fs.unlinkSync(apkLocalPath);
    console.log('Build & release pipeline completed successfully!');

  } catch (err) {
    console.error('Pipeline failed with error:', err.message);
    process.exit(1);
  }
}

run();
