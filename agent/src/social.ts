// Search Twitter by Agent-Twitter-Client
import { Scraper, SearchMode } from "agent-twitter-client";

export class TwitterDataProvider {

    static async fetchSearchTweets(keys: string): Promise<string> {
        try {
            // Create a new instance of the Scraper
            const scraper = new Scraper();

            // Check if login was successful
            if (!await scraper.isLoggedIn()) {
                // Log in to Twitter using the configured environment variables
                await scraper.login(
                    process.env.TWITTER_USERNAME,
                    process.env.TWITTER_PASSWORD,
                    process.env.TWITTER_EMAIL
                );

                console.log("Logged in successfully!");
            }

            // Check if login was successful
            if (await scraper.isLoggedIn()) {
                const tweetsres = await scraper.fetchSearchTweets(
                    keys,
                    20,
                    SearchMode.Latest
                );
                const promptTweet =
                    `
        Please combine the data on Twitter and cryptocurrency kline when analyzing and predicting, Below, I will provide Twitter and Kline data separately, Here are some tweets/replied:
        ${[...tweetsres?.tweets]
                        .map(
                            (tweet) => `
        From: ${tweet.name} (@${tweet.username})
        Text: ${tweet.text}\n
        Likes: ${tweet.likes}, Replies: ${tweet.replies}, Retweets: ${tweet.retweets},
            `
                        )
                        .join("\n")}
        `;
                // Log out from Twitter
                await scraper.logout();
                console.log("Logged out successfully!");
                return promptTweet;
            } else {
                console.log("Login failed. Please check your credentials.");
            }
        } catch (error) {
            console.error("An error occurred:", error);
        }
        return `The search of twitter for ${keys} is unknown`;
    }

};
