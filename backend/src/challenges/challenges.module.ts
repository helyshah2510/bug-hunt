import { Module } from "@nestjs/common";
import { ChallengeGeneratorService } from "./challenge-generator.service.js";
import { ChallengesController } from "./challenges.controller.js";
import { RunnerModule } from "../runner/runner.module.js";

@Module({
    imports:[RunnerModule],
    controllers:[ChallengesController],
    providers:[ChallengeGeneratorService],
    exports:[ChallengeGeneratorService],
})
export class ChallengesModule {}