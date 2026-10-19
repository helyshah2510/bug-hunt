import { Module } from "@nestjs/common";
import { ChallengeGeneratorService } from "./challenge-generator.service.js";
import { ChallengesController } from "./challenges.controller.js";
import { RunnerModule } from "../runner/runner.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";

@Module({
    imports:[RunnerModule,PrismaModule],
    controllers:[ChallengesController],
    providers:[ChallengeGeneratorService],
    exports:[ChallengeGeneratorService],
})
export class ChallengesModule {}