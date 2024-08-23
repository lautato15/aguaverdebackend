const { google } = require("googleapis");
const oauth2Client = require("../config/googleAuth");
const transporter = require("../config/mailTransporter");

exports.addToList = async (req, res) => {
    console.log(req.body);
    const { email } = req.body;
  
  try {
    const people = google.people({ version: "v1", auth: oauth2Client });

    const contact = await people.people.createContact({
      requestBody: {
        emailAddresses: [{ value: email }],
      },
    });

    const groupsResponse = await people.contactGroups.list();
    const groups = groupsResponse.data.contactGroups;
    const group = groups.find((g) => g.name === process.env.GROUP_AGUAVERDE);

    if (!group) {
      return res.status(404).send("Grupo no encontrado.");
    }

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
};

exports.contactUs = async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const mailOptions = {
      from: email,
      to: process.env.EMAIL_RECIPIENT,
      subject: `Nuevo mensaje de contacto de ${name}`,
      text: message,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Correo enviado por ${email}`);
    res.status(200).send("Mensaje enviado con éxito.");
  } catch (error) {
    console.error("Error al enviar el correo:", error);
    res.status(500).send("Hubo un error al enviar tu mensaje.");
  }
};
