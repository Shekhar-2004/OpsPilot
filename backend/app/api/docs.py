from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
import random
from app.core import deps
from app.core.config import settings
from app.models.models import Document, DocumentChunk, User
from app.schemas.schemas import DocumentResponse

router = APIRouter()

def simple_chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
    # Custom semantic sliding-window chunker
    words = text.split()
    chunks = []
    
    # Let's chunk based on characters to mimic the 500 token spec closely
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start += (chunk_size - overlap)
        
    return [c.strip() for c in chunks if len(c.strip()) > 10]

def generate_mock_embedding(dimensions: int = 128) -> List[float]:
    # Mocking standard normalized embedding float arrays
    vec = [random.uniform(-1.0, 1.0) for _ in range(dimensions)]
    norm = sum(x**2 for x in vec) ** 0.5
    return [x / norm for x in vec]

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    team_id: int = Form(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    # Enforce team membership check
    allowed_team_ids = [t.id for t in current_user.teams]
    if team_id not in allowed_team_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden. You are not a member of this team."
        )

    # Enforce maximum upload file size boundaries
    try:
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read upload metadata: {str(e)}"
        )

    max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB} MB (uploaded size: {file_size / (1024 * 1024):.2f} MB)"
        )

    try:
        # Read the file contents
        content_bytes = await file.read()
        text_content = content_bytes.decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read uploaded text file: {str(e)}"
        )
        
    if not text_content.strip():
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Create Document record
    doc = Document(
        file_name=file.filename,
        uploaded_by=current_user.name,
        team_id=team_id,
        embedding_status="processing"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    try:
        # Chunk text
        chunks = simple_chunk_text(text_content)
        
        # Add chunks with simulated float embeddings
        for content in chunks:
            mock_emb = generate_mock_embedding()
            chunk_rec = DocumentChunk(
                document_id=doc.id,
                content=content,
                embedding=mock_emb
            )
            db.add(chunk_rec)
            
        doc.embedding_status = "completed"
        db.commit()
    except Exception as e:
        doc.embedding_status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chunks: {str(e)}"
        )
        
    db.refresh(doc)
    return doc

@router.post("/text", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def submit_text_log(
    file_name: str = Form(...),
    content: str = Form(...),
    team_id: int = Form(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    # Enforce team membership check
    allowed_team_ids = [t.id for t in current_user.teams]
    if team_id not in allowed_team_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden. You are not a member of this team."
        )

    # Support for adding transcriptions or plain text logs directly via form
    if not content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty.")

    doc = Document(
        file_name=file_name,
        uploaded_by=current_user.name,
        team_id=team_id,
        embedding_status="processing"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    try:
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
    except Exception as e:
        doc.embedding_status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))
        
    db.refresh(doc)
    return doc

@router.get("/", response_model=List[DocumentResponse])
def list_documents(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    allowed_team_ids = [t.id for t in current_user.teams]
    return db.query(Document).filter(Document.team_id.in_(allowed_team_ids)).order_by(Document.created_at.desc()).all()

@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    doc_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
        
    allowed_team_ids = [t.id for t in current_user.teams]
    if doc.team_id not in allowed_team_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden. You cannot delete a document from another team's workspace."
        )
        
    db.delete(doc)
    db.commit()
    return None
