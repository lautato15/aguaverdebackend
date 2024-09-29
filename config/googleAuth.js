const { google } = require("googleapis");
// Importar el cliente de AWS Secrets Manager desde la v3
const {
  SecretsManagerClient,
  GetSecretValueCommand,
  PutSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

const SECRET_NAME = "AguaverdeAuth";

// Inicializar el cliente de Secrets Manager en AWS SDK v3
const secretsManagerClient = new SecretsManagerClient({
  region: process.env.AWS_REGION,
});

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Variable global para almacenar los tokens
let tokens = {};

// Función para cargar los tokens desde AWS Secrets Manager (v3)
const loadTokens = async () => {
  try {
    const command = new GetSecretValueCommand({ SecretId: SECRET_NAME });
    const secretValue = await secretsManagerClient.send(command);
    if (secretValue.SecretString) {
      return JSON.parse(secretValue.SecretString);
    }
    return null;
  } catch (error) {
    console.error("Error loading tokens from AWS Secrets Manager:", error);
    return null;
  }
};

// Función para guardar los tokens en AWS Secrets Manager (v3)
const saveTokens = async (tokens) => {
  try {
    const command = new PutSecretValueCommand({
      SecretId: SECRET_NAME,
      SecretString: JSON.stringify(tokens),
    });
    await secretsManagerClient.send(command);
    console.log("Tokens stored in AWS Secrets Manager!");
  } catch (error) {
    console.error("Error saving tokens to AWS Secrets Manager:", error);
  }
};

// Cargar los tokens al inicio
(async () => {
  const tokens = (await loadTokens()) || {};
  if (tokens) {
    oauth2Client.setCredentials(tokens);
  }
})();

// Manejar la actualización de los tokens
oauth2Client.on("tokens", async (newTokens) => {
  if (newTokens.refresh_token) {
    tokens.refresh_token = newTokens.refresh_token;
  }
  tokens.access_token = newTokens.access_token;
  await saveTokens(tokens);
});

module.exports = {
  oauth2Client,
  saveTokens,
};
