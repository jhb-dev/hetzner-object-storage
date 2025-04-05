# Developing with this plugin locally

This repository allows for local testing and development of the Hetzner Object Storage adapter for Payload CMS.

## Prerequisites

1. Node.js (v18.20.2 or v20.9.0+)
2. A Hetzner Cloud account with Object Storage enabled
3. A Hetzner Object Storage bucket
4. Access keys for your Hetzner Object Storage

## Setup for Local Development

1. Clone the repo
   ```bash
   git clone https://github.com/joneslloyd/payload-storage-hetzner.git
   cd payload-storage-hetzner
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file in the root of the project
   ```bash
   cp .env.example .env
   ```

4. Fill out the environment variables in `.env` with your Hetzner credentials:
   ```
   HETZNER_BUCKET=your-bucket-name
   HETZNER_REGION=fsn1  # or nbg1, hel1
   HETZNER_ACCESS_KEY_ID=your-access-key
   HETZNER_SECRET_ACCESS_KEY=your-secret-key
   ```

5. Build the adapter
   ```bash
   npm run build
   ```

## Linking to a Payload Project

To test the adapter with a local Payload CMS project:

1. In the adapter directory, create a global symlink:
   ```bash
   npm link
   ```

2. In your Payload project directory, link to the adapter:
   ```bash
   cd path/to/your/payload/project
   npm link @joneslloyd/payload-storage-hetzner
   ```

3. Configure your Payload project to use the adapter in your `payload.config.ts`:
   ```typescript
   import { buildConfig } from 'payload'
   import { hetznerStorage } from '@joneslloyd/payload-storage-hetzner'

   export default buildConfig({
     // Your existing config
     plugins: [
       hetznerStorage({
         collections: {
           media: true, // Enable for media collection
         },
         bucket: process.env.HETZNER_BUCKET,
         region: process.env.HETZNER_REGION as 'fsn1' | 'nbg1' | 'hel1',
         credentials: {
           accessKeyId: process.env.HETZNER_ACCESS_KEY_ID,
           secretAccessKey: process.env.HETZNER_SECRET_ACCESS_KEY,
         },
       }),
       // Other plugins...
     ],
   })
   ```

4. Add the required environment variables to your Payload project's `.env` file.

5. Start your Payload project and test the adapter:
   ```bash
   npm run dev
   ```

## Troubleshooting

If you encounter issues:

- Check that your Hetzner credentials are correct
- Verify that your bucket exists and is properly configured
- Check the server logs for any errors related to the adapter
- Make sure your Hetzner region is correct in the configuration

## Testing File Uploads

1. Log into your Payload admin dashboard
2. Navigate to your Media collection
3. Upload a file
4. Verify that the file appears in your Hetzner Object Storage bucket

## Making Changes

After making changes to the adapter:

1. Rebuild the adapter:
   ```bash
   npm run build
   ```

2. Your linked Payload project should use the updated version automatically when restarted