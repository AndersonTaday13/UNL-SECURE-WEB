import app from "./app.js";
import { connectDB } from "./config/db.js";
import "dotenv/config";

connectDB();

const PORT = process.env.PORT_SERVER;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
