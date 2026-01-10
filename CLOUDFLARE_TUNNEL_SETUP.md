# Cloudflare Tunnel Setup Guide

This guide will help you set up Cloudflare Tunnel to access your local development server via `DH.nicholasching.ca`.

## Why Cloudflare Tunnel?

When accessing your Next.js app via IP address (e.g., `http://192.168.1.100:3000`), Clerk authentication fails because it redirects to `localhost` instead of the IP address. Cloudflare Tunnel solves this by providing a proper domain name that Clerk can work with.

## Prerequisites

1. A Cloudflare account
2. A domain managed by Cloudflare (nicholasching.ca)
3. Cloudflared CLI installed

### Installing Cloudflared

**Windows:**
- Download from [GitHub Releases](https://github.com/cloudflare/cloudflared/releases)
- Extract and add to PATH, or use the installer

**macOS:**
```bash
brew install cloudflared
```

**Linux:**
```bash
# Download from releases or use package manager
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
```

## Setup Steps

### 1. Login to Cloudflare

```bash
npm run tunnel:login
```

This will open your browser to authenticate with Cloudflare. After authentication, credentials will be saved to `.cloudflared/credentials.json`.

### 2. Create a Tunnel

```bash
npm run tunnel:create
```

This creates a tunnel named "DH12" and outputs a tunnel ID (UUID). **Save this tunnel ID** - you'll need it for the next step.

### 3. Configure the Tunnel

Copy the example config file:
```bash
cp cloudflared-config.yml.example cloudflared-config.yml
```

Edit `cloudflared-config.yml` and replace `<TUNNEL_ID>` with the tunnel ID from step 2.

### 4. Route DNS to Your Tunnel

```bash
npm run tunnel:route
```

This creates a DNS record (`DH.nicholasching.ca`) that points to your tunnel. The DNS record will be a CNAME pointing to your tunnel's domain.

**Note:** If you prefer to set up DNS manually in the Cloudflare dashboard:
- Go to your domain's DNS settings
- Add a CNAME record:
  - Name: `DH`
  - Target: `<TUNNEL_ID>.cfargotunnel.com`
  - Proxy: Enabled (orange cloud)

### 5. Update Clerk Configuration

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Settings** → **Domains**
4. Add `https://DH.nicholasching.ca` to the allowed origins
5. Save changes

### 6. Start Your Development Server with Tunnel

```bash
npm run dev:tunnel
```

This starts both the Next.js dev server and the Cloudflare tunnel.

Or run them separately:
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run tunnel
```

### 7. Access Your App

Open your browser and navigate to:
```
https://DH.nicholasching.ca
```

The tunnel provides HTTPS automatically, so Clerk authentication will work correctly!

## Troubleshooting

### Tunnel won't start

- Make sure you've logged in: `npm run tunnel:login`
- Verify your `cloudflared-config.yml` has the correct tunnel ID
- Check that `.cloudflared/credentials.json` exists

### DNS not resolving

- Wait a few minutes for DNS propagation
- Verify the CNAME record in Cloudflare dashboard
- Check that the tunnel is running: `cloudflared tunnel list`

### Clerk still redirecting to localhost

- Verify `https://DH.nicholasching.ca` is added to Clerk's allowed origins
- Make sure you're accessing via `https://` (not `http://`)
- Clear your browser cache and cookies

### Connection refused

- Ensure Next.js is running on port 3000
- Check that no firewall is blocking localhost:3000
- Verify the service URL in `cloudflared-config.yml` matches your Next.js port

## Stopping the Tunnel

Press `Ctrl+C` in the terminal running the tunnel, or stop the `dev:tunnel` process.

## Additional Resources

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Clerk Domain Configuration](https://clerk.com/docs/authentication/configuration)
