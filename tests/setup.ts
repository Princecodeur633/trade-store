import {sequelize} from "../src/config/db";

beforeAll(async () => {
  await sequelize.sync({ force: true }); // Reset DB avant tests
});

afterAll(async () => {
  await sequelize.close(); // Fermer connexion DB après tests
});
