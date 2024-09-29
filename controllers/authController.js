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

  res.redirect(authUrl);
};

exports.authCallback = async (req, res) => {
  const code = req.query.code;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  await saveTokens(tokens);
  res.redirect("/");
};
