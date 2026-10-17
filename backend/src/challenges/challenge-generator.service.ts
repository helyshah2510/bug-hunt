import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenAI } from "@google/genai";

@Injectable()
export class ChallengeGeneratorService{
    private readonly ai:GoogleGenAI;
    constructor(private readonly configService:ConfigService){
        this.ai=new GoogleGenAI({
            apiKey:this.configService.getOrThrow<string>('GEMINI_API_KEY'),
        });
    }

    async generateChallenge(){
        const response = await this.ai.models.generateContent({
            model:'gemini-3.5-flash-lite',
            contents:` Create one beginner-level Python debugging case for a
      detective-themed game called Bug Hunt.

      Return only a JSON object with these fields:
      {
        "title": "short case title",
        "description": "the debugging story and task",
        "difficulty": "easy",
        "brokenCode": "Python code containing a bug",
        "referenceSolution": "correct Python code",
        "testInputs": [
          "Python code that calls the function and prints its result"
        ],
        "hints": [
          "first gentle hint",
          "second more specific hint",
          "third strong hint"
        ],
        "explanation": "explain the bug and its fix simply"
      }

      Requirements:
      - Use Python only.
      - The broken code must contain a real, understandable bug.
      - The reference solution must fix that bug.
      - Include at least 3 useful test inputs.
      - Do not include expected outputs; our backend will calculate them.
      - Return exactly 3 hints, from subtle to specific.
      - Do not wrap the JSON in Markdown code fences.`,
        });
        const text=response.text;
        if(!text){
            throw new Error('Gemini returned an empty response');
        }
        return JSON.parse(text);
    }
}