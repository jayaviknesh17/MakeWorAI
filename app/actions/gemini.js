"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

// SMART AI CONTENT SYSTEM - Uses Gemini API with intelligent fallbacks
export async function generateBlogContent(title, category = "", tags = []) {
  try {
    if (!title || title.trim().length === 0) {
      throw new Error("Title is required to generate content");
    }

    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDXBG1dJbSX3Fq3w2m2k-07mgtsjOM2ROQ";
    
    if (!apiKey) {
      return {
        success: true,
        content: generateSmartContent(title, category, tags),
        source: "smart_template"
      };
    }

    // Try Gemini API first
    try {
      // Initialize Gemini AI with the most efficient available model
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

      // Create intelligent prompt based on the title
      const prompt = createIntelligentPrompt(title, category, tags);

      console.log("Generating content with Gemini for:", title);

      // Generate content using real Gemini API
      const result = await model.generateContent(prompt);
      const response = result.response;
      const content = response.text();

      // Validate content
      if (!content || content.trim().length < 100) {
        throw new Error("Generated content is too short");
      }

      console.log("Successfully generated content with Gemini");

      return {
        success: true,
        content: content.trim(),
        source: "gemini_ai"
      };
    } catch (apiError) {
      console.log("Gemini API unavailable, using smart content generation:", apiError.message);
      
      // If API fails, use smart content generation
      return {
        success: true,
        content: generateSmartContent(title, category, tags),
        source: "smart_template",
        note: "Generated using smart templates due to API limitations"
      };
    }

  } catch (error) {
    console.error("Content generation error:", error);

    // Always provide useful content as fallback
    return {
      success: true,
      content: generateSmartContent(title, category, tags),
      source: "smart_template",
      note: "Generated using smart templates"
    };
  }
}

// INTELLIGENT PROMPT CREATOR
function createIntelligentPrompt(title, category, tags) {
  const titleLower = title.toLowerCase();
  
  // Detect what type of content is needed
  let promptType = "general";
  let specificInstructions = "";

  // Celebrity/Person detection
  if (isAboutPerson(titleLower)) {
    promptType = "biography";
    specificInstructions = `
Write a comprehensive biography about ${title}. Include:
- Early life and background
- Career highlights and major achievements
- Notable works, projects, or contributions
- Awards and recognition
- Personal life (if publicly known)
- Current status and recent activities
- Impact and legacy
- Interesting facts or trivia

Make it factual, well-researched, and engaging. Use proper HTML formatting with headers and lists.`;
  }
  
  // Technology topics
  else if (titleLower.includes('ai') || titleLower.includes('artificial intelligence') || 
           titleLower.includes('machine learning') || titleLower.includes('programming') ||
           titleLower.includes('coding') || titleLower.includes('software') ||
           titleLower.includes('technology') || titleLower.includes('computer')) {
    promptType = "technology";
    specificInstructions = `
Write a comprehensive technical article about ${title}. Include:
- Clear explanation of the concept/technology
- How it works (technical details made accessible)
- Real-world applications and use cases
- Current trends and developments
- Benefits and challenges
- Future prospects
- Practical examples
- Getting started guide (if applicable)

Make it informative, accurate, and suitable for both beginners and intermediate readers.`;
  }
  
  // Science topics
  else if (titleLower.includes('science') || titleLower.includes('physics') ||
           titleLower.includes('chemistry') || titleLower.includes('biology') ||
           titleLower.includes('space') || titleLower.includes('research') ||
           titleLower.includes('discovery') || titleLower.includes('theory')) {
    promptType = "science";
    specificInstructions = `
Write a detailed scientific article about ${title}. Include:
- Scientific explanation of the concept
- Current research and findings
- Historical background and discoveries
- Key scientists or researchers involved
- Practical applications
- Recent breakthroughs
- Future research directions
- Why it matters to society

Make it scientifically accurate but accessible to general readers.`;
  }
  
  // Health topics
  else if (titleLower.includes('health') || titleLower.includes('fitness') ||
           titleLower.includes('diet') || titleLower.includes('exercise') ||
           titleLower.includes('nutrition') || titleLower.includes('wellness') ||
           titleLower.includes('medical') || titleLower.includes('disease')) {
    promptType = "health";
    specificInstructions = `
Write a comprehensive health and wellness article about ${title}. Include:
- Medical/scientific explanation
- Evidence-based information
- Practical tips and recommendations
- Risk factors and prevention
- Treatment options (if applicable)
- Lifestyle modifications
- Expert recommendations
- Common myths vs facts
- When to consult healthcare professionals

Ensure all information is medically accurate and evidence-based.`;
  }
  
  // Business topics
  else if (titleLower.includes('business') || titleLower.includes('entrepreneur') ||
           titleLower.includes('startup') || titleLower.includes('marketing') ||
           titleLower.includes('finance') || titleLower.includes('investment') ||
           titleLower.includes('economy') || titleLower.includes('company')) {
    promptType = "business";
    specificInstructions = `
Write a comprehensive business article about ${title}. Include:
- Market analysis and current trends
- Key strategies and best practices
- Case studies and real examples
- Financial considerations
- Risk assessment
- Implementation steps
- Success metrics
- Common challenges and solutions
- Expert insights and recommendations

Make it practical and actionable for business professionals.`;
  }
  
  // List/ranking topics
  else if (titleLower.includes('top') || titleLower.includes('best') ||
           titleLower.includes('list') || titleLower.includes('ranking') ||
           titleLower.includes('famous') || titleLower.includes('greatest')) {
    promptType = "list";
    specificInstructions = `
Create a comprehensive ranked list for ${title}. Include:
- Clear ranking criteria and methodology
- Detailed description of each item/person
- Key achievements, features, or qualities
- Why each deserves their position
- Interesting facts or statistics
- Current status or relevance
- Comparison between items
- Honorable mentions (if applicable)

Make each entry substantial with specific details and facts.`;
  }
  
  // How-to topics
  else if (titleLower.includes('how to') || titleLower.includes('guide') ||
           titleLower.includes('tutorial') || titleLower.includes('learn') ||
           titleLower.includes('steps')) {
    promptType = "howto";
    specificInstructions = `
Write a detailed step-by-step guide for ${title}. Include:
- Prerequisites and requirements
- Detailed step-by-step instructions
- Tips and best practices
- Common mistakes to avoid
- Troubleshooting guide
- Advanced techniques
- Resources and tools needed
- Expected outcomes
- Next steps for further learning

Make it practical, actionable, and easy to follow.`;
  }
  
  // Question topics
  else if (titleLower.includes('what') || titleLower.includes('why') ||
           titleLower.includes('when') || titleLower.includes('where') ||
           titleLower.includes('who') || titleLower.includes('which') ||
           titleLower.includes('?')) {
    promptType = "question";
    specificInstructions = `
Answer the question "${title}" comprehensively. Include:
- Direct, clear answer to the question
- Detailed explanation and context
- Background information
- Multiple perspectives (if applicable)
- Supporting evidence and examples
- Related concepts and connections
- Practical implications
- Current relevance

Make the answer thorough, factual, and well-researched.`;
  }
  
  // Default comprehensive article
  else {
    specificInstructions = `
Write a comprehensive, informative article about ${title}. Include:
- Introduction and overview
- Key concepts and definitions
- Historical background (if relevant)
- Current state and developments
- Important aspects and components
- Real-world applications or examples
- Benefits and challenges
- Future outlook
- Practical takeaways

Make it engaging, informative, and well-structured.`;
  }

  // Build the complete prompt
  const fullPrompt = `${specificInstructions}

IMPORTANT FORMATTING REQUIREMENTS:
- Use proper HTML formatting with <h2> for main sections and <h3> for subsections
- Use <p> tags for paragraphs
- Use <ul> and <li> for bullet points
- Use <strong> for emphasis on important terms
- Use <em> for subtle emphasis
- Do NOT include the main title as it will be added separately
- Start directly with the content
- Make the content substantial (800-1200 words)
- Ensure factual accuracy and cite specific details where possible

${category ? `Category: ${category}` : ""}
${tags && tags.length > 0 ? `Tags: ${tags.join(", ")}` : ""}

Write engaging, factual, and well-researched content that provides real value to readers.`;

  return fullPrompt;
}

// Helper function to detect if content is about a person
function isAboutPerson(titleLower) {
  const personIndicators = [
    // Tamil/Indian Actors
    'thalapathy', 'vijay', 'ajith', 'thala', 'rajinikanth', 'superstar', 'kamal hassan', 'suriya', 'dhanush', 'vikram',
    // Bollywood
    'shah rukh khan', 'srk', 'salman khan', 'aamir khan', 'akshay kumar', 'hrithik roshan',
    // Hollywood
    'leonardo dicaprio', 'brad pitt', 'tom cruise', 'will smith', 'robert downey jr',
    // Musicians
    'taylor swift', 'ed sheeran', 'justin bieber', 'ariana grande', 'drake', 'beyonce',
    // Business leaders
    'elon musk', 'jeff bezos', 'bill gates', 'mark zuckerberg', 'steve jobs',
    // Athletes
    'virat kohli', 'ms dhoni', 'messi', 'ronaldo', 'lebron james', 'serena williams',
    // Politicians
    'narendra modi', 'joe biden', 'donald trump', 'barack obama',
    // General indicators
    'biography', 'life story', 'actor', 'actress', 'singer', 'musician', 'athlete', 'politician', 'ceo', 'founder'
  ];
  
  return personIndicators.some(indicator => titleLower.includes(indicator));
}

// SMART CONTENT GENERATOR - Creates intelligent content based on title analysis
function generateSmartContent(title, category, tags) {
  const titleLower = title.toLowerCase();
  
  // Detect content type and generate appropriate content
  if (isAboutPerson(titleLower)) {
    return generatePersonContent(title);
  } else if (titleLower.includes('ai') || titleLower.includes('technology') || titleLower.includes('programming')) {
    return generateTechContent(title);
  } else if (titleLower.includes('health') || titleLower.includes('fitness') || titleLower.includes('wellness')) {
    return generateHealthContent(title);
  } else if (titleLower.includes('business') || titleLower.includes('entrepreneur') || titleLower.includes('startup')) {
    return generateBusinessContent(title);
  } else if (titleLower.includes('how to') || titleLower.includes('guide') || titleLower.includes('tutorial')) {
    return generateHowToContent(title);
  } else if (titleLower.includes('top') || titleLower.includes('best') || titleLower.includes('list')) {
    return generateListContent(title);
  } else {
    return generateGeneralContent(title, category);
  }
}

// Generate content for person/celebrity topics
function generatePersonContent(title) {
  return `
<h2>Introduction</h2>
<p><strong>${title}</strong> is a prominent figure who has made significant contributions to their field. This comprehensive overview explores their life, career, and lasting impact.</p>

<h3>Early Life and Background</h3>
<p>Understanding the early influences and formative experiences that shaped ${title}'s journey provides valuable insight into their later achievements and career trajectory.</p>

<h3>Career Highlights</h3>
<p>Throughout their career, ${title} has achieved numerous milestones and breakthrough moments that have defined their professional legacy.</p>
<ul>
<li>Major career achievements and recognition</li>
<li>Notable projects and collaborations</li>
<li>Awards and honors received</li>
<li>Industry impact and influence</li>
</ul>

<h3>Notable Works and Contributions</h3>
<p>The body of work created by ${title} demonstrates their talent, dedication, and unique perspective in their field.</p>

<h3>Personal Philosophy and Approach</h3>
<p>What sets ${title} apart is their distinctive approach and the principles that guide their work and life decisions.</p>

<h3>Current Projects and Future Endeavors</h3>
<p>Staying current with ${title}'s latest activities and upcoming projects shows their continued relevance and evolution.</p>

<h3>Legacy and Impact</h3>
<p>The lasting influence of ${title} extends beyond their immediate work, inspiring others and shaping their industry for future generations.</p>

<p><em>This content provides a comprehensive foundation for exploring ${title}'s life and achievements. For the most current and detailed information, consider researching recent interviews, official biographies, and verified news sources.</em></p>
`;
}

// Generate content for technology topics
function generateTechContent(title) {
  return `
<h2>Understanding ${title}</h2>
<p><strong>${title}</strong> represents an important development in modern technology that's reshaping how we work, communicate, and solve problems.</p>

<h3>What is ${title}?</h3>
<p>At its core, ${title} is a technological innovation that addresses specific challenges and opens new possibilities for users and businesses alike.</p>

<h3>How It Works</h3>
<p>The underlying mechanisms and processes that power ${title} involve sophisticated systems designed for efficiency and reliability.</p>
<ul>
<li>Core technical components and architecture</li>
<li>Key algorithms and methodologies</li>
<li>Integration with existing systems</li>
<li>Performance optimization techniques</li>
</ul>

<h3>Real-World Applications</h3>
<p>The practical applications of ${title} span multiple industries and use cases, demonstrating its versatility and value.</p>

<h3>Benefits and Advantages</h3>
<p>Organizations and individuals adopting ${title} can expect several key benefits that improve efficiency and outcomes.</p>

<h3>Challenges and Considerations</h3>
<p>Like any technology, ${title} comes with certain challenges and considerations that users should understand before implementation.</p>

<h3>Future Developments</h3>
<p>The evolution of ${title} continues with ongoing research, development, and emerging trends that will shape its future applications.</p>

<h3>Getting Started</h3>
<p>For those interested in exploring ${title}, here are the essential steps and resources to begin your journey.</p>

<p><em>Technology evolves rapidly, so staying informed about the latest developments in ${title} through official documentation, industry publications, and expert analysis is recommended.</em></p>
`;
}

// Generate content for health topics
function generateHealthContent(title) {
  return `
<h2>Understanding ${title}</h2>
<p><strong>${title}</strong> is an important aspect of health and wellness that affects many people's daily lives and long-term well-being.</p>

<h3>What You Need to Know</h3>
<p>Having accurate, evidence-based information about ${title} is essential for making informed decisions about your health and lifestyle.</p>

<h3>Key Factors and Considerations</h3>
<p>Several important factors influence ${title} and understanding these can help you make better choices for your health.</p>
<ul>
<li>Risk factors and prevention strategies</li>
<li>Lifestyle modifications and recommendations</li>
<li>Evidence-based approaches and treatments</li>
<li>When to consult healthcare professionals</li>
</ul>

<h3>Practical Tips and Strategies</h3>
<p>Implementing practical, sustainable approaches to ${title} can lead to meaningful improvements in your overall health and quality of life.</p>

<h3>Common Myths vs. Facts</h3>
<p>Separating fact from fiction is crucial when it comes to health information, especially regarding ${title}.</p>

<h3>Professional Guidance</h3>
<p>While general information is helpful, personalized advice from qualified healthcare professionals is invaluable for addressing individual needs related to ${title}.</p>

<h3>Latest Research and Developments</h3>
<p>The field of health and medicine continues to evolve, with new research providing better understanding and treatment options for ${title}.</p>

<p><em><strong>Important Note:</strong> This information is for educational purposes only and should not replace professional medical advice. Always consult with qualified healthcare providers for personalized guidance regarding ${title}.</em></p>
`;
}

// Generate content for business topics
function generateBusinessContent(title) {
  return `
<h2>Mastering ${title}</h2>
<p><strong>${title}</strong> is a critical aspect of modern business that can significantly impact success, growth, and competitive advantage in today's market.</p>

<h3>Strategic Overview</h3>
<p>Understanding the strategic importance of ${title} helps businesses align their efforts with long-term goals and market opportunities.</p>

<h3>Key Components and Elements</h3>
<p>Successful implementation of ${title} requires attention to several essential components that work together to drive results.</p>
<ul>
<li>Strategic planning and goal setting</li>
<li>Resource allocation and management</li>
<li>Performance metrics and measurement</li>
<li>Risk assessment and mitigation</li>
</ul>

<h3>Best Practices and Strategies</h3>
<p>Industry leaders have developed proven approaches to ${title} that consistently deliver positive outcomes and sustainable growth.</p>

<h3>Implementation Framework</h3>
<p>A structured approach to implementing ${title} increases the likelihood of success and helps avoid common pitfalls.</p>

<h3>Measuring Success</h3>
<p>Establishing clear metrics and KPIs for ${title} enables businesses to track progress and make data-driven improvements.</p>

<h3>Common Challenges and Solutions</h3>
<p>Understanding potential obstacles and proven solutions helps businesses navigate the complexities of ${title} more effectively.</p>

<h3>Future Trends and Opportunities</h3>
<p>Staying ahead of emerging trends in ${title} positions businesses to capitalize on new opportunities and maintain competitive advantage.</p>

<p><em>Business success requires continuous learning and adaptation. Stay informed about industry developments and best practices related to ${title} through professional networks, industry publications, and expert insights.</em></p>
`;
}

// Generate content for how-to topics
function generateHowToContent(title) {
  return `
<h2>${title}: Complete Guide</h2>
<p>This comprehensive guide will walk you through everything you need to know about <strong>${title.toLowerCase()}</strong>, from basic concepts to advanced techniques.</p>

<h3>Getting Started</h3>
<p>Before diving into the process, it's important to understand the fundamentals and prepare properly for success.</p>

<h3>Prerequisites and Requirements</h3>
<p>To successfully complete this process, you'll need certain tools, knowledge, or resources. Here's what to prepare:</p>
<ul>
<li>Essential tools and materials</li>
<li>Basic knowledge requirements</li>
<li>Time and resource commitments</li>
<li>Safety considerations (if applicable)</li>
</ul>

<h3>Step-by-Step Process</h3>
<p>Follow these detailed steps to achieve your goal. Each step builds on the previous one, so take your time and don't skip ahead.</p>

<h4>Step 1: Foundation</h4>
<p>Start with the basics and establish a solid foundation for the process.</p>

<h4>Step 2: Implementation</h4>
<p>Begin the main implementation phase, following best practices and proven methods.</p>

<h4>Step 3: Refinement</h4>
<p>Fine-tune your approach and make necessary adjustments for optimal results.</p>

<h4>Step 4: Completion</h4>
<p>Finalize the process and ensure everything meets your quality standards.</p>

<h3>Tips for Success</h3>
<p>These proven tips will help you avoid common mistakes and achieve better results more efficiently.</p>

<h3>Troubleshooting Common Issues</h3>
<p>If you encounter problems along the way, these solutions address the most common challenges people face.</p>

<h3>Advanced Techniques</h3>
<p>Once you've mastered the basics, these advanced approaches can help you take your skills to the next level.</p>

<h3>Next Steps</h3>
<p>After completing this process, consider these follow-up actions to continue your progress and build on your success.</p>

<p><em>Remember that mastery comes with practice. Don't be discouraged if you don't get perfect results immediately – keep practicing and refining your approach.</em></p>
`;
}

// Generate content for list topics
function generateListContent(title) {
  return `
<h2>${title}: Comprehensive Analysis</h2>
<p>This carefully curated list explores <strong>${title.toLowerCase()}</strong> based on thorough research, expert opinions, and proven track records.</p>

<h3>Selection Criteria</h3>
<p>Our ranking methodology considers multiple factors to ensure accuracy and relevance:</p>
<ul>
<li>Performance metrics and achievements</li>
<li>Expert reviews and professional opinions</li>
<li>User feedback and real-world results</li>
<li>Innovation and unique features</li>
<li>Value and accessibility</li>
</ul>

<h3>Top Selections</h3>

<h4>1. Leading Choice</h4>
<p>This top selection stands out for its exceptional performance, reliability, and overall value. Key features include comprehensive functionality, user-friendly design, and proven results.</p>

<h4>2. Premium Option</h4>
<p>Offering advanced features and superior quality, this choice is perfect for those seeking the highest level of performance and are willing to invest in excellence.</p>

<h4>3. Best Value</h4>
<p>This selection provides an excellent balance of quality and affordability, making it accessible to a wider audience without compromising on essential features.</p>

<h4>4. Innovation Leader</h4>
<p>Known for cutting-edge features and forward-thinking approach, this option represents the latest developments and emerging trends in the field.</p>

<h4>5. Reliable Standard</h4>
<p>A dependable choice that consistently delivers solid performance and has earned trust through years of reliable service and positive user experiences.</p>

<h3>Detailed Comparison</h3>
<p>Each option has unique strengths and characteristics that make it suitable for different needs and preferences. Consider your specific requirements when making your selection.</p>

<h3>Expert Recommendations</h3>
<p>Industry professionals and experienced users consistently recommend these selections based on real-world performance and long-term satisfaction.</p>

<h3>Making Your Choice</h3>
<p>To select the best option for your needs, consider your budget, specific requirements, and long-term goals. Each choice on this list offers distinct advantages.</p>

<p><em>This list is regularly updated to reflect current market conditions, new developments, and changing user needs. Check back periodically for the latest recommendations.</em></p>
`;
}

// Generate general content
function generateGeneralContent(title, category) {
  return `
<h2>Exploring ${title}</h2>
<p><strong>${title}</strong> is a fascinating topic that deserves thorough exploration and understanding. This comprehensive guide provides valuable insights and practical information.</p>

<h3>Overview and Introduction</h3>
<p>Understanding the fundamentals of ${title} provides a solid foundation for deeper exploration and practical application.</p>

<h3>Key Concepts and Principles</h3>
<p>Several important concepts form the backbone of ${title}, and grasping these principles is essential for comprehensive understanding.</p>
<ul>
<li>Core definitions and terminology</li>
<li>Fundamental principles and theories</li>
<li>Historical context and development</li>
<li>Current relevance and applications</li>
</ul>

<h3>Practical Applications</h3>
<p>The real-world applications of ${title} demonstrate its relevance and importance in various contexts and situations.</p>

<h3>Benefits and Advantages</h3>
<p>Understanding ${title} offers numerous benefits that can enhance knowledge, improve decision-making, and provide valuable insights.</p>

<h3>Different Perspectives</h3>
<p>Examining ${title} from multiple angles provides a more complete and nuanced understanding of its complexity and significance.</p>

<h3>Current Trends and Developments</h3>
<p>The field surrounding ${title} continues to evolve, with new research, innovations, and insights emerging regularly.</p>

<h3>Future Outlook</h3>
<p>Looking ahead, ${title} is likely to continue developing and adapting to changing circumstances and new discoveries.</p>

<h3>Getting More Involved</h3>
<p>For those interested in learning more about ${title}, there are numerous resources and opportunities for deeper engagement.</p>

${category ? `<p><em>This content falls under the ${category} category and provides a comprehensive introduction to ${title}. Continue exploring related topics to build your knowledge and understanding.</em></p>` : `<p><em>This comprehensive overview of ${title} provides a solid foundation for further exploration and learning.</em></p>`}
`;
}

// REAL GEMINI AI CONTENT IMPROVEMENT
export async function improveContent(currentContent, improvementType = "enhance") {
  try {
    if (!currentContent || currentContent.trim().length === 0) {
      throw new Error("Content is required for improvement");
    }

    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDXBG1dJbSX3Fq3w2m2k-07mgtsjOM2ROQ";
    
    if (!apiKey) {
      return {
        success: false,
        error: "Gemini API key not configured",
      };
    }

    // Initialize Gemini AI with the most efficient available model
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    let prompt = "";

    switch (improvementType) {
      case "expand":
        prompt = `
Take this blog content and significantly expand it with more details, examples, research, and insights:

${currentContent}

EXPANSION REQUIREMENTS:
- Add more depth and detail to each existing section
- Include specific examples, statistics, and case studies
- Add new relevant subsections where appropriate
- Include expert quotes or research findings (you can create realistic ones)
- Expand on practical applications and real-world scenarios
- Add more comprehensive explanations
- Include additional tips, strategies, or methods
- Maintain the original HTML structure but make it much more comprehensive
- Aim for 50-100% more content while keeping it relevant and valuable

Return the expanded content in the same HTML format with proper <h2>, <h3>, <p>, <ul>, <li>, <strong>, and <em> tags.`;
        break;

      case "simplify":
        prompt = `
Take this blog content and make it much simpler, clearer, and easier to understand:

${currentContent}

SIMPLIFICATION REQUIREMENTS:
- Replace complex words with simpler alternatives
- Break down complicated concepts into easy-to-understand explanations
- Use shorter sentences and paragraphs
- Add more examples to clarify difficult points
- Remove jargon and technical terms (or explain them simply)
- Make the language more conversational and accessible
- Keep all the important information but make it digestible
- Maintain the HTML structure but improve readability
- Ensure a 5th grader could understand the main concepts

Return the simplified content in the same HTML format.`;
        break;

      default: // enhance
        prompt = `
Take this blog content and enhance it to make it more engaging, professional, and compelling:

${currentContent}

ENHANCEMENT REQUIREMENTS:
- Improve the writing style and flow
- Add engaging introductions and transitions
- Include compelling statistics or facts
- Make the content more actionable and practical
- Add relevant examples and case studies
- Improve the structure and organization
- Make it more persuasive and interesting to read
- Add calls-to-action where appropriate
- Enhance with better formatting and emphasis
- Keep the same length but make it much more engaging

Return the enhanced content in the same HTML format with proper formatting.`;
    }

    console.log(`${improvementType} content with Gemini...`);

    // Generate improved content using real Gemini API
    const result = await model.generateContent(prompt);
    const response = result.response;
    const improvedContent = response.text();

    console.log("Successfully improved content with Gemini");

    return {
      success: true,
      content: improvedContent.trim(),
    };
  } catch (error) {
    console.error("Gemini content improvement error:", error);
    
    // Handle specific error types
    if (error.message?.includes("API key")) {
      return {
        success: false,
        error: "Invalid API key. Please check your Gemini API configuration.",
      };
    }

    if (error.message?.includes("not found") || error.message?.includes("404")) {
      return {
        success: false,
        error: "Gemini model not available. Please try again later.",
      };
    }

    if (error.message?.includes("quota") || error.message?.includes("limit") || error.message?.includes("429")) {
      return {
        success: false,
        error: "Gemini API quota exceeded. Please wait a few minutes and try again, or check your API billing settings.",
      };
    }
    
    return {
      success: false,
      error: error.message || "Failed to improve content. Please try again.",
    };
  }
}