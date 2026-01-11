const express = require("express");
const cors = require("cors");
const downloadRoute = require("./routes/download");

const app = express();
// app.use(cors());
app.use(
  cors({
    exposedHeaders: ["Content-Disposition"]
  })
);

app.use(express.json());

app.use("/api/download", downloadRoute);

app.listen(3001, () => {
  console.log("Backend running on port 3001");
});
