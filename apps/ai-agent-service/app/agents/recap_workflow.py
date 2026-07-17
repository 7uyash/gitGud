from typing import TypedDict, Annotated, List, Dict, Any
from langgraph.graph import StateGraph, END
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field
import os

class MatchDataState(TypedDict):
    match_id: str
    winner_team: str
    ending_reason: str
    player_role: str
    player_username: str
    tasks: List[Dict[str, Any]]
    events: List[Dict[str, Any]]
    recap: Dict[str, Any]

class AIRecapSchema(BaseModel):
    overallNarrative: str
    performanceScore: int
    conceptsLearned: List[str]
    conceptsToReview: List[str]
    hardestFaultTitle: str
    hardestFaultExplanation: str
    hardestFaultCode: str
    playerStrengths: List[str]
    playerWeaknesses: List[str]
    votingAnalysis: str
    taskBreakdown: List[Dict[str, str]]

def generate_recap_node(state: MatchDataState) -> MatchDataState:
    # Initialize LLM
    # Use Groq if API key available, else fallback to Gemini (since we have both configured in our docker-compose)
    if os.getenv("GROQ_API_KEY"):
        llm = ChatGroq(model_name="llama3-70b-8192", temperature=0.7)
    elif os.getenv("GOOGLE_API_KEY"):
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", temperature=0.7)
    else:
        # Template fallback if no API keys are present
        return fallback_template(state)
        
    structured_llm = llm.with_structured_output(AIRecapSchema)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an AI Post-Match Recap Agent for the game GitGud. Generate a personalized learning narrative explaining which concepts the player struggled with."),
        ("user", "Match ended. Winner: {winner_team}. Reason: {ending_reason}. Player: @{player_username} ({player_role}). Tasks: {tasks}")
    ])
    
    chain = prompt | structured_llm
    
    try:
        result = chain.invoke({
            "winner_team": state["winner_team"],
            "ending_reason": state["ending_reason"],
            "player_username": state["player_username"],
            "player_role": state["player_role"],
            "tasks": state["tasks"]
        })
        state["recap"] = result.dict()
    except Exception as e:
        print(f"LLM Generation failed: {e}")
        return fallback_template(state)
        
    return state

def fallback_template(state: MatchDataState) -> MatchDataState:
    tasks = state.get("tasks", [])
    completed = [t for t in tasks if t.get("playerAction") == "completed"]
    score = int((len(completed) / len(tasks)) * 100) if tasks else 0
    
    state["recap"] = {
        "overallNarrative": f"Template fallback: @{state.get('player_username')} played as {state.get('player_role')}.",
        "performanceScore": score,
        "conceptsLearned": [],
        "conceptsToReview": [],
        "hardestFaultTitle": "N/A",
        "hardestFaultExplanation": "N/A",
        "hardestFaultCode": "N/A",
        "playerStrengths": [],
        "playerWeaknesses": [],
        "votingAnalysis": "N/A",
        "taskBreakdown": []
    }
    return state

workflow = StateGraph(MatchDataState)

# Add node
workflow.add_node("generate_recap", generate_recap_node)

# Add edges
workflow.set_entry_point("generate_recap")
workflow.add_edge("generate_recap", END)

# Compile
recap_app = workflow.compile()
