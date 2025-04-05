//imports
require('dotenv').config();

//user configurable items
let prefix = "!";
let token = process.env.BOT_TOKEN; // Token loaded from .env file

// For Node.js < 18, use node-fetch; for Node.js >= 18, fetch is built-in
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on("ready", () => {
  console.log("Client Logged In!");
});

client.on("messageCreate", message => {
  if (!message.content.startsWith(prefix)) return;
  const withoutPrefix = message.content.slice(prefix.length);
  const split = withoutPrefix.split(/ +/);
  const command = split[0];
  const args = split.slice(1);
  if (command == "s") {
    let link = args[0];

    // Check if it's truly a collection URL (ends with 'collections/X' not followed by /products/)
    if (link.includes("/collections/") && !link.includes("/products/")) {
      // Handle collection link
      processCollection(link, message);
    } else if (link.includes("/products/")) {
      // Handle product link
      processProduct(link, message);
    } else {
      message.reply("Please provide a valid Shopify collection or product link!");
    }
  }
});

async function processProduct(link, message) {
  // Get product details
  grabProductJSON(link)
    .then(async json => {
      let productname = json.product.title;
      let handle = json.product.handle;
      let vendor = json.product.vendor;
      let imagesrc = json.product.image.src;
      console.log(json.product.variants);

      // Create our embed
      const exampleEmbed = new EmbedBuilder()
        .setColor("#2E6F40")
        .setTitle(productname)
        .setURL(link)
        .setDescription(
          "Variants of product w/ handle " + handle + " on the site " + vendor
        )
        .setThumbnail(imagesrc)
        .setTimestamp()
        .setFooter({
          text: "Developed by joshh",
          iconURL: "https://cdn.discordapp.com/avatars/172202026309124096/b19ab24d77e7994bbaf95dff7a96fc82.webp?size=100"
        });

      // Add variant links to our embed
      json.product.variants.forEach(variant => {
        let cleanlink = link.split("?")[0]
        let partarr = cleanlink.split("/")
        cleanlink = partarr.slice(0, 3).join("/")
        exampleEmbed.addFields({
          name: variant.title,
          value: "[ATC](" + cleanlink + "/cart/" + variant.id + ":1)\n$" + variant.price + "\nWeight: " + variant.weight + " " + variant["weight_unit"] + "\nsku: " + variant.sku,
          inline: true
        })
      })

      message.channel.send({ embeds: [exampleEmbed] })
    })
    .catch(e => {
      console.log(e);
      message.reply("This is not a valid Shopify product link!");
    });
}

async function processCollection(link, message) {
  try {
    // First, tell the user we're processing
    const loadingMsg = await message.reply("Processing collection, this may take a moment...");

    // Get collection products
    let products;
    try {
      products = await getCollectionProducts(link);

      if (!products || products.length === 0) {
        await loadingMsg.edit("No products found in this collection or this isn't a valid collection URL.");
        return;
      }
    } catch (error) {
      console.error("Error fetching collection products:", error);
      await loadingMsg.edit("Failed to process this collection. This might not be a valid collection URL.");

      // If it fails as a collection, try processing as a product
      if (link.includes("/products/")) {
        message.channel.send("Trying to process as a product instead...");
        processProduct(link, message);
      }
      return;
    }

    // Create a message to display the found products
    const collectionEmbed = new EmbedBuilder()
      .setColor("#2E6F40")
      .setTitle("Collection Products")
      .setURL(link)
      .setDescription(`Found ${products.length} products in this collection. Use the number to get ATC links.`)
      .setTimestamp()
      .setFooter({
        text: "Developed by joshh",
        iconURL: "https://cdn.discordapp.com/avatars/172202026309124096/b19ab24d77e7994bbaf95dff7a96fc82.webp?size=100"
      });

    // Add products to the embed (limit to first 25 to avoid Discord limitations)
    const displayProducts = products.slice(0, 25);
    displayProducts.forEach((product, index) => {
      collectionEmbed.addFields({
        name: `${index + 1}. ${product.title}`,
        value: `[View Product](${product.url})`,
        inline: true
      });
    });

    await loadingMsg.edit({ content: "", embeds: [collectionEmbed] });

    // Create a collector to listen for user's product selection
    const filter = m => m.author.id === message.author.id && !isNaN(m.content) && parseInt(m.content) > 0 && parseInt(m.content) <= displayProducts.length;
    const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    await message.channel.send("Reply with the number of the product you want ATC links for (timeout in 30 seconds)");

    collector.on('collect', async m => {
      const selection = parseInt(m.content) - 1;
      const selectedProduct = displayProducts[selection];

      // Process the selected product
      await processProduct(selectedProduct.url, message);
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        message.channel.send("Selection timed out.");
      }
    });

  } catch (error) {
    console.error("Error processing collection:", error);
    message.reply("Error processing the collection link. Trying as a product instead...");

    // If all collection processing fails, try as a product
    if (link.includes("/products/")) {
      processProduct(link, message);
    }
  }
}

async function grabProductJSON(link) {
  // Remove query strings from our link
  let parsedlink = link.split("?")[0];
  try {
    let response = await fetch(parsedlink + ".json");

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    let json = await response.json();

    // Verify the response contains the expected product data
    if (!json.product) {
      throw new Error("Invalid Shopify product data");
    }

    return json;
  } catch (error) {
    console.error("Error fetching product data:", error);
    throw error;
  }
}

async function getCollectionProducts(link) {
  // Remove query strings from our link
  let parsedlink = link.split("?")[0];

  // Make sure we're working with a proper collection URL
  // If URL ends with a collection (like /collections/all), append /products.json
  if (parsedlink.match(/\/collections\/[^\/]+$/)) {
    parsedlink += '/products.json';
  }
  // If URL already has /products but not .json, add .json
  else if (parsedlink.match(/\/collections\/[^\/]+\/products$/)) {
    parsedlink += '.json';
  }
  // If URL doesn't match either pattern, add /products.json
  else if (!parsedlink.endsWith('.json') && !parsedlink.endsWith('/products.json')) {
    parsedlink += '/products.json';
  }

  try {
    console.log(`Fetching collection products from: ${parsedlink}`);
    let response = await fetch(parsedlink);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    let json = await response.json();

    // Shopify collection API returns products array
    if (!json.products || !Array.isArray(json.products)) {
      throw new Error("Invalid Shopify collection data");
    }

    // Format the products into a usable format
    const baseUrl = link.split('/collections/')[0];
    return json.products.map(product => ({
      id: product.id,
      title: product.title,
      handle: product.handle,
      url: `${baseUrl}/products/${product.handle}`,
      image: product.images && product.images.length > 0 ? product.images[0].src : null
    }));

  } catch (error) {
    console.error("Error fetching collection data:", error);
    throw error;
  }
}
client.login(token).catch(error => {
  console.error("Error logging in:", error);
  console.log("Make sure your BOT_TOKEN is correctly set in the .env file!");
});
