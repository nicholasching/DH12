#!/usr/bin/env node

/**
 * Check if Cloudflare Tunnel prerequisites are met
 *
 * Notes:
 * - On Windows, cloudflared stores cert/credentials under your user profile/AppData.
 * - Tunnel credentials are typically saved as: <tunnel-id>.json
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

let hasErrors = false;

console.log("🔍 Checking Cloudflare Tunnel prerequisites...\n");

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function firstExisting(paths) {
  for (const p of paths) if (exists(p)) return p;
  return null;
}

function readTextSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

// 1) Check if cloudflared is available on PATH
try {
  execSync("cloudflared --version", { stdio: "ignore" });
  console.log("✅ cloudflared CLI is installed (on PATH)");
} catch (error) {
  console.error("❌ cloudflared CLI not found on PATH");
  console.error("   Fix: install cloudflared and ensure it's on PATH");
  console.error(
    "   Docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/\n"
  );
  hasErrors = true;
}

// 2) Check config file and extract tunnel id / credentials-file (optional)
const repoRoot = path.join(__dirname, "..");
const configPath = path.join(repoRoot, "cloudflared-config.yml");
let tunnelId = null;
let explicitCredentialsFile = null;

if (!exists(configPath)) {
  console.error("❌ Missing: cloudflared-config.yml");
  console.error("   Copy from cloudflared-config.yml.example and update with your tunnel ID\n");
  hasErrors = true;
} else {
  const configContent = readTextSafe(configPath);
  if (!configContent) {
    console.error("❌ Unable to read: cloudflared-config.yml\n");
    hasErrors = true;
  } else if (configContent.includes("<TUNNEL_ID>")) {
    console.error("❌ Config file contains placeholder <TUNNEL_ID>");
    console.error("   Update cloudflared-config.yml with your actual tunnel ID\n");
    hasErrors = true;
  } else {
    // very small "parser" for common keys
    const tunnelMatch = configContent.match(/^\s*tunnel:\s*([^\s#]+)\s*$/m);
    if (tunnelMatch) tunnelId = tunnelMatch[1].trim();

    const credsMatch = configContent.match(/^\s*credentials-file:\s*([^\n#]+)\s*$/m);
    if (credsMatch) explicitCredentialsFile = credsMatch[1].trim();

    if (!tunnelId) {
      console.error("❌ Could not find `tunnel:` in cloudflared-config.yml\n");
      hasErrors = true;
    } else {
      console.log(`✅ Config file found (tunnel: ${tunnelId})`);
    }
  }
}

// 3) Check that tunnel credentials exist (either explicit path or default locations)
if (tunnelId) {
  const userProfile = process.env.USERPROFILE || "";
  const appData = process.env.APPDATA || "";

  const candidateCreds = [];

  if (explicitCredentialsFile) {
    candidateCreds.push(explicitCredentialsFile);
  } else {
    // Common default locations on Windows / cross-platform
    if (userProfile) {
      candidateCreds.push(path.join(userProfile, ".cloudflared", `${tunnelId}.json`));
    }
    if (appData) {
      candidateCreds.push(path.join(appData, ".cloudflared", `${tunnelId}.json`));
      // Seen in some installs (your machine): %APPDATA%\SPB_Data\.cloudflared
      candidateCreds.push(path.join(appData, "SPB_Data", ".cloudflared", `${tunnelId}.json`));
    }
    // Repo-local fallback (not recommended, but supported)
    candidateCreds.push(path.join(repoRoot, ".cloudflared", `${tunnelId}.json`));
    candidateCreds.push(path.join(repoRoot, ".cloudflared", "credentials.json"));
  }

  const foundCreds = firstExisting(candidateCreds);
  if (!foundCreds) {
    console.error("❌ Tunnel credentials not found");
    console.error("   Expected one of:");
    for (const p of candidateCreds) console.error(`   - ${p}`);
    console.error("\n   Fix:");
    console.error("   - Run: npm run tunnel:create  (creates <tunnel-id>.json)");
    console.error("   - Ensure you're using the same tunnel id in cloudflared-config.yml\n");
    hasErrors = true;
  } else {
    console.log(`✅ Tunnel credentials found: ${foundCreds}`);
  }
}

console.log("");

if (hasErrors) {
  console.error("⚠️  Please fix the errors above before running the tunnel.");
  process.exit(1);
} else {
  console.log("✅ All prerequisites met! You can run: npm run dev:tunnel");
  process.exit(0);
}
