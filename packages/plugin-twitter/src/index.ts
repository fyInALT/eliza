import {Plugin} from "@ai16z/eliza";
import {factEvaluator as _factEvaluator} from "./evaluators/fact.ts";
import {factsProvider as _factsProvider} from "./providers/facts.ts";
import {timeProvider as _timeProvider} from "./providers/time.ts";
import {TwitterFetcherService} from "./services"

export * as actions from "./actions";
export * as evaluators from "./evaluators";
export * as providers from "./providers";

export const twitterPlugin: Plugin = {
    name: "twitter",
    description: "Agent twitter with actions to search twitters",
    services: [
        new TwitterFetcherService(),
    ],
    actions: [],
    evaluators: [],
    providers: [],
};
