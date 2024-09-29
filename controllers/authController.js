const { oauth2Client, saveTokens } = require("../config/googleAuth");

exports.auth = (req, res) => {
  if (oauth2Client.credentials && oauth2Client.credentials.access_token) {
    return res.redirect("/");
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/contacts",
      "https://www.googleapis.com/auth/gmail.send",
    ],
  });

  console.log("toy en auth");
  res.redirect(authUrl);
};

exports.authCallback = async (req, res) => {
  console.log("toy en auth callback");

  const code = req.query.code;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  await saveTokens(tokens); // Asegúrate de que saveTokens esté disponible.
  console.log("toy en auth callback final");

  res.redirect("/");
};
