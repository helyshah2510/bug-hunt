import { Difficulty } from "@prisma/client";

export const LEVEL_POINTS: Record<
Difficulty,
{solveReward:number;hintCost:number;skipCost:number;}
>={
    EASY:{solveReward:300,hintCost:100,skipCost:300},
    MEDIUM:{solveReward:400,hintCost:120,skipCost:320},
    HARD:{solveReward:500,hintCost:130,skipCost:330},
};