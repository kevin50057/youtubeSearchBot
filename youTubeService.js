require('dotenv').config();
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;



const oauth2Client = new OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);

const youtube = google.youtube({
version: "v3",
auth: process.env.YOUTUBE_API_KEY,
});


function searchVideo(query, callback) {
    youtube.search.list({
      part: 'snippet',
      q: query,
      maxResults: 1,
      type: 'video'
    }, function(err, response) {
      if (err) {
        callback(err, null);
        return;
      }
  
      if (response.data.items.length === 0) {
        callback(new Error('No videos found'), null);
        return;
      }
      console.log('abb');
      console.log(response.data.items[0]);
      const videoId = response.data.items[0].id.videoId;
      const videoLink = `https://www.youtube.com/watch?v=${videoId}`;
  
      callback(null, videoLink);
    });
  }
  
module.exports = searchVideo;
