import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import connectDB from "@/db/connectDb";
import { embedText } from "../embedding";

export const runtime = "nodejs";
export const maxDuration = 60;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function extractJsonPayload(text) {
  const rawText = String(text || "").trim();
  const fencedMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fencedMatch ? fencedMatch[1].trim() : rawText;

  try {
    return JSON.parse(jsonText);
  } catch {
    const startIndex = jsonText.indexOf("{");
    const endIndex = jsonText.lastIndexOf("}");
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      return JSON.parse(jsonText.slice(startIndex, endIndex + 1));
    }
    throw new Error("Quiz model response was not valid JSON");
  }
}

function normalizeQuizPayload(payload) {
  const questions = Array.isArray(payload?.questions) ? payload.questions : [];

  return {
    title: String(payload?.title || "Resource Quiz"),
    instructions: String(
      payload?.instructions ||
        "Select one answer per question. Your score is shown after submission."
    ),
    questions: questions.slice(0, 5).map((question, index) => {
      const options = Array.isArray(question?.options) ? question.options.slice(0, 4) : [];
      while (options.length < 4) {
        options.push(`Option ${options.length + 1}`);
      }

      const correctIndex = Number.isInteger(question?.correctIndex)
        ? Math.min(Math.max(question.correctIndex, 0), 3)
        : 0;

      return {
        id: question?.id || `q${index + 1}`,
        question: String(question?.question || `Question ${index + 1}`),
        options,
        correctIndex,
        explanation: String(question?.explanation || ""),
      };
    }),
  };
}

export async function POST(request) {
  try {
    const { filename, resourceTitle } = await request.json();

    if (!filename) {
      return NextResponse.json({ error: "Missing filename" }, { status: 400 });
    }

    const questionVector = embedText(`${filename} quiz generation`);

    const mongooseInstance = await connectDB();
    const db = mongooseInstance.connection 
      ? mongooseInstance.connection.db 
      : mongooseInstance.connections[0].db;
    
    const pipelineSearch = [
      {
        $vectorSearch: {
          index: "stratos_index", 
          path: "embedding",
          queryVector: questionVector,
          numCandidates: 10,
          limit: 3,
          filter: { fileName: filename }
        }
      },
      {
        $project: {
          textContext: 1, 
          text: 1, 
          score: { $meta: "vectorSearchScore" }
        }
      }
    ];

    const searchResults = await db.collection("resources").aggregate(pipelineSearch).toArray();
    
    const retrievedContext = searchResults.length > 0 
      ? searchResults.map(doc => doc.textContext || doc.text || "").filter(Boolean).join("\n\n")
      : "No specific reference blocks matched in database logs.";

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: [
            "You are Stratos AI, a quiz generator for study resources.",
            "Generate exactly 5 multiple-choice questions from the provided resource context.",
            "Each question must have exactly 4 options, one correctIndex from 0 to 3, and a short explanation.",
            "Return valid JSON only in this shape: {\"title\": string, \"instructions\": string, \"questions\": [{\"id\": string, \"question\": string, \"options\": [string, string, string, string], \"correctIndex\": number, \"explanation\": string}] }.",
            "Do not wrap the JSON in markdown fences.",
            `Resource title: ${resourceTitle || filename}`,
            `Resource filename: ${filename}`,
            `Context:\n${retrievedContext}`,
          ].join("\n\n"),
        },
        {
          role: "user",
          content: "Create a quiz now.",
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = chatCompletion.choices[0].message.content;
    const parsedQuiz = normalizeQuizPayload(extractJsonPayload(content));

    return NextResponse.json({
      success: true,
      quiz: {
        ...parsedQuiz,
        questions: parsedQuiz.questions.map((question) => ({
          ...question,
          currentAnswer: null,
        })),
      },
    });
    
      } catch (error) {
        console.error("Cloud AI Workflow Failure:", error);
        return NextResponse.json({ error: "Cloud engine failed to generate quiz" }, { status: 500 });
      }
    }