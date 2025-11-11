from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
import json

app = FastAPI(title="Service Price Estimator", version="2.0.0")

# Updated pricing data structure with multiple service types
pricing_data = {
    "service_types": {
        "web_development": {
            "name": "Web Development",
            "description": "Website creation and development services",
            "types": {
                "static": {
                    "base_price": 500,
                    "description": "Simple static website with basic pages"
                },
                "dynamic": {
                    "base_price": 1200,
                    "description": "Dynamic website with database and admin panel"
                },
                "ecommerce": {
                    "base_price": 2500,
                    "description": "Full e-commerce website with payment processing"
                }
            },
            "features": {
                "responsive_design": {
                    "price": 250,
                    "description": "Mobile-friendly responsive design"
                },
                "admin_panel": {
                    "price": 450,
                    "description": "Custom admin panel for content management"
                },
                "multi_language": {
                    "price": 300,
                    "description": "Multi-language support"
                },
                "blog_system": {
                    "price": 350,
                    "description": "Integrated blog system"
                },
                "seo_optimization": {
                    "price": 400,
                    "description": "Search engine optimization"
                }
            }
        },
        "social_media_design": {
            "name": "Social Media Design",
            "description": "Professional social media graphics and content",
            "types": {
                "basic_package": {
                    "base_price": 300,
                    "description": "Basic social media post designs"
                },
                "premium_package": {
                    "base_price": 600,
                    "description": "Premium designs with animations"
                },
                "enterprise_package": {
                    "base_price": 1000,
                    "description": "Complete social media branding"
                }
            },
            "features": {
                "photo_editing": {
                    "price": 150,
                    "description": "Professional photo editing"
                },
                "video_editing": {
                    "price": 300,
                    "description": "Short video content editing"
                },
                "brand_kit": {
                    "price": 200,
                    "description": "Complete brand kit creation"
                },
                "carousel_design": {
                    "price": 250,
                    "description": "Multi-page carousel designs"
                },
                "animation_graphics": {
                    "price": 400,
                    "description": "Animated graphics and stories"
                }
            }
        },
        "cloud_computing": {
            "name": "Cloud Computing",
            "description": "Cloud infrastructure and deployment services",
            "types": {
                "basic_setup": {
                    "base_price": 400,
                    "description": "Basic cloud infrastructure setup"
                },
                "scalable_architecture": {
                    "base_price": 800,
                    "description": "Scalable cloud architecture"
                },
                "enterprise_cloud": {
                    "base_price": 1500,
                    "description": "Enterprise-grade cloud solution"
                }
            },
            "features": {
                "aws_setup": {
                    "price": 200,
                    "description": "AWS infrastructure setup"
                },
                "azure_setup": {
                    "price": 200,
                    "description": "Microsoft Azure setup"
                },
                "google_cloud_setup": {
                    "price": 200,
                    "description": "Google Cloud Platform setup"
                },
                "ci_cd_pipeline": {
                    "price": 350,
                    "description": "CI/CD pipeline configuration"
                },
                "monitoring_setup": {
                    "price": 250,
                    "description": "Monitoring and alerting setup"
                }
            }
        }
    },
    "additional_services": {
        "maintenance": {
            "monthly_price": 100,
            "description": "Monthly maintenance and updates"
        },
        "hosting": {
            "monthly_price": 50,
            "description": "Basic hosting services"
        },
        "support": {
            "monthly_price": 80,
            "description": "24/7 technical support"
        },
        "content_creation": {
            "monthly_price": 120,
            "description": "Monthly content creation"
        },
        "cloud_monitoring": {
            "monthly_price": 60,
            "description": "Cloud infrastructure monitoring"
        }
    }
}

class EstimateRequest(BaseModel):
    service_type: str
    service_subtype: str
    selected_features: List[str]
    selected_services: List[str]
    custom_requirements: Optional[str] = None

class EstimateResponse(BaseModel):
    service_type: str
    service_subtype: str
    base_price: float
    features_total: float
    services_monthly: float
    total_one_time: float
    breakdown: Dict
    message: str

@app.get("/")
async def read_index():
    return FileResponse("static/index.html")

@app.get("/api/pricing")
async def get_pricing_data():
    """Return all pricing data to the frontend"""
    return pricing_data

@app.get("/api/service-types")
async def get_service_types():
    """Return available service types"""
    return {
        service_type: {
            "name": data["name"],
            "description": data["description"]
        }
        for service_type, data in pricing_data["service_types"].items()
    }

@app.get("/api/service-types/{service_type}/subtypes")
async def get_service_subtypes(service_type: str):
    """Return subtypes for a specific service type"""
    if service_type not in pricing_data["service_types"]:
        raise HTTPException(status_code=404, detail="Service type not found")
    
    return pricing_data["service_types"][service_type]["types"]

@app.get("/api/service-types/{service_type}/features")
async def get_service_features(service_type: str):
    """Return features for a specific service type"""
    if service_type not in pricing_data["service_types"]:
        raise HTTPException(status_code=404, detail="Service type not found")
    
    return pricing_data["service_types"][service_type]["features"]

@app.post("/api/estimate", response_model=EstimateResponse)
async def calculate_estimate(request: EstimateRequest):
    """Calculate price estimate based on selections"""
    
    # Validate service type
    if request.service_type not in pricing_data["service_types"]:
        raise HTTPException(status_code=400, detail="Invalid service type")
    
    service_data = pricing_data["service_types"][request.service_type]
    
    # Validate service subtype
    if request.service_subtype not in service_data["types"]:
        raise HTTPException(status_code=400, detail="Invalid service subtype")
    
    # Get base price
    base_price = service_data["types"][request.service_subtype]["base_price"]
    
    # Calculate features total
    features_total = 0
    features_breakdown = {}
    
    for feature in request.selected_features:
        if feature in service_data["features"]:
            feature_price = service_data["features"][feature]["price"]
            features_total += feature_price
            features_breakdown[feature] = {
                "price": feature_price,
                "description": service_data["features"][feature]["description"]
            }
    
    # Calculate monthly services cost
    services_monthly = 0
    services_breakdown = {}
    
    for service in request.selected_services:
        if service in pricing_data["additional_services"]:
            service_price = pricing_data["additional_services"][service]["monthly_price"]
            services_monthly += service_price
            services_breakdown[service] = {
                "price": service_price,
                "description": pricing_data["additional_services"][service]["description"]
            }
    
    # Calculate totals
    total_one_time = base_price + features_total
    
    breakdown = {
        "base_service": base_price,
        "features": features_breakdown,
        "services_monthly": services_breakdown
    }
    
    return EstimateResponse(
        service_type=request.service_type,
        service_subtype=request.service_subtype,
        base_price=base_price,
        features_total=features_total,
        services_monthly=services_monthly,
        total_one_time=total_one_time,
        breakdown=breakdown,
        message="Estimate calculated successfully"
    )

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)