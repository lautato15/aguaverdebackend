const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const contactRoutes = require("./routes/contactRoutes");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server Aguaverde corriendo listo para recibir contactos...");
});

app.use("/", authRoutes);
app.use("/", contactRoutes);

app.listen(3000, () => {
  console.log("App corriendo en http://localhost:3000/auth");
});
