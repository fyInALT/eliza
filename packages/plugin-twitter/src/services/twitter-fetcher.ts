import {IAgentRuntime, ServiceType} from "@ai16z/eliza";
import {Service} from "@ai16z/eliza";
import {elizaLogger} from "@ai16z/eliza";
import {z} from "zod";

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
    static serviceType: ServiceType = ServiceType.SPEECH_GENERATION;

    async initialize(runtime: IAgentRuntime): Promise<void> {
        const config = await getTwitterSettings(runtime)
        elizaLogger.info("initialize TwitterFetcherService:", config);
    }

    getInstance(): TwitterFetcherService {
        return TwitterFetcherService.getInstance();
    }
}
