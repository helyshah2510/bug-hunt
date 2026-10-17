export type ChallengeDifficulty='easy'|'medium'|'hard';
export type ChallengeStatus='draft'|'validated'|'approved';
export type TestCase={
    input:string;
    expectedOutput:string;
};

export type challenge={
    id:string;
    title:string;
    description:string;
    difficulty:ChallengeDifficulty;
    brokenCode:string;
    refrenceSolution:string;
    testCases:TestCase[];
    hints:[string,string,string],
    explanation:string;
    status:ChallengeStatus;
};