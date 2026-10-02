use super::ollama;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::env;

#[derive(Serialize, Deserialize, Debug)]
pub struct LeadSimulation {
    pub name: String,
    pub company: String,
    pub phone: String,
    pub email: String,
    pub title: String,
    pub linkedin_url: String,
    pub score: i32,
}

#[tauri::command]
pub async fn simulate_lead_scraping(
    query: String,
    location: String,
    icp: Option<Value>,
    api_key: Option<String>,
    ollama_base_url: Option<String>,
    ollama_model: Option<String>,
) -> Result<Vec<LeadSimulation>, String> {
    let icp_str = match &icp {
        Some(val) => serde_json::to_string(val).unwrap_or("Not provided".to_string()),
        None => "Not provided".to_string(),
    };

    let prompt = format!(
        "You are simulating a headless browser scraping engine for an elite B2B sales tool.
        Search: \"{}\" in \"{}\".
        ICP: {}
        Generate 4 realistic fictional B2B leads matching EXACTLY this search context.
        Each lead must have: name, company, phone, email, title, linkedin_url, score (85-99).",
        query, location, icp_str
    );

    // Offline mode: an explicitly configured local Ollama server is tried
    // first; on failure we fall through to Gemini (or the demo mock).
    if let Some((base, model)) = ollama::resolve_local_ai(ollama_base_url, ollama_model) {
        match ollama::chat(&base, &model, &prompt, true).await {
            Ok(raw) => {
                let text = ollama::strip_json_fences(&raw);
                match serde_json::from_str::<Vec<LeadSimulation>>(text) {
                    Ok(data) => return Ok(data),
                    Err(e) => eprintln!("Ollama returned invalid leads JSON: {}", e),
                }
            }
            Err(e) => eprintln!("Ollama unreachable: {}", e),
        }
    }

    let api_key = api_key
        .filter(|k| !k.is_empty() && k != "MY_GEMINI_API_KEY")
        .or_else(|| env::var("GEMINI_API_KEY").ok())
        .unwrap_or_default();
    if api_key.is_empty() || api_key == "MY_GEMINI_API_KEY" {
        return Ok(get_mock_leads(&query, &location));
    }

    let client = Client::new();
    let url =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    let payload = json!({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "name": { "type": "STRING" },
                        "company": { "type": "STRING" },
                        "phone": { "type": "STRING" },
                        "email": { "type": "STRING" },
                        "title": { "type": "STRING" },
                        "linkedin_url": { "type": "STRING" },
                        "score": { "type": "INTEGER" }
                    },
                    "required": ["name", "company", "phone", "email", "title", "linkedin_url", "score"]
                }
            }
        }
    });

    let res = client
        .post(url)
        .header("x-goog-api-key", &api_key)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {}", e))?;
    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Gemini API error: {}", err_text));
    }

    let body: Value = res
        .json()
        .await
        .map_err(|e| format!("Failed to parse response JSON: {}", e))?;
    let text = body["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .unwrap_or("[]");
    let leads: Vec<LeadSimulation> = serde_json::from_str(text)
        .map_err(|e| format!("Failed to parse simulated leads: {}", e))?;
    Ok(leads)
}

fn get_mock_leads(query: &str, location: &str) -> Vec<LeadSimulation> {
    let q = query.to_lowercase();
    let area = if location.to_lowercase().contains("austin")
        || location.to_lowercase().contains("tx")
    {
        "512"
    } else if location.to_lowercase().contains("san francisco")
        || location.to_lowercase().contains("sf")
        || location.to_lowercase().contains("bay")
    {
        "415"
    } else if location.to_lowercase().contains("new york")
        || location.to_lowercase().contains("nyc")
    {
        "212"
    } else if location.to_lowercase().contains("miami") || location.to_lowercase().contains("fl") {
        "305"
    } else if location.to_lowercase().contains("chicago") || location.to_lowercase().contains("il")
    {
        "312"
    } else if location.to_lowercase().contains("denver") || location.to_lowercase().contains("co") {
        "720"
    } else if location.to_lowercase().contains("seattle") || location.to_lowercase().contains("wa")
    {
        "206"
    } else {
        "555"
    };

    if q.contains("construction")
        || q.contains("contractor")
        || q.contains("engineer")
        || q.contains("build")
        || q.contains("infrastructure")
    {
        vec![
            LeadSimulation {
                name: "Richard Vance".into(),
                company: "Vance Heavy Engineering".into(),
                phone: format!("+1 ({}) 555-0199", area),
                email: "rvance@vanceeng.com".into(),
                title: "VP of Operations".into(),
                linkedin_url: "https://linkedin.com/in/richardvance".into(),
                score: 98,
            },
            LeadSimulation {
                name: "Diana Cortez".into(),
                company: "Cortez Industrial Builders".into(),
                phone: format!("+1 ({}) 555-0201", area),
                email: "dcortez@cortezindustrial.com".into(),
                title: "CEO".into(),
                linkedin_url: "https://linkedin.com/in/dianacortez".into(),
                score: 95,
            },
            LeadSimulation {
                name: "Tom Hendricks".into(),
                company: "Hendricks Structural".into(),
                phone: format!("+1 ({}) 555-0202", area),
                email: "thendricks@hendricksstructural.com".into(),
                title: "Director of Risk Management".into(),
                linkedin_url: "https://linkedin.com/in/tomhendricks".into(),
                score: 91,
            },
            LeadSimulation {
                name: "Angela Wu".into(),
                company: "Pacific Bridge Constructors".into(),
                phone: format!("+1 ({}) 555-0203", area),
                email: "awu@pacificbridge.com".into(),
                title: "CFO".into(),
                linkedin_url: "https://linkedin.com/in/angelawu".into(),
                score: 88,
            },
        ]
    } else if q.contains("software")
        || q.contains("saas")
        || q.contains("tech")
        || q.contains("developer")
        || q.contains("cloud")
        || q.contains("it ")
    {
        vec![
            LeadSimulation {
                name: "Jordan Mitchell".into(),
                company: "AtlasDev Solutions".into(),
                phone: format!("+1 ({}) 555-0301", area),
                email: "jmitchell@atlasdev.io".into(),
                title: "CTO".into(),
                linkedin_url: "https://linkedin.com/in/jordanmitchell".into(),
                score: 97,
            },
            LeadSimulation {
                name: "Nina Patel".into(),
                company: "CloudGrid Technologies".into(),
                phone: format!("+1 ({}) 555-0302", area),
                email: "npatel@cloudgrid.tech".into(),
                title: "VP of Engineering".into(),
                linkedin_url: "https://linkedin.com/in/ninapatel".into(),
                score: 94,
            },
            LeadSimulation {
                name: "Kevin O'Reilly".into(),
                company: "DataPulse Analytics".into(),
                phone: format!("+1 ({}) 555-0303", area),
                email: "koreilly@datapulse.ai".into(),
                title: "CEO".into(),
                linkedin_url: "https://linkedin.com/in/kevinoreilly".into(),
                score: 92,
            },
            LeadSimulation {
                name: "Sophia Liang".into(),
                company: "NexGen DevOps".into(),
                phone: format!("+1 ({}) 555-0304", area),
                email: "sliang@nexgendevops.com".into(),
                title: "Head of Product".into(),
                linkedin_url: "https://linkedin.com/in/sophialiang".into(),
                score: 89,
            },
        ]
    } else if q.contains("finance")
        || q.contains("bank")
        || q.contains("invest")
        || q.contains("insurance")
        || q.contains("risk")
    {
        vec![
            LeadSimulation {
                name: "Harold Fincher".into(),
                company: "Fincher Wealth Management".into(),
                phone: format!("+1 ({}) 555-0401", area),
                email: "hfincher@fincherwealth.com".into(),
                title: "Managing Partner".into(),
                linkedin_url: "https://linkedin.com/in/haroldfincher".into(),
                score: 96,
            },
            LeadSimulation {
                name: "Grace Okonkwo".into(),
                company: "Apex Risk Advisors".into(),
                phone: format!("+1 ({}) 555-0402", area),
                email: "gokonkwo@apexrisk.com".into(),
                title: "VP of Compliance".into(),
                linkedin_url: "https://linkedin.com/in/graceokonkwo".into(),
                score: 93,
            },
            LeadSimulation {
                name: "Raj Mehta".into(),
                company: "Meridian Capital Group".into(),
                phone: format!("+1 ({}) 555-0403", area),
                email: "rmehta@meridiancapital.com".into(),
                title: "Director of Operations".into(),
                linkedin_url: "https://linkedin.com/in/rajmehta".into(),
                score: 90,
            },
            LeadSimulation {
                name: "Claire Dubois".into(),
                company: "Euro-American Underwriters".into(),
                phone: format!("+1 ({}) 555-0404", area),
                email: "cdubois@eua-underwriters.com".into(),
                title: "CEO".into(),
                linkedin_url: "https://linkedin.com/in/clairerubois".into(),
                score: 87,
            },
        ]
    } else if q.contains("health")
        || q.contains("medical")
        || q.contains("doctor")
        || q.contains("dentist")
        || q.contains("clinic")
        || q.contains("hospital")
    {
        vec![
            LeadSimulation {
                name: "Dr. Mark Chen".into(),
                company: "Pacific Northwest Dental Group".into(),
                phone: format!("+1 ({}) 555-0501", area),
                email: "mchen@pnwdental.com".into(),
                title: "Owner / Lead Dentist".into(),
                linkedin_url: "https://linkedin.com/in/drmarkchen".into(),
                score: 95,
            },
            LeadSimulation {
                name: "Jennifer Holt".into(),
                company: "Holt Medical Associates".into(),
                phone: format!("+1 ({}) 555-0502", area),
                email: "jholt@holtmedical.com".into(),
                title: "Practice Manager".into(),
                linkedin_url: "https://linkedin.com/in/jenniferholt".into(),
                score: 92,
            },
            LeadSimulation {
                name: "Dr. Sanjay Rao".into(),
                company: "Bay Area Cardiology".into(),
                phone: format!("+1 ({}) 555-0503", area),
                email: "srao@baycardiology.com".into(),
                title: "Managing Partner".into(),
                linkedin_url: "https://linkedin.com/in/drsanjayrao".into(),
                score: 90,
            },
            LeadSimulation {
                name: "Cynthia Vega".into(),
                company: "Vega Vision Clinics".into(),
                phone: format!("+1 ({}) 555-0504", area),
                email: "cvega@vegavision.com".into(),
                title: "COO".into(),
                linkedin_url: "https://linkedin.com/in/cynthiavega".into(),
                score: 86,
            },
        ]
    } else {
        vec![
            LeadSimulation {
                name: "Richard Vance".into(),
                company: "Vance Heavy Engineering".into(),
                phone: format!("+1 ({}) 555-0199", area),
                email: "rvance@vanceeng.com".into(),
                title: "VP of Operations".into(),
                linkedin_url: "https://linkedin.com/in/richardvance".into(),
                score: 98,
            },
            LeadSimulation {
                name: "Elena Rostova".into(),
                company: "Rostova Commercial Builds".into(),
                phone: format!("+1 ({}) 555-0102", area),
                email: "erostova@rostovabuilds.com".into(),
                title: "Director of Procurement".into(),
                linkedin_url: "https://linkedin.com/in/elenarostova".into(),
                score: 94,
            },
            LeadSimulation {
                name: "Marcus Thorne".into(),
                company: "Thorne Industrial Partners".into(),
                phone: format!("+1 ({}) 555-0103", area),
                email: "mthorne@thorneindustrial.com".into(),
                title: "CEO".into(),
                linkedin_url: "https://linkedin.com/in/marcusthorne".into(),
                score: 96,
            },
            LeadSimulation {
                name: "Sarah Williams".into(),
                company: "SafeBuild Development".into(),
                phone: format!("+1 ({}) 555-0104", area),
                email: "swilliams@safebuilddev.com".into(),
                title: "COO".into(),
                linkedin_url: "https://linkedin.com/in/sarahwilliams".into(),
                score: 89,
            },
        ]
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct IcpResponseData {
    #[serde(rename = "isComplete")]
    pub is_complete: bool,
    pub reply: Option<String>,
    pub icp: Option<Value>,
}

#[tauri::command]
pub async fn process_onboarding_chat(
    messages: Vec<Value>,
    api_key: Option<String>,
    ollama_base_url: Option<String>,
    ollama_model: Option<String>,
) -> Result<IcpResponseData, String> {
    let mut history = String::new();
    for m in &messages {
        let role = m["role"].as_str().unwrap_or("UNKNOWN").to_uppercase();
        let content = m["content"].as_str().unwrap_or("");
        history.push_str(&format!("{}: {}\n", role, content));
    }

    let prompt = format!(
        "You are an elite AI Sales Strategist building an outbound engine for OpenCloser.
        Goal: Interview the user to build an ICP using SPIN and Challenger frameworks.
        Conversation:\n{}\n
        If incomplete, ask ONE strategic follow-up question.
        If complete, generate full ICP JSON with ALL fields: targetAudience, industry, companySize, decisionMakerTitles, painPoints, objections, competitorNames, valueProposition, salesMethodology, systemPrompt.",
        history
    );

    // Offline mode: an explicitly configured local Ollama server is tried
    // first; on failure we fall through to Gemini (or the demo mock).
    if let Some((base, model)) = ollama::resolve_local_ai(ollama_base_url, ollama_model) {
        let contract = r#"Respond ONLY with a single JSON object of the form {"isComplete": true|false, "reply": "next interview question or null", "icp": <full ICP object> or null}. While interviewing: isComplete=false, reply=<your next strategic question>, icp=null. When the ICP is complete: isComplete=true, reply=null, icp=<full ICP with all fields>."#;
        let ollama_prompt = format!(
            "{}

{}",
            prompt, contract
        );
        match ollama::chat(&base, &model, &ollama_prompt, true).await {
            Ok(raw) => {
                let text = ollama::strip_json_fences(&raw);
                match serde_json::from_str::<IcpResponseData>(text) {
                    Ok(data) => return Ok(data),
                    Err(e) => eprintln!("Ollama returned invalid ICP JSON: {}", e),
                }
            }
            Err(e) => eprintln!("Ollama unreachable: {}", e),
        }
    }

    let api_key = api_key
        .filter(|k| !k.is_empty() && k != "MY_GEMINI_API_KEY")
        .or_else(|| env::var("GEMINI_API_KEY").ok())
        .unwrap_or_default();
    if api_key.is_empty() || api_key == "MY_GEMINI_API_KEY" {
        if messages.len() > 3 {
            let mock_icp = json!({
                "targetAudience": "Mid-market commercial contractors in heavy engineering ($5M-$20M ARR) who bid on $10M+ municipal contracts and require specialized equipment/flood/liability coverage that standard B2B policies exclude",
                "industry": "Commercial Construction & Heavy Engineering",
                "companySize": "Mid-Market ($5M-$20M ARR)",
                "decisionMakerTitles": ["CEO", "CFO", "VP of Operations", "Director of Risk Management"],
                "painPoints": [
                    "SITUATION: Currently using generic business owner policies that leave critical heavy equipment uninsured during complex transports across multiple jurisdictions",
                    "PROBLEM: Cash flow is inherently tight, and one denied claim on a $500k excavator can wipe out the entire year's margin - a recent incident cost them $150k out-of-pocket",
                    "IMPLICATION: One more denied claim means they cannot bid on $10M+ city contracts, effectively capping their growth and potentially forcing bankruptcy within 6 months",
                    "NEED-PAYOFF: A specialized contractor policy with guaranteed equipment coverage that enables them to confidently bid on the largest municipal projects in Texas without existential risk"
                ],
                "objections": [
                    "Already have a broker we've used for years",
                    "This sounds expensive - our margins are already tight",
                    "I need to run this by my business partner before making any changes"
                ],
                "competitorNames": ["Hartford", "Travelers", "Liberty Mutual", "Chubb"],
                "valueProposition": "We don't just sell insurance - we protect your livelihood with contractor-specific policies that definitively close the $100k+ coverage gaps your current carrier won't touch, so you can bid on $10M+ contracts with total confidence",
                "salesMethodology": "SPIN Selling",
                "systemPrompt": "You are an elite SPIN Sales SDR specializing in commercial contractor insurance. Your mission: uncover the exact Situation, probe the specific Problem, amplify the financial Implication of inaction, and position the Need-payoff. Do not pitch until you've uncovered at least 2 specific pain points. Always ask: 'If [specific equipment] goes down and your claim is denied tomorrow, what does that cost you by Friday?'\n\nCRITICAL RULES:\n- Use the prospect's name naturally every 3-4 exchanges\n- After objections, pause briefly before responding\n- NEVER fabricate statistics or case studies\n- Sound human, not robotic — vary sentence structure\n- If interested: 'Would Tuesday at 2pm work for a quick 15-minute walkthrough?'"
            });
            return Ok(IcpResponseData {
                is_complete: true,
                reply: None,
                icp: Some(mock_icp),
            });
        } else {
            let replies = [
                "That's a great start. To really nail down an outreach strategy using the SPIN methodology, what is the most costly consequence (Implication) your clients face when things go wrong during a critical project?",
                "Excellent. Now paint me a picture — if a client of yours had their single biggest operational risk materialize tomorrow, what would that cost them in real dollars? Walk me through the chain reaction."
            ];
            let idx = messages.len().saturating_sub(1).min(replies.len() - 1);
            return Ok(IcpResponseData {
                is_complete: false,
                reply: Some(replies[idx].into()),
                icp: None,
            });
        }
    }

    let client = Client::new();
    let url =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    let payload = json!({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "isComplete": { "type": "BOOLEAN" },
                    "reply": { "type": "STRING" },
                    "icp": {
                        "type": "OBJECT",
                        "properties": {
                            "targetAudience": { "type": "STRING" },
                            "industry": { "type": "STRING" },
                            "companySize": { "type": "STRING" },
                            "decisionMakerTitles": { "type": "ARRAY", "items": { "type": "STRING" } },
                            "painPoints": { "type": "ARRAY", "items": { "type": "STRING" } },
                            "objections": { "type": "ARRAY", "items": { "type": "STRING" } },
                            "competitorNames": { "type": "ARRAY", "items": { "type": "STRING" } },
                            "valueProposition": { "type": "STRING" },
                            "salesMethodology": { "type": "STRING" },
                            "systemPrompt": { "type": "STRING" }
                        }
                    }
                },
                "required": ["isComplete"]
            }
        }
    });

    let res = client
        .post(url)
        .header("x-goog-api-key", &api_key)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {}", e))?;
    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Gemini API error: {}", err_text));
    }
    let body: Value = res
        .json()
        .await
        .map_err(|e| format!("Failed to parse response JSON: {}", e))?;
    let text = body["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .unwrap_or("{}");
    let response_data: IcpResponseData = serde_json::from_str(text)
        .map_err(|e| format!("Failed to parse structured response: {}", e))?;
    Ok(response_data)
}

#[tauri::command]
pub async fn analyze_call_transcript(
    transcript: String,
    lead_name: String,
    lead_company: String,
    icp: Option<String>,
    api_key: Option<String>,
    ollama_base_url: Option<String>,
    ollama_model: Option<String>,
) -> Result<Value, String> {
    let icp_context = icp.unwrap_or("Not provided".to_string());
    let prompt = format!(
        "Analyze this sales call transcript.\nLEAD: {} at {}\nICP: {}\nTRANSCRIPT: {}\n
        Return JSON: summary, sentiment (Positive/Neutral/Negative/Mixed), objectionsRaised (array), keyInsights (array of 2-4), nextSteps (array), followUpEmail (body only), emailSubject.",
        lead_name, lead_company, icp_context, transcript
    );

    // Offline mode: an explicitly configured local Ollama server is tried
    // first; on failure we fall through to Gemini (or the demo mock).
    if let Some((base, model)) = ollama::resolve_local_ai(ollama_base_url, ollama_model) {
        match ollama::chat(&base, &model, &prompt, true).await {
            Ok(raw) => {
                let text = ollama::strip_json_fences(&raw);
                match serde_json::from_str::<Value>(text) {
                    Ok(data) => return Ok(data),
                    Err(e) => eprintln!("Ollama returned invalid analysis JSON: {}", e),
                }
            }
            Err(e) => eprintln!("Ollama unreachable: {}", e),
        }
    }

    let api_key = api_key
        .filter(|k| !k.is_empty() && k != "MY_GEMINI_API_KEY")
        .or_else(|| env::var("GEMINI_API_KEY").ok())
        .unwrap_or_default();
    if api_key.is_empty() || api_key == "MY_GEMINI_API_KEY" {
        return Ok(get_dynamic_mock_debrief(
            &transcript,
            &lead_name,
            &lead_company,
        ));
    }

    let client = Client::new();
    let url =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    let payload = json!({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "summary": { "type": "STRING" },
                    "sentiment": { "type": "STRING" },
                    "objectionsRaised": { "type": "ARRAY", "items": { "type": "STRING" } },
                    "keyInsights": { "type": "ARRAY", "items": { "type": "STRING" } },
                    "nextSteps": { "type": "ARRAY", "items": { "type": "STRING" } },
                    "followUpEmail": { "type": "STRING" },
                    "emailSubject": { "type": "STRING" }
                },
                "required": ["summary","sentiment","objectionsRaised","keyInsights","nextSteps","followUpEmail","emailSubject"]
            }
        }
    });

    let res = client
        .post(url)
        .header("x-goog-api-key", &api_key)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {}", e))?;
    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Gemini API error: {}", err_text));
    }
    let body: Value = res
        .json()
        .await
        .map_err(|e| format!("Failed to parse response JSON: {}", e))?;
    let text = body["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .unwrap_or("{}");
    let result: Value =
        serde_json::from_str(text).map_err(|e| format!("Failed to parse analysis: {}", e))?;
    Ok(result)
}

fn get_dynamic_mock_debrief(transcript: &str, lead_name: &str, lead_company: &str) -> Value {
    let lower = transcript.to_lowercase();
    let has_objection = lower.contains("already")
        || lower.contains("competitor")
        || lower.contains("broker")
        || lower.contains("expensive")
        || lower.contains("budget");
    let has_interest = lower.contains("interesting")
        || lower.contains("send")
        || lower.contains("calendar")
        || lower.contains("demo")
        || lower.contains("tuesday")
        || lower.contains("works");

    let sentiment = if has_interest {
        "Positive"
    } else if has_objection {
        "Mixed"
    } else {
        "Neutral"
    };

    let mut objections = vec![];
    if lower.contains("already") || lower.contains("hartford") || lower.contains("competitor") {
        objections.push("Competitor objection — prospect has existing relationship");
    }
    if lower.contains("expensive") || lower.contains("budget") || lower.contains("cost") {
        objections.push("Budget/pricing concern raised");
    }
    if lower.contains("partner") || lower.contains("team") || lower.contains("check with") {
        objections.push("Need to consult stakeholders before deciding");
    }

    let mut insights = vec![
        format!(
            "{} is actively evaluating alternatives to their current solution",
            lead_name
        ),
        format!(
            "Key decision makers at {} are receptive to change with proper justification",
            lead_company
        ),
    ];
    if has_interest {
        insights.push("Strong buying signals detected — follow up within 24 hours".to_string());
    }
    if has_objection {
        insights.push("Initial resistance was overcome by addressing specific pain points".into());
    }

    let next_steps = vec![
        format!(
            "Send follow-up email with tailored overview for {}",
            lead_company
        ),
        "Schedule a 15-minute follow-up call for next Tuesday".into(),
        "Prepare side-by-side comparison versus current provider".into(),
    ];

    json!({
        "summary": format!("The AI agent had a productive conversation with {} at {}. The prospect was initially skeptical but warmed up after specific pain points were addressed. Clear next steps were established, including a follow-up meeting.", lead_name, lead_company),
        "sentiment": sentiment,
        "objectionsRaised": if objections.is_empty() { vec!["No major objections detected"] } else { objections },
        "keyInsights": insights,
        "nextSteps": next_steps,
        "followUpEmail": format!("Hi {},\n\nGreat chatting with you earlier today. I really appreciated you taking the time to walk me through what's happening at {}.\n\nAs we discussed, I'll put together that tailored overview showing exactly how we can help close the gaps your current solution isn't covering. I think once you see the specifics, it'll make the conversation with your team much easier.\n\nWould next Tuesday afternoon work for a quick 15-minute follow-up? I'll come prepared with everything we discussed.\n\nLooking forward to it!", lead_name, lead_company),
        "emailSubject": format!("Great connecting today, {} — quick follow-up", lead_name)
    })
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ObjectionTrainerRequest {
    pub mode: String,
    pub objection: String,
    pub difficulty: String,
    pub messages: Vec<Value>,
    pub icp: Option<Value>,
    pub api_key: Option<String>,
    #[serde(default)]
    pub ollama_base_url: Option<String>,
    #[serde(default)]
    pub ollama_model: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct ObjectionTrainerResponse {
    pub role: String,
    pub text: String,
    // Gemini's schema emits camelCase; accept both spellings on parse.
    #[serde(alias = "isComplete", default)]
    pub is_complete: bool,
    #[serde(default)]
    pub score: Option<i32>,
    #[serde(default)]
    pub strengths: Vec<String>,
    #[serde(default)]
    pub improvements: Vec<String>,
    #[serde(alias = "rebuttalTip", default)]
    pub rebuttal_tip: String,
}

#[tauri::command]
pub async fn objection_trainer_turn(
    req: ObjectionTrainerRequest,
) -> Result<ObjectionTrainerResponse, String> {
    let messages_text: Vec<String> = req
        .messages
        .iter()
        .map(|m| {
            format!(
                "{}: {}",
                m["role"].as_str().unwrap_or("?"),
                m["text"].as_str().unwrap_or("")
            )
        })
        .collect();

    let icp_context = req
        .icp
        .as_ref()
        .and_then(|v| v.get("industry").and_then(|i| i.as_str()))
        .map(|ind| format!("\nProspect industry context from your ICP: {}.", ind))
        .unwrap_or_default();

    let prompt = format!(
        "You are role-playing as a resistant B2B prospect in a sales objection training simulation.
        Objection: \"{}\". Difficulty: {}.{}
        Conversation: {}
        Respond as the prospect. Keep responses 1-3 sentences. Be realistic.
        Return JSON: role='ai_prospect', text=<your next line>, isComplete=false (unless score requested).",
        req.objection, req.difficulty, icp_context, messages_text.join("\n")
    );

    // Offline mode: an explicitly configured local Ollama server is tried
    // first; on failure we fall through to Gemini (or the demo mock).
    if let Some((base, model)) =
        ollama::resolve_local_ai(req.ollama_base_url.clone(), req.ollama_model.clone())
    {
        match ollama::chat(&base, &model, &prompt, true).await {
            Ok(raw) => {
                let text = ollama::strip_json_fences(&raw);
                match serde_json::from_str::<ObjectionTrainerResponse>(text) {
                    Ok(data) => return Ok(data),
                    Err(e) => eprintln!("Ollama returned invalid trainer JSON: {}", e),
                }
            }
            Err(e) => eprintln!("Ollama unreachable: {}", e),
        }
    }

    let api_key_str = req.api_key.clone();
    let api_key = api_key_str
        .filter(|k| !k.is_empty() && k != "MY_GEMINI_API_KEY")
        .or_else(|| env::var("GEMINI_API_KEY").ok())
        .unwrap_or_default();
    if api_key.is_empty() || api_key == "MY_GEMINI_API_KEY" {
        return Ok(get_mock_trainer_response(&req));
    }

    let client = Client::new();
    let url =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    let payload = json!({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "role": { "type": "STRING" },
                    "text": { "type": "STRING" },
                    "isComplete": { "type": "BOOLEAN" },
                    "score": { "type": "INTEGER" },
                    "strengths": { "type": "ARRAY", "items": { "type": "STRING" } },
                    "improvements": { "type": "ARRAY", "items": { "type": "STRING" } },
                    "rebuttalTip": { "type": "STRING" }
                },
                "required": ["role","text","isComplete"]
            }
        }
    });

    let res = client
        .post(url)
        .header("x-goog-api-key", &api_key)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {}", e))?;
    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Gemini API error: {}", err_text));
    }
    let body: Value = res
        .json()
        .await
        .map_err(|e| format!("Failed to parse response JSON: {}", e))?;
    let text = body["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .unwrap_or("{}");
    let result: ObjectionTrainerResponse =
        serde_json::from_str(text).map_err(|e| format!("Failed to parse: {}", e))?;
    Ok(result)
}

fn get_mock_trainer_response(req: &ObjectionTrainerRequest) -> ObjectionTrainerResponse {
    let msg_count = req.messages.len();

    if req.mode == "score" || msg_count >= 5 {
        let score: i32 = match req.difficulty.as_str() {
            "easy" => 82,
            "hard" => 58,
            _ => 72,
        };
        return ObjectionTrainerResponse {
            role: "ai_prospect".into(),
            text: "Alright, you've made your case. Let me think about it.".into(),
            is_complete: true,
            score: Some(score),
            strengths: vec![
                "Good use of active listening techniques".into(),
                "Stayed professional under pushback".into(),
                "Effectively acknowledged the prospect's concern before rebutting".into(),
            ],
            improvements: vec![
                "Quantify the risk more specifically — use numbers to make the pain real".into(),
                "Ask more discovery questions before jumping to the solution".into(),
                "Use the Feel-Felt-Found framework more explicitly: 'I understand how you feel...'".into(),
            ],
            rebuttal_tip: match req.objection.as_str().contains("expensive") || req.objection.as_str().contains("budget") {
                true => "Try the ROI reframe: 'What would it cost you if this problem goes unsolved for another 6 months?'".into(),
                false => match req.objection.as_str().contains("already") || req.objection.as_str().contains("broker") {
                    true => "Try: 'That's exactly why you should hear us out — the best clients do their homework. What specifically would you need to see to consider a switch?'".into(),
                    false => "Try the 'feel-felt-found' technique: 'I understand how you feel. Others have felt the same way. What they found was...'".into(),
                }
            },
        };
    }

    let response_texts: [&str; 3] = match req.difficulty.as_str() {
        "easy" => [
            "Alright, I'm listening. What makes you different from what we're already doing?",
            "That's a fair point. Can you give me a specific example of how that would work for us?",
            "Hmm, I hadn't thought of it that way. Go on.",
        ],
        "medium" => [
            "Look, we've been doing things this way for years. Why should I change now?",
            "I hear what you're saying, but I'm not convinced the ROI is there. What's your proof?",
            "We tried something similar before and it didn't work. How is this different?",
        ],
        _ => [
            "I don't have time for this. What's your ONE best reason I should even care?",
            "You sound like every other vendor. Give me something concrete or I'm hanging up.",
            "We're already locked into a contract. Unless you can break our deal, this is a waste of time.",
        ],
    };

    let idx = (msg_count / 2).min(response_texts.len() - 1);
    ObjectionTrainerResponse {
        role: "ai_prospect".into(),
        text: response_texts[idx].into(),
        is_complete: false,
        score: None,
        strengths: vec![],
        improvements: vec![],
        rebuttal_tip: String::new(),
    }
}

#[tauri::command]
pub async fn test_provider_connection(provider: String, api_key: String) -> Result<(), String> {
    let api_key = api_key.trim().to_string();
    if api_key.is_empty() {
        return Err("No API key configured".to_string());
    }

    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let res = match provider.as_str() {
        "gemini" => {
            let url = "https://generativelanguage.googleapis.com/v1beta/models";
            client
                .get(url)
                .header("x-goog-api-key", &api_key)
                .send()
                .await
        }
        "openai" => {
            client
                .get("https://api.openai.com/v1/models")
                .bearer_auth(&api_key)
                .send()
                .await
        }
        "elevenlabs" => {
            client
                .get("https://api.elevenlabs.io/v1/user")
                .header("xi-api-key", &api_key)
                .send()
                .await
        }
        other => return Err(format!("Unknown provider: {}", other)),
    };

    match res {
        Ok(r) if r.status().is_success() => Ok(()),
        Ok(r) => {
            let status = r.status();
            let body = r.text().await.unwrap_or_default();
            let snippet: String = body.chars().take(300).collect();
            Err(format!("HTTP {}: {}", status, snippet))
        }
        Err(e) => Err(format!("Connection failed: {}", e)),
    }
}
