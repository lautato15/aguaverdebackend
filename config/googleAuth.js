const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const TOKEN_PATH = path.join("./", "tokens.json");

// Cargar los tokens
const loadTokens = () => {
  try {
    const tokens = fs.readFileSync(TOKEN_PATH, "utf8");
    return JSON.parse(tokens);
  } catch (error) {
    return null;
  }
};

// Guardar los tokens
const saveTokens = (tokens) => {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log("Se almacenaron los Tokens!");
};

// Intentar cargar los tokens al inicio
const tokens = loadTokens() || {};
if (tokens) {
  oauth2Client.setCredentials(tokens);
}

oauth2Client.on("tokens", (newTokens) => {
  console.log("newTokens", newTokens);
  if (newTokens.refresh_token) {
    tokens.refresh_token = newTokens.refresh_token;
  }
  tokens.access_token = newTokens.access_token;
  saveTokens(tokens);
});

module.exports = oauth2Client;
