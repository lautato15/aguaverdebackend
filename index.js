const express = require("express");
const { google } = require("googleapis");
const app = express();
require("dotenv").config();

const fs = require("fs");
const path = require("path");

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server Aguaverde corriendo listo para recibir contactos...");
});

// Configura tu cliente OAuth 2.0 con tus credenciales
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID, // ID de cliente de Google
  process.env.CLIENT_SECRET, // Secreto de cliente
  process.env.REDIRECT_URI // URI de redirección autorizada
);

const TOKEN_PATH = path.join("./", "tokens.json");

// Intentar cargar los tokens guardados
const loadTokens = () => {
  try {
    const tokens = fs.readFileSync(TOKEN_PATH, "utf8");
    return JSON.parse(tokens);
  } catch (error) {
    return null;
  }
};

// Guardar los tokens en un archivo
const saveTokens = (tokens) => {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log("Se almacenaron los Tokens!");
};

// Intentar cargar los tokens al inicio
const tokens = loadTokens();
if (tokens) {
  oauth2Client.setCredentials(tokens);

  // Si el access token está cerca de expirar, intenta refrescarlo
  oauth2Client.on("tokens", (newTokens) => {
    if (newTokens.refresh_token) {
      tokens.refresh_token = newTokens.refresh_token;
    }
    tokens.access_token = newTokens.access_token;
    saveTokens(tokens);
  });
}

app.get("/auth", (req, res) => {
  // Si ya tenemos tokens, no necesitamos volver a autenticar
  if (oauth2Client.credentials && oauth2Client.credentials.access_token) {
    return res.redirect("/");
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/contacts"], // Permisos necesarios
  });
  res.redirect(authUrl);
});

app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Guardar los tokens obtenidos
  saveTokens(tokens);

  res.redirect("/");
});

app.post("/addtolist", async (req, res) => {
  const { email } = req.body;

  try {
    const people = google.people({ version: "v1", auth: oauth2Client });

    // Crear un nuevo contacto
    const contact = await people.people.createContact({
      requestBody: {
        emailAddresses: [
          {
            value: email,
          },
        ],
      },
    });

    // Verificar si el contacto se creó exitosamente
    console.log("Contacto creado:");
    console.log(contact.data.emailAddresses[0].value);

    // Listar todos los grupos para encontrar el que coincide con `process.env.GROUP_AGUAVERDE`
    const groupsResponse = await people.contactGroups.list();
    const groups = groupsResponse.data.contactGroups;
    const group = groups.find((g) => g.name === process.env.GROUP_AGUAVERDE);

    if (!group) {
      return res.status(404).send("Grupo no encontrado.");
    }
    // Añadir el contacto al grupo
    await people.contactGroups.members.modify({
      resourceName: `${group.resourceName}`,
      requestBody: {
        resourceNamesToAdd: [contact.data.resourceName],
      },
    });
    res.send(
      `Contacto agregado al grupo ${process.env.GROUP_AGUAVERDE}: ${contact.data.emailAddresses[0].value}`
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al modificar los contactos.");
  }
});

app.listen(3000, () => {
  console.log("App corriendo en http://localhost:3000/auth");
});
