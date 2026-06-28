import datetime
from sqlalchemy import func
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.analytics import APIUsage, UsageAnalytics
from app.schemas.analytics import AnalyticsResponse

router = APIRouter()

@router.get("/", response_model=AnalyticsResponse)
def get_user_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Total Requests & Costs
    usage_records = db.query(APIUsage).filter(APIUsage.user_id == current_user.id).all()
    total_requests = len(usage_records)
    total_cost = sum(r.estimated_cost for r in usage_records)
    
    # Language Distribution
    lang_data = db.query(
        UsageAnalytics.language, func.count(UsageAnalytics.id)
    ).filter(UsageAnalytics.user_id == current_user.id).group_by(UsageAnalytics.language).all()
    
    language_distribution = {}
    for lang, count in lang_data:
        if lang:
            language_distribution[lang] = count
            
    # Action Type Distribution
    action_data = db.query(
        UsageAnalytics.action_type, func.count(UsageAnalytics.id)
    ).filter(UsageAnalytics.user_id == current_user.id).group_by(UsageAnalytics.action_type).all()
    
    action_distribution = {}
    for action, count in action_data:
        action_distribution[action] = count
        
    # Daily Request Trend (Last 7 days)
    seven_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    trend_data = db.query(
        func.date(APIUsage.created_at).label("date"),
        func.count(APIUsage.id).label("count")
    ).filter(
        APIUsage.user_id == current_user.id,
        APIUsage.created_at >= seven_days_ago
    ).group_by(
        func.date(APIUsage.created_at)
    ).order_by(
        func.date(APIUsage.created_at)
    ).all()
    
    daily_request_trend = []
    for day, count in trend_data:
        daily_request_trend.append({
            "date": str(day),
            "count": count
        })
        
    # If empty, add placeholder
    if not daily_request_trend:
        daily_request_trend = [{"date": str(datetime.date.today()), "count": 0}]
        
    return {
        "total_requests": total_requests,
        "estimated_cost": round(total_cost, 4),
        "language_distribution": language_distribution,
        "action_distribution": action_distribution,
        "daily_request_trend": daily_request_trend
    }
