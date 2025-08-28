import app from "./app";
import { env } from "./config/env";

app.listen(env.app.port, () => {
  console.log(`🚀 Server running on port ${env.app.port}`);
});
