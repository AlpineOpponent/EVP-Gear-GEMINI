import { GoogleGenAI, Type } from "@google/genai";
import { TagHierarchy, GearItem, PackAnalysis } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const getExistingTagsForPrompt = (
    level: 'tt' | 'mt' | 'bt',
    hierarchy: TagHierarchy,
    context: { tt?: string; mt?: string }
): string => {
    if (level === 'tt') {
        return Object.keys(hierarchy).join(', ') || 'None';
    }
    if (level === 'mt' && context.tt && hierarchy[context.tt]) {
        return Object.keys(hierarchy[context.tt].children).join(', ') || 'None';
    }
    if (level === 'bt' && context.tt && context.mt && hierarchy[context.tt]?.children[context.mt]) {
        return Object.keys(hierarchy[context.tt].children[context.mt].children).join(', ') || 'None';
    }
    return 'None';
};


export const suggestTagsForLevel = async (
    level: 'tt' | 'mt' | 'bt',
    itemDetails: { name: string, brand: string, notes: string },
    hierarchy: TagHierarchy,
    context: { tt?: string, mt?: string }
): Promise<Array<{ tag: string; matchPercentage: number }> | null> => {
    if (!API_KEY) return null;

    const { name, brand, notes } = itemDetails;
    const existingTags = getExistingTagsForPrompt(level, hierarchy, context);

    let levelDescription = '';
    let contextDescription = '';
    switch (level) {
        case 'tt':
            levelDescription = 'You must suggest a Top Tag (TT). This should be a BROAD category (e.g., "Clothing", "Shelter", "Cookware").';
            break;
        case 'mt':
            levelDescription = 'You must suggest a Middle Tag (MT). This is a sub-category.';
            contextDescription = `The user has already selected the Top Tag: "${context.tt}". Your suggestions must fit within this category.`;
            break;
        case 'bt':
            levelDescription = 'You must suggest a Base Tag (BT). This should be a VERY SPECIFIC tag.';
            contextDescription = `The user has already selected the Top Tag "${context.tt}" and Middle Tag "${context.mt}". Your suggestions must fit this specific path.`;
            break;
    }

    const prompt = `You are an expert backpacker and gear organizer. Your task is to suggest a tag for a new piece of gear.

**New Gear Item Details:**
- Name: ${name}
- Brand: ${brand}
- Notes: ${notes}

**Task:**
${levelDescription}
${contextDescription}

**Instructions:**
1.  **Analyze Existing Tags:** Here is a list of existing tags for this level: [${existingTags}].
2.  **Prioritize Existing:** If any of the existing tags are a good fit, you MUST include them in your suggestions. Your primary goal is to reuse existing tags to keep the hierarchy clean.
3.  **Suggest New (If Necessary):** If NO existing tags are a good fit, suggest 1-3 new, relevant tag names. For a Base Tag, be specific (e.g., if the item is a summer sleeping bag and an existing tag is "Winter Sleeping Bags", you MUST create a new tag like "Summer Sleeping Bags").
4.  **Assign a STRICT Match Percentage:** For each suggestion, provide a 'matchPercentage' from 0 to 100. Be very critical and discerning in your assessment. Use the full 0-100 scale.
    - **90-100%:** An absolutely perfect, undeniable fit for the item's primary purpose.
    - **70-89%:** A very good and logical fit.
    - **40-69%:** A plausible but not perfect fit. The connection is understandable but not direct.
    - **0-39%:** A poor or tangential fit. Only include these if there are truly no better options.
    **Do NOT default to high scores.** For example, if the item is "MacBook Pro Laptop", a suggestion of "Tools" as a Top Tag should receive a very low score (e.g., 20-30%), while "Tech" or "Electronics" should be high (95%+).
5.  **Combine & Rank:** Provide a combined list of the best-fitting existing tags and any necessary new suggestions.

**Output Format:**
Return ONLY a JSON array of 2-5 unique objects. Each object must have two keys: "tag" (string) and "matchPercentage" (integer).
Example: [{"tag": "Tech", "matchPercentage": 98}, {"tag": "Electronics", "matchPercentage": 95}, {"tag": "Tools", "matchPercentage": 25}]
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    description: "A list of 2-5 tag suggestions as objects.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            tag: { type: Type.STRING },
                            matchPercentage: { type: Type.INTEGER },
                        },
                        required: ["tag", "matchPercentage"]
                    },
                },
            },
        });

        // Fix: Access the text property directly from the response for the JSON output.
        const jsonText = response.text;
        const suggestions = JSON.parse(jsonText) as Array<{ tag: string; matchPercentage: number }>;
        // Deduplicate based on tag name, keeping the highest percentage
        const uniqueSuggestions = Array.from(suggestions.reduce((map, sug) => {
            const existing = map.get(sug.tag);
            if (!existing || sug.matchPercentage > existing.matchPercentage) {
                map.set(sug.tag, sug);
            }
            return map;
        }, new Map<string, { tag: string; matchPercentage: number }>()).values());

        return uniqueSuggestions;
    } catch (error) {
        console.error(`Error suggesting tags for level ${level}:`, error);
        return null;
    }
};

export const generateTagVisuals = async (tagName: string): Promise<{ color: string, emoji: string } | null> => {
  if (!API_KEY) return null;
  try {
    const prompt = `For the backpacking gear category "${tagName}", provide a unique hex color code and a single, relevant emoji. The color should be vibrant and suitable for a dark-themed UI. Return ONLY a JSON object.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            color: { type: Type.STRING, description: 'Hex color code (e.g., #FF5733)' },
            emoji: { type: Type.STRING, description: 'A single emoji' },
          },
          required: ['color', 'emoji'],
        },
      },
    });
    
    // Fix: Access the text property directly from the response for the JSON output.
    const jsonText = response.text;
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error generating tag visuals:", error);
    return { color: '#7f8c8d', emoji: '📦' }; // fallback
  }
};


export const findBrandDomain = async (brandName: string): Promise<string | null> => {
    if (!API_KEY) return null;
    try {
        const prompt = `What is the official website domain for the brand "${brandName}"? For example, for the brand "The North Face", the answer is "thenorthface.com". Respond with ONLY the domain name.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        // Try to get a clean domain from the text response first
        // Fix: Access the text property directly from the response.
        let domain = response.text.toLowerCase();
        
        // Basic cleanup and validation
        if (domain) {
            // Remove common prefixes
            domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
            // Remove path
            domain = domain.split('/')[0];
            // Check if it looks like a domain
            if (domain.includes('.')) {
                return domain;
            }
        }
        
        // Fallback to grounding chunks if text response is not a valid domain
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks && groundingChunks.length > 0) {
            const firstUri = groundingChunks[0].web?.uri;
            if (firstUri) {
                try {
                    // Extract hostname from the URI
                    const hostname = new URL(firstUri).hostname;
                    return hostname.replace(/^(www\.)?/, '');
                } catch (e) {
                    // Ignore invalid URLs
                }
            }
        }

        return null;
    } catch (error) {
        console.error("Error finding brand domain:", error);
        return null;
    }
};

export const analyzePack = async (gearItems: GearItem[]): Promise<PackAnalysis | null> => {
    if (!API_KEY) {
        console.error("AI features are disabled because the API key is not set.");
        return null;
    }
    if (gearItems.length === 0) {
        return null;
    }

    const gearListString = gearItems.map(item =>
        `- ${item.name} (${item.weight}g) [${item.tt} / ${item.mt} / ${item.bt}]`
    ).join('\n');

    const prompt = `
You are an expert backpacking gear analyst. Your task is to analyze a provided list of gear items and calculate a detailed, hierarchical weight distribution.

Here is the list of gear items. Each item includes its name, weight in grams, and its category path (Top Tag / Middle Tag / Base Tag):

${gearListString}

**Instructions:**

1.  **Calculate Total Weight:** Sum the weights of ALL items to get the total pack weight in grams.
2.  **Hierarchical Grouping & Weight Calculation:**
    - Sum the weights for each unique Base Tag (BT).
    - Sum the weights for each unique Middle Tag (MT). This is the sum of its child BTs.
    - Sum the weights for each unique Top Tag (TT). This is the sum of its child MTs.
3.  **Hierarchical Percentage Calculation:**
    - For each TT, calculate its percentage of the **total pack weight**.
    - For each MT, calculate its percentage of its **parent TT's total weight**.
    - For each BT, calculate its percentage of its **parent MT's total weight**.
    - For example, if a TT "Shelter" is 1000g and the total pack is 2000g, its percentage is 50%. If an MT "Tent" under "Shelter" is 800g, its percentage is 80% (800g / 1000g).
    - Round all percentages to one decimal place.
4.  **Sort Lists:** At each level (TT, MT, and BT), the list of tags MUST be sorted in descending order by weight.
5.  **Format the Output:** You must return ONLY a JSON object that matches the provided schema. The structure must be nested. An empty \`children\` array is acceptable if a tag has no sub-tags.

**Example JSON Output Structure:**
{
  "totalWeight": 2000,
  "distribution": [
    {
      "tag": "Shelter", "weight": 1500, "percentage": 75.0,
      "children": [
        {
          "tag": "Tent", "weight": 1200, "percentage": 80.0,
          "children": [
            { "tag": "2-Person Tent", "weight": 1200, "percentage": 100.0 }
          ]
        },
        { "tag": "Tarp", "weight": 300, "percentage": 20.0 }
      ]
    },
    { "tag": "Cookware", "weight": 500, "percentage": 25.0, "children": [] }
  ]
}
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        totalWeight: { type: Type.INTEGER },
                        distribution: {
                            type: Type.ARRAY, // TT Level
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    tag: { type: Type.STRING },
                                    weight: { type: Type.INTEGER },
                                    percentage: { type: Type.NUMBER },
                                    children: {
                                        type: Type.ARRAY, // MT Level
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                tag: { type: Type.STRING },
                                                weight: { type: Type.INTEGER },
                                                percentage: { type: Type.NUMBER },
                                                children: {
                                                    type: Type.ARRAY, // BT Level
                                                    items: {
                                                        type: Type.OBJECT,
                                                        properties: {
                                                            tag: { type: Type.STRING },
                                                            weight: { type: Type.INTEGER },
                                                            percentage: { type: Type.NUMBER },
                                                        },
                                                        required: ["tag", "weight", "percentage"]
                                                    }
                                                }
                                            },
                                            required: ["tag", "weight", "percentage"]
                                        }
                                    }
                                },
                                required: ["tag", "weight", "percentage"]
                            }
                        }
                    },
                    required: ["totalWeight", "distribution"]
                },
            },
        });
        
        const jsonText = response.text;
        return JSON.parse(jsonText) as PackAnalysis;
    } catch (error) {
        console.error("Error analyzing pack:", error);
        return null;
    }
};

export const getPackSummary = async (analysis: PackAnalysis): Promise<string | null> => {
    if (!API_KEY) return null;

    const analysisString = `Total Weight: ${analysis.totalWeight}g\nDistribution:\n${
        analysis.distribution.map(d => `- ${d.tag}: ${d.percentage.toFixed(1)}%`).join('\n')
    }`;

    const prompt = `
You are an expert ultralight backpacker providing advice. Based on the following pack analysis, provide a concise, two-sentence summary.

**Analysis Data:**
${analysisString}

**Instructions:**
1.  **First Sentence:** Comment on what kind of trip this total weight is suitable for (e.g., weekend, multi-day, ultralight, traditional) and mention the overall weight distribution (e.g., "well-balanced", "heavily skewed towards shelter").
2.  **Second Sentence:** Give a single, high-level suggestion on where to cut weight, focusing on the largest category or categories.
3.  **Strictly adhere to the two-sentence format.**

Your summary:
`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating pack summary:", error);
        return "Could not generate summary.";
    }
};