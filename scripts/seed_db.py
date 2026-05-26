import os
import sys

# Add backend to python path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend"))

from sqlalchemy.orm import Session
from app.models.database import engine, Base, SessionLocal
from app.models.models import User, Team, Task, Document, DocumentChunk, UserRole, TaskPriority, TaskStatus
from app.core.security import get_password_hash
from app.services.ai_service import AIService

def seed_database():
    print("Re-creating all database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        print("Inserting seed users...")
        pw_hash = get_password_hash("password123")
        
        rahul = User(name="Rahul", email="rahul@opspilot.ai", hashed_password=pw_hash, role=UserRole.COORDINATOR)
        priya = User(name="Priya", email="priya@opspilot.ai", hashed_password=pw_hash, role=UserRole.MEMBER)
        amit = User(name="Amit", email="amit@opspilot.ai", hashed_password=pw_hash, role=UserRole.ADMIN)
        sneha = User(name="Sneha", email="sneha@opspilot.ai", hashed_password=pw_hash, role=UserRole.MEMBER)
        
        db.add_all([rahul, priya, amit, sneha])
        db.commit()
        db.refresh(rahul)
        db.refresh(priya)
        db.refresh(amit)
        db.refresh(sneha)
        
        print("Creating operational teams...")
        sponsorship_team = Team(
            name="Sponsorship Operations",
            description="Securing funding, managing sponsor relations, and delivering sponsor deliverables.",
            invite_code="SPONS1"
        )
        event_team = Team(
            name="Event Coordination",
            description="Logistics, venue reservations, catering coordination, and schedule management.",
            invite_code="EVENT2"
        )
        
        # Add members to teams
        sponsorship_team.members.extend([rahul, priya, sneha])
        event_team.members.extend([rahul, priya, amit])
        
        db.add_all([sponsorship_team, event_team])
        db.commit()
        db.refresh(sponsorship_team)
        db.refresh(event_team)
        
        print("Creating operational tasks...")
        tasks = [
            Task(
                title="Finalize sponsorship pitch deck",
                description="Review slides, update package pricing, and add key metrics from last year's event.",
                priority=TaskPriority.HIGH,
                status=TaskStatus.TODO,
                deadline="Friday",
                owner_id=rahul.id,
                team_id=sponsorship_team.id
            ),
            Task(
                title="Email prospective tech partners",
                description="Reach out to the list of 15 confirmed target tech startups with the custom bronze package.",
                priority=TaskPriority.CRITICAL,
                status=TaskStatus.IN_PROGRESS,
                deadline="Next Monday",
                owner_id=priya.id,
                team_id=sponsorship_team.id
            ),
            Task(
                title="Sponsorship deliverables agreement review",
                description="Needs approval from Admin before sending to legal.",
                priority=TaskPriority.MEDIUM,
                status=TaskStatus.BLOCKED,
                deadline="Overdue since May 20",
                owner_id=sneha.id,
                team_id=sponsorship_team.id
            ),
            Task(
                title="Reserve venue main stage audio equipment",
                description="Signed contract for mixers, speakers, and wireless lapels.",
                priority=TaskPriority.HIGH,
                status=TaskStatus.DONE,
                deadline="Completed yesterday",
                owner_id=amit.id,
                team_id=event_team.id
            ),
            Task(
                title="Review event safety protocols",
                description="Audit the medical response station layout and evacuation exits.",
                priority=TaskPriority.MEDIUM,
                status=TaskStatus.BLOCKED,
                deadline="Tomorrow afternoon",
                owner_id=rahul.id,
                team_id=event_team.id
            ),
            Task(
                title="Draft welcome booklet for attendees",
                description="Design draft in Figma, prepare maps, and write the operational schedules.",
                priority=TaskPriority.LOW,
                status=TaskStatus.TODO,
                deadline="June 10",
                owner_id=priya.id,
                team_id=event_team.id
            )
        ]
        
        db.add_all(tasks)
        db.commit()
        
        print("Uploading & chunking operational transcript documents...")
        transcript_content = (
            "Sponsorship Team Sync Transcript - May 24, 2026\n\n"
            "Rahul: Welcome everyone to our sponsorship synchronization meeting. Let's align on execution.\n"
            "Rahul: We need to finalize the sponsorship pitch deck by Friday because several partners requested the materials.\n"
            "Priya: I have draft slides ready, but I need updated pricing metrics from last year.\n"
            "Rahul: Action item: Rahul will finalize the sponsorship pitch deck by Friday.\n"
            "Priya: Great. I will also email prospective tech partners with the bronze packages on Monday.\n"
            "Priya: Sneha, do we have the deliverables agreement ready?\n"
            "Sneha: No, it is blocked since May 20. Amit needs to approve the legal templates first. I will wait for Amit.\n"
            "Rahul: Perfect. Let's make sure Priya contacts the startup leads. Meeting adjourned."
        )
        
        doc = Document(
            file_name="sponsorship_sync_may24.txt",
            uploaded_by="Rahul",
            embedding_status="processing"
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        
        # Ingest chunks
        # Chunk size is small to have multiple chunks for our mock document
        chunks = [
            "Sponsorship Team Sync Transcript - May 24, 2026\nRahul: Welcome everyone to our sponsorship synchronization meeting. Let's align on execution. We need to finalize the sponsorship pitch deck by Friday because several partners requested the materials.",
            "Priya: I have draft slides ready, but I need updated pricing metrics from last year.\nAction item: Rahul will finalize the sponsorship pitch deck by Friday.\nPriya: Great. I will also email prospective tech partners with the bronze packages on Monday.",
            "Priya: Sneha, do we have the deliverables agreement ready?\nSneha: No, it is blocked since May 20. Amit needs to approve the legal templates first. I will wait for Amit.\nRahul: Perfect. Let's make sure Priya contacts the startup leads. Meeting adjourned."
        ]
        
        for c in chunks:
            mock_vector = AIService.generate_query_vector()
            chunk_rec = DocumentChunk(
                document_id=doc.id,
                content=c,
                embedding=mock_vector
            )
            db.add(chunk_rec)
            
        doc.embedding_status = "completed"
        db.commit()
        
        print("Database successfully seeded with highly rich operational data!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {str(e)}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
