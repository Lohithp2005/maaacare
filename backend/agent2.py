import os
from dotenv import load_dotenv
from crewai import Agent, Crew, Task, Process, LLM
from crewai_tools import RagTool
from tools import SMSTool
from memory import PATIENT_DATA

load_dotenv()

llm = LLM(
    model="gemini/gemini-2.0-flash",
    api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0.7,
    max_tokens=200
)

rag_config = {
    "llm": {
        "provider": "google",
        "config": {
            "model": "gemini-2.0-flash-exp",
            "api_key": os.getenv("GEMINI_API_KEY")
        }
    },
    "embedder": {
        "provider": "google",
        "config": {
            "model": "models/text-embedding-004",
            "api_key": os.getenv("GEMINI_API_KEY"),
            "task_type": "retrieval_document"
        }
    }
}

try:
    medical_knowledge = RagTool(config=rag_config, summarize=True)
    
    
    print(" RAG Tool initialized successfully with Google embeddings!")
except Exception as e:
    print(f" RAG Tool initialization failed: {e}")
    print("Continuing without RAG tool. Agents will use base knowledge only.")
    medical_knowledge = None

# Patient Info Agent - No tools needed (uses memory)
patient_info = Agent(
    role="Patient Info Agent",
    goal="Provide complete patient information on request",
    backstory=f"You are analyzing patient: {PATIENT_DATA['patient']}. "
              f"You have access to their complete medical history including: "
              f"trimester, conditions, allergies, and restrictions.",
    allow_delegation=False,
    verbose=True,
    llm=llm
)

# Nutrition Agent - Enhanced with RAG (if available)
nutrition_tools = [medical_knowledge] if medical_knowledge else []
nutrition_agent = Agent(
    role="Nutrition Agent",
    goal="Create personalized, evidence-based diet plans based on patient data",
    backstory="You are a certified prenatal nutritionist. Always consult the "
              "Patient Info Agent first to understand the patient's trimester, "
              "conditions, and allergies. Use your medical knowledge base to "
              "ensure recommendations are evidence-based and safe.",
    allow_delegation=True,
    verbose=True,
    llm=llm,
    tools=nutrition_tools
)

# Exercise Agent - Enhanced with RAG (if available)
exercise_tools = [medical_knowledge] if medical_knowledge else []
exercise_agent = Agent(
    role="Prenatal Exercise Specialist Agent",
    goal="Offer exercise guidance personalized to the patient's trimester, "
         "adjusting intensity and avoiding unsafe positions",
    backstory="You are a certified prenatal fitness specialist with deep knowledge "
              "of pregnancy-safe exercises, trimester physiology, and medical red-flags. "
              "You always consult the Patient Info Agent first to understand the mother's "
              "trimester, health status, and restrictions. You use evidence-based protocols "
              "for safe exercise recommendations.",
    allow_delegation=True,
    verbose=True,
    llm=llm,
    tools=exercise_tools
)

doctor_agent = Agent(
    role="Doctor Agent",
    goal="Review all recommendations for medical safety and approve or reject them",
    backstory="You are a board-certified OB-GYN with expertise in high-risk pregnancies. "
              "You review all diet and exercise plans to ensure they are medically safe. "
              "If you detect any unsafe recommendations or severe symptoms, you immediately "
              "send an SMS alert using your SMS tool. Severe symptoms include: bleeding, "
              "severe abdominal pain, fever >100.4°F, no fetal movement, chest pain, "
              "severe headache, or vision changes.",
    allow_delegation=False,
    verbose=True,
    llm=llm,
    tools=[SMSTool()]
)

def run_agents(user_question: str):
    """
    Process user questions through the agent workflow.
    
    Args:
        user_question: The user's question or concern
        
    Returns:
        A doctor-approved response
    """
    
    emergency_keywords = [
        "bleeding", "severe pain", "fever", "no movement",
        "chest pain", "can't breathe", "severe headache",
        "vision changes", "seizure", "passed out", "fainted"
    ]
    
    is_emergency = any(keyword in user_question.lower() for keyword in emergency_keywords)
    
    dynamic_task = Task(
        description=f"""
        User Question: "{user_question}"
        
        CRITICAL EMERGENCY PROTOCOL:
        {f"EMERGENCY DETECTED! Immediately alert doctor via SMS." if is_emergency else ""}
        
        WORKFLOW:
        1. Patient Info Agent: Retrieve patient's current trimester, medical conditions,
           allergies, dietary restrictions, and exercise limitations.
        
        2. Route to appropriate specialist(s):
           - Nutrition questions → Nutrition Agent
           - Exercise questions → Exercise Agent
           - Complex questions → Both agents collaborate
        
        3. Specialist agents MUST:
           - First consult Patient Info Agent
           - Provide specific, personalized advice based on patient data
           - Note any concerns or contraindications
        
        4. Doctor Agent: Review and validate ALL recommendations for safety.
           - Approve if safe and appropriate
           - Modify if needed
           - REJECT and send SMS alert if unsafe or concerning symptoms detected
        
        5. Final Output: Provide ONLY the doctor-approved answer in a clear,
           compassionate format suitable for the patient.
        """,
        expected_output="A clear, personalized, doctor-approved answer with specific "
                       "recommendations based on the patient's trimester and medical profile. "
                       "Include any important safety notes or warnings.",
        agent=None  
    )

    crew = Crew(
        agents=[patient_info, nutrition_agent, exercise_agent, doctor_agent],
        tasks=[dynamic_task],
        process=Process.hierarchical,
        verbose=True,
        manager_llm=llm,

    )

    try:
        result = crew.kickoff()
        return result.raw
    except Exception as e:
        print(f"Error in agent workflow: {e}")
        return f"An error occurred while processing your request. Please try again or contact your healthcare provider."


if __name__ == "__main__":
    print("\n" + "="*80)
    print("PRENATAL CARE AGENT SYSTEM - Testing")
    print("="*80 + "\n")
    
    test_questions = [
        "What should I eat for breakfast in my second trimester?",
        "Is yoga safe during pregnancy?",
    ]
    
    for question in test_questions:
        print(f"\n{'─'*80}")
        print(f"Question: {question}")
        print(f"{'─'*80}\n")
        
        response = run_agents(question)
        print(f"\nResponse: {response}\n")
        print("="*80)