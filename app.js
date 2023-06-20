require("dotenv").config();
const express = require("express");
const linebot = require("linebot");
const { google } = require("googleapis");
const searchVideo = require("./youTubeService");
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

const youtube2 = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

const app = express();

app.post("/webhook", bot.parser());

bot.on("message", function (event) {
  if (event.message.type === "text") {
    let message = event.message.text;
    if (message.includes("/add")) {
      let searchMessage = message.slice(4).trim();
      searchVideo(searchMessage, function (err, response) {
        console.log(response);

        const title = response.data.items[0].snippet.title;
        const videoId = response.data.items[0].id.videoId;
        // const videoLink = `https://www.youtube.com/watch?v=${videoId}`;
        if (err) {
          console.log(err);
          return;
        }
        if (Object.keys(oauth2Client.credentials).length === 0) {
          console.log("easa");
          fs.readFile(
            "refresh_token.txt",
            "utf8",
            function (err, refreshToken) {
              if (err) {
                console.log(
                  "Error while trying to retrieve refresh token",
                  err
                );
                return;
              }
              oauth2Client.setCredentials({ refresh_token: refreshToken });
              youtube.playlistItems.insert(
                {
                  part: "snippet",
                  resource: {
                    snippet: {
                      playlistId: "PLiCvt-Pmy0niC2hwAwmM8PoGF2kHPftX_",
                      resourceId: {
                        kind: "youtube#video",
                        videoId: videoId,
                      },
                    },
                  },
                },
                function (err, response) {
                  if (err) {
                    console.log("The API returned an error: " + err);
                    return;
                  }
                  event.reply(`adding the ${title} in channel`);
                }
              );
            }
          );
        } else {
          console.log(oauth2Client.credentials);
          youtube.playlistItems.insert(
            {
              part: "snippet",
              resource: {
                snippet: {
                  playlistId: "PLiCvt-Pmy0niC2hwAwmM8PoGF2kHPftX_",
                  resourceId: {
                    kind: "youtube#video",
                    videoId: videoId,
                  },
                },
              },
            },
            function (err, response) {
              if (err) {
                console.log("The API returned an error: " + err);
                return;
              }
              event.reply(`adding the ${title} in channel`);
            }
          );
        }
      });
    }

    if (message.toLowerCase() === "list") {
      youtube2.playlistItems.list(
        {
          playlistId: "PLiCvt-Pmy0niC2hwAwmM8PoGF2kHPftX_",
          part: "snippet",
          maxResults: 50, // API 的最大值
        },
        (err, res) => {
          if (err) {
            console.error("The API returned an error: " + err);
            return;
          }
          const items = res.data.items;
          if (items) {
            console.log("Videos in playlist:");
            let reply = "Videos in playlist:\n";
            items.map((item, index) => {
              reply += ` ${index++}. ${
                item.snippet.title
              }: https://www.youtube.com/watch?v=${
                item.snippet.resourceId.videoId
              }\n\n`;
            });
            event.reply(reply);
          } else {
            console.log("No videos found in playlist.");
          }
        }
      );
    }
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
    prompt: "consent",
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

    console.log(tokens);
    oauth2Client.setCredentials(tokens);

    if (tokens.refresh_token) {
      // Store the refresh token in a secure place
      fs.writeFile("refresh_token.txt", tokens.refresh_token, function (err) {
        if (err) {
          console.log("Error while trying to store refresh token", err);
          return;
        }
      });
    }
    res.send("Authentication successful");
  });
});

app.listen(process.env.PORT || 3000, () => {
  // Load client secrets from a local file.
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
