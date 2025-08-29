from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import json
import io
import csv
import re
from enum import Enum
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Satomaru Map API", version="0.2.0")

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Visibility(str, Enum):
    personal = "personal"
    group = "group"
    public = "public"

class LayerKey(str, Enum):
    sumai = "sumai"
    kurashi = "kurashi"
    manabi = "manabi"
    asobi = "asobi"
    other = "other"

class Status(str, Enum):
    active = "active"
    hidden = "hidden"
    draft = "draft"

class CreatePin(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    layer: LayerKey
    tag: str
    note: Optional[str] = ""
    visibility: Visibility
    group_id: Optional[str] = None

class UpdatePin(BaseModel):
    tag: Optional[str] = None
    note: Optional[str] = None
    visibility: Optional[Visibility] = None
    status: Optional[Status] = None

class Pin(BaseModel):
    id: str
    lat: float
    lng: float
    layer: LayerKey
    tag: str
    note: Optional[str] = ""
    visibility: Visibility
    group_id: Optional[str] = None
    status: Status = Status.active
    createdAt: datetime
    updatedAt: Optional[datetime] = None

class PinListResponse(BaseModel):
    items: List[Pin]
    page: int
    page_size: int
    total: int

class AuditLog(BaseModel):
    id: str
    actor_id: str
    action: str
    target_type: str
    target_id: str
    diff_json: Dict[str, Any]
    created_at: datetime

pins_db: Dict[str, Pin] = {}
audit_logs: List[AuditLog] = []
pin_counter = 1

rate_limit_storage: Dict[str, List[datetime]] = {}

PII_PATTERNS = [
    r'\d{3}-\d{4}-\d{4}',  # Phone numbers
    r'\d{11}',  # Phone numbers without hyphens
    r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',  # Email addresses
    r'〒\d{3}-\d{4}',  # Japanese postal codes
    r'\d{3}-\d{4}',  # Postal codes
]

def detect_pii(text: str) -> bool:
    """Detect potential PII in text"""
    if not text:
        return False
    for pattern in PII_PATTERNS:
        if re.search(pattern, text):
            return True
    return False

def check_rate_limit(user_id: str, lat: float, lng: float, tag: str) -> bool:
    """Check if user is rate limited for this location and tag"""
    now = datetime.now(timezone.utc)
    key = f"{user_id}:{tag}:{lat:.4f}:{lng:.4f}"
    
    if key not in rate_limit_storage:
        rate_limit_storage[key] = []
    
    window_seconds = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
    rate_limit_storage[key] = [
        timestamp for timestamp in rate_limit_storage[key]
        if (now - timestamp).total_seconds() < window_seconds
    ]
    
    if len(rate_limit_storage[key]) > 0:
        return True
    
    rate_limit_storage[key].append(now)
    return False

def log_audit(actor_id: str, action: str, target_type: str, target_id: str, diff: Dict[str, Any]):
    """Log audit entry"""
    global audit_logs
    audit_log = AuditLog(
        id=f"audit_{len(audit_logs) + 1}",
        actor_id=actor_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        diff_json=diff,
        created_at=datetime.now(timezone.utc)
    )
    audit_logs.append(audit_log)

@app.get("/")
def read_root():
    return {"message": "Satomaru Map API", "version": "0.2.0"}

@app.get("/pins", response_model=PinListResponse)
def list_pins(
    bbox: Optional[str] = Query(None, description="左下経度,左下緯度,右上経度,右上緯度"),
    since: Optional[datetime] = Query(None),
    until: Optional[datetime] = Query(None),
    layer: Optional[LayerKey] = Query(None),
    tag: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=200)
):
    """List pins with filtering"""
    filtered_pins = list(pins_db.values())
    
    if bbox:
        try:
            lng1, lat1, lng2, lat2 = map(float, bbox.split(","))
            filtered_pins = [
                pin for pin in filtered_pins
                if lng1 <= pin.lng <= lng2 and lat1 <= pin.lat <= lat2
            ]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid bbox format")
    
    if since:
        filtered_pins = [pin for pin in filtered_pins if pin.createdAt >= since]
    
    if until:
        filtered_pins = [pin for pin in filtered_pins if pin.createdAt <= until]
    
    if layer:
        filtered_pins = [pin for pin in filtered_pins if pin.layer == layer]
    
    if tag:
        filtered_pins = [pin for pin in filtered_pins if pin.tag == tag]
    
    filtered_pins = [pin for pin in filtered_pins if pin.status == Status.active]
    
    total = len(filtered_pins)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    items = filtered_pins[start_idx:end_idx]
    
    return PinListResponse(
        items=items,
        page=page,
        page_size=page_size,
        total=total
    )

@app.post("/pins", status_code=201)
def create_pin(pin_data: CreatePin):
    """Create a new pin"""
    global pin_counter
    
    if detect_pii(pin_data.note or ""):
        raise HTTPException(
            status_code=422,
            detail={"code": "PII_DETECTED", "message": "個人情報の可能性がある内容が含まれています"}
        )
    
    user_id = "user_1"  # In real app, get from auth
    if check_rate_limit(user_id, pin_data.lat, pin_data.lng, pin_data.tag):
        raise HTTPException(
            status_code=429,
            detail={"code": "RATE_LIMIT", "message": "短時間に同じ場所へ投稿しています"}
        )
    
    pin_id = f"pin_{pin_counter}"
    pin_counter += 1
    
    now = datetime.now(timezone.utc)
    pin = Pin(
        id=pin_id,
        lat=pin_data.lat,
        lng=pin_data.lng,
        layer=pin_data.layer,
        tag=pin_data.tag,
        note=pin_data.note or "",
        visibility=pin_data.visibility,
        group_id=pin_data.group_id,
        status=Status.active,
        createdAt=now
    )
    
    pins_db[pin_id] = pin
    
    log_audit(user_id, "CREATE", "pin", pin_id, pin.dict())
    
    return {"id": pin_id, "createdAt": now.isoformat()}

@app.get("/pins/{pin_id}", response_model=Pin)
def get_pin(pin_id: str):
    """Get pin by ID"""
    if pin_id not in pins_db:
        raise HTTPException(status_code=404, detail="Pin not found")
    return pins_db[pin_id]

@app.patch("/pins/{pin_id}")
def update_pin(pin_id: str, update_data: UpdatePin):
    """Update pin"""
    if pin_id not in pins_db:
        raise HTTPException(status_code=404, detail="Pin not found")
    
    pin = pins_db[pin_id]
    old_data = pin.dict()
    
    if update_data.note and detect_pii(update_data.note):
        raise HTTPException(
            status_code=422,
            detail={"code": "PII_DETECTED", "message": "個人情報の可能性がある内容が含まれています"}
        )
    
    if update_data.tag is not None:
        pin.tag = update_data.tag
    if update_data.note is not None:
        pin.note = update_data.note
    if update_data.visibility is not None:
        pin.visibility = update_data.visibility
    if update_data.status is not None:
        pin.status = update_data.status
    
    pin.updatedAt = datetime.now(timezone.utc)
    
    user_id = "user_1"  # In real app, get from auth
    log_audit(user_id, "UPDATE", "pin", pin_id, {
        "old": old_data,
        "new": pin.dict()
    })
    
    return {"message": "Pin updated successfully"}

@app.delete("/pins/{pin_id}", status_code=204)
def delete_pin(pin_id: str):
    """Soft delete pin"""
    if pin_id not in pins_db:
        raise HTTPException(status_code=404, detail="Pin not found")
    
    pin = pins_db[pin_id]
    old_status = pin.status
    pin.status = Status.hidden
    pin.updatedAt = datetime.now(timezone.utc)
    
    user_id = "user_1"  # In real app, get from auth
    log_audit(user_id, "DELETE", "pin", pin_id, {
        "old_status": old_status,
        "new_status": "hidden"
    })

@app.get("/export.csv")
def export_csv(
    since: Optional[datetime] = Query(None),
    until: Optional[datetime] = Query(None),
    layer: Optional[LayerKey] = Query(None),
    tag: Optional[str] = Query(None)
):
    """Export pins as CSV"""
    filtered_pins = list(pins_db.values())
    
    if since:
        filtered_pins = [pin for pin in filtered_pins if pin.createdAt >= since]
    if until:
        filtered_pins = [pin for pin in filtered_pins if pin.createdAt <= until]
    if layer:
        filtered_pins = [pin for pin in filtered_pins if pin.layer == layer]
    if tag:
        filtered_pins = [pin for pin in filtered_pins if pin.tag == tag]
    
    output = io.StringIO()
    
    output.write('\ufeff')
    
    writer = csv.writer(output)
    
    headers = [
        'ピンID', '緯度', '経度', 'レイヤー', 'タグキー', 'タグ名', 'メモ',
        '公開範囲', 'グループ名', '作成者', '作成日時(JST)', '更新日時(JST)',
        'ステータス', '住所(簡易)', 'モデレーション'
    ]
    writer.writerow(headers)
    
    for pin in filtered_pins:
        created_jst = pin.createdAt.astimezone(timezone.utc).strftime('%Y-%m-%d %H:%M')
        updated_jst = pin.updatedAt.astimezone(timezone.utc).strftime('%Y-%m-%d %H:%M') if pin.updatedAt else ''
        
        row = [
            pin.id,
            pin.lat,
            pin.lng,
            pin.layer.value,
            pin.tag,
            pin.tag,  # Tag label (same as key for now)
            pin.note,
            pin.visibility.value,
            pin.group_id or '',
            'ニックネーム',  # Dummy user name
            created_jst,
            updated_jst,
            pin.status.value,
            '',  # Address (not implemented)
            ''   # Moderation flags
        ]
        writer.writerow(row)
    
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8-sig')),
        media_type='text/csv; charset=utf-8',
        headers={'Content-Disposition': 'attachment; filename=pins_export.csv'}
    )

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
