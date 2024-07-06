const { read } = require("fs");
const { get } = require("http");
const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  user: "postgres",
  password: "1734",
  database: "postgres",
  port: 5432,
});

async function connect() {
  try {
    await client.connect();
    console.log("Connected to database");
  } catch (err) {
    console.error("Error executing.");
  }
}

async function getRowCount() {
  try {
    let query = await client.query("SELECT COUNT(*) FROM testuser");
    let count = query.rows[0].count;
    //console.log(`Rows: ${count}`);
    return count;
  } catch (err) {
    console.error("Error getting count");
  }
}

async function createData(name, rate, desc, type) {
  try {
    let query = await client.query(
      `insert into testuser (name, rating, description, genre, created_at) 
        values ($1, $2, $3, $4, default) returning *`,
      [name, rate, desc, type]
    );
    console.log("Data saved", query.rows[0]);
  } catch (err) {
    console.log("Error saving...");
  }
}
async function readData() {
  try {
    let query = await client.query(`select * from testuser `);
    console.log("Data retrieved:");
    console.table(query.rows);
  } catch (err) {
    console.log("Error reading...", err.stack);
  }
}
async function updateData() {
  try {
    //1 get name of media to be updated
    //2 check if media exists in database
    //3 ask what should be updated
    // update
    let query = await client.query(``);
    console.log("Data updated");
  } catch (err) {
    console.log("Error updating...", err.stack);
  }
}
async function deleteData(name) {
  try {
    let query = await client.query(
      `delete from testuser 
        where name = $1 returning *`,
      [name]
    );
    console.log("Data deleted", query.rows[0]);
  } catch (err) {
    console.log("Error deleting...", err.stack);
  }
}
async function disconnect() {
  try {
    await client.end();
    console.log("Disconnected from database");
  } catch (err) {
    console.error("Error executing.");
  }
}
(async () => {
  await connect();
  //await createData("testername", "5", "fake desc", "movie");
  //await deleteData("testName1");
  await getRowCount();
  await disconnect();
})();
