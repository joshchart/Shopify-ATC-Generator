# Shopify ATC Generator Discord Bot

A powerful Discord bot that finds Shopify product variants and generates add-to-cart (ATC) links. The bot also displays detailed product information including prices, weights, and SKUs. Now with support for both individual products and entire collections!

## Features

- Generate ATC links for Shopify products
- Process entire collection pages and list all products
- Display detailed variant information (price, weight, SKU)
- Interactive collection browsing
- Clean Discord embed presentation

## Setup Instructions

### Prerequisites

1. [Node.js](https://nodejs.org/) (version 16.9.0 or higher recommended)
2. A Discord account with permission to add bots to servers
3. Basic knowledge of command line operations

### Create a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give your application a name
3. Go to the "Bot" tab and click "Add Bot"
4. Under the "Privileged Gateway Intents" section, enable:
   - SERVER MEMBERS INTENT
   - MESSAGE CONTENT INTENT
5. Copy your bot token by clicking "Reset Token" or "Copy" (keep this secure and private!)

### Setting Up the Project

1. Clone this repository:
   ```
   git clone https://github.com/joshchart/Shopify-ATC-Generator.git
   cd Shopify-ATC-Generator
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   DISCORD_TOKEN=your_discord_bot_token_here
   ```
   Replace `your_discord_bot_token_here` with the token you copied from the Discord Developer Portal.

4. Start the bot:
   ```
   node server.js
   ```

## Bot Commands

- `!s [Shopify product URL]` - Generate ATC links for a specific product
  Example: `!s https://shop.example.com/products/cool-product`

- `!s [Shopify collection URL]` - Process an entire collection page
  Example: `!s https://shop.example.com/collections/new-arrivals`
  This outputs a Collection of products then the user chooses a number (representing the item)
    -> returns the atc link

## How It Works

The bot fetches product data directly from Shopify stores by:
1. Finding the product.js endpoint
2. Extracting variant information
3. Generating direct add-to-cart links that can be used to expedite checkout

## Deployment

For 24/7 operation, consider deploying the bot to a cloud service:

- [Heroku](https://heroku.com)
- [DigitalOcean](https://www.digitalocean.com)
- [AWS](https://aws.amazon.com)
- [Google Cloud](https://cloud.google.com)

Remember to set environment variables on your hosting platform.
