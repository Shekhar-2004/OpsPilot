from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
import random
from app.core import deps
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
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
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
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    # Support for adding transcriptions or plain text logs directly via form
    if not content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty.")

    doc = Document(
        file_name=file_name,
        uploaded_by=current_user.name,
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
    return db.query(Document).order_by(Document.created_at.desc()).all()

@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    doc_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
        
    db.delete(doc)
    db.commit()
    return None
