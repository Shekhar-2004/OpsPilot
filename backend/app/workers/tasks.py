from app.workers.celery_app import celery_app
from app.models.database import SessionLocal
from app.models.models import Document, DocumentChunk, Meeting, Task, Team, User, TaskStatus, TaskPriority
from app.services.ai_service import AIService
from app.api.docs import simple_chunk_text, generate_mock_embedding
import time

@celery_app.task(name="app.workers.process_document_chunking_task")
def process_document_chunking_task(doc_id: int, content: str):
    print(f"Celery Worker: Starting document chunking for doc {doc_id}...")
    # Simulate processing lag for realism (e.g. LLM/Embedding API call)
    time.sleep(2)
    
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            print(f"Error: Document {doc_id} not found in database.")
            return False
            
        chunks = simple_chunk_text(content)
        for chunk_txt in chunks:
            mock_emb = generate_mock_embedding()
            chunk_rec = DocumentChunk(
                document_id=doc.id,
                content=chunk_txt,
                embedding=mock_emb
            )
            db.add(chunk_rec)
            
        doc.embedding_status = "completed"
        db.commit()
        print(f"Celery Worker: Successfully parsed {len(chunks)} chunks for doc {doc_id}.")
        return True
    except Exception as e:
        db.rollback()
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.embedding_status = "failed"
            db.commit()
        print(f"Celery Worker Exception: {str(e)}")
        return False
    finally:
        db.close()

@celery_app.task(name="app.workers.extract_meeting_action_items_task")
def extract_meeting_action_items_task(meeting_id: int):
    print(f"Celery Worker: Parsing transcript from meeting {meeting_id}...")
    time.sleep(3)
    
    db = SessionLocal()
    try:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            print(f"Error: Meeting {meeting_id} not found.")
            return False
            
        # 1. Synthesize summary using AIService
        ai_res = AIService.answer_query(db, f"Summarize transcript and find items in: {meeting.title}")
        meeting.summary = ai_res["answer"]
        
        # 2. Extract and auto-assign tasks to first team found
        extracted = AIService.extract_actionable_tasks(meeting.transcript)
        default_team = db.query(Team).first()
        
        if default_team and extracted:
            print(f"Celery Worker: Automatically creating {len(extracted)} tasks for team '{default_team.name}'...")
            for et in extracted[:3]:
                # Try finding candidate assignee
                assignee = db.query(User).filter(User.name.ilike(f"%{et['owner']}%")).first()
                
                # Check for existing duplicate task
                dup = db.query(Task).filter(Task.title == et['title']).first()
                if not dup:
                    t = Task(
                        title=et['title'],
                        description=f"Auto-extracted from meeting transcript: \"{meeting.title}\"",
                        priority=TaskPriority.HIGH if et['deadline'] != "Pending" else TaskPriority.MEDIUM,
                        status=TaskStatus.TODO,
                        deadline=et['deadline'],
                        team_id=default_team.id,
                        owner_id=assignee.id if assignee else None
                    )
                    db.add(t)
                    
        db.commit()
        print(f"Celery Worker: Meeting {meeting_id} transcript processed successfully!")
        return True
    except Exception as e:
        db.rollback()
        print(f"Celery Worker Meeting Exception: {str(e)}")
        return False
    finally:
        db.close()
