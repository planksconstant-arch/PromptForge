"""
YaPrompt AI Studio - Main UI
Built with Streamlit for 90% Python Architecture
"""

import streamlit as st
import asyncio
import time
from services.agent_execution_engine import agent_execution_engine
from services.conversational_agent_builder import conversational_agent_builder, BuilderState
from services.negotiation_engine import negotiation_engine
from services.business_automation import business_automation
from services.workflow_generator import workflow_generator
from services.rl_engine import rl_engine
from services.teammate_engine import teammate_engine
from services.ai_operating_system import ai_operating_system

# Page Config
st.set_page_config(
    page_title="PromptForge AI Studio",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .reportview-container { background: #0e1117; }
    .main { background: #0e1117; color: white; }
    h1, h2, h3 { color: #8b5cf6 !important; }
    .stButton>button { background-color: #6366f1; color: white; border-radius: 8px; }
</style>
""", unsafe_allow_html=True)

# Sidebar
st.sidebar.title("🤖 PromptForge Studio")
st.sidebar.markdown("---")
mode = st.sidebar.radio("Select Module", [
    "Dashboard", 
    "Agent Builder", 
    "Workflow Studio", 
    "Negotiation Engine", 
    "Business Automation"
])

# Async Helper
def run_async(coro):
    return asyncio.run(coro)

# === MODULES ===

if mode == "Dashboard":
    st.title("🚀 AI Operating System Dashboard")
    
    col1, col2, col3 = st.columns(3)
    
    status = run_async(ai_operating_system.get_system_status())
    
    with col1:
        st.metric("System Uptime", f"{int(status['uptime']/1000)}s")
        st.metric("Active Agents", "3")
        
    with col2:
        stats = rl_engine.get_stats()
        st.metric("RL Rewards", stats['totalRewards'])
        st.metric("Learning Rate", stats['learningRate'])
    
    with col3:
        st.metric("Workflows", status['stats'].get('workflowsLearned', 0))
        st.metric("Projects", status['stats'].get('projectsManaged', 0))

    st.markdown("### 🧠 Teammate Suggestions")
    suggestions = run_async(teammate_engine.generate_proactive_suggestions({}))
    if not suggestions:
        st.info("No immediate suggestions. You're doing great!")
    else:
        for sug in suggestions:
            st.warning(f"**{sug.type.upper()}**: {sug.message}")

elif mode == "Agent Builder":
    st.title("🛠️ Conversational Agent Builder")
    
    if "builder_state" not in st.session_state:
        st.session_state.builder_state = None
        st.session_state.messages = []

    # Chat Interface
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.write(msg["content"])

    if prompt := st.chat_input("Describe the agent you want to build..."):
        # Add user message
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.write(prompt)

        # Process with Python Backend
        with st.spinner("Thinking..."):
            if st.session_state.builder_state is None:
                # Start new
                result = run_async(conversational_agent_builder.start_conversation(prompt))
            else:
                # Continue
                result = run_async(conversational_agent_builder.continue_conversation(
                    st.session_state.builder_state, prompt
                ))
            
            st.session_state.builder_state = result.state
            
            # Add AI responses
            ai_msg = result.message
            st.session_state.messages.append({"role": "assistant", "content": ai_msg})
            with st.chat_message("assistant"):
                st.write(ai_msg)
            
            if result.agentConfig:
                st.success("✨ Agent Configuration Generated!")
                st.json(result.agentConfig)

elif mode == "Workflow Studio":
    st.title("⚡ Workflow Generator")
    
    desc = st.text_area("Describe your automation workflow:", height=100)
    if st.button("Generate n8n Workflow"):
        with st.spinner("Generating nodes and connections..."):
            workflow = run_async(workflow_generator.generate_workflow(desc))
            
            st.markdown(f"### Result: {workflow['name']}")
            
            # Visualize Graph (Simple representation)
            st.graphviz_chart(f"""
                digraph {{
                    rankdir=LR;
                    node [shape=box, style="filled,rounded", fillcolor="#e0e7ff", fontname="Helvetica"];
                    
                    {'; '.join([f'"{n["name"]}"' for n in workflow['nodes']])}
                    
                    "Webhook" -> "Google Gemini Chat";
                    "Google Gemini Chat" -> "Respond to Webhook";
                }}
            """)
            
            with st.expander("View JSON"):
                st.json(workflow)

elif mode == "Negotiation Engine":
    st.title("💰 AI Negotiator")
    
    col1, col2 = st.columns(2)
    with col1:
        vendor = st.text_input("Vendor Name", "Acme Corp")
        product = st.text_input("Product", "Cloud Services")
        price = st.number_input("Initial Price ($)", 1000)
        target = st.number_input("Target Price ($)", 700)
        
    if st.button("Start Negotiation"):
        session = run_async(negotiation_engine.start_negotiation({
            "vendor": vendor,
            "product": product,
            "initialPrice": price,
            "targetPrice": target
        }))
        st.session_state.negotiation_session = session
        st.success(f"Negotiation Started! Session ID: {session.id}")
        
    if "negotiation_session" in st.session_state:
        session = st.session_state.negotiation_session
        st.markdown(f"### Current Price: ${session.currentPrice}")
        
        history = session.rounds
        for r in history:
            with st.chat_message("assistant"):
                st.write(f"**Round {r['round']} Offer:** ${r['agentOffer']}")
                st.write(f"_{r['agentMessage']}_")
            
            if 'vendorResponse' in r:
                with st.chat_message("user"):
                    st.write(f"**Vendor:** ${r['vendorResponse']['price']}")
                    st.write(f"_{r['vendorResponse']['message']}_")

elif mode == "Business Automation":
    st.title("🏢 Business Automation")
    
    tab1, tab2 = st.tabs(["Booking", "Invoicing"])
    
    with tab1:
        st.subheader("Smart Booking Agent")
        b_type = st.selectbox("Type", ["Restaurant", "Hotel", "Flight"])
        name = st.text_input("Name/Location")
        date = st.date_input("Date")
        
        if st.button("Book Now"):
            res = run_async(business_automation.make_booking({
                "type": b_type.lower(),
                "details": {"name": name, "date": str(date)}
            }))
            st.info(res['message'])
            if res.get("approvalId"):
                st.warning(f"Approval Required: {res['approvalId']}")
                
    with tab2:
        st.subheader("Invoice Generator")
        client = st.text_input("Client Name")
        item = st.text_input("Item Description")
        amt = st.number_input("Amount", 0)
        
        if st.button("Generate & Send"):
            res = run_async(business_automation.generate_invoice({
                "client": client,
                "items": [{"description": item, "quantity": 1, "rate": amt}]
            }))
            st.success("Invoice Generated (Draft)")
            st.json(res['invoice'])

