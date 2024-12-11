import {IAgentRuntime} from "@ai16z/eliza";
import {Service} from "@ai16z/eliza";
import {elizaLogger, parseBooleanFromText} from "@ai16z/eliza";
import { Tweet } from "agent-twitter-client";
import {z} from "zod";

import { ClientBase } from "./base";

async function getTwitterSettings(runtime: IAgentRuntime) {

    try {
        const accounts = runtime.getSetting("TWITTER_FETCHER_FETCHER_ACCOUNTS")
        const config = {
            TWITTER_DRY_RUN:
                runtime.getSetting("TWITTER_DRY_RUN") ||
                process.env.TWITTER_DRY_RUN ||
                "false",
            TWITTER_USERNAME:
                runtime.getSetting("TWITTER_USERNAME") ||
                process.env.TWITTER_USERNAME,
            TWITTER_PASSWORD:
                runtime.getSetting("TWITTER_PASSWORD") ||
                process.env.TWITTER_PASSWORD,
            TWITTER_EMAIL:
                runtime.getSetting("TWITTER_EMAIL") ||
                process.env.TWITTER_EMAIL,
            TWITTER_COOKIES:
                runtime.getSetting("TWITTER_COOKIES") ||
                process.env.TWITTER_COOKIES,
        }
        elizaLogger.debug("Voice settings:", {
            accounts,
            config,
        });

        return {
            twitterFetcherFetchAccounts: accounts,
            config,
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Twitter configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}

export class TwitterFetcherService extends Service {
    client: ClientBase;
    runtime: IAgentRuntime;

    async initialize(runtime: IAgentRuntime): Promise<void> {
        const config = await getTwitterSettings(runtime)
        elizaLogger.info("initialize TwitterFetcherService:", config);

        this.client = new ClientBase(runtime);
        this.runtime = runtime;

        await this.start();
    }

    getInstance(): TwitterFetcherService {
        return TwitterFetcherService.getInstance();
    }

    async start(postImmediately: boolean = false) {
        if (!this.client.profile) {
            await this.client.init();
        }

        const fetchNewTweetLoop = async () => {
            elizaLogger.info("fetchNewTweetLoop tick");

            const lastPost = await this.runtime.cacheManager.get<{
                timestamp: number;
            }>(
                "twitter/" +
                    this.runtime.getSetting("TWITTER_USERNAME") +
                    "/lastPost"
            );

            const lastPostTimestamp = lastPost?.timestamp ?? 0;
            const minMinutes =
                parseInt(this.runtime.getSetting("POST_INTERVAL_MIN")) || 90;
            const maxMinutes =
                parseInt(this.runtime.getSetting("POST_INTERVAL_MAX")) || 180;
            const randomMinutes =
                Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) +
                minMinutes;
            const delay = randomMinutes * 60 * 1000;

            if (Date.now() > lastPostTimestamp + delay) {
                await this.fetchNewTweet();
            }

            setTimeout(() => {
                fetchNewTweetLoop(); // Set up next iteration
            }, delay);

            elizaLogger.log(`Next tweet scheduled in ${randomMinutes} minutes`);
        };
        if (
            this.runtime.getSetting("POST_IMMEDIATELY") != null &&
            this.runtime.getSetting("POST_IMMEDIATELY") != ""
        ) {
            postImmediately = parseBooleanFromText(
                this.runtime.getSetting("POST_IMMEDIATELY")
            );
        }
        if (postImmediately) {
            this.fetchNewTweet();
        }

        fetchNewTweetLoop();
    }

    private async fetchNewTweet() {
        elizaLogger.log("New fetch new twitter");

        // TODO set tweet to knownledge
        const tweet = await this.client.getCachedTimeline()

        tweet?.forEach((tweet: Tweet) => {
            elizaLogger.info("got tweet", tweet)
        })
    }
}
