import { choice, noul, TypeSafeClient } from "@typesafe-ai/sdk";
import { NextResponse } from "next/server";

if (!process.env.TYPESAFE_API_KEY) {
    throw new Error(
        "TYPESAFE_API_KEY is not defined in the environment variables.",
    );
}

const client = new TypeSafeClient();

const energyByMood: Record<string, number> = {
    Sparkly: 5,
    Cozy: 4,
    Tired: 3,
    Sad: 2,
    Frustrated: 1,
};

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const decision = await client.systemOne({
            state: body,
            questions: {
                requestType: choice(
                    "What is the primary mood or emotional vibe expressed in `message`?",
                    {
                        Sparkly:
                            "The user is feeling joyful, highly productive, energetic, or had an unusually great day.",
                        Cozy: "The user is feeling relaxed, content, peaceful, or enjoyed quiet, low-energy activities.",
                        Tired: "The user is physically or mentally exhausted, lacking energy, burnt out, or desperately needs rest.",
                        Sad: "The user is feeling down, melancholic, emotionally drained, or experiencing a sense of sorrow.",
                        Frustrated:
                            "The user is annoyed, overly stressed, dealing with major inconveniences, or losing their patience.",
                    },
                ),
                nudge: noul(
                    "Does `message` express a need for self-care, de-compression, or rest?",
                ),
            },
        });

        const vibeResult: string = decision.answers.requestType.choice;
        const energyScore = energyByMood[vibeResult] ?? 5;
        const needsRest: number = decision.answers.nudge.noul;

        let nudgeText = "Keep riding that positive wave!";

        if (vibeResult === "Frustrated") {
            nudgeText = "Take a deep breath and give yourself a break.";
        } else if (vibeResult === "Cozy") {
            nudgeText = "Keep enjoying those peaceful moments.";
        } else if (
            vibeResult === "Tired" ||
            vibeResult === "Sad" ||
            needsRest > 0.5
        ) {
            nudgeText = "Prioritize rest tonight!";
        }

        return NextResponse.json({
            vibe: vibeResult,
            energy: energyScore,
            nudge: `${nudgeText}`,
        });
    } catch (error) {
        console.error("Failed to analyze vibe", error);
        return NextResponse.json(
            { error: "Failed to analyze vibe" },
            { status: 500 },
        );
    }
}
