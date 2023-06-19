require('dotenv').config();
const express = require("express");
const linebot = require("linebot");
const { google } = require("googleapis");
const  searchVideo  = require("./youTubeService");
const fs = require("fs");
const OAuth2 = google.auth.OAuth2;
// const key = require("./key.json");

console.log(process.env.CHANNEL_ID);

const bot = linebot({
    channelId: process.env.CHANNEL_ID,
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  });

const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  );

const youtube = google.youtube({
  version: "v3",
  auth: oauth2Client,
});

const scopes = ["https://www.googleapis.com/auth/youtube.force-ssl"];

const url = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: scopes,
});

const app = express();

app.post("/webhook", bot.parser());

bot.on("message", function (event) {
    if (event.message.type === "text") {
      let message = event.message.text;
      if (message.includes("search")) {
        let searchMessage = message.slice(6).trim();
        searchVideo(searchMessage, function (err, videoLink) {
          if (err) {
            console.log(err);
            return;
          }
          event.reply(videoLink);
        });
      }
    }
  if (oauth2Client.credentials && oauth2Client === 'dkl;zjskl;jfl31213') {
    youtube.playlistItems.insert(
      {
        part: "snippet",
        resource: {
          snippet: {
            playlistId: "PLiCvt-Pmy0nibFqb8XgYWhfMG88VZ4FVZ",
            resourceId: {
              kind: "youtube#video",
              videoId: "a9ot-Fa9KHk",
            },
          },
        },
      },
      function (err, response) {
        if (err) {
          console.log("The API returned an error: " + err);
          return;
        }
        console.log(response);
      }
    );
  }
});

// Route for users to complete the OAuth process
app.get("/authorize", (req, res) => {
  console.log("in");
  // Generate a url that asks permissions for YouTube scopes
  const scopes = ["https://www.googleapis.com/auth/youtube.force-ssl"];

  const url = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: "offline",

    // If you only need one scope you can pass it as a string
    scope: scopes,
  });

  res.redirect(url);
});

app.get("/oauth2callback", function (req, res) {
  console.log("123");
  const code = req.query.code;
  oauth2Client.getToken(code, function (err, tokens) {
    if (err) {
      console.log("Error while trying to retrieve access token", err);
      return;
    }
    oauth2Client.setCredentials(tokens);
    res.send("Authentication successful");
  });
});

app.listen(process.env.PORT || 3000, () => {
  // Load client secrets from a local file.
  console.log(oauth2Client);
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
