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
You are an expert backpacking gear analyst. Your task is to analyze a provided list of gear items and calculate the weight distribution by top-level category.

Here is the list of gear items. Each item includes its name, weight in grams, and its category path:

${gearListString}

**Instructions:**

1.  **Calculate Total Weight:** Sum the weights of ALL items to get the total pack weight in grams.
2.  **Group by Top Tag:** Group all items by their "Top Tag".
3.  **Calculate Category Weights:** For each Top Tag, sum the weights of all items within that category.
4.  **Calculate Percentages:** For each Top Tag, calculate what percentage of the total pack weight it represents. Calculate the percentage to one decimal place.
5.  **Sort the List:** The distribution list must be sorted in descending order, from the highest percentage to the lowest.
6.  **Format the Output:** You must return ONLY a JSON object that matches the provided schema.

**Example Item List:**
- Hubba Hubba NX (1720g) [Shelter / Tent / 2-Person Tent]
- Leatherman Signal (212g) [Tools / Knife / Multi-tool]

**Example JSON Output:**
{
  "totalWeight": 1932,
  "distribution": [
    { "tag": "Shelter", "weight": 1720, "percentage": 89.0 },
    { "tag": "Tools", "weight": 212, "percentage": 11.0 }
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
                            type: Type.ARRAY,
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