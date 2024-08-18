const express = require("express");
const { google } = require("googleapis");
const app = express();
require("dotenv").config();

app.use(express.json());

// Configura tu cliente OAuth 2.0 con tus credenciales
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID, // ID de cliente de Google
  process.env.CLIENT_SECRET, // Secreto de cliente
  process.env.REDIRECT_URI // URI de redirección autorizada
);

app.get("/auth", (req, res) => {
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
  res.redirect("/modify-contacts");
});

app.post("/modify-contacts", async (req, res) => {
  console.log("ACA");
  console.log(req.body);
  const { email, groupName } = req.body;

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
    console.log(contact.data);

    // Listar todos los grupos para encontrar el que coincide con `groupName`
    const groupsResponse = await people.contactGroups.list();
    const groups = groupsResponse.data.contactGroups;
    const group = groups.find((g) => g.name === groupName);

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
      `Contacto agregado al grupo ${groupName}: ${contact.data.emailAddresses[0].value}`
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al modificar los contactos.");
  }
});

app.listen(3000, () => {
  console.log("App corriendo en http://localhost:3000/auth");
});
