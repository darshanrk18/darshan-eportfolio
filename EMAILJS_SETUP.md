# EmailJS Setup Guide

Follow these steps to set up EmailJS for your contact form.

## Step 1: Create EmailJS Account

1. Go to https://www.emailjs.com
2. Click "Sign Up" and create a free account
3. Verify your email address

## Step 2: Add Email Service

1. Go to https://dashboard.emailjs.com/admin/integration
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions to connect your email
5. **Copy the Service ID** - you'll need this later

## Step 3: Create Email Template

1. Go to https://dashboard.emailjs.com/admin/template
2. Click "Create New Template"
3. Use this template:

**Subject:**
```
New Message from {{from_name}} - Portfolio Contact
```

**Important Settings:**
- **To Email**: Set this to your email address (e.g., `konnur.d@northeastern.edu`) - This is where emails will be sent
- **From Name**: `{{from_name}}` - The sender's name
- **Reply To**: `{{from_email}}` - This allows you to reply directly to the sender

**Content:**
```
You have received a new message from your portfolio contact form.

From: {{from_name}}
Email: {{from_email}}

Message:
{{message}}

---
This message was sent from your portfolio website.
Reply to: {{from_email}}
```

**⚠️ IMPORTANT**: Make sure you set the **"To Email"** field in your EmailJS template to your actual email address (e.g., `konnur.d@northeastern.edu`). This field should be in the template settings, NOT in the content.

4. **Save the template**
5. **Copy the Template ID** - you'll need this later

## Step 4: Get Public Key

1. Go to https://dashboard.emailjs.com/admin/account/general
2. Find "Public Key" section
3. **Copy your Public Key** - you'll need this later

## Step 5: Configure Environment Variables

1. Create a file named `.env.local` in the root of your project (same directory as `package.json`)
2. Add the following (replace with your actual values):

```env
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id_here
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id_here
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key_here
```

**Important:** 
- Replace `your_service_id_here` with your actual Service ID from Step 2
- Replace `your_template_id_here` with your actual Template ID from Step 3
- Replace `your_public_key_here` with your actual Public Key from Step 4
- Never commit `.env.local` to git (it's already in `.gitignore`)

## Step 6: Test the Form

1. Restart your development server:
   ```bash
   npm run dev
   ```
2. Navigate to your contact form
3. Fill out and submit the form
4. Check your email inbox for the message

## Troubleshooting

- **"Failed to send message"**: Check that all environment variables are set correctly
- **"Service not found"**: Verify your Service ID is correct
- **"Template not found"**: Verify your Template ID is correct
- **Emails not received**: Check spam folder, verify email service connection

## Security Notes

- The Public Key is safe to expose in frontend code
- Service ID and Template ID can be public (they're in your frontend code)
- Never share your Private/Secret keys
- Free tier allows 200 emails/month

