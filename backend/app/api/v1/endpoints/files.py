import io
from typing import List
import uuid
import zipfile
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File as FastAPIFile
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.workspace import Project, File, Workspace
from app.models.analytics import AuditLog
from app.schemas.workspace import FileCreate, FileResponse, FileUpdate

router = APIRouter()

# Helper to map extension to monaco language
def get_language_from_ext(filename: str) -> str:
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    mapping = {
        "py": "python",
        "js": "javascript",
        "jsx": "javascript",
        "ts": "typescript",
        "tsx": "typescript",
        "html": "html",
        "css": "css",
        "java": "java",
        "cpp": "cpp",
        "c": "c",
        "go": "go",
        "rs": "rust",
        "json": "json",
        "md": "markdown",
        "sh": "shell"
    }
    return mapping.get(ext, "plaintext")

@router.get("/project/{project_id}", response_model=List[FileResponse])
def get_project_files(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    project = db.query(Project).join(Workspace).filter(
        Project.id == project_id,
        Workspace.owner_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project.files

@router.post("/project/{project_id}", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
def create_file(
    project_id: uuid.UUID,
    file_in: FileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    project = db.query(Project).join(Workspace).filter(
        Project.id == project_id,
        Workspace.owner_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Check if path already exists
    existing = db.query(File).filter(File.project_id == project_id, File.path == file_in.path).first()
    if existing:
        raise HTTPException(status_code=400, detail="File path already exists in project")
        
    db_file = File(
        project_id=project_id,
        path=file_in.path,
        content=file_in.content,
        language=get_language_from_ext(file_in.path)
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file

@router.put("/{file_id}", response_model=FileResponse)
def update_file(
    file_id: uuid.UUID,
    file_in: FileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_file = db.query(File).join(Project).join(Workspace).filter(
        File.id == file_id,
        Workspace.owner_id == current_user.id
    ).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
        
    db_file.content = file_in.content
    db.commit()
    db.refresh(db_file)
    return db_file

@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(
    file_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_file = db.query(File).join(Project).join(Workspace).filter(
        File.id == file_id,
        Workspace.owner_id == current_user.id
    ).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
        
    db.delete(db_file)
    db.commit()
    return None

@router.post("/project/{project_id}/upload", response_model=List[FileResponse])
async def upload_files(
    project_id: uuid.UUID,
    files: List[UploadFile] = FastAPIFile(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    project = db.query(Project).join(Workspace).filter(
        Project.id == project_id,
        Workspace.owner_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    allowed_exts = {".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".cpp", ".c", ".go", ".rs", ".json", ".md", ".txt"}
    created_files = []
    
    for upload_file in files:
        filename = upload_file.filename
        if not filename:
            continue
            
        content_bytes = await upload_file.read()
        
        # Handle ZIP Archives
        if filename.endswith(".zip"):
            try:
                with zipfile.ZipFile(io.BytesIO(content_bytes)) as z:
                    for z_info in z.infolist():
                        # Skip directories
                        if z_info.is_dir():
                            continue
                        
                        # Validate extensions
                        from pathlib import Path
                        ext = Path(z_info.filename).suffix.lower()
                        if ext not in allowed_exts:
                            continue
                            
                        # Size limit per file inside ZIP (e.g. 2MB)
                        if z_info.file_size > 2 * 1024 * 1024:
                            continue
                            
                        try:
                            file_content = z.read(z_info.filename).decode("utf-8")
                        except UnicodeDecodeError:
                            continue  # Skip binary file types
                            
                        # Clean prefix directory structures in ZIP if any
                        clean_path = z_info.filename
                        
                        # Skip duplicate paths
                        existing = db.query(File).filter(File.project_id == project_id, File.path == clean_path).first()
                        if existing:
                            existing.content = file_content
                            created_files.append(existing)
                        else:
                            db_file = File(
                                project_id=project_id,
                                path=clean_path,
                                content=file_content,
                                language=get_language_from_ext(clean_path)
                            )
                            db.add(db_file)
                            created_files.append(db_file)
            except zipfile.BadZipFile:
                raise HTTPException(status_code=400, detail="Invalid zip file uploaded")
        else:
            # Single File upload
            from pathlib import Path
            ext = Path(filename).suffix.lower()
            if ext not in allowed_exts:
                raise HTTPException(status_code=400, detail=f"File type {ext} not allowed.")
                
            try:
                file_content = content_bytes.decode("utf-8")
            except UnicodeDecodeError:
                raise HTTPException(status_code=400, detail="Binary files not supported. Plaintext only.")
                
            existing = db.query(File).filter(File.project_id == project_id, File.path == filename).first()
            if existing:
                existing.content = file_content
                created_files.append(existing)
            else:
                db_file = File(
                    project_id=project_id,
                    path=filename,
                    content=file_content,
                    language=get_language_from_ext(filename)
                )
                db.add(db_file)
                created_files.append(db_file)

    db.add(AuditLog(
        user_id=current_user.id,
        action="upload_files",
        details=f"Uploaded {len(created_files)} files into project (ID: {project_id})"
    ))
    db.commit()
    for f in created_files:
        db.refresh(f)
    return created_files
