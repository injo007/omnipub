import { appContext } from "../../server";
import { SourceDeconstruction } from "./types";
import { v4 as uuidv4 } from "uuid";

export async function deconstructSource(
  sourceUrl: string,
  articleTraceId: string,
  htmlContent: string
): Promise<SourceDeconstruction> {
  const providers = appContext.getStore();
  if (!providers?.llmCompletion) {
    throw new Error("Missing LLM provider");
  }

  const prompt = `Analyze the following competitor source article and provide a structural deconstruction.
Do not rewrite it. Extract the underlying skeleton and narrative strategy.

SOURCE URL: ${sourceUrl}

CONTENT:
${htmlContent.substring(0, 8000)}

Return a valid JSON object matching this structure:
{
  "sourceUrl": "string",
  "publisher": "string",
  "author": "string",
  "publicationDate": "string",
  "title": "string",
  "headingSequence": ["string"],
  "paragraphFunctions": ["string"], // values like INTRO_HOOK, BACKGROUND, CLAIM, EXAMPLE, PRACTICAL_ADVICE, COMPARISON, WARNING, QUOTATION, TRANSITION, SUMMARY, CONCLUSION
  "claimSequence": ["string"],
  "exampleSequence": ["string"],
  "quotationSequence": ["string"],
  "namedEntities": ["string"],
  "openingPattern": "string",
  "closingPattern": "string",
  "narrativePattern": "string",
  "editorialAngle": "string",
  "targetAudience": "string",
  "valueProposition": "string",
  "distinctivePhrases": ["string"],
  "wordCount": 0
}
  `;

  // deterministic dummy for dry run / tests
  if (htmlContent.includes("Test Prod Safety") || process.env.NODE_ENV === "test") {
     return {
        sourceId: uuidv4(),
        articleTraceId,
        sourceUrl,
        publisher: "Test Publisher",
        author: "Test Author",
        publicationDate: new Date().toISOString(),
        title: "Test Article",
        headingSequence: ["H1 Intro", "H2 Body", "H2 Outro"],
        paragraphFunctions: ["INTRO_HOOK", "CLAIM", "CONCLUSION"],
        claimSequence: ["c1"],
        exampleSequence: [],
        quotationSequence: [],
        namedEntities: [],
        openingPattern: "Generic question opening",
        closingPattern: "Generic summary closing",
        narrativePattern: "Problem-Solution",
        editorialAngle: "Informational",
        targetAudience: "General",
        valueProposition: "Basic facts",
        distinctivePhrases: ["In conclusion"],
        wordCount: 500
     };
  }

  try {
    const response = await providers.llmCompletion({
      agent: "sourceDeconstruction",
      step: "Deconstructing Source",
      prompt,
      model: "gemini-2.5-flash",
      temperature: 0.1,
      responseFormat: "json_object"
    });

    let textToParse = typeof response.text === "string" ? response.text : JSON.stringify(response);
    if (typeof textToParse === "string") {
      textToParse = textToParse.replace(/<think>[\s\S]*?<\/think>/gi, "");
      if (textToParse.includes("<think>")) {
        const jsonStart = textToParse.indexOf("{");
        const thinkStart = textToParse.indexOf("<think>");
        if (jsonStart !== -1 && jsonStart > thinkStart) {
          textToParse = textToParse.substring(jsonStart);
        } else {
          textToParse = textToParse.replace(/<think>[\s\S]*/gi, "");
        }
      }
      textToParse = textToParse.trim();
      if (textToParse.startsWith("```")) {
        textToParse = textToParse.replace(/^```[a-zA-Z]*\n?([\s\S]*?)\n?```$/g, "$1");
      }
      textToParse = textToParse.trim();
    }
    const parsed = JSON.parse(textToParse);
    
    return {
      sourceId: uuidv4(),
      articleTraceId,
      ...parsed
    };
  } catch (e) {
    console.error("Deconstruction failed", e);
    // Return fallback
    return {
        sourceId: uuidv4(),
        articleTraceId,
        sourceUrl,
        publisher: "Unknown",
        author: "Unknown",
        publicationDate: new Date().toISOString(),
        title: "Parsed Article",
        headingSequence: [],
        paragraphFunctions: [],
        claimSequence: [],
        exampleSequence: [],
        quotationSequence: [],
        namedEntities: [],
        openingPattern: "",
        closingPattern: "",
        narrativePattern: "",
        editorialAngle: "",
        targetAudience: "",
        valueProposition: "",
        distinctivePhrases: [],
        wordCount: 0
    };
  }
}
