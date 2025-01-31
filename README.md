# Competitive Analysis Workflow

This repository contains a Competitive Analysis Workflow built with the BeeAI Framework. It automates the process of gathering competitor data, conducting web research, categorizing insights, and generating a detailed competitive analysis report.

## Workflow Overview

This workflow helps streamline competitive research by:
1. Identifying Competitors: Automatically generates a list of competitors in a given industry or from a custom list you provide.
2. Selecting Competitors for Analysis: Chooses which competitor to analyze next from the list.
3. Conducting Web Research: Uses the Tavily API to gather relevant data about each competitor.
4. Categorizing Findings: Analyzes the data and categorizes the key insights.
5. Generating a Final Report: Compiles all findings into a markdown-based summary.

## How to Use

1. The script will prompt you to enter an industry or a list of competitors.
2. It will then run through the workflow steps, providing logs and insights along the way.
3. Upon completion, it will output the final competitive analysis.

## Example Input & Output

### Input

```
npm start <<< '{"industry": "Open Source AI Agent Frameworks", "specifiedCompetitors": ["CrewAI", "Relevance AI", "LangGraph", "AutoGen", "OpenAI"]}'
```

### Output

```markdown
=== Final Analysis ===

# Competitive Analysis: Open Source AI Agent Frameworks

Competitive analysis of CrewAI, LangChain, AutoGen

## CrewAI
* CrewAI is an open-source framework for managing AI agents.
* It allows for task automation and collaboration among multiple agents.
* The platform is built in Python, making it accessible to a wide range of developers.
* Open-source nature enabling community contributions
* Python-based implementation facilitating easy integration with existing tools
* Multi-agent orchestration supporting collaborative workflows

## LangChain
* LangChain is an open-source framework designed to simplify building LLM-powered applications.
* It provides modular components that help integrate LLMs with data sources and computation tools.
* The framework offers advanced prompt engineering capabilities for better application development.
* Open-source nature allowing customization and community contributions.
* Modular architecture enabling flexible integration with various LLMs and external systems.
* Comprehensive set of tools for building sophisticated AI applications like chatbots, content generators, and data retrieval systems.

## AutoGen
* AutoGen is a multi-agent platform designed for collaborative problem-solving.
* It supports asynchronous messaging and scalable distributed agents.
* The platform offers modular, extensible design allowing users to bring their own agents and implement behaviors.
* Asynchronous messaging enabling efficient agent communication.
* Scalable distributed architecture supporting multiple agents working together.
* Modular design for extensibility and customization.

### Sources
* Unlocking the Power of AI with CrewAI: A Comprehensive Overview : https://www.squareshift.co/post/unlocking-the-power-of-ai-with-crewai-a-comprehensive-overview
* CrewAI: Unlocking Collaborative Intelligence in AI Systems : https://insights.codegpt.co/crewai-guide
* CrewAI Reviews 2025: Features, Pricing & Alternatives : https://www.aitoolsty.com/tool/crewai
* What is Langchain? - Analytics Vidhya : https://www.analyticsvidhya.com/blog/2024/06/langchain-guide/
* What is LangChain? A Comprehensive Guide to the Framework : https://datasciencedojo.com/blog/what-is-langchain/
* Understanding the LangChain Framework | by TechLatest.Net - Medium : https://medium.com/@techlatest.net/understanding-the-langchain-framework-8624e68fca32
* Autogen Overview, Examples, Pros and Cons in 2025 : https://best-of-web.builder.io/library/microsoft/autogen
* AutoGen Agents - Fast overview for beginners - Method Lab AI : https://methodlab.ai/multi-agent/autogen-agents-fast-overview-for-beginners/
* What is AutoGen? Our Full Guide to the Autogen Multi-Agent Platform : https://skimai.com/what-is-autogen-our-full-guide-to-the-autogen-multi-agent-platform/
```
