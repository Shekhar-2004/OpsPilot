import random
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Dict, Any, Tuple, Optional
from app.models.models import Task, Document, DocumentChunk, Team, User
from app.core.config import settings

class AIService:
    @staticmethod
    def generate_query_vector(dimensions: int = 128) -> List[float]:
        # Generating a simulated normalized query embedding vector
        vec = [random.uniform(-1.0, 1.0) for _ in range(dimensions)]
        norm = sum(x**2 for x in vec) ** 0.5
        return [x / norm for x in vec]

    @staticmethod
    def compute_cosine_similarity(v1: List[float], v2: List[float]) -> float:
        if not v1 or not v2 or len(v1) != len(v2):
            return 0.0
        # Since our vectors are pre-normalized, dot product is exactly the cosine similarity
        return sum(a * b for a, b in zip(v1, v2))

    @classmethod
    def query_semantic_chunks(
        cls, db: Session, query: str, allowed_uploaders: List[str], top_k: int = 3
    ) -> List[Tuple[DocumentChunk, float]]:
        if not allowed_uploaders:
            return []
            
        # Retrieve all chunks belonging to allowed uploaders
        all_chunks = (
            db.query(DocumentChunk)
            .join(Document)
            .filter(Document.uploaded_by.in_(allowed_uploaders))
            .all()
        )
        if not all_chunks:
            return []
            
        # Standard keyword scoring boost for actual queries (for realistic RAG performance)
        query_words = set(query.lower().split())
        
        scored_chunks = []
        # Generate dummy vector for the search term
        q_vector = cls.generate_query_vector()
        
        for chunk in all_chunks:
            # Baseline vector similarity
            sim = cls.compute_cosine_similarity(q_vector, chunk.embedding or [])
            
            # Boost score based on keyword overlap for realism
            content_lower = chunk.content.lower()
            overlap_count = sum(1 for word in query_words if word in content_lower)
            if overlap_count > 0:
                sim += 0.15 * overlap_count  # boost by 15% per matching word
                
            scored_chunks.append((chunk, sim))
            
        # Sort by score descending
        scored_chunks.sort(key=lambda x: x[1], reverse=True)
        return scored_chunks[:top_k]

    @classmethod
    def extract_actionable_tasks(cls, text: str) -> List[Dict[str, Any]]:
        # Light NLP parser looking for indicators (e.g. "Draft sponsorship list by Friday", "Rahul will contact vendors")
        tasks = []
        lines = text.split("\n")
        
        common_owners = ["Rahul", "Priya", "Amit", "Sneha", "Karan", "Pooja", "Vikram"]
        
        # Simple extraction triggers
        for line in lines:
            line_clean = line.strip()
            if not line_clean:
                continue
                
            # Check for name references or action keywords
            found_owner = None
            for owner in common_owners:
                if owner.lower() in line_clean.lower():
                    found_owner = owner
                    break
                    
            if any(kw in line_clean.lower() for kw in ["will", "must", "should", "action:", "task:", "todo"]):
                # Clean up and extract
                title = line_clean
                deadline = "Pending"
                if "by" in line_clean.lower():
                    parts = line_clean.split("by")
                    title = parts[0].strip()
                    deadline = parts[1].strip().rstrip(".")
                
                tasks.append({
                    "title": title[:100],
                    "owner": found_owner or "Unassigned",
                    "deadline": deadline
                })
        return tasks

    @classmethod
    def answer_query_with_gemini(cls, query: str, context_str: str) -> Optional[str]:
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            return None
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        
        prompt = (
            "You are Antigravity, the premium AI Operations Coordinator inside the OpsPilot dashboard.\n"
            "Your job is to answer the user's operational query directly, concisely, and with extreme polish using the grounded workspace context provided below.\n\n"
            "Rules:\n"
            "1. Provide a direct, clear, and highly focused answer at the very beginning. Avoid verbose introductions.\n"
            "2. Keep the formatting clean and elegant. Do not output repetitive alert boxes, hallucination metrics, or unnecessary tables unless specifically requested.\n"
            "3. If the query relates to tasks, represent them in a simple Markdown Table (ID, Task Name, Status, Priority, Owner, Deadline).\n"
            "4. If relevant, output a concise list of 1-3 direct recommendations at the end.\n"
            "5. Ground your answer strictly in the provided context. If the query cannot be answered by the context, state it clearly.\n\n"
            f"Grounded Context:\n{context_str}\n\n"
            f"User Query: {query}\n\n"
            "Synthesized Response:"
        )
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ]
        }
        
        try:
            import urllib.request
            import json
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                return res_data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            print(f"Error calling Gemini API: {str(e)}")
            return None

    @classmethod
    def answer_query(
        cls, db: Session, query: str, team_id: Optional[int] = None, current_user: Optional[User] = None
    ) -> Dict[str, Any]:
        query_lower = query.lower()
        sources = []
        extracted_tasks = []
        
        # Enforce strict user and tenant privacy
        if current_user is None:
            from fastapi import HTTPException
            raise HTTPException(status_code=401, detail="Authentication required for query processing.")
            
        allowed_team_ids = [t.id for t in current_user.teams]
        
        # 1. Fetch relevant tasks, gated by user's team membership boundaries
        task_query = db.query(Task)
        if team_id is not None:
            if team_id not in allowed_team_ids:
                from fastapi import HTTPException
                raise HTTPException(status_code=403, detail="Access denied to the specified team workspace.")
            task_query = task_query.filter(Task.team_id == team_id)
        else:
            task_query = task_query.filter(Task.team_id.in_(allowed_team_ids))
            
        all_tasks = task_query.all()
        
        # Filter tasks matching query keywords
        matching_tasks = []
        for t in all_tasks:
            if (
                t.title.lower() in query_lower or 
                (t.description and t.description.lower() in query_lower) or
                any(w in t.title.lower() for w in query_lower.split())
            ):
                matching_tasks.append(t)
                
        # Resolve names of teammates belonging to the user's teams to filter uploaded documents
        allowed_uploaders = []
        for team in current_user.teams:
            for u in team.members:
                allowed_uploaders.append(u.name)
        allowed_uploaders = list(set(allowed_uploaders))
        
        # 2. Fetch isolated semantic document chunks uploaded by team members
        semantic_matches = cls.query_semantic_chunks(db, query, allowed_uploaders=allowed_uploaders, top_k=2)
        
        # Compile grounding context
        context_parts = []
        
        if matching_tasks:
            context_parts.append("### Grounded Relational Tasks")
            for t in matching_tasks[:5]:
                owner_name = t.owner.name if t.owner else "Unassigned"
                context_parts.append(
                    f"- Task **#{t.id}**: {t.title} (Status: {t.status.value.upper()}, Priority: {t.priority.value.upper()}, Assignee: {owner_name}, Deadline: {t.deadline or 'N/A'})"
                )
                sources.append(f"Task #{t.id}: {t.title}")
                
        if semantic_matches:
            context_parts.append("### Grounded Organizational Memory Chunks")
            for chunk, score in semantic_matches:
                doc_name = chunk.document.file_name
                context_parts.append(f"- From **[{doc_name}]** (Relevance: {score:.2f}):\n  > \"{chunk.content}\"")
                sources.append(f"Document: {doc_name}")
                
        # Synthesize answering text
        if not context_parts:
            # General fallback answering using standard team info
            user_teams = current_user.teams
            teams_str = ", ".join([t.name for t in user_teams]) if user_teams else "None"
            answer = (
                f"I checked the OpsPilot operational database but couldn't find any direct matches "
                f"for **\"{query}\"** in active tasks or documents.\n\n"
                f"**Active Workspace Context**:\n"
                f"- Available Teams: {teams_str}\n"
                f"- Total Tasks: {len(all_tasks)}\n\n"
                f"Try searching for specific tasks (e.g. 'sponsorship') or upload a team transcript "
                f"to ingest new semantic memories!"
            )
        else:
            context_str = "\n".join(context_parts)
            
            gemini_answer = cls.answer_query_with_gemini(query, context_str)
            if gemini_answer:
                return {
                    "query": query,
                    "answer": gemini_answer,
                    "sources": list(set(sources)),
                    "extracted_tasks": cls.extract_actionable_tasks(gemini_answer)
                }
            
            # Clean, direct simulated synthesis
            matched_sentences = []
            for chunk, score in semantic_matches:
                # Split content into sentences
                sentences = [s.strip() for s in chunk.content.replace("\n", ". ").split(". ") if s.strip()]
                for s in sentences:
                    # If sentence matches any query keywords, prioritize it
                    if any(w in s.lower() for w in query_lower.split()) and len(s) > 15:
                        matched_sentences.append(s)
            
            # Fallback if no specific sentence matched keywords
            if not matched_sentences:
                for chunk, score in semantic_matches:
                    sentences = [s.strip() for s in chunk.content.replace("\n", ". ").split(". ") if s.strip()]
                    if sentences:
                        matched_sentences.append(sentences[0])
            
            # Combine sentences into a clean paragraph
            direct_summary = ". ".join(matched_sentences[:3])
            if direct_summary and not direct_summary.endswith("."):
                direct_summary += "."
            direct_summary = direct_summary.replace("..", ".")
                
            # If we also have matching tasks, represent them cleanly
            task_notes = ""
            if matching_tasks:
                task_notes = "\n\n## 📋 Related Action Tasks\n"
                for t in matching_tasks[:3]:
                    owner_name = t.owner.name if t.owner else "Unassigned"
                    task_notes += f"- **{t.title}** (Status: *{t.status.value.upper()}*, Assignee: `{owner_name}`, Deadline: *{t.deadline or 'N/A'}*)\n"

            answer = (
                f"# 🚀 OpsPilot Operations Briefing\n\n"
                f"**Direct Answer**:\n"
                f"{direct_summary}"
                f"{task_notes}\n\n"
                f"---\n"
                f"**Retrieved Sources**: {', '.join(list(set(sources)))}"
            )
            
        return {
            "query": query,
            "answer": answer,
            "sources": list(set(sources)),
            "extracted_tasks": cls.extract_actionable_tasks(answer)
        }
