import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import connectDB from "@/db/connectDb";
import { embedText } from "../embedding";

export const runtime = "nodejs";
export const maxDuration = 60;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
  try {
    const { filename, question } = await request.json();

    if (!filename || !question) {
      return NextResponse.json({ error: "Missing filename or question" }, { status: 400 });
    }

    const questionVector = embedText(question);

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
          content: `You are Stratos AI, an elite engineering study companion. Answer the student's question clearly using only this verified context document extraction layer:\n\n${retrievedContext}`
        },
        { role: "user", content: question }
      ],
      model: "llama-3.3-70b-versatile", 
      temperature: 0.3,
    });

    return NextResponse.json({ answer: chatCompletion.choices[0].message.content });

  } catch (error) {
    console.error("Cloud AI Workflow Failure:", error);
    return NextResponse.json({ error: "Cloud engine failure" }, { status: 500 });
  }
}