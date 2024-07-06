let list = [];
let takenSpots = 0;
const { resolve } = require("path");
const readline = require("readline");
//const { Client } = require("undici-types");

const { read } = require("fs");
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
    console.log("Connected to database...");
  } catch (err) {
    console.error("Error executing...");
  }
}

async function signOrLog() {
  let accChoice = await prompt("1)Sign up\n2)Login\n ");
  if (accChoice === "1") {
    let user = await signup();
    return user;
  } else if (accChoice === "2") {
    return await login();
  }
}
async function signup() {
  let username = await prompt("Enter a username: ");
  while (true) {
    let password = await prompt("Enter a password: ");
    let passwordVer = await prompt("Verify password: ");
    if (password === passwordVer) {
      // console.log("Account created!");
      let query = await client.query(
        `insert into userlogins (username, password)
  values ($1, $2)
  on conflict (username) do nothing`,
        [username, password]
      );
      let query2 = await client.query(
        `create table ${username} (
Name text primary key,
Description text,
Genre text,
Rating varchar(10),
Created_at timestamp default current_timestamp
)`
      );
      console.log("Account created!");
      return username;
      break;
    }
    console.log("Passwords didn't match...");
  }
}
async function login() {
  while (true) {
    try {
      let username = await prompt("Enter username: ");
      let password = await prompt("Enter password: ");
      let query = await client.query(
        `select password from userlogins
where username = $1`,
        [username]
      );
      // console.log(query.rows[0].password);
      if (query.rows[0].password === password) {
        //console.log(`Welcome ${username}...`);
        return username;
        break;
      } else {
        console.log("Incorrect username and password...");
      }
    } catch (err) {
      console.log("Incorrect username and password...");
    }
  }
}
async function getRowCount(user) {
  try {
    let query = await client.query(`SELECT COUNT(*) FROM ${user}`);
    let count = query.rows[0].count;
    return count;
  } catch (err) {
    console.error("Error getting count...");
  }
}
async function createData(user, name, rate, desc, type) {
  try {
    let query = await client.query(
      `insert into ${user} (name, rating, description, genre, created_at) 
        values ($1, $2, $3, $4, default) returning *`,
      [name, rate, desc, type]
    );
    console.log("Data saved...", query.rows[0]);
  } catch (err) {
    console.log("Error saving...", err.stack);
  }
}
async function readData(user) {
  try {
    let query = await client.query(`select * from ${user} `);
    console.log("Data retrieved: ");
    console.table(query.rows);
  } catch (err) {
    console.log("Error reading... ", err.stack);
  }
}
async function databaseCheck(user, check) {
  const checkQuery = await client.query(
    `SELECT * FROM ${user} WHERE name = $1`,
    [check]
  );

  if (checkQuery.rowCount === 0) {
    console.log("Media not found in the database...");
    return 0;
  }
  return 1;
}
async function updateData(user) {
  try {
    //1 get name of media to be updated
    let mediaUpdate = await prompt("Which media would you like to update?: ");
    let skip = await databaseCheck(user, mediaUpdate);
    if (skip === 0) {
      return;
    } else {
      // //let choice = prompt("Would you like to view your list")
      // const checkQuery = await client.query(
      //   `SELECT * FROM testuser WHERE name = $1`,
      //   [mediaUpdate]
      // );

      // if (checkQuery.rowCount === 0) {
      //   console.log("Media not found in the database.");
      //   return;
      // }
      let typeUpdate = await prompt("Which column would you like to change?: ");
      //2 check if media exists in database
      //3 ask what should be updated
      // update
      if (typeUpdate.toLowerCase() === "rating") {
        let rate = await prompt(
          "What would you like to change the rating to?: "
        );
        let query = await client.query(
          `update ${user} 
      set rating = $1 where name = $2`,
          [rate, mediaUpdate]
        );
      } else if (typeUpdate.toLowerCase() === "description") {
        let desc = await prompt(
          "What would you like to change the description to?: "
        );
        let query = await client.query(
          `update ${user} 
      set description = $1 where name = $2`,
          [desc, mediaUpdate]
        );
      } else if (typeUpdate.toLowerCase() === "genre") {
        let genre = await prompt(
          "What would you like to change the genre to?: "
        );
        let query = await client.query(
          `update ${user} 
      set genre = $1 where name = $2`,
          [genre, mediaUpdate]
        );
      } else if (typeUpdate.toLowerCase() === "name") {
        let name = await prompt("What would you like to change the name to?: ");
        let query = await client.query(
          `update ${user} 
      set name = $1 where name = $2`,
          [name, mediaUpdate]
        );
      }
      console.log("Data updated...");
    }
  } catch (err) {
    console.log("Error updating...", err.stack);
  }
}
async function deleteData(user, name) {
  try {
    let skip = await databaseCheck(user, name);
    if (skip === 0) {
      return;
    } else {
      let query = await client.query(
        `delete from ${user} 
        where name = $1 returning *`,
        [name]
      );
      console.log("Data deleted...", query.rows[0]);
    }
  } catch (err) {
    console.log("Error deleting...", err.stack);
  }
}
async function disconnect() {
  try {
    await client.end();
    console.log("Disconnected from database...");
  } catch (err) {
    console.error("Error executing...");
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
function prompt(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function addMedia(user) {
  let type = await prompt("What is the form of media?: ");
  let name = await prompt(`What is the name of the ${type.toLowerCase()}? `);
  let desc = await prompt(`How would you describe the ${type.toLowerCase()}? `);
  let rate = await prompt(`What would you rate the ${type.toLowerCase()}? `);
  //let type = await prompt("What form of media is it?");
  let review = {
    Name: name,
    Description: desc,
    Rating: rate,
    Genre: type,
  };
  await createData(user, name, rate, desc, type);
  list.push(review);
  //console.log(list);
  takenSpots++;
}
async function removeMedia(user) {
  let count = getRowCount();
  if (count === 0) {
    console.log("Nothing to remove...");
  } else {
    // console.log(`You have ${takenSpots} spot(s) taken.`);
    // list.map((review) => {
    //   console.log(review["Name"]);
    // });
    await readData(user);
    let removedMedia = await prompt("What would you like to remove?: ");
    await deleteData(user, removedMedia);
    //console.log(removedMedia);
    // let takeOut = list.findIndex((group) => group["Name"] === removedMedia);
    // if (takeOut !== -1) {
    //   console.log(`You have removed ${list[takeOut]["Name"]}.`);
    //   list.splice(takeOut, 1);
    //   listShelf();
    //   takenSpots--;
    // } else {
    //   console.log("Item not found.");
    // }
  }
}

async function listShelf(user) {
  await readData(user);
}

async function checkShelf(user) {
  let count = await getRowCount(user);
  console.log(`There are ${count} spot(s) taken.`);
}
(async () => {
  await connect();
  // let accChoice = await prompt("Sign up (1) or Login (2): ");
  // if (accChoice === "1") {
  //   let user = await signup();
  //   return user;
  //   break;
  // } else if (accChoice === "2") {
  //   return await login();

  //   break;
  // }
  const user = await signOrLog();
  console.log(`Welcome ${user}...`);
  let choice = "enter";

  while (choice !== "0") {
    console.log(
      "1)Add media\n2)Remove media\n3)Update media\n4)Check Shelf\n5)List Shelf"
    );
    choice = await prompt("Enter choice (type 0 to quit): ");
    if (choice === "0") {
      break;
    } else if (choice === "1") {
      await addMedia(user);
    } else if (choice === "2") {
      await removeMedia(user);
    } else if (choice === "3") {
      await updateData(user);
    } else if (choice === "4") {
      await checkShelf(user);
    } else if (choice === "5") {
      await listShelf(user);
    } else {
      //console.log("Invalid choice. Please try again. (Type exit to quit)");
    }
  }
  rl.close();
  await disconnect();
  console.log("Goodbye...");
})();
