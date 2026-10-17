import { Module } from "@nestjs/common";
import { ChallengeGeneratorService } from "./challenge-generator.service.js";
import { ChallengesController } from "./challenges.controller.js";

@Module({
    controllers:[ChallengesController],
    providers:[ChallengeGeneratorService],
    exports:[ChallengeGeneratorService],
})
export class ChallengesModule {}